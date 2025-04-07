/**
 * @jest-environment jsdom
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { renderWithWrapper } from '../TestWrapper';

// Mock the login form component
const LoginForm = () => {
  const [username, setUsername] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [errors, setErrors] = React.useState<{ username?: string; password?: string }>({});
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [isSuccess, setIsSuccess] = React.useState(false);
  
  const validateForm = () => {
    const newErrors: { username?: string; password?: string } = {};
    
    if (!username.trim()) {
      newErrors.username = 'Username is required';
    }
    
    if (!password) {
      newErrors.password = 'Password is required';
    } else if (password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (validateForm()) {
      setIsSubmitting(true);
      
      // Simulate API call
      setTimeout(() => {
        setIsSubmitting(false);
        setIsSuccess(true);
      }, 500);
    }
  };
  
  return (
    <div>
      {isSuccess ? (
        <div data-testid="success-message">Login successful!</div>
      ) : (
        <form onSubmit={handleSubmit} data-testid="login-form">
          <div>
            <label htmlFor="username">Username</label>
            <input
              type="text"
              id="username"
              value={username}
              onChange={e => setUsername(e.target.value)}
              aria-invalid={!!errors.username}
              aria-describedby={errors.username ? 'username-error' : undefined}
              data-testid="username-input"
            />
            {errors.username && (
              <div id="username-error" role="alert" data-testid="username-error">
                {errors.username}
              </div>
            )}
          </div>
          
          <div>
            <label htmlFor="password">Password</label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              aria-invalid={!!errors.password}
              aria-describedby={errors.password ? 'password-error' : undefined}
              data-testid="password-input"
            />
            {errors.password && (
              <div id="password-error" role="alert" data-testid="password-error">
                {errors.password}
              </div>
            )}
          </div>
          
          <button
            type="submit"
            disabled={isSubmitting}
            data-testid="login-button"
          >
            {isSubmitting ? 'Logging in...' : 'Log In'}
          </button>
        </form>
      )}
    </div>
  );
};

describe('Login Form Validation', () => {
  it('displays validation errors when submitting an empty form', async () => {
    renderWithWrapper(<LoginForm />);
    
    // Submit the form without entering any data
    const loginButton = screen.getByTestId('login-button');
    fireEvent.click(loginButton);
    
    // Check that validation errors are displayed
    await waitFor(() => {
      expect(screen.getByTestId('username-error')).toBeInTheDocument();
      expect(screen.getByTestId('password-error')).toBeInTheDocument();
    });
    
    // Check the error messages
    expect(screen.getByTestId('username-error')).toHaveTextContent('Username is required');
    expect(screen.getByTestId('password-error')).toHaveTextContent('Password is required');
  });
  
  it('displays password validation error when password is too short', async () => {
    renderWithWrapper(<LoginForm />);
    
    // Enter a username
    const usernameInput = screen.getByTestId('username-input');
    fireEvent.change(usernameInput, { target: { value: 'testuser' } });
    
    // Enter a short password
    const passwordInput = screen.getByTestId('password-input');
    fireEvent.change(passwordInput, { target: { value: 'short' } });
    
    // Submit the form
    const loginButton = screen.getByTestId('login-button');
    fireEvent.click(loginButton);
    
    // Check that only password validation error is displayed
    await waitFor(() => {
      expect(screen.queryByTestId('username-error')).not.toBeInTheDocument();
      expect(screen.getByTestId('password-error')).toBeInTheDocument();
    });
    
    // Check the error message
    expect(screen.getByTestId('password-error')).toHaveTextContent('Password must be at least 8 characters');
  });
  
  it('submits the form successfully with valid data', async () => {
    renderWithWrapper(<LoginForm />);
    
    // Enter a username
    const usernameInput = screen.getByTestId('username-input');
    fireEvent.change(usernameInput, { target: { value: 'testuser' } });
    
    // Enter a valid password
    const passwordInput = screen.getByTestId('password-input');
    fireEvent.change(passwordInput, { target: { value: 'password123' } });
    
    // Submit the form
    const loginButton = screen.getByTestId('login-button');
    fireEvent.click(loginButton);
    
    // Check that the button shows loading state
    expect(loginButton).toHaveTextContent('Logging in...');
    expect(loginButton).toBeDisabled();
    
    // Check that the success message is displayed after the API call
    await waitFor(() => {
      expect(screen.getByTestId('success-message')).toBeInTheDocument();
    });
    
    // Check the success message
    expect(screen.getByTestId('success-message')).toHaveTextContent('Login successful!');
  });
  
  it('sets aria-invalid attribute on invalid fields', async () => {
    renderWithWrapper(<LoginForm />);
    
    // Submit the form without entering any data
    const loginButton = screen.getByTestId('login-button');
    fireEvent.click(loginButton);
    
    // Check that aria-invalid attribute is set on invalid fields
    await waitFor(() => {
      expect(screen.getByTestId('username-input')).toHaveAttribute('aria-invalid', 'true');
      expect(screen.getByTestId('password-input')).toHaveAttribute('aria-invalid', 'true');
    });
    
    // Enter a username to fix that field
    const usernameInput = screen.getByTestId('username-input');
    fireEvent.change(usernameInput, { target: { value: 'testuser' } });
    
    // Submit the form again
    fireEvent.click(loginButton);
    
    // Check that aria-invalid is removed from the fixed field
    await waitFor(() => {
      expect(screen.getByTestId('username-input')).not.toHaveAttribute('aria-invalid', 'true');
      expect(screen.getByTestId('password-input')).toHaveAttribute('aria-invalid', 'true');
    });
  });
});
