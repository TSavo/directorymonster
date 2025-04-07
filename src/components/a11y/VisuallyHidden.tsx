import React from 'react';

interface VisuallyHiddenProps {
  children: React.ReactNode;
  as?: keyof JSX.IntrinsicElements;
  className?: string;
}

export default function VisuallyHidden({
  children,
  as: Component = 'span',
  className = '',
  ...props
}: VisuallyHiddenProps & React.HTMLAttributes<HTMLElement>) {
  return (
    <Component
      className={`sr-only ${className}`}
      data-testid="visually-hidden"
      {...props}
    >
      {children}
    </Component>
  );
}
