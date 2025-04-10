import { RenderHookResult } from '@testing-library/react-hooks';

/**
 * Utility function to wait for a condition to be true
 * @param condition Function that returns a boolean
 * @param timeout Timeout in milliseconds
 * @returns Promise that resolves when the condition is true
 */
export const waitForCondition = async (
  condition: () => boolean,
  timeout = 5000,
  interval = 50
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
 * Utility function to wait for a hook to finish loading
 * @param result RenderHookResult with isLoading property
 * @param timeout Timeout in milliseconds
 * @returns Promise that resolves when isLoading is false
 */
export const waitForLoadingToComplete = async <T extends { isLoading: boolean }>(
  result: RenderHookResult<any, T>,
  timeout = 5000
): Promise<void> => {
  return waitForCondition(() => !result.current.isLoading, timeout);
};

/**
 * Utility function to wait for a hook to update its state based on a predicate
 * @param result RenderHookResult
 * @param predicate Function that takes the current result and returns a boolean
 * @param timeout Timeout in milliseconds
 * @returns Promise that resolves when the predicate returns true
 */
export const waitForHookToUpdate = async <T>(
  result: RenderHookResult<any, T>,
  predicate: (result: T) => boolean,
  timeout = 5000
): Promise<void> => {
  return waitForCondition(() => predicate(result.current), timeout);
};
