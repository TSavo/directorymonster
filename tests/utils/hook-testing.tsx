import { renderHook, RenderHookOptions, RenderHookResult, act } from '@testing-library/react';

/**
 * Utility function to wait for a condition to be true
 * @param condition Function that returns a boolean
 * @param timeout Timeout in milliseconds
 * @returns Promise that resolves when the condition is true
 */
export const waitFor = async (
  condition: () => boolean,
  timeout = 5000,
  interval = 100
): Promise<void> => {
  const start = Date.now();
  while (!condition() && Date.now() - start < timeout) {
    await new Promise((resolve) => setTimeout(resolve, interval));
  }
  if (!condition()) {
    throw new Error(`Timeout waiting for condition after ${timeout}ms`);
  }
};

/**
 * Utility function to wait for a hook result to match a condition
 * @param result RenderHookResult
 * @param predicate Function that takes the current result and returns a boolean
 * @param options Options for waiting
 * @returns Promise that resolves when the condition is true
 */
export const waitForHookToMatch = async <Result, Props>(
  result: RenderHookResult<Result, Props>,
  predicate: (result: Result) => boolean,
  options: { timeout?: number; interval?: number } = {}
): Promise<void> => {
  const { timeout = 5000, interval = 100 } = options;
  return waitFor(() => predicate(result.current), timeout, interval);
};

/**
 * Utility function to update a hook with a new value and wait for the update to complete
 * @param result RenderHookResult
 * @param updateFn Function that updates the hook
 * @returns Promise that resolves when the update is complete
 */
export const actAndWait = async <Result, Props>(
  result: RenderHookResult<Result, Props>,
  updateFn: () => void | Promise<void>
): Promise<void> => {
  await act(async () => {
    await updateFn();
  });
};

/**
 * Utility function to render a hook with a wrapper component
 * @param hook Hook to render
 * @param options Options for rendering
 * @returns RenderHookResult
 */
export const renderHookWithWrapper = <Result, Props>(
  hook: (props: Props) => Result,
  options?: RenderHookOptions<Props>
): RenderHookResult<Result, Props> => {
  return renderHook(hook, options);
};
