import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { PasswordResetForm } from '@/components/admin/auth';

// Mock next/router
const mockPush = jest.fn();
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
  }),
}));

// Mock fetch for API calls
global.fetch = jest.fn();

describe('Password Reset Form', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (global.fetch as jest.Mock).mockReset();
  });
  
  it('renders the request reset form correctly', () => {
    render(<PasswordResetForm />);
    
    // Check for form elements
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /reset password/i })).toBeInTheDocument();
    expect(screen.getByText(/enter your email/i)).toBeInTheDocument();
  });
  
  it('validates email input', async () => {
    render(<PasswordResetForm />);
    
    // Try with empty email
    await userEvent.click(screen.getByRole('button', { name: /reset password/i }));
    
    // Check for validation error
    expect(screen.getByText(/email is required/i)).toBeInTheDocument();
    
    // Try with invalid email format
    await userEvent.type(screen.getByLabelText(/email/i), 'invalid-email');
    await userEvent.click(screen.getByRole('button', { name: /reset password/i }));
    
    // Check for validation error
    expect(screen.getByText(/invalid email format/i)).toBeInTheDocument();
  });
  
  it('submits request and shows confirmation', async () => {
    // Mock successful response
    (global.fetch as jest.Mock).mockImplementation(() => 
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ success: true }),
      })
    );
    
    render(<PasswordResetForm />);
    
    // Fill and submit the form
    await userEvent.type(screen.getByLabelText(/email/i), 'user@example.com');
    await userEvent.click(screen.getByRole('button', { name: /reset password/i }));
    
    // Check for API call
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith('/api/auth/request-reset', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email: 'user@example.com' }),
      });
    });
    
    // Check for success message
    expect(screen.getByText(/check your email/i)).toBeInTheDocument();
  });
  
  it('handles API errors during request', async () => {
    // Mock error response
    (global.fetch as jest.Mock).mockImplementation(() => 
      Promise.resolve({
        ok: false,
        status: 404,
        json: () => Promise.resolve({ error: 'Email not found' }),
      })
    );
    
    render(<PasswordResetForm />);
    
    // Fill and submit the form
    await userEvent.type(screen.getByLabelText(/email/i), 'unknown@example.com');
    await userEvent.click(screen.getByRole('button', { name: /reset password/i }));
    
    // Check for error message
    await waitFor(() => {
      expect(screen.getByText(/email not found/i)).toBeInTheDocument();
    });
  });
});

describe('Password Reset Confirmation', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (global.fetch as jest.Mock).mockReset();
  });
  
  it('renders the reset confirmation form correctly', () => {
    // Create mock URL params
    const searchParams = new URLSearchParams();
    searchParams.set('token', 'test-reset-token');
    searchParams.set('email', 'user@example.com');
    
    render(<PasswordResetForm isConfirmation searchParams={searchParams} />);
    
    // Check for form elements
    expect(screen.getByLabelText(/new password/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/confirm password/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /confirm new password/i })).toBeInTheDocument();
  });
  
  it('validates password fields', async () => {
    // Create mock URL params
    const searchParams = new URLSearchParams();
    searchParams.set('token', 'test-reset-token');
    searchParams.set('email', 'user@example.com');
    
    render(<PasswordResetForm isConfirmation searchParams={searchParams} />);
    
    // Try with empty password
    await userEvent.click(screen.getByRole('button', { name: /confirm new password/i }));
    
    // Check for validation error
    expect(screen.getByText(/password is required/i)).toBeInTheDocument();
    
    // Try with short password
    await userEvent.type(screen.getByLabelText(/new password/i), 'short');
    await userEvent.click(screen.getByRole('button', { name: /confirm new password/i }));
    
    // Check for validation error
    expect(screen.getByText(/password must be at least/i)).toBeInTheDocument();
    
    // Try with passwords that don't match
    await userEvent.clear(screen.getByLabelText(/new password/i));
    await userEvent.type(screen.getByLabelText(/new password/i), 'securepassword123');
    await userEvent.type(screen.getByLabelText(/confirm password/i), 'differentpassword');
    await userEvent.click(screen.getByRole('button', { name: /confirm new password/i }));
    
    // Check for validation error
    expect(screen.getByText(/passwords do not match/i)).toBeInTheDocument();
  });
  
  it('confirms reset and redirects to login', async () => {
    // Mock successful response
    (global.fetch as jest.Mock).mockImplementation(() => 
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ success: true }),
      })
    );
    
    // Create mock URL params
    const searchParams = new URLSearchParams();
    searchParams.set('token', 'test-reset-token');
    searchParams.set('email', 'user@example.com');
    
    render(<PasswordResetForm isConfirmation searchParams={searchParams} />);
    
    // Fill and submit the form
    await userEvent.type(screen.getByLabelText(/new password/i), 'newSecurePassword123');
    await userEvent.type(screen.getByLabelText(/confirm password/i), 'newSecurePassword123');
    await userEvent.click(screen.getByRole('button', { name: /confirm new password/i }));
    
    // Check for API call with ZKP parameters
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith('/api/auth/confirm-reset', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: expect.stringContaining('proof'),
      });
    });
    
    // Check for redirection to login
    expect(mockPush).toHaveBeenCalledWith('/login');
  });
  
  it('handles invalid or expired reset tokens', async () => {
    // Mock error response
    (global.fetch as jest.Mock).mockImplementation(() => 
      Promise.resolve({
        ok: false,
        status: 400,
        json: () => Promise.resolve({ error: 'Reset token expired or invalid' }),
      })
    );
    
    // Create mock URL params
    const searchParams = new URLSearchParams();
    searchParams.set('token', 'invalid-reset-token');
    searchParams.set('email', 'user@example.com');
    
    render(<PasswordResetForm isConfirmation searchParams={searchParams} />);
    
    // Fill and submit the form
    await userEvent.type(screen.getByLabelText(/new password/i), 'newSecurePassword123');
    await userEvent.type(screen.getByLabelText(/confirm password/i), 'newSecurePassword123');
    await userEvent.click(screen.getByRole('button', { name: /confirm new password/i }));
    
    // Check for error message
    await waitFor(() => {
      expect(screen.getByText(/token expired or invalid/i)).toBeInTheDocument();
    });
  });
});
