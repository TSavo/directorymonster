'use client';

import { CategoryTableErrorProps } from '../types';

export default function CategoryTableError({ error, onRetry }: CategoryTableErrorProps) {
  const handleRetry = () => {
    if (onRetry) {
      onRetry();
    }
  };
  
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && onRetry) {
      onRetry();
    }
  };
  
  return (
    <div className="w-full p-4 text-center" data-testid="error-container" role="alert" aria-live="assertive">
      <div className="bg-red-50 border border-red-200 rounded-lg p-6" data-testid="error-box">
        <h3 className="text-xl font-medium text-red-800 mb-2" data-testid="error-title">Error Loading Categories</h3>
        <p className="text-red-600 mb-4" data-testid="error-message">{error}</p>
        <button
          onClick={handleRetry}
          onKeyDown={handleKeyDown}
          className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 transition-colors"
          aria-label="Retry loading categories"
          data-testid="retry-button"
        >
          Try Again
        </button>
      </div>
    </div>
  );
}
