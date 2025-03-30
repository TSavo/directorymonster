"use client";

import React from 'react';

interface ActivityFeedErrorProps {
  message: string;
  onRetry: () => void;
}

export function ActivityFeedError({ message, onRetry }: ActivityFeedErrorProps) {
  return (
    <div 
      className="px-3 py-2 bg-red-50 border border-red-200 rounded-lg text-red-700 mb-2"
      data-testid="activity-feed-error"
      role="alert"
    >
      <div className="flex items-start">
        <div className="flex-shrink-0 pt-0.5">
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
          <p className="text-sm">Failed to load activities: {message}</p>
          <button 
            className="mt-1 text-sm font-medium text-red-600 hover:text-red-800 underline" 
            onClick={onRetry}
            data-testid="activity-feed-retry"
          >
            Retry
          </button>
        </div>
      </div>
    </div>
  );
}

export default ActivityFeedError;