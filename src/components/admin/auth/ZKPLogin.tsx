'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { generateZKPWithBcrypt } from '@/lib/zkp/zkp-bcrypt';
import { getSalt, clearSaltCache } from '@/lib/auth/salt-cache';
import { getAuthErrorMessage, AuthErrorType } from '@/lib/auth/error-handler';
import CaptchaWidget from './CaptchaWidget';

interface ZKPLoginProps {
  // Optional props for customization
  redirectPath?: string;
}

/**
 * Renders a login form using Zero-Knowledge Proof (ZKP) authentication with optional CAPTCHA verification.
 *
 * This component manages user credential input, validates the form, generates a ZKP using bcrypt, and sends the proof
 * along with CSRF protection for verification. On successful authentication, it stores the token, applies the "remember me"
 * preference, and redirects the user to the specified path. It also handles various error cases such as rate limiting,
 * CAPTCHA verification, and network issues.
 *
 * @param redirectPath - The URL path to redirect the user upon successful authentication. Defaults to '/admin'.
 */
export function ZKPLogin({ redirectPath = '/admin' }: ZKPLoginProps) {
  // Form state
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);

  // Error and loading state
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isDisabled, setIsDisabled] = useState(false);

  // CAPTCHA state
  const [requireCaptcha, setRequireCaptcha] = useState(false);
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);
  const captchaRef = useRef<{ reset: () => void; execute: () => void } | null>(null);

  // Form validation state
  const [validationErrors, setValidationErrors] = useState<{
    username?: string;
    password?: string;
    captcha?: string;
  }>({});

  // Router for redirecting
  const router = useRouter();

  /**
   * Validate the form inputs
   * @returns True if the form is valid, false otherwise
   */
  const validateForm = (): boolean => {
    const errors: { username?: string; password?: string; captcha?: string } = {};

    // Validate username
    if (!username.trim()) {
      errors.username = 'Username is required';
    }

    // Validate password
    if (!password) {
      errors.password = 'Password is required';
    } else if (password.length < 8) {
      errors.password = 'Password must be at least 8 characters long';
    }

    // Validate CAPTCHA if required
    if (requireCaptcha && !captchaToken) {
      errors.captcha = 'Please complete the CAPTCHA verification';
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  /**
   * Get CSRF token from cookies
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
      // Get salt from cache or server API
      const salt = await getSalt(username);

      // Log for debugging
      console.log('Generating proof with credentials:', {
        username,
        password: '********', // Redacted for security
        salt: salt ? 'Retrieved' : 'Missing'
      });

      // Generate ZKP with bcrypt
      const { proof, publicSignals } = await generateZKPWithBcrypt(
        username,
        password,
        salt
      );

      // Get CSRF token
      const csrfToken = getCsrfToken();

      // Log for debugging (in production, you would not log the proof)
      console.log('Proof generated:', {
        publicSignals,
        csrfToken: csrfToken ? 'Present' : 'Missing'
      });

      // Send to server for verification
      const response = await fetch('/api/auth/verify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-Token': csrfToken,
        },
        body: JSON.stringify({
          username,
          proof,
          publicSignals,
          captchaToken: requireCaptcha ? captchaToken : undefined,
        }),
      });

      // Handle response
      if (response.ok) {
        const data = await response.json();

        // Log for debugging
        console.log('Authentication successful, token received');

        // Store token in localStorage
        localStorage.setItem('authToken', data.token);

        // Store remember me preference if checked
        if (rememberMe) {
          localStorage.setItem('rememberMe', 'true');
        } else {
          localStorage.removeItem('rememberMe');
        }

        // Redirect to admin dashboard
        router.push(redirectPath);
      } else {
        // Handle different error types
        if (response.status === 429) {
          // Rate limiting
          setIsDisabled(true);
        }

        const data = await response.json();

        // Check if CAPTCHA is required
        if (data.requireCaptcha) {
          setRequireCaptcha(true);
          // Reset CAPTCHA if it was already shown
          if (captchaRef.current) {
            captchaRef.current.reset();
          }
          setCaptchaToken(null);
        }

        setError(data.error || 'Authentication failed');
      }
    } catch (err) {
      console.error('Authentication error:', err);

      // Determine the appropriate error type based on the error
      let errorType = AuthErrorType.UNKNOWN;

      if (err instanceof Error) {
        if (err.message.includes('salt')) {
          errorType = AuthErrorType.SALT_RETRIEVAL;
        } else if (err.message.includes('proof') || err.message.includes('generate')) {
          errorType = AuthErrorType.ZKP_GENERATION;
        } else if (err.message.includes('network') || err.message.includes('fetch')) {
          errorType = AuthErrorType.NETWORK;
        }
      }

      // Get a user-friendly error message
      setError(getAuthErrorMessage(err, errorType));

      // If there was an error with the salt, clear the cache for this user
      if (errorType === AuthErrorType.SALT_RETRIEVAL) {
        clearSaltCache(username);
      }
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Handle forgot password link click
   */
  const handleForgotPassword = () => {
    router.push('/admin/forgot-password');
  };

  return (
    <div className="w-full max-w-md mx-auto p-6 bg-white rounded-lg shadow-md" data-testid="login-form-container">
      <h2 className="text-2xl font-bold mb-6 text-center text-gray-800" data-testid="login-title">Admin Login</h2>

      {error && (
        <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded" data-testid="login-error">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6" data-testid="login-form">
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
            name="username"
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
            name="password"
          />
          {validationErrors.password && (
            <p className="mt-1 text-sm text-red-600" data-testid="password-error">{validationErrors.password}</p>
          )}
        </div>

        {requireCaptcha && (
          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Security Verification
            </label>
            <CaptchaWidget
              onVerify={(token) => {
                setCaptchaToken(token);
                setValidationErrors({ ...validationErrors, captcha: undefined });
              }}
              onExpire={() => {
                setCaptchaToken(null);
                setValidationErrors({ ...validationErrors, captcha: 'CAPTCHA expired, please verify again' });
              }}
              onError={() => {
                setCaptchaToken(null);
                setValidationErrors({ ...validationErrors, captcha: 'CAPTCHA verification failed, please try again' });
              }}
              useCustomCaptcha={!process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY}
              ref={(ref) => { captchaRef.current = ref; }}
            />
            {validationErrors.captcha && (
              <p className="mt-1 text-sm text-red-600" data-testid="captcha-error">{validationErrors.captcha}</p>
            )}
          </div>
        )}

        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <input
              id="remember-me"
              type="checkbox"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
              className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
              disabled={isLoading || isDisabled}
            />
            <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-700">
              Remember me
            </label>
          </div>

          <div className="text-sm">
            <button
              type="button"
              onClick={handleForgotPassword}
              className="font-medium text-indigo-600 hover:text-indigo-500"
              disabled={isLoading || isDisabled}
              data-testid="forgot-password-button"
            >
              Forgot password?
            </button>
          </div>
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
                Authenticating...
              </div>
            ) : (
              'Sign In'
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
            <span className="px-2 bg-white text-gray-500">Secure Authentication</span>
          </div>
        </div>

        <div className="mt-6">
          <p className="text-xs text-center text-gray-600">
            This login uses Zero-Knowledge Proof authentication. Your password is never sent to the server.
          </p>
          <p className="text-xs text-center text-gray-600 mt-2">
            Powered by <a href="https://github.com/iden3/snarkjs" target="_blank" rel="noopener noreferrer" className="text-indigo-600 hover:text-indigo-500">SnarkJS</a> and <a href="https://github.com/iden3/circom" target="_blank" rel="noopener noreferrer" className="text-indigo-600 hover:text-indigo-500">Circom</a>.
          </p>
        </div>
      </div>
    </div>
  );
}

// Add default export for dual-export pattern
export default ZKPLogin;
