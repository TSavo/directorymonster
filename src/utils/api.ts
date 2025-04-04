/**
 * API utility functions
 */

/**
 * Retry a function with exponential backoff
 * 
 * @param fn - The function to retry
 * @param options - Retry options
 * @returns The result of the function
 */
export async function retry<T>(
  fn: () => Promise<T>,
  options: {
    maxRetries?: number;
    initialDelay?: number;
    maxDelay?: number;
    backoffFactor?: number;
    retryCondition?: (error: any) => boolean;
    onRetry?: (error: any, attempt: number) => void;
  } = {}
): Promise<T> {
  const {
    maxRetries = 3,
    initialDelay = 300,
    maxDelay = 5000,
    backoffFactor = 2,
    retryCondition = () => true,
    onRetry = () => {}
  } = options;

  let attempt = 0;

  while (true) {
    try {
      return await fn();
    } catch (error) {
      attempt++;

      if (attempt > maxRetries || !retryCondition(error)) {
        throw error;
      }

      // Call the onRetry callback
      onRetry(error, attempt);

      // Calculate delay with exponential backoff
      const delay = Math.min(
        initialDelay * Math.pow(backoffFactor, attempt - 1),
        maxDelay
      );

      // Wait before retrying
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
}

/**
 * Fetch with retry functionality
 * 
 * @param url - The URL to fetch
 * @param options - Fetch options
 * @returns The fetch response
 */
export async function fetchWithRetry(
  url: string,
  options: RequestInit & {
    retryOptions?: Parameters<typeof retry>[1];
  } = {}
): Promise<Response> {
  const { retryOptions, ...fetchOptions } = options;

  return retry(
    () => fetch(url, fetchOptions),
    {
      retryCondition: (error) => {
        // Only retry on network errors or 5xx responses
        if (error instanceof Response) {
          return error.status >= 500;
        }
        return true;
      },
      ...retryOptions
    }
  );
}
