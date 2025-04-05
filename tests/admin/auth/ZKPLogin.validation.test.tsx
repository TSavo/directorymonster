import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import userEvent from '@testing-library/user-event';
import ZKPLogin from '@/components/admin/auth/ZKPLogin';

// Mock TextEncoder and crypto.subtle for Jest environment
global.TextEncoder = class TextEncoder {
  encode(text: string): Uint8Array {
    return new Uint8Array(Buffer.from(text));
  }
};

// Mock the ZKP-Bcrypt library functions
jest.mock('@/lib/zkp/zkp-bcrypt', () => ({
  generateZKPWithBcrypt: jest.fn().mockImplementation(() => {
    return Promise.resolve({
      proof: {
        pi_a: ['mock_proof_a', '2', '3'],
        pi_b: [['4', '5'], ['6', '7'], ['8', '9']],
        pi_c: ['mock_proof_c', '11', '12'],
        protocol: 'groth16'
      },
      publicSignals: ['mock_public_signal_1', 'mock_public_signal_2']
    });
  }),
  verifyZKPWithBcrypt: jest.fn().mockResolvedValue(true),
  hashPassword: jest.fn().mockResolvedValue('$2b$10$mockedhash'),
  verifyPassword: jest.fn().mockResolvedValue(true),
  generateBcryptSalt: jest.fn().mockReturnValue('$2b$10$mockedsalt')
}));

// Mock the Next.js router
const mockRouter = {
  push: jest.fn(),
  prefetch: jest.fn(),
};

jest.mock('next/navigation', () => ({
  useRouter: () => mockRouter
}));

// Mock fetch for API calls
global.fetch = jest.fn().mockImplementation(() =>
  Promise.resolve({
    ok: false,
    status: 401,
    json: () => Promise.resolve({ error: 'Invalid credentials' }),
  })
);

describe('ZKPLogin Validation Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (global.fetch as jest.Mock).mockReset();
  });

  it('shows validation errors for empty fields', async () => {
    const user = userEvent.setup();
    render(<ZKPLogin />);

    // Submit without filling any fields
    await user.click(screen.getByRole('button', { name: /sign in/i }));

    // Should show validation errors
    expect(await screen.findByText(/username is required/i)).toBeInTheDocument();
    expect(await screen.findByText(/password is required/i)).toBeInTheDocument();
  });

  it('validates username input', async () => {
    const user = userEvent.setup();
    render(<ZKPLogin />);

    // Type a username and password
    await user.type(screen.getByLabelText(/username/i), 'user');
    await user.type(screen.getByLabelText(/password/i), 'validPassword123');

    // Submit form
    await user.click(screen.getByRole('button', { name: /sign in/i }));

    // No validation error for username since it's not empty
    expect(screen.queryByText(/username is required/i)).not.toBeInTheDocument();
  });

  it('validates password length', async () => {
    const user = userEvent.setup();
    render(<ZKPLogin />);

    // Type valid username but short password
    await user.type(screen.getByLabelText(/username/i), 'validuser');
    await user.type(screen.getByLabelText(/password/i), 'short');

    // Submit form
    await user.click(screen.getByRole('button', { name: /sign in/i }));

    // Should show password validation error
    expect(await screen.findByText(/password must be at least 8 characters/i)).toBeInTheDocument();
  });

  it('clears validation errors when input is corrected', async () => {
    const user = userEvent.setup();
    render(<ZKPLogin />);

    // Submit empty form to trigger validation
    await user.click(screen.getByRole('button', { name: /sign in/i }));

    // Verify error appears
    expect(await screen.findByText(/username is required/i)).toBeInTheDocument();

    // Type in valid username
    await user.type(screen.getByLabelText(/username/i), 'validuser');

    // Submit form again to trigger validation
    await user.click(screen.getByRole('button', { name: /sign in/i }));

    // Now we should see password error but not username error
    expect(await screen.findByText(/password is required/i)).toBeInTheDocument();
    expect(screen.queryByText(/username is required/i)).not.toBeInTheDocument();
  });

  it('handles password validation correctly', async () => {
    const user = userEvent.setup();
    render(<ZKPLogin />);

    // Fill in username to avoid username validation error
    await user.type(screen.getByLabelText(/username/i), 'validuser');

    const passwordInput = screen.getByLabelText(/password/i);

    // Type weak password
    await user.type(passwordInput, 'weak');

    // Submit form
    await user.click(screen.getByRole('button', { name: /sign in/i }));

    // Should show password validation error
    expect(await screen.findByText(/password must be at least 8 characters/i)).toBeInTheDocument();

    // Clear and type stronger password
    await user.clear(passwordInput);
    await user.type(passwordInput, 'StrongP@ssw0rd123');

    // Submit form again to trigger validation
    await user.click(screen.getByRole('button', { name: /sign in/i }));

    // Now we should not see the password length error
    await waitFor(() => {
      expect(screen.queryByText(/password must be at least 8 characters/i)).not.toBeInTheDocument();
    });
  });
});
