'use client';

import React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/utils/classNames';

const buttonVariants = cva(
  "inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none",
  {
    variants: {
      variant: {
        primary: "bg-indigo-600 text-white hover:bg-indigo-700 focus-visible:ring-indigo-500",
        secondary: "bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 focus-visible:ring-gray-500",
        danger: "bg-red-600 text-white hover:bg-red-700 focus-visible:ring-red-500",
        success: "bg-green-600 text-white hover:bg-green-700 focus-visible:ring-green-500",
        warning: "bg-amber-500 text-white hover:bg-amber-600 focus-visible:ring-amber-400",
        ghost: "hover:bg-gray-100 hover:text-gray-900 focus-visible:ring-gray-500",
        link: "text-indigo-600 underline-offset-4 hover:underline focus-visible:ring-indigo-500",
        outline: "border border-gray-300 bg-transparent hover:bg-gray-50 focus-visible:ring-gray-500",
        "outline-primary": "border border-indigo-600 text-indigo-600 bg-transparent hover:bg-indigo-50 focus-visible:ring-indigo-500",
        "outline-danger": "border border-red-600 text-red-600 bg-transparent hover:bg-red-50 focus-visible:ring-red-500",
        "outline-success": "border border-green-600 text-green-600 bg-transparent hover:bg-green-50 focus-visible:ring-green-500",
        "outline-warning": "border border-amber-500 text-amber-500 bg-transparent hover:bg-amber-50 focus-visible:ring-amber-400",
      },
      size: {
        xs: "h-6 px-2 py-0.5 text-xs",
        sm: "h-8 px-3 py-1",
        md: "h-10 px-4 py-2",
        lg: "h-12 px-6 py-3",
        icon: "h-10 w-10",
        full: "w-full justify-center",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "md",
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  isLoading?: boolean;
  asChild?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  loadingText?: string;
}

/**
 * Button Component
 *
 * A reusable button component with different variants and sizes
 */
export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({
    className,
    variant,
    size,
    isLoading,
    asChild,
    children,
    leftIcon,
    rightIcon,
    loadingText,
    ...props
  }, ref) => {
    // If asChild is true, we render the children directly with the button props
    if (asChild && React.isValidElement(children)) {
      return React.cloneElement(children, {
        className: cn(buttonVariants({ variant, size }), className),
        disabled: isLoading || props.disabled,
        ...props,
        ref
      });
    }

    const buttonText = isLoading && loadingText ? loadingText : children;

    return (
      <button
        className={cn(buttonVariants({ variant, size }), className)}
        ref={ref}
        disabled={isLoading || props.disabled}
        {...props}
      >
        {isLoading ? (
          <div className="mr-2">
            <svg
              className="animate-spin h-4 w-4 text-current"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              ></circle>
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              ></path>
            </svg>
          </div>
        ) : leftIcon ? (
          <span className="mr-2">{leftIcon}</span>
        ) : null}
        {buttonText}
        {rightIcon && !isLoading && <span className="ml-2">{rightIcon}</span>}
      </button>
    );
  }
);

Button.displayName = "Button";

export default Button;
