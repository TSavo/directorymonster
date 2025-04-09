import { renderHook, RenderHookResult } from '@testing-library/react';
import { ReactNode } from 'react';

/**
 * Custom wrapper for renderHook that allows providing a context provider
 * @param Provider The context provider component
 * @param providerProps Props to pass to the provider
 * @returns A function that can be used as the wrapper for renderHook
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
 * Custom wrapper for renderHook that allows providing multiple context providers
 * @param providers Array of provider components and their props
 * @returns A function that can be used as the wrapper for renderHook
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
 * Custom renderHook that allows providing a context provider
 * @param callback The hook to render
 * @param Provider The context provider component
 * @param providerProps Props to pass to the provider
 * @returns The result of renderHook
 */
export function renderHookWithProvider<TProps, TResult, TProviderProps>(
  callback: (props: TProps) => TResult,
  Provider: React.ComponentType<TProviderProps & { children?: ReactNode }>,
  providerProps: TProviderProps
): RenderHookResult<TResult, TProps> {
  return renderHook(callback, {
    wrapper: withProvider(Provider)(providerProps),
  });
}

/**
 * Custom renderHook that allows providing multiple context providers
 * @param callback The hook to render
 * @param providers Array of provider components and their props
 * @returns The result of renderHook
 */
export function renderHookWithProviders<TProps, TResult>(
  callback: (props: TProps) => TResult,
  providers: Array<{
    Provider: React.ComponentType<any>;
    props: Record<string, any>;
  }>
): RenderHookResult<TResult, TProps> {
  return renderHook(callback, {
    wrapper: withProviders(providers),
  });
}
