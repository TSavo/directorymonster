'use client';

import React from 'react';
import Link from 'next/link';

interface AccessDeniedProps {
  message?: string;
  showBackLink?: boolean;
}

/**
 * AccessDenied component for tenant or permission access denial
 */
const AccessDenied: React.FC<AccessDeniedProps> = ({
  message = 'You do not have permission to access this resource.',
  showBackLink = true,
}) => {
  return (
    <div className="flex flex-col items-center justify-center min-h-[50vh] p-4">
      <div className="bg-white rounded-lg shadow-md p-8 max-w-md text-center">
        <div className="w-16 h-16 mx-auto mb-4 text-red-500">
          {/* Shield with X icon */}
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
            />
          </svg>
        </div>
        <h2 className="text-2xl font-bold text-gray-800 mb-2">Access Denied</h2>
        <p className="text-gray-600 mb-6">{message}</p>
        
        {showBackLink && (
          <div className="mt-4">
            <Link
              href="/admin/dashboard"
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Return to Dashboard
            </Link>
          </div>
        )}
      </div>
    </div>
  );
};

export default AccessDenied;
