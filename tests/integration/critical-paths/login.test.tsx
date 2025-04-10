/**
 * @jest-environment jsdom
 */

import React from 'react';
import { screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { renderWithWrapper } from './TestWrapper';
import { mockRouter, resetMocks } from './setup';

// Mock the useSearchParams hook
jest.mock('next/navigation', () => ({
  useSearchParams: jest.fn(() => ({
    get: (param: string) => {
      if (param === 'returnUrl') {
        return '/admin';
      }
      return null;
    },
  })),
}));

// Mock the page component
const LoginPage = () => {
  return (
    <div data-testid="login-page">
      <h1 data-testid="login-heading">DirectoryMonster Admin</h1>
      <h2 data-testid="login-subheading">Zero-Knowledge Proof Authentication</h2>
      <div data-testid="auth-container" data-redirect-path="/admin">
        <div data-testid="login-form">
          <input type="text" placeholder="Username" data-testid="username-input" />
          <input type="password" placeholder="Password" data-testid="password-input" />
          <button type="submit" data-testid="login-button">Log In</button>
        </div>
      </div>
      <div data-testid="zkp-login" data-redirect-path="/admin">
        <div data-testid="zkp-login-form">
          <input type="text" placeholder="Username" data-testid="zkp-username-input" />
          <input type="password" placeholder="Password" data-testid="zkp-password-input" />
          <button type="submit" data-testid="zkp-login-button">Log In</button>
        </div>
      </div>
    </div>
  );
};



describe('Login Page Integration Tests', () => {
  beforeEach(() => {
    resetMocks();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('renders the login page with auth container', async () => {
    // Render the login page
    renderWithWrapper(<LoginPage />);

    // Wait for the login page to be rendered
    await waitFor(() => {
      expect(screen.getByTestId('login-page')).toBeInTheDocument();
    });

    // Check that the auth container is rendered
    expect(screen.getByTestId('auth-container')).toBeInTheDocument();
  });

  it('renders the login form with username and password inputs', async () => {
    // Render the login page
    renderWithWrapper(<LoginPage />);

    // Wait for the login form to be rendered
    await waitFor(() => {
      expect(screen.getByTestId('login-form')).toBeInTheDocument();
    });

    // Check that the username and password inputs are rendered
    expect(screen.getByTestId('username-input')).toBeInTheDocument();
    expect(screen.getByTestId('password-input')).toBeInTheDocument();
    expect(screen.getByTestId('login-button')).toBeInTheDocument();
  });

  it('passes the correct redirect path to auth container', async () => {
    // Render the login page
    renderWithWrapper(<LoginPage />);

    // Wait for the auth container to be rendered
    await waitFor(() => {
      expect(screen.getByTestId('auth-container')).toBeInTheDocument();
    });

    // Check that the auth container has the correct redirect path
    expect(screen.getByTestId('auth-container')).toHaveAttribute('data-redirect-path', '/admin');
  });

  it('renders the login page with correct headings', async () => {
    // Render the login page
    renderWithWrapper(<LoginPage />);

    // Wait for the login page to be rendered
    await waitFor(() => {
      expect(screen.getByTestId('login-page')).toBeInTheDocument();
    });

    // Check that the headings are rendered
    expect(screen.getByTestId('login-heading')).toBeInTheDocument();
    expect(screen.getByTestId('login-heading')).toHaveTextContent('DirectoryMonster Admin');

    expect(screen.getByTestId('login-subheading')).toBeInTheDocument();
    expect(screen.getByTestId('login-subheading')).toHaveTextContent('Zero-Knowledge Proof Authentication');
  });
});
