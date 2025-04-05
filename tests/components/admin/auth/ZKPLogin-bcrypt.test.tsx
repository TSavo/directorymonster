import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ZKPLogin } from '@/components/admin/auth/ZKPLogin';
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
  getSalt: jest.fn(),
  clearSaltCache: jest.fn()
}));

// Mock fetch
global.fetch = jest.fn();

describe('ZKPLogin with bcrypt integration', () => {
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
      json: jest.fn().mockResolvedValue({ token: 'mock-token' })
    });
  });

  it('should use generateZKPWithBcrypt instead of generateProof', async () => {
    // Arrange
    render(<ZKPLogin />);

    // Act
    fireEvent.change(screen.getByTestId('username-input'), { target: { value: 'testuser' } });
    fireEvent.change(screen.getByTestId('password-input'), { target: { value: 'testpassword' } });
    fireEvent.click(screen.getByTestId('submit-button'));

    // Assert
    await waitFor(() => {
      expect(getSalt).toHaveBeenCalledWith('testuser');
      expect(generateZKPWithBcrypt).toHaveBeenCalledWith('testuser', 'testpassword', 'mock-salt');
      expect(global.fetch).toHaveBeenCalledWith(
        '/api/auth/verify',
        expect.objectContaining({
          method: 'POST',
          body: expect.stringContaining('proof')
        })
      );
    });
  });

  it('should handle successful login', async () => {
    // Arrange
    const router = { push: jest.fn() };
    (useRouter as jest.Mock).mockReturnValue(router);

    render(<ZKPLogin redirectPath="/admin" />);

    // Act
    fireEvent.change(screen.getByTestId('username-input'), { target: { value: 'testuser' } });
    fireEvent.change(screen.getByTestId('password-input'), { target: { value: 'testpassword' } });
    fireEvent.click(screen.getByTestId('submit-button'));

    // Assert
    await waitFor(() => {
      expect(window.localStorage.setItem).toHaveBeenCalledWith('authToken', 'mock-token');
      expect(router.push).toHaveBeenCalledWith('/admin');
    });
  });

  it('should handle login failure', async () => {
    // Arrange
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: false,
      json: jest.fn().mockResolvedValue({ error: 'Invalid credentials' })
    });

    render(<ZKPLogin />);

    // Act
    fireEvent.change(screen.getByTestId('username-input'), { target: { value: 'testuser' } });
    fireEvent.change(screen.getByTestId('password-input'), { target: { value: 'testpassword' } });
    fireEvent.click(screen.getByTestId('submit-button'));

    // Assert
    await waitFor(() => {
      expect(screen.getByTestId('login-error')).toBeInTheDocument();
    });
  });
});
