'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { generateProof } from '@/lib/zkp';

interface PasswordResetFormProps {
  isConfirmation?: boolean;
  searchParams?: URLSearchParams;
}

export function PasswordResetForm({
  isConfirmation = false,
  searchParams = new URLSearchParams(),
}: PasswordResetFormProps) {
  // Form state for request reset
  const [email, setEmail] = useState('');

  // Form state for confirm reset
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // UI state
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Validation state
  const [validationErrors, setValidationErrors] = useState<{
    email?: string;
    password?: string;
    confirmPassword?: string;
  }>({});

  const router = useRouter();

  // Validate request form
  const validateRequestForm = (): boolean => {
    const errors: { email?: string } = {};

    if (!email.trim()) {
      errors.email = 'Email is required';
    } else if (!/^[\w-]+(\.[\w-]+)*@([\w-]+\.)+[a-zA-Z]{2,7}$/.test(email)) {
      errors.email = 'Invalid email format';
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Validate confirmation form
  const validateConfirmForm = (): boolean => {
    const errors: { password?: string; confirmPassword?: string } = {};

    if (!newPassword) {
      errors.password = 'Password is required';
    } else if (newPassword.length < 8) {
      errors.password = 'Password must be at least 8 characters long';
    }

    if (newPassword !== confirmPassword) {
      errors.confirmPassword = 'Passwords do not match';
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Handle request password reset
  const handleRequestReset = async (e: React.FormEvent) => {
    e.preventDefault();

    setError(null);

    // Validate form
    if (!validateRequestForm()) {
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch('/api/auth/request-reset', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (response.ok) {
        setSuccess(true);
      } else {
        setError(data.error || 'Failed to request password reset');
      }
    } catch (error) {
      setError(`An error occurred: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle confirm password reset
  const handleConfirmReset = async (e: React.FormEvent) => {
    e.preventDefault();

    setError(null);

    // Validate form
    if (!validateConfirmForm()) {
      return;
    }

    setIsLoading(true);

    try {
      // Get token and email from URL params
      const token = searchParams.get('token') || '';
      const email = searchParams.get('email') || '';

      if (!email) {
        throw new Error('Email is required for password reset');
      }

      // Get salt from the server API endpoint
      const saltResponse = await fetch(`/api/auth/salt/${encodeURIComponent(email)}`);

      if (!saltResponse.ok) {
        throw new Error('Failed to retrieve salt for password reset');
      }

      const saltData = await saltResponse.json();
      const salt = saltData.salt;

      // Generate ZKP for new password
      const { proof, publicSignals } = await generateProof({
        username: email,
        password: newPassword,
        salt,
      });

      const response = await fetch('/api/auth/confirm-reset', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          token,
          email,
          proof,
          publicSignals,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        // Redirect to login page after successful reset
        router.push('/login');
      } else {
        setError(data.error || 'Failed to reset password');
      }
    } catch (error) {
      setError(`An error occurred: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  // Render request form
  const renderRequestForm = () => {
    if (success) {
      return (
        <div className="text-center py-8">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Check your email</h3>
          <p className="text-gray-600 mb-6">
            If an account exists for that email, we've sent instructions to reset your password.
          </p>
          <button
            onClick={() => router.push('/login')}
            className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
          >
            Return to Login
          </button>
        </div>
      );
    }

    return (
      <form onSubmit={handleRequestReset} className="space-y-6">
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700">
            Email
          </label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className={`mt-1 block w-full px-3 py-2 border ${
              validationErrors.email ? 'border-red-500' : 'border-gray-300'
            } rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500`}
            disabled={isLoading}
          />
          {validationErrors.email && (
            <p className="mt-1 text-sm text-red-600">{validationErrors.email}</p>
          )}
        </div>

        <div>
          <button
            type="submit"
            className={`w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white ${
              isLoading
                ? 'bg-indigo-300'
                : 'bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500'
            }`}
            disabled={isLoading}
          >
            {isLoading ? 'Processing...' : 'Reset Password'}
          </button>
        </div>

        <div className="text-sm text-center">
          <button
            type="button"
            onClick={() => router.push('/login')}
            className="font-medium text-indigo-600 hover:text-indigo-500"
          >
            Back to Login
          </button>
        </div>
      </form>
    );
  };

  // Render confirmation form
  const renderConfirmForm = () => {
    return (
      <form onSubmit={handleConfirmReset} className="space-y-6">
        <div>
          <label htmlFor="new-password" className="block text-sm font-medium text-gray-700">
            New Password
          </label>
          <input
            id="new-password"
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            className={`mt-1 block w-full px-3 py-2 border ${
              validationErrors.password ? 'border-red-500' : 'border-gray-300'
            } rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500`}
            disabled={isLoading}
          />
          {validationErrors.password && (
            <p className="mt-1 text-sm text-red-600">{validationErrors.password}</p>
          )}
        </div>

        <div>
          <label htmlFor="confirm-password" className="block text-sm font-medium text-gray-700">
            Confirm Password
          </label>
          <input
            id="confirm-password"
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className={`mt-1 block w-full px-3 py-2 border ${
              validationErrors.confirmPassword ? 'border-red-500' : 'border-gray-300'
            } rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500`}
            disabled={isLoading}
          />
          {validationErrors.confirmPassword && (
            <p className="mt-1 text-sm text-red-600">{validationErrors.confirmPassword}</p>
          )}
        </div>

        <div>
          <button
            type="submit"
            className={`w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white ${
              isLoading
                ? 'bg-indigo-300'
                : 'bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500'
            }`}
            disabled={isLoading}
          >
            {isLoading ? 'Processing...' : 'Confirm New Password'}
          </button>
        </div>
      </form>
    );
  };

  return (
    <div className="w-full max-w-md mx-auto p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-6 text-center text-gray-800">
        {isConfirmation ? 'Reset Your Password' : 'Forgot Password'}
      </h2>

      {!isConfirmation && !success && (
        <p className="mb-6 text-gray-600 text-center">
          Enter your email address and we'll send you a link to reset your password.
        </p>
      )}

      {error && (
        <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
          {error}
        </div>
      )}

      {isConfirmation ? renderConfirmForm() : renderRequestForm()}
    </div>
  );
}

// Add default export for dual-export pattern
export default PasswordResetForm;
