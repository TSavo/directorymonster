import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { PasswordResetForm } from '@/components/admin/auth/PasswordResetForm';
import { generateZKPWithBcrypt } from '@/lib/zkp/zkp-bcrypt';
import { getSalt } from '@/lib/auth/salt-cache';
import { useRouter } from 'next/navigation';

// Mock the required modules
jest.mock('next/navigation', () => ({
  useRouter: jest.fn()
}));

jest.mock('@/lib/zkp/zkp-bcrypt', () => ({
  generateZKPWithBcrypt: jest.fn()
}));

jest.mock('@/lib/auth/salt-cache', () => ({
  getSalt: jest.fn()
}));

// Mock fetch
global.fetch = jest.fn();

// Set up router mock
const mockRouterPush = jest.fn();
(useRouter as jest.Mock).mockReturnValue({
  push: mockRouterPush
});

describe('PasswordResetForm with bcrypt integration', () => {
  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();

    // Mock router
    (useRouter as jest.Mock).mockReturnValue({
      push: jest.fn()
    });

    // Mock getSalt
    (getSalt as jest.Mock).mockResolvedValue('mock-salt');

    // Mock generateZKPWithBcrypt
    (generateZKPWithBcrypt as jest.Mock).mockResolvedValue({
      proof: { mock: 'proof' },
      publicSignals: { mock: 'publicSignals' }
    });

    // Mock fetch
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: jest.fn().mockResolvedValue({ success: true })
    });
  });

  it('should use generateZKPWithBcrypt for password reset confirmation', async () => {
    // Arrange
    const searchParams = new URLSearchParams();
    searchParams.set('token', 'reset-token');
    searchParams.set('email', 'user@example.com');

    render(<PasswordResetForm isConfirmation={true} searchParams={searchParams} />);

    // Act
    fireEvent.change(screen.getByLabelText(/new password/i), { target: { value: 'newpassword' } });
    fireEvent.change(screen.getByLabelText(/confirm password/i), { target: { value: 'newpassword' } });
    fireEvent.click(screen.getByRole('button', { name: /confirm new password/i }));

    // Assert
    await waitFor(() => {
      expect(getSalt).toHaveBeenCalledWith('user@example.com');
      expect(generateZKPWithBcrypt).toHaveBeenCalledWith('user@example.com', 'newpassword', 'mock-salt');
      expect(global.fetch).toHaveBeenCalledWith(
        '/api/auth/confirm-reset',
        expect.objectContaining({
          method: 'POST',
          body: expect.stringContaining('proof')
        })
      );
      // Ensure password is not in the request body
      const requestBody = JSON.parse((global.fetch as jest.Mock).mock.calls[0][1].body);
      expect(requestBody).not.toHaveProperty('password');
    });
  });

  it('should handle successful password reset request', async () => {
    // Arrange
    render(<PasswordResetForm />);

    // Act
    fireEvent.change(screen.getByLabelText(/email/i), { target: { value: 'user@example.com' } });
    fireEvent.click(screen.getByRole('button', { name: /reset password/i }));

    // Assert
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        '/api/auth/request-reset',
        expect.objectContaining({
          method: 'POST',
          body: expect.stringContaining('user@example.com')
        })
      );
      expect(screen.getByText(/check your email/i)).toBeInTheDocument();
    });
  });

  it('should handle successful password reset confirmation', async () => {
    // Arrange
    const searchParams = new URLSearchParams();
    searchParams.set('token', 'reset-token');
    searchParams.set('email', 'user@example.com');

    render(<PasswordResetForm isConfirmation={true} searchParams={searchParams} />);

    // Act
    fireEvent.change(screen.getByLabelText(/new password/i), { target: { value: 'newpassword' } });
    fireEvent.change(screen.getByLabelText(/confirm password/i), { target: { value: 'newpassword' } });
    fireEvent.click(screen.getByRole('button', { name: /confirm new password/i }));

    // Assert
    await waitFor(() => {
      // Check that fetch was called with the correct parameters
      expect(global.fetch).toHaveBeenCalledWith(
        '/api/auth/confirm-reset',
        expect.objectContaining({
          method: 'POST',
          body: expect.stringContaining('proof')
        })
      );
    });
  });

  it('should handle password reset confirmation failure', async () => {
    // Arrange
    const searchParams = new URLSearchParams();
    searchParams.set('token', 'reset-token');
    searchParams.set('email', 'user@example.com');

    (global.fetch as jest.Mock).mockResolvedValue({
      ok: false,
      json: jest.fn().mockResolvedValue({ error: 'Invalid token' })
    });

    render(<PasswordResetForm isConfirmation={true} searchParams={searchParams} />);

    // Act
    fireEvent.change(screen.getByLabelText(/new password/i), { target: { value: 'newpassword' } });
    fireEvent.change(screen.getByLabelText(/confirm password/i), { target: { value: 'newpassword' } });
    fireEvent.click(screen.getByRole('button', { name: /confirm new password/i }));

    // Assert
    await waitFor(() => {
      expect(screen.getByText('Invalid token')).toBeInTheDocument();
    });
  });
});
