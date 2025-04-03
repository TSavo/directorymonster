/**
 * Authentication and Authorization Error Classes
 * 
 * This module provides a set of error classes for authentication and authorization errors.
 * These classes extend the standard Error class and add additional properties for
 * status codes and error types.
 * 
 * Using these error classes instead of generic errors or returning null values
 * provides more consistent error handling and better error messages.
 */

/**
 * Base class for authentication and authorization errors
 */
export class AuthError extends Error {
  /**
   * HTTP status code to return for this error
   */
  public statusCode: number;
  
  /**
   * Error type for categorizing errors
   */
  public type: string;
  
  /**
   * Additional error details
   */
  public details?: Record<string, any>;
  
  /**
   * Create a new AuthError
   * 
   * @param message - Error message
   * @param statusCode - HTTP status code (default: 401)
   * @param details - Additional error details
   */
  constructor(message: string, statusCode: number = 401, details?: Record<string, any>) {
    super(message);
    this.name = 'AuthError';
    this.statusCode = statusCode;
    this.type = 'auth_error';
    this.details = details;
    
    // Ensure the stack trace includes this constructor
    Error.captureStackTrace(this, this.constructor);
  }
  
  /**
   * Convert the error to a JSON object
   * 
   * @returns JSON representation of the error
   */
  public toJSON(): Record<string, any> {
    return {
      error: this.name,
      type: this.type,
      message: this.message,
      ...(this.details ? { details: this.details } : {})
    };
  }
}

/**
 * Error for token validation failures
 */
export class TokenValidationError extends AuthError {
  /**
   * Create a new TokenValidationError
   * 
   * @param message - Error message
   * @param details - Additional error details
   */
  constructor(message: string, details?: Record<string, any>) {
    super(message, 401, details);
    this.name = 'TokenValidationError';
    this.type = 'token_validation_error';
  }
}

/**
 * Error for token expiration
 */
export class TokenExpiredError extends TokenValidationError {
  /**
   * Create a new TokenExpiredError
   * 
   * @param message - Error message
   * @param expiredAt - When the token expired
   */
  constructor(message: string, expiredAt?: Date) {
    super(message, { expiredAt: expiredAt?.toISOString() });
    this.name = 'TokenExpiredError';
    this.type = 'token_expired';
  }
}

/**
 * Error for revoked tokens
 */
export class TokenRevokedError extends TokenValidationError {
  /**
   * Create a new TokenRevokedError
   * 
   * @param message - Error message
   * @param tokenId - ID of the revoked token
   */
  constructor(message: string, tokenId?: string) {
    super(message, { tokenId });
    this.name = 'TokenRevokedError';
    this.type = 'token_revoked';
  }
}

/**
 * Error for rate limiting
 */
export class RateLimitError extends AuthError {
  /**
   * Create a new RateLimitError
   * 
   * @param message - Error message
   * @param retryAfter - Seconds until the rate limit resets
   * @param limit - Rate limit
   * @param remaining - Remaining requests
   */
  constructor(
    message: string,
    retryAfter?: number,
    limit?: number,
    remaining?: number
  ) {
    super(message, 429, { retryAfter, limit, remaining });
    this.name = 'RateLimitError';
    this.type = 'rate_limit_exceeded';
  }
}

/**
 * Error for permission denied
 */
export class PermissionError extends AuthError {
  /**
   * Create a new PermissionError
   * 
   * @param message - Error message
   * @param requiredPermission - Permission that was required
   * @param resource - Resource that was accessed
   */
  constructor(
    message: string,
    requiredPermission?: string,
    resource?: string
  ) {
    super(message, 403, { requiredPermission, resource });
    this.name = 'PermissionError';
    this.type = 'permission_denied';
  }
}

/**
 * Error for invalid credentials
 */
export class InvalidCredentialsError extends AuthError {
  /**
   * Create a new InvalidCredentialsError
   * 
   * @param message - Error message
   */
  constructor(message: string = 'Invalid credentials') {
    super(message, 401);
    this.name = 'InvalidCredentialsError';
    this.type = 'invalid_credentials';
  }
}

/**
 * Error for account lockout
 */
export class AccountLockedError extends AuthError {
  /**
   * Create a new AccountLockedError
   * 
   * @param message - Error message
   * @param unlockAt - When the account will be unlocked
   */
  constructor(message: string, unlockAt?: Date) {
    super(message, 403, { unlockAt: unlockAt?.toISOString() });
    this.name = 'AccountLockedError';
    this.type = 'account_locked';
  }
}

/**
 * Error for missing authentication
 */
export class AuthenticationRequiredError extends AuthError {
  /**
   * Create a new AuthenticationRequiredError
   * 
   * @param message - Error message
   */
  constructor(message: string = 'Authentication required') {
    super(message, 401);
    this.name = 'AuthenticationRequiredError';
    this.type = 'authentication_required';
  }
}

/**
 * Convert a generic error to an AuthError
 * 
 * @param error - Error to convert
 * @returns AuthError instance
 */
export function toAuthError(error: unknown): AuthError {
  if (error instanceof AuthError) {
    return error;
  }
  
  if (error instanceof Error) {
    // Check for specific error types from jsonwebtoken
    if (error.name === 'TokenExpiredError') {
      return new TokenExpiredError(
        'Token has expired',
        (error as any).expiredAt
      );
    }
    
    if (error.name === 'JsonWebTokenError') {
      return new TokenValidationError(
        error.message || 'Invalid token'
      );
    }
    
    return new AuthError(error.message || 'Unknown error');
  }
  
  return new AuthError(
    typeof error === 'string' ? error : 'Unknown error'
  );
}
