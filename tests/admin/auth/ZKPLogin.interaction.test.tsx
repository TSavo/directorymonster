import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import userEvent from '@testing-library/user-event';
import { ZKPLogin } from '@/components/admin/auth';

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

jest.mock('next/navigation', () => ({
  useRouter: () => mockRouter
}));

// Mock localStorage
const localStorageMock = (() => {
  let store = {};
  return {
    getItem: jest.fn((key) => store[key] || null),
    setItem: jest.fn((key, value) => {
      store[key] = value.toString();
    }),
    removeItem: jest.fn((key) => {
      delete store[key];
    }),
    clear: jest.fn(() => {
      store = {};
    }),
  };
})();

Object.defineProperty(window, 'localStorage', { value: localStorageMock });

describe('ZKPLogin Interaction Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorageMock.clear();
  });

  it('updates field values when user types', async () => {
    const user = userEvent.setup();
    render(<ZKPLogin />);
    
    const emailInput = screen.getByLabelText(/email/i);
    const passwordInput = screen.getByLabelText(/password/i);
    
    await user.type(emailInput, 'test@example.com');
    await user.type(passwordInput, 'securePassword123');
    
    expect(emailInput).toHaveValue('test@example.com');
    expect(passwordInput).toHaveValue('securePassword123');
  });
  
  it('toggles remember me checkbox when clicked', async () => {
    const user = userEvent.setup();
    render(<ZKPLogin />);
    
    const rememberMeCheckbox = screen.getByRole('checkbox', { name: /remember me/i });
    
    // Initially unchecked
    expect(rememberMeCheckbox).not.toBeChecked();
    
    // Click the checkbox
    await user.click(rememberMeCheckbox);
    
    // Should now be checked
    expect(rememberMeCheckbox).toBeChecked();
    
    // Click again to toggle off
    await user.click(rememberMeCheckbox);
    
    // Should be unchecked again
    expect(rememberMeCheckbox).not.toBeChecked();
  });
  
  it('shows password reveal button and toggles visibility', async () => {
    const user = userEvent.setup();
    render(<ZKPLogin />);
    
    const passwordInput = screen.getByLabelText(/password/i);
    const revealButton = screen.getByRole('button', { name: /toggle password visibility/i });
    
    // Password should initially be hidden
    expect(passwordInput).toHaveAttribute('type', 'password');
    
    // Click the reveal button
    await user.click(revealButton);
    
    // Password should now be visible
    expect(passwordInput).toHaveAttribute('type', 'text');
    
    // Click again to hide
    await user.click(revealButton);
    
    // Password should be hidden again
    expect(passwordInput).toHaveAttribute('type', 'password');
  });

  it('calls onForgotPassword when forgot password link is clicked', async () => {
    const user = userEvent.setup();
    const handleForgotPassword = jest.fn();
    
    render(<ZKPLogin onForgotPassword={handleForgotPassword} />);
    
    const forgotPasswordLink = screen.getByText(/forgot password/i);
    await user.click(forgotPasswordLink);
    
    expect(handleForgotPassword).toHaveBeenCalledTimes(1);
  });

  it('stores email in localStorage when remember me is checked', async () => {
    const user = userEvent.setup();
    render(<ZKPLogin />);
    
    // Fill in email
    await user.type(screen.getByLabelText(/email/i), 'remembered@example.com');
    
    // Check remember me
    await user.click(screen.getByRole('checkbox', { name: /remember me/i }));
    
    // Submit form (this would trigger the saving)
    await user.click(screen.getByRole('button', { name: /sign in/i }));
    
    // Check localStorage was updated
    expect(localStorageMock.setItem).toHaveBeenCalledWith('rememberedEmail', 'remembered@example.com');
  });
});
