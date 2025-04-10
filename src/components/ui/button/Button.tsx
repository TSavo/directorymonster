'use client';

import * as React from 'react';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  asChild?: boolean;
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  loadingText?: string;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ 
    className, 
    variant = 'default', 
    size = 'default', 
    asChild = false, 
    isLoading = false, 
    leftIcon, 
    rightIcon, 
    loadingText, 
    children, 
    ...props 
  }, ref) => {
    const Comp = asChild ? 'div' : 'button';
    return (
      <Comp
        className={className}
        ref={ref}
        data-variant={variant}
        data-size={size}
        data-loading={isLoading || undefined}
        {...props}
      >
        {leftIcon && <span data-testid="left-icon">{leftIcon}</span>}
        {isLoading && loadingText ? loadingText : children}
        {rightIcon && <span data-testid="right-icon">{rightIcon}</span>}
      </Comp>
    );
  }
);
Button.displayName = 'Button';
