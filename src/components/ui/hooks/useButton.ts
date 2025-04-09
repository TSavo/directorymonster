'use client';

import React, { useMemo } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/utils/classNames';

// Define button variants
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

export interface UseButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  isLoading?: boolean;
  asChild?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  loadingText?: string;
  className?: string;
  children?: React.ReactNode;
}

export interface UseButtonReturn {
  buttonProps: {
    className: string;
    disabled: boolean | undefined;
    ref?: React.ForwardedRef<HTMLButtonElement>;
  };
  asChildProps?: {
    className: string;
    disabled: boolean | undefined;
    ref?: React.ForwardedRef<HTMLButtonElement>;
  };
  showSpinner: boolean;
  showLeftIcon: boolean;
  showRightIcon: boolean;
  buttonText: React.ReactNode;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  shouldRenderAsChild: boolean;
}

export function useButton(
  props: UseButtonProps,
  ref?: React.ForwardedRef<HTMLButtonElement>
): UseButtonReturn {
  const {
    className,
    variant,
    size,
    isLoading,
    asChild,
    children,
    leftIcon,
    rightIcon,
    loadingText,
    disabled,
    ...restProps
  } = props;

  // Determine if we should render as a child
  const shouldRenderAsChild = Boolean(asChild && React.isValidElement(children));

  // Compute button text based on loading state
  const buttonText = useMemo(() => {
    return isLoading && loadingText ? loadingText : children;
  }, [isLoading, loadingText, children]);

  // Compute button class names
  const buttonClassName = useMemo(() => {
    return cn(buttonVariants({ variant, size }), className);
  }, [variant, size, className]);

  // Compute button props
  const buttonProps = {
    className: buttonClassName,
    disabled: isLoading || disabled,
    ref,
    ...restProps
  };

  // Compute props for asChild rendering
  const asChildProps = shouldRenderAsChild ? {
    className: buttonClassName,
    disabled: isLoading || disabled,
    ref,
    ...restProps
  } : undefined;

  // Determine which icons to show
  const showSpinner = Boolean(isLoading);
  const showLeftIcon = Boolean(leftIcon && !isLoading);
  const showRightIcon = Boolean(rightIcon && !isLoading);

  return {
    buttonProps,
    asChildProps,
    showSpinner,
    showLeftIcon,
    showRightIcon,
    buttonText,
    leftIcon,
    rightIcon,
    shouldRenderAsChild
  };
}

export default useButton;
