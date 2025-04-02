import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import ZKPLogin from '@/components/admin/auth/ZKPLogin';

// Mock the Next.js router
const mockRouter = {
  push: jest.fn(),
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

// Mock the ZKP library functions
jest.mock('@/lib/zkp', () => ({
  generateProof: jest.fn(),
  verifyProof: jest.fn(),
  generateSalt: jest.fn().mockReturnValue('test-salt-value'),
  derivePublicKey: jest.fn().mockReturnValue('test-derived-public-key'),
}));

describe('ZKPLogin Rendering Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders the login form with proper elements', () => {
    render(<ZKPLogin />);

    // Check for essential form elements
    expect(screen.getByLabelText(/username/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument();

    // Check for security messaging
    expect(screen.getByText(/zero-knowledge proof/i)).toBeInTheDocument();
    expect(screen.getByText(/password is never sent to the server/i)).toBeInTheDocument();
  });

  it('renders the remember me option', () => {
    render(<ZKPLogin />);

    const rememberMeCheckbox = screen.getByRole('checkbox', { name: /remember me/i });
    expect(rememberMeCheckbox).toBeInTheDocument();
    expect(rememberMeCheckbox).not.toBeChecked();
  });

  it('renders the secure authentication message', () => {
    render(<ZKPLogin />);

    // Security message should be present
    expect(screen.getByText('Secure Authentication')).toBeInTheDocument();
  });

  it('has a submit button', () => {
    render(<ZKPLogin />);

    // Check that the submit button exists
    const submitButton = screen.getByTestId('submit-button');
    expect(submitButton).toBeInTheDocument();
    expect(submitButton).toHaveTextContent('Sign In');
  });

  it('has a forgot password button', () => {
    render(<ZKPLogin />);

    // Check that the forgot password button exists
    const forgotPasswordButton = screen.getByTestId('forgot-password-button');
    expect(forgotPasswordButton).toBeInTheDocument();
    expect(forgotPasswordButton).toHaveTextContent('Forgot password?');
  });
});
