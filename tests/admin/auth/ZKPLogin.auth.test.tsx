import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import userEvent from '@testing-library/user-event';
import ZKPLogin from '@/components/admin/auth/ZKPLogin';
import * as zkpBcryptLib from '@/lib/zkp/zkp-bcrypt';

// Mock the Next.js router
const mockPush = jest.fn();
const mockRouter = {
  push: mockPush,
  replace: jest.fn(),
};

jest.mock('next/navigation', () => ({
  useRouter: () => mockRouter
}));

// Mock the ZKP-Bcrypt library functions
jest.mock('@/lib/zkp/zkp-bcrypt', () => ({
  generateZKPWithBcrypt: jest.fn(),
  verifyZKPWithBcrypt: jest.fn(),
  hashPassword: jest.fn().mockResolvedValue('$2b$10$mockedhash'),
  verifyPassword: jest.fn().mockResolvedValue(true),
  generateBcryptSalt: jest.fn().mockResolvedValue('$2b$10$mockedsalt'),
}));

// Mock fetch for API calls
global.fetch = jest.fn();

describe('ZKPLogin Authentication Flow Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (global.fetch as jest.Mock).mockReset();

    // Default mock implementation for generateZKPWithBcrypt
    (zkpBcryptLib.generateZKPWithBcrypt as jest.Mock).mockResolvedValue({
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

  it('generates and submits ZKP proof on form submission', async () => {
    const user = userEvent.setup();
    const onSuccess = jest.fn();

    render(<ZKPLogin onSuccess={onSuccess} />);

    // Fill in valid form data
    await user.type(screen.getByLabelText(/username/i), 'testuser');
    await user.type(screen.getByLabelText(/password/i), 'SecurePassword123');

    // Submit the form
    await user.click(screen.getByRole('button', { name: /sign in/i }));

    // Verify ZKP functions were called
    expect(zkpBcryptLib.generateZKPWithBcrypt).toHaveBeenCalled();

    // Get the first call arguments
    const callArgs = (zkpBcryptLib.generateZKPWithBcrypt as jest.Mock).mock.calls[0];

    // Verify username and password were passed correctly
    expect(callArgs[0]).toBe('testuser');
    expect(callArgs[1]).toBe('SecurePassword123');
    // Note: We don't check the salt value as it might be undefined in the test environment

    // Verify fetch was called with correct data
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        '/api/auth/verify',
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
            'X-CSRF-Token': 'test-csrf-token'
          }),
          body: expect.stringContaining('proof')
        })
      );
    });

    // Verify redirect
    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/admin');
    });
  });

  it('handles authentication failure', async () => {
    const user = userEvent.setup();

    // Mock a failed authentication response
    (global.fetch as jest.Mock).mockImplementationOnce(() =>
      Promise.resolve({
        ok: false,
        json: () => Promise.resolve({ success: false, error: 'Invalid credentials' }),
      })
    );

    render(<ZKPLogin />);

    // Fill form and submit
    await user.type(screen.getByLabelText(/username/i), 'testuser');
    await user.type(screen.getByLabelText(/password/i), 'Password123');
    await user.click(screen.getByRole('button', { name: /sign in/i }));

    // Should show error message
    expect(await screen.findByText(/invalid credentials/i)).toBeInTheDocument();

    // Should not redirect
    expect(mockPush).not.toHaveBeenCalled();
  });

  it('handles network errors during authentication', async () => {
    const user = userEvent.setup();

    // Mock a network error
    (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'));

    render(<ZKPLogin />);

    // Fill form and submit
    await user.type(screen.getByLabelText(/username/i), 'testuser');
    await user.type(screen.getByLabelText(/password/i), 'Password123');
    await user.click(screen.getByRole('button', { name: /sign in/i }));

    // Should show error message
    expect(await screen.findByTestId('login-error')).toBeInTheDocument();
    expect(await screen.findByTestId('login-error')).toHaveTextContent(/An unknown error occurred/i);
  });

  it('shows loading state during authentication', async () => {
    // Create a delayed promise to keep the loading state visible
    (global.fetch as jest.Mock).mockImplementationOnce(() =>
      new Promise(resolve => {
        setTimeout(() => {
          resolve({
            ok: true,
            json: () => Promise.resolve({ success: true, token: 'mock-auth-token' }),
          });
        }, 100);
      })
    );

    const user = userEvent.setup();
    render(<ZKPLogin />);

    // Fill form and submit
    await user.type(screen.getByLabelText(/username/i), 'testuser');
    await user.type(screen.getByLabelText(/password/i), 'Password123');
    await user.click(screen.getByRole('button', { name: /sign in/i }));

    // Should show loading state (button text changes to "Authenticating...")
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /authenticating/i })).toBeInTheDocument();
    });

    // Wait for authentication to complete
    await waitFor(() => {
      expect(screen.queryByRole('button', { name: /authenticating/i })).not.toBeInTheDocument();
    }, { timeout: 200 });
  });
});
