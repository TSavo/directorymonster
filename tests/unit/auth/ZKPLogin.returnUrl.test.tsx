import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ZKPLogin } from '@/components/admin/auth/ZKPLogin';
import * as zkpBcryptLib from '@/lib/zkp/zkp-bcrypt';
import * as saltCache from '@/lib/auth/salt-cache';

// Mock the Next.js router
const mockPush = jest.fn();
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
    replace: jest.fn(),
    prefetch: jest.fn(),
    back: jest.fn(),
    forward: jest.fn(),
    refresh: jest.fn(),
    pathname: '/login',
    query: { returnUrl: '/admin/dashboard' }
  }),
  useSearchParams: () => new URLSearchParams('returnUrl=%2Fadmin%2Fdashboard')
}));

// Mock the ZKP library
jest.mock('@/lib/zkp/zkp-bcrypt', () => ({
  generateZKPWithBcrypt: jest.fn().mockResolvedValue({
    proof: 'mock-proof',
    publicSignals: ['mock-signal']
  })
}));

// Mock the salt cache
jest.mock('@/lib/auth/salt-cache', () => ({
  getSalt: jest.fn().mockResolvedValue('mock-salt'),
  clearSaltCache: jest.fn()
}));

// Mock fetch
global.fetch = jest.fn().mockImplementation(() => 
  Promise.resolve({
    ok: true,
    json: () => Promise.resolve({ token: 'mock-token' })
  })
);

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => { store[key] = value; },
    removeItem: (key: string) => { delete store[key]; },
    clear: () => { store = {}; }
  };
})();
Object.defineProperty(window, 'localStorage', { value: localStorageMock });

// Mock document.cookie
Object.defineProperty(document, 'cookie', {
  writable: true,
  value: 'csrf_token=mock-csrf-token'
});

describe('ZKPLogin with returnUrl', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorageMock.clear();
  });

  it('should redirect to returnUrl after successful login', async () => {
    // Render the component
    render(<ZKPLogin />);

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
      expect(localStorageMock.getItem('authToken')).toBe('mock-token');
    });

    // Verify that router.push was called with the returnUrl
    expect(mockPush).toHaveBeenCalledWith('/admin/dashboard');
  });
});
