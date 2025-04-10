'use client';

import * as React from 'react';

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'secondary' | 'destructive' | 'outline';
}

const Badge = React.forwardRef<HTMLDivElement, BadgeProps>(
  ({ className, variant = 'default', ...props }, ref) => {
    return (
      <div
        className={className}
        ref={ref}
        data-variant={variant}
        {...props}
      />
    );
  }
);
Badge.displayName = 'Badge';

export { Badge };
