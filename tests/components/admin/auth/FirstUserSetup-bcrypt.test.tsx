import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { FirstUserSetup } from '@/components/admin/auth/FirstUserSetup';
import { generateZKPWithBcrypt } from '@/lib/zkp/zkp-bcrypt';
import { generateSalt } from '@/lib/zkp';
import { useRouter } from 'next/navigation';

// Mock the required modules
jest.mock('next/navigation', () => ({
  useRouter: jest.fn()
}));

jest.mock('@/lib/zkp/zkp-bcrypt', () => ({
  generateZKPWithBcrypt: jest.fn()
}));

jest.mock('@/lib/zkp', () => ({
  generateSalt: jest.fn()
}));

// Mock fetch
global.fetch = jest.fn();

describe('FirstUserSetup with bcrypt integration', () => {
  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();

    // Mock router
    (useRouter as jest.Mock).mockReturnValue({
      push: jest.fn()
    });

    // Mock localStorage
    Object.defineProperty(window, 'localStorage', {
      value: {
        getItem: jest.fn(),
        setItem: jest.fn(),
        removeItem: jest.fn()
      },
      writable: true
    });

    // Mock generateSalt
    (generateSalt as jest.Mock).mockReturnValue('mock-salt');

    // Mock generateZKPWithBcrypt
    (generateZKPWithBcrypt as jest.Mock).mockResolvedValue({
      proof: { mock: 'proof' },
      publicSignals: { mock: 'publicSignals' }
    });

    // Mock fetch
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: jest.fn().mockResolvedValue({ token: 'mock-token' })
    });

    // Mock document.cookie for CSRF token
    Object.defineProperty(document, 'cookie', {
      value: 'csrf_token=mock-csrf-token',
      writable: true
    });
  });

  it('should use generateZKPWithBcrypt instead of sending raw password', async () => {
    // Arrange
    render(<FirstUserSetup />);

    // Act
    fireEvent.change(screen.getByTestId('username-input'), { target: { value: 'admin' } });
    fireEvent.change(screen.getByTestId('password-input'), { target: { value: 'adminpassword' } });
    fireEvent.change(screen.getByTestId('confirm-password-input'), { target: { value: 'adminpassword' } });
    fireEvent.change(screen.getByTestId('email-input'), { target: { value: 'admin@example.com' } });
    fireEvent.change(screen.getByTestId('site-name-input'), { target: { value: 'Test Site' } });
    fireEvent.click(screen.getByTestId('submit-button'));

    // Assert
    await waitFor(() => {
      expect(generateSalt).toHaveBeenCalled();
      expect(generateZKPWithBcrypt).toHaveBeenCalledWith('admin', 'adminpassword', 'mock-salt');
      expect(global.fetch).toHaveBeenCalledWith(
        '/api/auth/setup',
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
            'X-CSRF-Token': 'mock-csrf-token'
          }),
          body: expect.stringContaining('proof')
        })
      );
      // Ensure password is not in the request body
      const requestBody = JSON.parse((global.fetch as jest.Mock).mock.calls[0][1].body);
      expect(requestBody).not.toHaveProperty('password');
    });
  });

  it('should handle successful user creation', async () => {
    // Arrange
    const router = { push: jest.fn() };
    (useRouter as jest.Mock).mockReturnValue(router);

    render(<FirstUserSetup redirectPath="/admin/dashboard" />);

    // Act
    fireEvent.change(screen.getByTestId('username-input'), { target: { value: 'admin' } });
    fireEvent.change(screen.getByTestId('password-input'), { target: { value: 'adminpassword' } });
    fireEvent.change(screen.getByTestId('confirm-password-input'), { target: { value: 'adminpassword' } });
    fireEvent.change(screen.getByTestId('email-input'), { target: { value: 'admin@example.com' } });
    fireEvent.change(screen.getByTestId('site-name-input'), { target: { value: 'Test Site' } });
    fireEvent.click(screen.getByTestId('submit-button'));

    // Assert
    await waitFor(() => {
      expect(window.localStorage.setItem).toHaveBeenCalledWith('authToken', 'mock-token');
      expect(router.push).toHaveBeenCalledWith('/admin/dashboard');
    });
  });

  it('should handle user creation failure', async () => {
    // Arrange
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: false,
      json: jest.fn().mockResolvedValue({ error: 'Failed to create user' })
    });

    render(<FirstUserSetup />);

    // Act
    fireEvent.change(screen.getByTestId('username-input'), { target: { value: 'admin' } });
    fireEvent.change(screen.getByTestId('password-input'), { target: { value: 'adminpassword' } });
    fireEvent.change(screen.getByTestId('confirm-password-input'), { target: { value: 'adminpassword' } });
    fireEvent.change(screen.getByTestId('email-input'), { target: { value: 'admin@example.com' } });
    fireEvent.change(screen.getByTestId('site-name-input'), { target: { value: 'Test Site' } });
    fireEvent.click(screen.getByTestId('submit-button'));

    // Assert
    await waitFor(() => {
      expect(screen.getByText('Failed to create user')).toBeInTheDocument();
    });
  });
});
