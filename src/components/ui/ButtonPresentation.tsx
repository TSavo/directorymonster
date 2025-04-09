'use client';

import React from 'react';

export interface ButtonPresentationProps {
  buttonProps: {
    className: string;
    disabled: boolean | undefined;
    ref?: React.ForwardedRef<HTMLButtonElement>;
    [key: string]: any;
  };
  showSpinner: boolean;
  showLeftIcon: boolean;
  showRightIcon: boolean;
  buttonText: React.ReactNode;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const ButtonPresentation = React.forwardRef<HTMLButtonElement, ButtonPresentationProps>(
  ({ buttonProps, showSpinner, showLeftIcon, showRightIcon, buttonText, leftIcon, rightIcon }, ref) => {
    return (
      <button
        {...buttonProps}
        ref={ref}
      >
        {showSpinner ? (
          <div className="mr-2">
            <svg
              className="animate-spin h-4 w-4 text-current"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              data-testid="loading-spinner"
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
        ) : showLeftIcon ? (
          <span className="mr-2" data-testid="left-icon">{leftIcon}</span>
        ) : null}
        {buttonText}
        {showRightIcon && !showSpinner && <span className="ml-2" data-testid="right-icon">{rightIcon}</span>}
      </button>
    );
  }
);

ButtonPresentation.displayName = "ButtonPresentation";

export default ButtonPresentation;
