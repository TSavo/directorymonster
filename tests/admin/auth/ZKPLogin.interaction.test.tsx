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

    const usernameInput = screen.getByLabelText(/username/i);
    const passwordInput = screen.getByLabelText(/password/i);

    await user.type(usernameInput, 'testuser');
    await user.type(passwordInput, 'securePassword123');

    expect(usernameInput).toHaveValue('testuser');
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

  it('has a password input with type password', async () => {
    render(<ZKPLogin />);

    const passwordInput = screen.getByLabelText(/password/i);

    // Password should be hidden
    expect(passwordInput).toHaveAttribute('type', 'password');
  });

  it('navigates to forgot password page when forgot password button is clicked', async () => {
    const user = userEvent.setup();

    render(<ZKPLogin />);

    const forgotPasswordButton = screen.getByTestId('forgot-password-button');
    await user.click(forgotPasswordButton);

    // Check that the router was called to navigate to the forgot password page
    expect(mockPush).toHaveBeenCalledWith('/admin/forgot-password');
  });

  it('has a remember me checkbox', async () => {
    const user = userEvent.setup();
    render(<ZKPLogin />);

    // Check that the remember me checkbox exists
    const rememberMeCheckbox = screen.getByRole('checkbox', { name: /remember me/i });
    expect(rememberMeCheckbox).toBeInTheDocument();
  });
});
