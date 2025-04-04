'use client';

import { AlertTriangle, RefreshCw } from 'lucide-react';
import { ListingTableErrorProps } from '../types';

// Add support for error object format
interface ErrorObject {
  message: string;
  details?: string;
}

/**
 * Error display component for the listing table
 */
export function ListingTableError({ error, onRetry }: ListingTableErrorProps) {
  return (
    <div
      className="w-full p-4 border rounded-lg bg-red-50"
      role="alert"
      aria-live="assertive"
      data-testid="listings-error"
    >
      <div className="flex items-center text-red-600 mb-2">
        <AlertTriangle size={20} className="mr-2" aria-hidden="true" />
        <h2 className="text-lg font-semibold">Error Loading Listings</h2>
      </div>
      <p className="text-red-700">
        {typeof error === 'string'
          ? error
          : (error as ErrorObject).message || 'An unexpected error occurred'}
      </p>
      {typeof error !== 'string' && (error as ErrorObject).details && (
        <p className="text-red-600 text-sm mt-1">{(error as ErrorObject).details}</p>
      )}
      <button
        onClick={onRetry}
        className="mt-4 flex items-center px-4 py-2 bg-white border border-red-600 text-red-600 rounded hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
        aria-label="Retry loading listings"
        data-testid="retry-load-listings"
      >
        <RefreshCw size={16} className="mr-2" aria-hidden="true" />
        Retry
      </button>
    </div>
  );
}

// Enable both named and default exports
export default ListingTableError;
