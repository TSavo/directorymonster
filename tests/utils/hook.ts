import { renderHook as rtlRenderHook, RenderHookResult, RenderHookOptions } from '@testing-library/react';
import React, { ReactNode } from 'react';
import { act } from 'react-dom/test-utils';

// Simple implementation of waitForNextUpdate that uses setTimeout
export const waitForNextUpdate = async (timeout = 50): Promise<void> => {
  return new Promise((resolve) => setTimeout(resolve, timeout));
};

/**
 * Renders a hook with the given options and adds waitForNextUpdate functionality
 */
export function renderHook<TProps, TResult>(
  callback: (props: TProps) => TResult,
  options?: RenderHookOptions<TProps>
): RenderHookResult<TProps, TResult> & { waitForNextUpdate: () => Promise<void> } {
  const result = rtlRenderHook(callback, options);
  
  // Add waitForNextUpdate function to the result
  return {
    ...result,
    waitForNextUpdate: async () => {
      await waitForNextUpdate();
      return;
    }
  };
}

/**
 * Creates a wrapper around a context provider
 */
export function withProvider<T>(
  Provider: React.ComponentType<T & { children?: ReactNode }>
) {
  return (providerProps: T) => {
    return ({ children }: { children: ReactNode }) => (
      <Provider {...providerProps}>{children}</Provider>
    );
  };
}

/**
 * Creates a wrapper around multiple context providers
 */
export function withProviders(
  providers: Array<{
    Provider: React.ComponentType<any>;
    props: Record<string, any>;
  }>
) {
  return ({ children }: { children: ReactNode }) => {
    return providers.reduce(
      (acc, { Provider, props }) => <Provider {...props}>{acc}</Provider>,
      children as ReactNode
    );
  };
}

/**
 * Renders a hook with a context provider
 */
export function renderHookWithProvider<TProps, TResult, TProviderProps>(
  callback: (props: TProps) => TResult,
  Provider: React.ComponentType<TProviderProps & { children?: ReactNode }>,
  providerProps: TProviderProps
): RenderHookResult<TProps, TResult> & { waitForNextUpdate: () => Promise<void> } {
  return renderHook(callback, {
    wrapper: withProvider(Provider)(providerProps),
  });
}

/**
 * Updates a hook with the given props and wraps it in an act
 */
export async function updateHookWithAct<TProps, TResult>(
  result: RenderHookResult<TProps, TResult>,
  props: TProps
): Promise<void> {
  await act(async () => {
    result.rerender(props);
    await waitForNextUpdate();
  });
}

/**
 * Executes a callback within an act
 */
export async function actHook<T>(callback: () => T | Promise<T>): Promise<T> {
  let result: T;
  await act(async () => {
    result = await callback();
    await waitForNextUpdate();
  });
  return result!;
}

export { act };
