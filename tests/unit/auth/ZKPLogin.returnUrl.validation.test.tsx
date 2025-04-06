import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ZKPLogin } from '@/components/admin/auth/ZKPLogin';
import * as zkpBcryptLib from '@/lib/zkp/zkp-bcrypt';
import * as saltCache from '@/lib/auth/salt-cache';
import * as urlValidator from '@/utils/url-validator';

// Mock the Next.js router
const mockPush = jest.fn();
const mockUseSearchParams = jest.fn(() => new URLSearchParams('returnUrl=%2Fadmin%2Fdashboard'));

jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
    replace: jest.fn(),
    prefetch: jest.fn(),
    back: jest.fn(),
    forward: jest.fn(),
    refresh: jest.fn(),
    pathname: '/login',
    query: {}
  }),
  useSearchParams: () => mockUseSearchParams()
}));

// Mock the fetch API
global.fetch = jest.fn();

// Mock localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn()
};
Object.defineProperty(window, 'localStorage', { value: localStorageMock });

// Mock the ZKP library
jest.mock('@/lib/zkp/zkp-bcrypt', () => ({
  generateZKPWithBcrypt: jest.fn().mockResolvedValue({
    proof: 'mock-proof',
    publicSignals: ['mock-public-signal-1', 'mock-public-signal-2']
  })
}));

// Mock the salt cache
jest.mock('@/lib/auth/salt-cache', () => ({
  getSalt: jest.fn().mockResolvedValue('mock-salt'),
  clearSaltCache: jest.fn()
}));

// Mock the URL validator
jest.mock('@/utils/url-validator', () => ({
  isValidReturnUrl: jest.fn()
}));

// Mock CSRF token
const getCsrfToken = () => 'mock-csrf-token';
global.getCsrfToken = getCsrfToken;

describe('ZKPLogin with returnUrl validation', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    // Mock successful fetch response
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({ token: 'mock-token', user: { id: '123', username: 'testuser' } })
    });

    // Reset the search params mock
    mockUseSearchParams.mockReturnValue(new URLSearchParams('returnUrl=%2Fadmin%2Fdashboard'));
  });

  it('should redirect to default path when returnUrl is invalid', async () => {
    // Mock URL validator to return false (invalid URL)
    (urlValidator.isValidReturnUrl as jest.Mock).mockReturnValue(false);

    // Render the component
    render(<ZKPLogin redirectPath="/admin" />);

    // Fill in the form
    fireEvent.change(screen.getByLabelText(/username/i), { target: { value: 'testuser' } });
    fireEvent.change(screen.getByLabelText(/password/i), { target: { value: 'password123' } });

    // Submit the form
    fireEvent.click(screen.getByRole('button', { name: /sign in/i }));

    // Wait for the login process to complete
    await waitFor(() => {
      expect(zkpBcryptLib.generateZKPWithBcrypt).toHaveBeenCalledWith(
        'testuser',
        'password123',
        'mock-salt'
      );
      expect(fetch).toHaveBeenCalled();
      expect(localStorageMock.setItem).toHaveBeenCalledWith('authToken', 'mock-token');

      // Should call isValidReturnUrl with the decoded returnUrl
      expect(urlValidator.isValidReturnUrl).toHaveBeenCalledWith('/admin/dashboard');

      // Should redirect to default path since returnUrl is invalid
      expect(mockPush).toHaveBeenCalledWith('/admin');
    });
  });

  it('should redirect to returnUrl when it is valid', async () => {
    // Mock URL validator to return true (valid URL)
    (urlValidator.isValidReturnUrl as jest.Mock).mockReturnValue(true);

    // Render the component
    render(<ZKPLogin redirectPath="/admin" />);

    // Fill in the form
    fireEvent.change(screen.getByLabelText(/username/i), { target: { value: 'testuser' } });
    fireEvent.change(screen.getByLabelText(/password/i), { target: { value: 'password123' } });

    // Submit the form
    fireEvent.click(screen.getByRole('button', { name: /sign in/i }));

    // Wait for the login process to complete
    await waitFor(() => {
      expect(zkpBcryptLib.generateZKPWithBcrypt).toHaveBeenCalledWith(
        'testuser',
        'password123',
        'mock-salt'
      );
      expect(fetch).toHaveBeenCalled();
      expect(localStorageMock.setItem).toHaveBeenCalledWith('authToken', 'mock-token');

      // Should call isValidReturnUrl with the decoded returnUrl
      expect(urlValidator.isValidReturnUrl).toHaveBeenCalledWith('/admin/dashboard');

      // Should redirect to returnUrl since it is valid
      expect(mockPush).toHaveBeenCalledWith('/admin/dashboard');
    });
  });
});
