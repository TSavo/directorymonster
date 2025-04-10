/**
 * Custom error class for API token related errors
 */
export class ApiTokenError extends Error {
  /**
   * Creates a new ApiTokenError
   * 
   * @param message - The error message
   */
  constructor(message: string) {
    super(message);
    this.name = 'ApiTokenError';
  }
}
