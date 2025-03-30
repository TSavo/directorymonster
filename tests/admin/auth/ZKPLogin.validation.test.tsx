import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import userEvent from '@testing-library/user-event';
import { ZKPLogin } from '@/components/admin/auth';

// Mock the Next.js router
const mockRouter = {
  push: jest.fn(),
  prefetch: jest.fn(),
};

jest.mock('next/navigation', () => ({
  useRouter: () => mockRouter
}));

// Mock fetch for API calls
global.fetch = jest.fn();

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
    expect(await screen.findByText(/email is required/i)).toBeInTheDocument();
    expect(await screen.findByText(/password is required/i)).toBeInTheDocument();
  });
  
  it('validates email format', async () => {
    const user = userEvent.setup();
    render(<ZKPLogin />);
    
    // Type invalid email
    await user.type(screen.getByLabelText(/email/i), 'not-an-email');
    await user.type(screen.getByLabelText(/password/i), 'validPassword123');
    
    // Submit form
    await user.click(screen.getByRole('button', { name: /sign in/i }));
    
    // Should show email validation error
    expect(await screen.findByText(/please enter a valid email address/i)).toBeInTheDocument();
  });
  
  it('validates password length', async () => {
    const user = userEvent.setup();
    render(<ZKPLogin />);
    
    // Type valid email but short password
    await user.type(screen.getByLabelText(/email/i), 'valid@example.com');
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
    expect(await screen.findByText(/email is required/i)).toBeInTheDocument();
    
    // Type in valid email
    await user.type(screen.getByLabelText(/email/i), 'valid@example.com');
    
    // Error should be cleared
    expect(screen.queryByText(/email is required/i)).not.toBeInTheDocument();
  });

  it('updates security indicator based on password strength', async () => {
    const user = userEvent.setup();
    render(<ZKPLogin />);
    
    const passwordInput = screen.getByLabelText(/password/i);
    const securityIndicator = screen.getByTestId('security-indicator');
    
    // Initially green (secure)
    expect(securityIndicator).toHaveClass('text-green-500');
    
    // Type weak password
    await user.type(passwordInput, 'weak');
    
    // Should change to red (insecure)
    expect(securityIndicator).toHaveClass('text-red-500');
    
    // Clear and type stronger password
    await user.clear(passwordInput);
    await user.type(passwordInput, 'StrongP@ssw0rd123');
    
    // Should change to green (secure)
    expect(securityIndicator).toHaveClass('text-green-500');
  });
});
