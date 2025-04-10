import React from 'react';
import { renderHook as rtlRenderHook } from '@testing-library/react';
import { act } from 'react-dom/test-utils';

// Interface for render hook options
interface CustomRenderHookOptions<P> {
  withAuth?: boolean;
  withTheme?: boolean;
  withToast?: boolean;
  authProps?: any;
  themeProps?: any;
  toastProps?: any;
}

// Create a custom renderHook function
export function renderHook<Result, Props>(
  callback: (props: Props) => Result,
  {
    withAuth = false,
    withTheme = false,
    withToast = false,
    authProps = {},
    themeProps = {},
    toastProps = {},
    ...options
  }: CustomRenderHookOptions<Props> = {}
) {
  // Create a wrapper with the requested providers
  const Wrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    let wrappedChildren = children;

    // Wrap with providers in the correct order
    if (withToast) {
      // We'll mock these providers when we implement them
      wrappedChildren = <div data-testid="toast-provider" {...toastProps}>{wrappedChildren}</div>;
    }

    if (withTheme) {
      wrappedChildren = <div data-testid="theme-provider" {...themeProps}>{wrappedChildren}</div>;
    }

    if (withAuth) {
      wrappedChildren = <div data-testid="auth-provider" {...authProps}>{wrappedChildren}</div>;
    }

    return <>{wrappedChildren}</>;
  };

  // Render hook with the wrapper
  return rtlRenderHook(callback, { wrapper: Wrapper, ...options });
}

// Export act for convenience
export { act };
