'use client';

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { retry } from '@/utils/api';

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  onReset?: () => void;
  maxRetries?: number;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  retryCount: number;
}

/**
 * ErrorBoundary - Component to catch JavaScript errors in child components
 *
 * Features:
 * - Catches errors in child components
 * - Displays a fallback UI
 * - Provides retry functionality
 * - Reports errors to error monitoring service
 */
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      retryCount: 0
    };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    // Update state so the next render will show the fallback UI
    return {
      hasError: true,
      error,
      retryCount: 0
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    // Log the error to an error reporting service
    console.error('Error caught by ErrorBoundary:', error, errorInfo);

    // Call onError callback if provided
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }
  }

  handleRetry = async (): Promise<void> => {
    const { maxRetries = 3 } = this.props;
    const { retryCount } = this.state;

    if (retryCount < maxRetries) {
      this.setState(prevState => ({
        retryCount: prevState.retryCount + 1
      }));

      try {
        // Use the retry utility to attempt recovery
        await retry(
          () => Promise.resolve(this.resetErrorBoundary()),
          {
            maxRetries: 1,
            initialDelay: 1000,
            onRetry: (error, attempt) => {
              console.log(`Retry attempt ${attempt} after error:`, error);
            }
          }
        );
      } catch (error) {
        console.error('Error recovery failed:', error);
      }
    } else {
      console.error(`Maximum retry attempts (${maxRetries}) reached`);
    }
  };

  resetErrorBoundary = (): void => {
    // Reset the error boundary state
    this.setState({
      hasError: false,
      error: null
    });

    // Call onReset callback if provided
    if (this.props.onReset) {
      this.props.onReset();
    }
  };

  render(): ReactNode {
    const { hasError, error, retryCount } = this.state;
    const { children, fallback, maxRetries = 3 } = this.props;

    if (hasError) {
      // You can render any custom fallback UI
      if (fallback) {
        return fallback;
      }

      return (
        <div className="error-boundary p-4 border border-red-300 bg-red-50 rounded-md">
          <h2 className="text-lg font-semibold text-red-700 mb-2">Something went wrong</h2>
          <p className="text-red-600 mb-4">{error?.message || 'An unexpected error occurred'}</p>

          {retryCount < maxRetries ? (
            <button
              onClick={this.handleRetry}
              className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500"
              data-testid="reset-error"
            >
              Try Again ({retryCount}/{maxRetries})
            </button>
          ) : (
            <div className="text-red-600">
              Maximum retry attempts reached. Please refresh the page or contact support.
            </div>
          )}
        </div>
      );
    }

    return children;
  }
}

export default ErrorBoundary;
