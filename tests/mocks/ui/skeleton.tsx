import React from 'react';

export function Skeleton({ className, ...props }: any) {
  return <div data-testid="skeleton" className={className} {...props} />;
}
