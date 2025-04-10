'use client';

import { CategoryTableErrorProps } from '../types';
import { Button } from '@/components/ui/Button';

export function CategoryTableError({ error, onRetry }: CategoryTableErrorProps) {
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
        <Button
          variant="danger"
          onClick={handleRetry}
          onKeyDown={handleKeyDown}
          aria-label="Retry loading categories"
          data-testid="retry-button"
        >
          Try Again
        </Button>
      </div>
    </div>
  );
}

// Add default export for dual-export pattern
export default CategoryTableError;
