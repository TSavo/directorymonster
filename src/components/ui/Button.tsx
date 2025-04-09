'use client';

import React from 'react';
import { VariantProps } from 'class-variance-authority';
import { useButton } from './hooks/useButton';
import ButtonPresentation from './ButtonPresentation';

// Re-export the button variants from the hook
export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<any> {
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
  (props, ref) => {
    const {
      shouldRenderAsChild,
      asChildProps,
      buttonProps,
      showSpinner,
      showLeftIcon,
      showRightIcon,
      buttonText,
      leftIcon,
      rightIcon
    } = useButton(props, ref);

    // If asChild is true, we render the children directly with the button props
    if (shouldRenderAsChild && React.isValidElement(props.children)) {
      return React.cloneElement(props.children, asChildProps);
    }

    // Otherwise, render the button presentation component
    return (
      <ButtonPresentation
        buttonProps={buttonProps}
        showSpinner={showSpinner}
        showLeftIcon={showLeftIcon}
        showRightIcon={showRightIcon}
        buttonText={buttonText}
        leftIcon={leftIcon}
        rightIcon={rightIcon}
        ref={ref}
      />
    );
  }
);

Button.displayName = "Button";

export default Button;
