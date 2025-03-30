import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { ZKPLogin } from '@/components/admin/auth';

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
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument();
    
    // Check for security messaging
    expect(screen.getByText(/zero-knowledge proof/i)).toBeInTheDocument();
    expect(screen.getByText(/your password never leaves your device/i)).toBeInTheDocument();
  });
  
  it('renders the remember me option', () => {
    render(<ZKPLogin />);
    
    const rememberMeCheckbox = screen.getByRole('checkbox', { name: /remember me/i });
    expect(rememberMeCheckbox).toBeInTheDocument();
    expect(rememberMeCheckbox).not.toBeChecked();
  });
  
  it('renders the security indicator', () => {
    render(<ZKPLogin />);
    
    // Security indicator should be present
    expect(screen.getByTestId('security-indicator')).toBeInTheDocument();
    
    // Initially, it should show as secure (green)
    expect(screen.getByTestId('security-indicator')).toHaveClass('text-green-500');
  });

  it('renders loading state when isLoading prop is true', () => {
    render(<ZKPLogin isLoading={true} />);
    
    expect(screen.getByTestId('login-loading-indicator')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /sign in/i })).toBeDisabled();
  });

  it('renders error state when error prop is provided', () => {
    const errorMessage = 'Authentication failed. Please try again.';
    render(<ZKPLogin error={errorMessage} />);
    
    expect(screen.getByText(errorMessage)).toBeInTheDocument();
    expect(screen.getByTestId('login-error-message')).toHaveClass('text-red-500');
  });
});
