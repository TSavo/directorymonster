import React, { ReactElement, ReactNode } from 'react';
import { render as rtlRender, RenderOptions, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createRoot } from 'react-dom/client';

// Interface for render options
interface CustomRenderOptions extends Omit<RenderOptions, 'wrapper'> {
  withAuth?: boolean;
  withTheme?: boolean;
  withToast?: boolean;
  authProps?: any;
  themeProps?: any;
  toastProps?: any;
}

// Create a custom render function
export function render(
  ui: ReactElement,
  {
    withAuth = false,
    withTheme = false,
    withToast = false,
    authProps = {},
    themeProps = {},
    toastProps = {},
    ...options
  }: CustomRenderOptions = {}
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

  // Render with the wrapper
  return rtlRender(ui, { wrapper: Wrapper, ...options });
}

// Create a setup function for user events
export function setup(ui: ReactElement, options: CustomRenderOptions = {}) {
  const user = userEvent.setup();
  const renderResult = render(ui, options);
  return {
    user,
    ...renderResult,
  };
}

// Re-export everything from testing-library
export * from '@testing-library/react';

// Export screen for convenience
export { screen };

/**
 * Custom render function that allows providing a context provider
 * @param ui The component to render
 * @param Provider The context provider component
 * @param providerProps Props to pass to the provider
 * @param options Additional render options
 * @returns The result of render
 */
export function renderWithProvider<TProviderProps>(
  ui: ReactElement,
  Provider: React.ComponentType<TProviderProps & { children?: ReactNode }>,
  providerProps: TProviderProps,
  options?: Omit<RenderOptions, 'wrapper'>
) {
  return rtlRender(ui, {
    wrapper: ({ children }) => (
      <Provider {...providerProps}>{children}</Provider>
    ),
    ...options,
  });
}

/**
 * Custom render function that allows providing multiple context providers
 * @param ui The component to render
 * @param providers Array of provider components and their props
 * @param options Additional render options
 * @returns The result of render
 */
export function renderWithProviders(
  ui: ReactElement,
  providers: Array<{
    Provider: React.ComponentType<any>;
    props: Record<string, any>;
  }>,
  options?: Omit<RenderOptions, 'wrapper'>
) {
  return rtlRender(ui, {
    wrapper: ({ children }) => {
      return providers.reduce(
        (acc, { Provider, props }) => <Provider {...props}>{acc}</Provider>,
        children as ReactNode
      );
    },
    ...options,
  });
}
