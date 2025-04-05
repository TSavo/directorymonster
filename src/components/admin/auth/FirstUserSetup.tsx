'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { generateSalt } from '@/lib/zkp';
import { generateZKPWithBcrypt } from '@/lib/zkp/zkp-bcrypt';

interface FirstUserSetupProps {
  // Optional props for customization
  redirectPath?: string;
}

/**
 * Renders a form for creating the first admin user.
 *
 * This component manages the setup process by collecting details such as username, password,
 * email (optional), and site name. It validates the form inputs, generates a CSRF token, salt,
 * and a zero-knowledge proof (ZKP) for secure account creation, then submits the data to the
 * /api/auth/setup endpoint. Upon successful creation, it stores an authentication token in
 * localStorage and redirects the user to the specified admin dashboard.
 *
 * @param redirectPath - Optional redirect destination after a successful setup (default: '/admin').
 *
 * @returns A React element containing the admin user setup form, along with its associated error and loading states.
 */
export function FirstUserSetup({ redirectPath = '/admin' }: FirstUserSetupProps) {
  // Form state
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [email, setEmail] = useState('');
  const [siteName, setSiteName] = useState('');

  // Error and loading state
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isDisabled, setIsDisabled] = useState(false);

  // Form validation state
  const [validationErrors, setValidationErrors] = useState<{
    username?: string;
    password?: string;
    confirmPassword?: string;
    email?: string;
    siteName?: string;
  }>({});

  // Router for redirecting
  const router = useRouter();

  /**
   * Validate the form inputs
   * @returns True if the form is valid, false otherwise
   */
  const validateForm = (): boolean => {
    const errors: {
      username?: string;
      password?: string;
      confirmPassword?: string;
      email?: string;
      siteName?: string;
    } = {};

    // Validate username
    if (!username.trim()) {
      errors.username = 'Username is required';
    } else if (username.length < 3) {
      errors.username = 'Username must be at least 3 characters long';
    }

    // Validate password
    if (!password) {
      errors.password = 'Password is required';
    } else if (password.length < 8) {
      errors.password = 'Password must be at least 8 characters long';
    }

    // Validate password confirmation
    if (!confirmPassword) {
      errors.confirmPassword = 'Please confirm your password';
    } else if (password !== confirmPassword) {
      errors.confirmPassword = 'Passwords do not match';
    }

    // Validate email (optional but must be valid if provided)
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      errors.email = 'Please enter a valid email address';
    }

    // Validate site name
    if (!siteName.trim()) {
      errors.siteName = 'Site name is required';
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  /**
   * Get CSRF token from cookies or generate a new one
   * @returns The CSRF token
   */
  const getCsrfToken = (): string => {
    const cookies = document.cookie.split(';');
    for (const cookie of cookies) {
      const [name, value] = cookie.trim().split('=');
      if (name === 'csrf_token') {
        return value;
      }
    }

    // If no CSRF token is found, generate one and set it
    const newToken = Math.random().toString(36).substring(2, 15) +
                     Math.random().toString(36).substring(2, 15);

    // Set the cookie
    document.cookie = `csrf_token=${newToken}; path=/; max-age=3600; SameSite=Strict`;

    return newToken;
  };

  /**
   * Handle form submission
   * @param e The form event
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Reset error state
    setError(null);

    // Validate form
    if (!validateForm()) {
      return;
    }

    // Show loading state
    setIsLoading(true);

    try {
      // Get CSRF token
      const csrfToken = getCsrfToken();

      // Generate salt for ZKP
      const salt = generateSalt();

      // Generate ZKP with bcrypt
      const { proof, publicSignals } = await generateZKPWithBcrypt(
        username,
        password,
        salt
      );

      // Send user creation request with ZKP
      const response = await fetch('/api/auth/setup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-Token': csrfToken,
        },
        body: JSON.stringify({
          username,
          proof,
          publicSignals,
          salt,
          email: email || undefined, // Only send if provided
          siteName,
        }),
      });

      // Handle response
      if (response.ok) {
        // User created successfully
        const data = await response.json();

        // Store token in localStorage
        localStorage.setItem('authToken', data.token);

        // Redirect to admin dashboard
        router.push(redirectPath);
      } else {
        // Handle error
        const data = await response.json();
        setError(data.error || 'Failed to create admin user');
      }
    } catch (err) {
      console.error('Setup error:', err);
      setError(`Setup error: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto p-6 bg-white rounded-lg shadow-md" data-testid="setup-form-container">
      <h2 className="text-2xl font-bold mb-6 text-center text-gray-800" data-testid="setup-title">Create First Admin User</h2>

      {error && (
        <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded" data-testid="setup-error">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6" data-testid="setup-form">
        <div>
          <label htmlFor="username" className="block text-sm font-medium text-gray-700">
            Username
          </label>
          <input
            id="username"
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className={`mt-1 block w-full px-3 py-2 border ${
              validationErrors.username ? 'border-red-500' : 'border-gray-300'
            } rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500`}
            disabled={isLoading || isDisabled}
            data-testid="username-input"
          />
          {validationErrors.username && (
            <p className="mt-1 text-sm text-red-600" data-testid="username-error">{validationErrors.username}</p>
          )}
        </div>

        <div>
          <label htmlFor="password" className="block text-sm font-medium text-gray-700">
            Password
          </label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className={`mt-1 block w-full px-3 py-2 border ${
              validationErrors.password ? 'border-red-500' : 'border-gray-300'
            } rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500`}
            disabled={isLoading || isDisabled}
            data-testid="password-input"
          />
          {validationErrors.password && (
            <p className="mt-1 text-sm text-red-600" data-testid="password-error">{validationErrors.password}</p>
          )}
        </div>

        <div>
          <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
            Confirm Password
          </label>
          <input
            id="confirmPassword"
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className={`mt-1 block w-full px-3 py-2 border ${
              validationErrors.confirmPassword ? 'border-red-500' : 'border-gray-300'
            } rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500`}
            disabled={isLoading || isDisabled}
            data-testid="confirm-password-input"
          />
          {validationErrors.confirmPassword && (
            <p className="mt-1 text-sm text-red-600" data-testid="confirm-password-error">
              {validationErrors.confirmPassword}
            </p>
          )}
        </div>

        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700">
            Email (Optional)
          </label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className={`mt-1 block w-full px-3 py-2 border ${
              validationErrors.email ? 'border-red-500' : 'border-gray-300'
            } rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500`}
            disabled={isLoading || isDisabled}
            data-testid="email-input"
          />
          {validationErrors.email && (
            <p className="mt-1 text-sm text-red-600" data-testid="email-error">{validationErrors.email}</p>
          )}
        </div>

        <div>
          <label htmlFor="siteName" className="block text-sm font-medium text-gray-700">
            Site Name
          </label>
          <input
            id="siteName"
            type="text"
            value={siteName}
            onChange={(e) => setSiteName(e.target.value)}
            className={`mt-1 block w-full px-3 py-2 border ${
              validationErrors.siteName ? 'border-red-500' : 'border-gray-300'
            } rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500`}
            disabled={isLoading || isDisabled}
            data-testid="site-name-input"
          />
          {validationErrors.siteName && (
            <p className="mt-1 text-sm text-red-600" data-testid="site-name-error">{validationErrors.siteName}</p>
          )}
        </div>

        <div>
          <button
            type="submit"
            className={`w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white ${
              isDisabled
                ? 'bg-gray-400 cursor-not-allowed'
                : isLoading
                ? 'bg-indigo-300'
                : 'bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500'
            }`}
            disabled={isLoading || isDisabled}
            data-testid="submit-button"
          >
            {isLoading ? (
              <div className="flex items-center">
                <svg
                  className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  role="progressbar"
                  aria-hidden="true"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  />
                </svg>
                Creating Admin...
              </div>
            ) : (
              'Setup My Account'
            )}
          </button>
        </div>
      </form>

      <div className="mt-6">
        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-300" />
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-2 bg-white text-gray-500">System Setup</span>
          </div>
        </div>

        <div className="mt-6">
          <p className="text-xs text-center text-gray-600">
            You are creating the first admin user for this system. This user will have full administrative privileges.
          </p>
          <p className="text-xs text-center text-gray-600 mt-2">
            Please use a strong password and keep it secure.
          </p>
        </div>
      </div>
    </div>
  );
}

// Add default export for dual-export pattern
export default FirstUserSetup;
