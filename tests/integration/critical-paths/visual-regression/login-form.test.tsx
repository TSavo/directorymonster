/**
 * @jest-environment jsdom
 */

import React from 'react';
import { fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { renderForSnapshot, snapshotTest } from './setup';

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
    <div className="login-form-container">
      {isSuccess ? (
        <div className="success-message" data-testid="success-message">
          <h2>Login successful!</h2>
          <p>You are now logged in.</p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="login-form" data-testid="login-form">
          <h2>Log In</h2>

          <div className="form-group">
            <label htmlFor="username">Username</label>
            <input
              type="text"
              id="username"
              className={errors.username ? 'input-error' : ''}
              value={username}
              onChange={e => setUsername(e.target.value)}
              aria-invalid={!!errors.username}
              aria-describedby={errors.username ? 'username-error' : undefined}
              data-testid="username-input"
            />
            {errors.username && (
              <div id="username-error" className="error-message" role="alert" data-testid="username-error">
                {errors.username}
              </div>
            )}
          </div>

          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              type="password"
              id="password"
              className={errors.password ? 'input-error' : ''}
              value={password}
              onChange={e => setPassword(e.target.value)}
              aria-invalid={!!errors.password}
              aria-describedby={errors.password ? 'password-error' : undefined}
              data-testid="password-input"
            />
            {errors.password && (
              <div id="password-error" className="error-message" role="alert" data-testid="password-error">
                {errors.password}
              </div>
            )}
          </div>

          <button
            type="submit"
            className="login-button"
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

describe('Login Form Visual Regression', () => {
  it('renders the login form correctly', () => {
    const container = renderForSnapshot(<LoginForm />);
    snapshotTest(container, 'login-form-default');
  });

  it('renders validation errors correctly', () => {
    const container = renderForSnapshot(<LoginForm />);

    // Submit the form without entering any data
    const loginButton = container.querySelector('[data-testid="login-button"]');
    if (loginButton) {
      fireEvent.click(loginButton);
    }

    snapshotTest(container, 'login-form-with-validation-errors');
  });

  it('renders the form with entered data correctly', () => {
    const container = renderForSnapshot(<LoginForm />);

    // Enter valid data
    const usernameInput = container.querySelector('[data-testid="username-input"]');
    const passwordInput = container.querySelector('[data-testid="password-input"]');

    if (usernameInput && passwordInput) {
      fireEvent.change(usernameInput, { target: { value: 'testuser' } });
      fireEvent.change(passwordInput, { target: { value: 'password123' } });
    }

    snapshotTest(container, 'login-form-with-data');
  });
});
