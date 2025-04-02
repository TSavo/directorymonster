import React from 'react';

export default function LoadingSpinner({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' }) {
  return <div data-testid="loading-spinner">Loading...</div>;
}
