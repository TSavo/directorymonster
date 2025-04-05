import React from 'react';
import { render, screen, waitFor, fireEvent, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ZKPLogin from '@/components/admin/auth/ZKPLogin';
import { generateProof, verifyProof } from '@/lib/zkp';
import * as zkpLib from '@/lib/zkp';

// Mock the Next.js router
const mockPush = jest.fn();
const mockRouter = {
  push: mockPush,
  replace: jest.fn(),
  prefetch: jest.fn(),
  back: jest.fn(),
  forward: jest.fn(),
  refresh: jest.fn(),
  pathname: '/admin',
};

// Add the router mock before the tests run
jest.mock('next/navigation', () => ({
  useRouter: () => mockRouter
}));

// Mock the ZKP library functions
jest.mock('@/lib/zkp', () => ({
  generateProof: jest.fn(),
  verifyProof: jest.fn(),
  generateSalt: jest.fn().mockReturnValue('test-salt-value'),
  derivePublicKey: jest.fn().mockReturnValue('test-derived-public-key'),
}));

// Mock fetch for API calls
global.fetch = jest.fn();

describe('ZKPLogin Component', () => {
  // Reset all mocks before each test
  beforeEach(() => {
    jest.clearAllMocks();
    (global.fetch as jest.Mock).mockReset();
    // Default mock implementation for generateProof
    (zkpLib.generateProof as jest.Mock).mockResolvedValue({
      proof: 'mock-proof-string',
      publicSignals: ['mock-public-signal-1', 'mock-public-signal-2'],
    });
    // Default mock implementation for fetch
    (global.fetch as jest.Mock).mockImplementation(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ success: true, token: 'mock-auth-token' }),
      })
    );

    // Mock document.cookie to provide a CSRF token
    Object.defineProperty(document, 'cookie', {
      writable: true,
      value: 'csrf_token=test-csrf-token',
    });
  });

  it('renders the login form correctly', () => {
    render(<ZKPLogin />);

    // Check for form elements
    expect(screen.getByLabelText(/username/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument();

    // Check for security information
    expect(screen.getByText(/zero-knowledge proof/i)).toBeInTheDocument();
    expect(screen.getByText(/your password is never sent/i)).toBeInTheDocument();
  });

  it('handles input changes correctly', async () => {
    render(<ZKPLogin />);

    const usernameInput = screen.getByLabelText(/username/i);
    const passwordInput = screen.getByLabelText(/password/i);

    // Type in the inputs
    await userEvent.type(usernameInput, 'testuser');
    await userEvent.type(passwordInput, 'password123');

    // Check that the input values are updated
    expect(usernameInput).toHaveValue('testuser');
    expect(passwordInput).toHaveValue('password123');
  });

  it('shows validation errors for empty fields', async () => {
    render(<ZKPLogin />);

    // Try to submit the form without filling in the fields
    const submitButton = screen.getByRole('button', { name: /sign in/i });
    await userEvent.click(submitButton);

    // Check for validation error messages
    await waitFor(() => {
      expect(screen.getByText(/username is required/i)).toBeInTheDocument();
      expect(screen.getByText(/password is required/i)).toBeInTheDocument();
    });

    // No API calls should have been made
    expect(global.fetch).not.toHaveBeenCalled();
    expect(zkpLib.generateProof).not.toHaveBeenCalled();
  });

  it('shows validation error for short password', async () => {
    render(<ZKPLogin />);

    // Fill in username but short password
    await userEvent.type(screen.getByLabelText(/username/i), 'testuser');
    await userEvent.type(screen.getByLabelText(/password/i), 'short');

    // Try to submit the form
    await userEvent.click(screen.getByRole('button', { name: /sign in/i }));

    // Check for password validation error
    await waitFor(() => {
      expect(screen.getByText(/password must be at least/i)).toBeInTheDocument();
    });

    // No API calls should have been made
    expect(global.fetch).not.toHaveBeenCalled();
    expect(zkpLib.generateProof).not.toHaveBeenCalled();
  });

  it('successfully submits the form and generates ZKP', async () => {
    render(<ZKPLogin />);

    // Fill in the form
    await userEvent.type(screen.getByLabelText(/username/i), 'testuser');
    await userEvent.type(screen.getByLabelText(/password/i), 'securepassword123');

    // Submit the form
    await userEvent.click(screen.getByRole('button', { name: /sign in/i }));

    // Wait for the ZKP generation and API call to occur
    await waitFor(() => {
      // Check that the ZKP library was called
      expect(zkpLib.generateProof).toHaveBeenCalled();

      // Get the first call arguments
      const callArgs = (zkpLib.generateProof as jest.Mock).mock.calls[0][0];

      // Verify username and password were passed correctly
      expect(callArgs.username).toBe('testuser');
      expect(callArgs.password).toBe('securepassword123');
      // Note: We don't check the salt value as it might be undefined in the test environment

      // Check that fetch was called with the correct parameters, including CSRF token
      expect(global.fetch).toHaveBeenCalledWith('/api/auth/verify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-Token': 'test-csrf-token',
        },
        body: JSON.stringify({
          username: 'testuser',
          proof: 'mock-proof-string',
          publicSignals: ['mock-public-signal-1', 'mock-public-signal-2'],
        }),
      });

      // Check that the user is redirected after successful login
      expect(mockPush).toHaveBeenCalledWith('/admin');
    });
  });

  it('shows an error message on authentication failure', async () => {
    // Mock a failed API response
    (global.fetch as jest.Mock).mockImplementation(() =>
      Promise.resolve({
        ok: false,
        status: 401,
        json: () => Promise.resolve({
          success: false,
          error: 'Invalid credentials'
        }),
      })
    );

    render(<ZKPLogin />);

    // Fill in the form
    await userEvent.type(screen.getByLabelText(/username/i), 'testuser');
    await userEvent.type(screen.getByLabelText(/password/i), 'wrongpassword');

    // Submit the form
    await userEvent.click(screen.getByRole('button', { name: /sign in/i }));

    // Wait for the error message to appear
    await waitFor(() => {
      expect(screen.getByText(/invalid credentials/i)).toBeInTheDocument();
    });

    // The user should not be redirected
    expect(mockPush).not.toHaveBeenCalled();
  });

  it('handles network errors gracefully', async () => {
    // Mock a network error
    (global.fetch as jest.Mock).mockRejectedValue(new Error('Network error'));

    render(<ZKPLogin />);

    // Fill in the form
    await userEvent.type(screen.getByLabelText(/username/i), 'testuser');
    await userEvent.type(screen.getByLabelText(/password/i), 'securepassword123');

    // Submit the form
    await userEvent.click(screen.getByRole('button', { name: /sign in/i }));

    // Wait for the error message to appear
    await waitFor(() => {
      expect(screen.getByTestId('login-error')).toBeInTheDocument();
      expect(screen.getByTestId('login-error')).toHaveTextContent(/An unknown error occurred/i);
    });

    // The user should not be redirected
    expect(mockPush).not.toHaveBeenCalled();
  });

  it('handles ZKP generation errors gracefully', async () => {
    // Mock a ZKP generation error
    (zkpLib.generateProof as jest.Mock).mockRejectedValue(new Error('ZKP generation failed'));

    render(<ZKPLogin />);

    // Fill in the form
    await userEvent.type(screen.getByLabelText(/username/i), 'testuser');
    await userEvent.type(screen.getByLabelText(/password/i), 'securepassword123');

    // Submit the form
    await userEvent.click(screen.getByRole('button', { name: /sign in/i }));

    // Wait for the error message to appear
    await waitFor(() => {
      expect(screen.getByTestId('login-error')).toBeInTheDocument();
      expect(screen.getByTestId('login-error')).toHaveTextContent(/An unknown error occurred/i);
    });

    // The user should not be redirected
    expect(mockPush).not.toHaveBeenCalled();

    // fetch should not be called if ZKP generation fails
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it('shows a spinner while authenticating', async () => {
    // Delay the API response to ensure spinner is visible
    (global.fetch as jest.Mock).mockImplementation(() =>
      new Promise(resolve => {
        setTimeout(() => {
          resolve({
            ok: true,
            json: () => Promise.resolve({ success: true, token: 'mock-auth-token' }),
          });
        }, 100);
      })
    );

    render(<ZKPLogin />);

    // Fill in the form
    await userEvent.type(screen.getByLabelText(/username/i), 'testuser');
    await userEvent.type(screen.getByLabelText(/password/i), 'securepassword123');

    // Submit the form
    await act(async () => {
      await userEvent.click(screen.getByRole('button', { name: /sign in/i }));
    });

    // Check for the loading spinner immediately after form submission
    // The spinner is an SVG with an aria-hidden attribute, so we can't use screen.getByRole
    // Instead, look for the text "Authenticating..." which appears when loading
    expect(screen.getByText(/authenticating/i)).toBeInTheDocument();

    // Wait for the authentication to complete
    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/admin');
    });
  });

  it('properly stores the authentication token after successful login', async () => {
    // Mock localStorage methods
    const localStorageMock = {
      getItem: jest.fn(),
      setItem: jest.fn(),
      removeItem: jest.fn(),
      clear: jest.fn(),
    };
    Object.defineProperty(window, 'localStorage', { value: localStorageMock });

    render(<ZKPLogin />);

    // Fill in the form
    await userEvent.type(screen.getByLabelText(/username/i), 'testuser');
    await userEvent.type(screen.getByLabelText(/password/i), 'securepassword123');

    // Submit the form
    await userEvent.click(screen.getByRole('button', { name: /sign in/i }));

    // Wait for the authentication to complete
    await waitFor(() => {
      // Verify the token was stored in localStorage
      expect(localStorageMock.setItem).toHaveBeenCalledWith('authToken', 'mock-auth-token');

      // Check for redirection
      expect(mockPush).toHaveBeenCalledWith('/admin');
    });
  });

  it('handles the "remember me" option correctly', async () => {
    // Mock localStorage methods
    const localStorageMock = {
      getItem: jest.fn(),
      setItem: jest.fn(),
      removeItem: jest.fn(),
      clear: jest.fn(),
    };
    Object.defineProperty(window, 'localStorage', { value: localStorageMock });

    render(<ZKPLogin />);

    // Fill in the form
    await userEvent.type(screen.getByLabelText(/username/i), 'testuser');
    await userEvent.type(screen.getByLabelText(/password/i), 'securepassword123');

    // Check the "Remember me" checkbox
    const rememberMeCheckbox = screen.getByLabelText(/remember me/i);
    await userEvent.click(rememberMeCheckbox);

    // Submit the form
    await userEvent.click(screen.getByRole('button', { name: /sign in/i }));

    // Wait for the authentication to complete
    await waitFor(() => {
      // Verify that both the token and remember me preference were stored
      expect(localStorageMock.setItem).toHaveBeenCalledWith('authToken', 'mock-auth-token');
      expect(localStorageMock.setItem).toHaveBeenCalledWith('rememberMe', 'true');

      // Check for redirection
      expect(mockPush).toHaveBeenCalledWith('/admin');
    });
  });

  it('supports "Forgot Password" functionality', async () => {
    render(<ZKPLogin />);

    // Check that the forgot password link is present
    const forgotPasswordLink = screen.getByText(/forgot password/i);
    expect(forgotPasswordLink).toBeInTheDocument();

    // Click the forgot password link
    await userEvent.click(forgotPasswordLink);

    // Check that the user is redirected to the forgot password page
    expect(mockPush).toHaveBeenCalledWith('/admin/forgot-password');
  });

  it('includes appropriate CSRF protection', async () => {
    // Mock the fetch to check for CSRF token
    (global.fetch as jest.Mock).mockImplementation((url, options) => {
      // Check if the CSRF token is in the headers
      const hasCSRFToken = options.headers && options.headers['X-CSRF-Token'];

      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({
          success: true,
          token: 'mock-auth-token'
        }),
      });
    });

    // Ensure document.cookie provides a CSRF token
    Object.defineProperty(document, 'cookie', {
      writable: true,
      value: 'csrf_token=test-csrf-token',
    });

    render(<ZKPLogin />);

    // Fill in the form
    await userEvent.type(screen.getByLabelText(/username/i), 'testuser');
    await userEvent.type(screen.getByLabelText(/password/i), 'securepassword123');

    // Submit the form
    await userEvent.click(screen.getByRole('button', { name: /sign in/i }));

    // Wait for the authentication to complete
    await waitFor(() => {
      // Verify the fetch was called with the CSRF token
      expect(global.fetch).toHaveBeenCalledWith('/api/auth/verify', expect.objectContaining({
        headers: expect.objectContaining({
          'X-CSRF-Token': 'test-csrf-token',
        }),
      }));

      // Check for redirection on successful auth
      expect(mockPush).toHaveBeenCalledWith('/admin');
    });
  });

  it('implements rate limiting for failed login attempts', async () => {
    // Set up a counter for failed attempts
    let failedAttempts = 0;

    // Mock fetch to simulate rate limiting after certain number of failed attempts
    (global.fetch as jest.Mock).mockImplementation(() => {
      failedAttempts++;

      // After 5 failed attempts, return rate limiting error
      if (failedAttempts >= 5) {
        return Promise.resolve({
          ok: false,
          status: 429,
          json: () => Promise.resolve({
            success: false,
            error: 'Too many login attempts. Please try again later.'
          }),
        });
      }

      // Otherwise return authentication failure
      return Promise.resolve({
        ok: false,
        status: 401,
        json: () => Promise.resolve({
          success: false,
          error: 'Invalid credentials'
        }),
      });
    });

    render(<ZKPLogin />);

    // Helper function to attempt login
    const attemptLogin = async () => {
      // Clear the form and fill it again
      await userEvent.clear(screen.getByLabelText(/username/i));
      await userEvent.clear(screen.getByLabelText(/password/i));
      await userEvent.type(screen.getByLabelText(/username/i), 'testuser');
      await userEvent.type(screen.getByLabelText(/password/i), 'wrongpassword');

      // Submit the form
      await userEvent.click(screen.getByRole('button', { name: /sign in/i }));

      // Wait for the request to complete
      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalled();
      });

      // Reset fetch mock for next attempt
      (global.fetch as jest.Mock).mockClear();
    };

    // Attempt login multiple times
    for (let i = 0; i < 4; i++) {
      await attemptLogin();

      // Should show invalid credentials after each attempt
      expect(screen.getByText(/invalid credentials/i)).toBeInTheDocument();
    }

    // Fifth attempt should trigger rate limiting
    await attemptLogin();

    // Should show rate limiting error
    expect(screen.getByText(/too many login attempts/i)).toBeInTheDocument();

    // The submit button should be disabled
    expect(screen.getByRole('button', { name: /sign in/i })).toBeDisabled();

    // And there should be a message about waiting
    expect(screen.getByText(/please try again later/i)).toBeInTheDocument();
  });
});
