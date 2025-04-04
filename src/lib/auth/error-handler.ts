/**
 * Authentication error handling utilities
 * 
 * This module provides functions to handle authentication errors
 * and provide user-friendly error messages.
 */

// Error types
export enum AuthErrorType {
  NETWORK = 'network',
  INVALID_CREDENTIALS = 'invalid_credentials',
  USER_NOT_FOUND = 'user_not_found',
  SERVER_ERROR = 'server_error',
  RATE_LIMIT = 'rate_limit',
  INVALID_TOKEN = 'invalid_token',
  EXPIRED_TOKEN = 'expired_token',
  SALT_RETRIEVAL = 'salt_retrieval',
  ZKP_GENERATION = 'zkp_generation',
  UNKNOWN = 'unknown'
}

// Error messages
const errorMessages: Record<AuthErrorType, string> = {
  [AuthErrorType.NETWORK]: 'Network error. Please check your internet connection and try again.',
  [AuthErrorType.INVALID_CREDENTIALS]: 'Invalid username or password. Please try again.',
  [AuthErrorType.USER_NOT_FOUND]: 'User not found. Please check your username and try again.',
  [AuthErrorType.SERVER_ERROR]: 'Server error. Please try again later.',
  [AuthErrorType.RATE_LIMIT]: 'Too many attempts. Please try again later.',
  [AuthErrorType.INVALID_TOKEN]: 'Invalid or expired token. Please request a new password reset link.',
  [AuthErrorType.EXPIRED_TOKEN]: 'Your session has expired. Please log in again.',
  [AuthErrorType.SALT_RETRIEVAL]: 'Failed to retrieve authentication data. Please try again.',
  [AuthErrorType.ZKP_GENERATION]: 'Failed to generate authentication proof. Please try again.',
  [AuthErrorType.UNKNOWN]: 'An unknown error occurred. Please try again.'
};

/**
 * Get a user-friendly error message for an authentication error
 * 
 * @param error The error object or message
 * @param defaultType The default error type to use if the error can't be classified
 * @returns A user-friendly error message
 */
export function getAuthErrorMessage(error: any, defaultType: AuthErrorType = AuthErrorType.UNKNOWN): string {
  // If the error is a string, try to classify it
  if (typeof error === 'string') {
    if (error.includes('network') || error.includes('fetch') || error.includes('connection')) {
      return errorMessages[AuthErrorType.NETWORK];
    }
    if (error.includes('invalid credentials') || error.includes('invalid proof')) {
      return errorMessages[AuthErrorType.INVALID_CREDENTIALS];
    }
    if (error.includes('user not found')) {
      return errorMessages[AuthErrorType.USER_NOT_FOUND];
    }
    if (error.includes('rate limit') || error.includes('too many')) {
      return errorMessages[AuthErrorType.RATE_LIMIT];
    }
    if (error.includes('token') && (error.includes('invalid') || error.includes('expired'))) {
      return errorMessages[AuthErrorType.INVALID_TOKEN];
    }
    if (error.includes('salt')) {
      return errorMessages[AuthErrorType.SALT_RETRIEVAL];
    }
    if (error.includes('proof') || error.includes('zkp')) {
      return errorMessages[AuthErrorType.ZKP_GENERATION];
    }
    
    // If we can't classify the error, use the default type
    return errorMessages[defaultType];
  }
  
  // If the error is an Error object, use its message
  if (error instanceof Error) {
    return getAuthErrorMessage(error.message, defaultType);
  }
  
  // If the error is a Response object, use its status
  if (error instanceof Response) {
    if (error.status === 401) {
      return errorMessages[AuthErrorType.INVALID_CREDENTIALS];
    }
    if (error.status === 404) {
      return errorMessages[AuthErrorType.USER_NOT_FOUND];
    }
    if (error.status === 429) {
      return errorMessages[AuthErrorType.RATE_LIMIT];
    }
    if (error.status >= 500) {
      return errorMessages[AuthErrorType.SERVER_ERROR];
    }
    
    // For other status codes, use the default type
    return errorMessages[defaultType];
  }
  
  // If we can't classify the error, use the default type
  return errorMessages[defaultType];
}
