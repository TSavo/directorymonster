"use client";

import React from 'react';

interface MetricsErrorProps {
  message: string;
  onRetry: () => void;
}

export function MetricsError({ message, onRetry }: MetricsErrorProps) {
  return (
    <div 
      className="col-span-full bg-red-50 border border-red-200 rounded-lg p-4 text-red-700"
      data-testid="metrics-error"
      role="alert"
      aria-live="assertive"
    >
      <div className="flex items-start">
        <div className="flex-shrink-0 mt-0.5">
          <svg 
            xmlns="http://www.w3.org/2000/svg" 
            className="h-5 w-5 text-red-500" 
            viewBox="0 0 20 20" 
            fill="currentColor"
            aria-hidden="true"
          >
            <path 
              fillRule="evenodd" 
              d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" 
              clipRule="evenodd" 
            />
          </svg>
        </div>
        <div className="ml-3">
          <p className="text-sm font-medium text-red-800">Failed to load metrics: {message}</p>
          <div className="mt-2">
            <button 
              className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md text-red-700 bg-red-100 hover:bg-red-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500" 
              onClick={onRetry}
              data-testid="metrics-retry"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default MetricsError;