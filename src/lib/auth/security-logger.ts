/**
 * Security Event Logging
 *
 * This module provides functionality for logging security-related events
 * such as authentication attempts, token validation failures, and unauthorized access attempts.
 *
 * In production, these events should be sent to a secure logging service or SIEM system.
 */

// Security event types
export enum SecurityEventType {
  // Authentication events
  LOGIN_SUCCESS = 'login_success',
  LOGIN_FAILURE = 'login_failure',
  LOGOUT = 'logout',

  // Token events
  TOKEN_VALIDATION_SUCCESS = 'token_validation_success',
  TOKEN_VALIDATION_FAILURE = 'token_validation_failure',
  TOKEN_REVOCATION = 'token_revocation',
  TOKEN_REFRESH_SUCCESS = 'token_refresh_success',
  TOKEN_REFRESH_FAILURE = 'token_refresh_failure',

  // Session events
  SESSION_CREATED = 'session_created',
  SESSION_UPDATED = 'session_updated',
  SESSION_EXPIRED = 'session_expired',
  SESSION_REVOKED = 'session_revoked',
  SESSIONS_REVOKED = 'sessions_revoked',

  // Access control events
  UNAUTHORIZED_ACCESS = 'unauthorized_access',
  PERMISSION_DENIED = 'permission_denied',

  // Rate limiting events
  RATE_LIMIT_EXCEEDED = 'rate_limit_exceeded',

  // Other events
  PASSWORD_CHANGE = 'password_change',
  PASSWORD_RESET_REQUEST = 'password_reset_request',
  PASSWORD_RESET_COMPLETE = 'password_reset_complete',
  USER_CREATED = 'user_created',
  USER_UPDATED = 'user_updated',
  USER_DELETED = 'user_deleted',

  // Error events
  ERROR = 'error'
}

// Security event interface
export interface SecurityEvent {
  // Type of security event
  type: SecurityEventType;

  // User ID associated with the event (if applicable)
  userId?: string;

  // IP address associated with the event (if applicable)
  ip?: string;

  // User agent associated with the event (if applicable)
  userAgent?: string;

  // Additional details about the event
  details?: Record<string, any>;

  // Timestamp of the event (in milliseconds since epoch)
  timestamp: number;
}

// Log level enum
export enum LogLevel {
  DEBUG = 'debug',
  INFO = 'info',
  WARN = 'warn',
  ERROR = 'error'
}

// Map event types to log levels
const eventLogLevels: Record<SecurityEventType, LogLevel> = {
  [SecurityEventType.LOGIN_SUCCESS]: LogLevel.INFO,
  [SecurityEventType.LOGIN_FAILURE]: LogLevel.WARN,
  [SecurityEventType.LOGOUT]: LogLevel.INFO,
  [SecurityEventType.TOKEN_VALIDATION_SUCCESS]: LogLevel.DEBUG,
  [SecurityEventType.TOKEN_VALIDATION_FAILURE]: LogLevel.WARN,
  [SecurityEventType.TOKEN_REVOCATION]: LogLevel.INFO,
  [SecurityEventType.TOKEN_REFRESH_SUCCESS]: LogLevel.DEBUG,
  [SecurityEventType.TOKEN_REFRESH_FAILURE]: LogLevel.WARN,
  [SecurityEventType.SESSION_CREATED]: LogLevel.INFO,
  [SecurityEventType.SESSION_UPDATED]: LogLevel.DEBUG,
  [SecurityEventType.SESSION_EXPIRED]: LogLevel.INFO,
  [SecurityEventType.SESSION_REVOKED]: LogLevel.INFO,
  [SecurityEventType.SESSIONS_REVOKED]: LogLevel.INFO,
  [SecurityEventType.UNAUTHORIZED_ACCESS]: LogLevel.ERROR,
  [SecurityEventType.PERMISSION_DENIED]: LogLevel.WARN,
  [SecurityEventType.RATE_LIMIT_EXCEEDED]: LogLevel.WARN,
  [SecurityEventType.PASSWORD_CHANGE]: LogLevel.INFO,
  [SecurityEventType.PASSWORD_RESET_REQUEST]: LogLevel.INFO,
  [SecurityEventType.PASSWORD_RESET_COMPLETE]: LogLevel.INFO,
  [SecurityEventType.USER_CREATED]: LogLevel.INFO,
  [SecurityEventType.USER_UPDATED]: LogLevel.INFO,
  [SecurityEventType.USER_DELETED]: LogLevel.INFO,
  [SecurityEventType.ERROR]: LogLevel.ERROR
};

/**
 * Log a security event
 *
 * @param event - The security event to log
 */
export async function logSecurityEvent(event: Omit<SecurityEvent, 'timestamp'>): Promise<void> {
  const fullEvent: SecurityEvent = {
    ...event,
    timestamp: Date.now()
  };

  // Get the log level for this event type
  const logLevel = eventLogLevels[event.type] || LogLevel.INFO;

  // In development, log to console
  if (process.env.NODE_ENV !== 'production') {
    logToConsole(logLevel, fullEvent);
    return;
  }

  // In production, log to a secure storage or monitoring service
  try {
    await logToSecureStorage(logLevel, fullEvent);
  } catch (error) {
    // Fallback to console logging if secure logging fails
    console.error('Failed to log security event to secure storage:', error);
    logToConsole(LogLevel.ERROR, fullEvent);
  }
}

/**
 * Log an event to the console
 *
 * @param level - The log level
 * @param event - The security event to log
 */
function logToConsole(level: LogLevel, event: SecurityEvent): void {
  const message = `[SECURITY] ${event.type}`;

  switch (level) {
    case LogLevel.DEBUG:
      console.debug(message, event);
      break;
    case LogLevel.INFO:
      console.info(message, event);
      break;
    case LogLevel.WARN:
      console.warn(message, event);
      break;
    case LogLevel.ERROR:
      console.error(message, event);
      break;
    default:
      console.log(message, event);
  }
}

/**
 * Log an event to a secure storage or monitoring service
 *
 * @param level - The log level
 * @param event - The security event to log
 */
async function logToSecureStorage(level: LogLevel, event: SecurityEvent): Promise<void> {
  // In a real implementation, this would send the event to a secure logging service
  // For example, a SIEM system, a logging service like Datadog or New Relic, or a secure database

  // For now, just log to console in production too
  logToConsole(level, event);

  // Example implementation for sending to a logging service:
  /*
  try {
    await fetch('https://logging-service.example.com/security-events', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.LOGGING_SERVICE_API_KEY}`
      },
      body: JSON.stringify({
        level,
        event
      })
    });
  } catch (error) {
    // If logging service is down, fall back to console
    console.error('Failed to send security event to logging service:', error);
    logToConsole(LogLevel.ERROR, event);
  }
  */
}

/**
 * Log a successful login
 *
 * @param userId - The ID of the user who logged in
 * @param ip - The IP address of the client
 * @param userAgent - The user agent of the client
 */
export async function logLoginSuccess(
  userId: string,
  ip?: string,
  userAgent?: string
): Promise<void> {
  await logSecurityEvent({
    type: SecurityEventType.LOGIN_SUCCESS,
    userId,
    ip,
    userAgent
  });
}

/**
 * Log a failed login attempt
 *
 * @param userId - The ID of the user who failed to log in (if known)
 * @param reason - The reason for the failure
 * @param ip - The IP address of the client
 * @param userAgent - The user agent of the client
 */
export async function logLoginFailure(
  userId: string | undefined,
  reason: string,
  ip?: string,
  userAgent?: string
): Promise<void> {
  await logSecurityEvent({
    type: SecurityEventType.LOGIN_FAILURE,
    userId,
    ip,
    userAgent,
    details: { reason }
  });
}

/**
 * Log an unauthorized access attempt
 *
 * @param userId - The ID of the user who attempted access (if known)
 * @param resource - The resource that was accessed
 * @param ip - The IP address of the client
 * @param userAgent - The user agent of the client
 */
export async function logUnauthorizedAccess(
  userId: string | undefined,
  resource: string,
  ip?: string,
  userAgent?: string
): Promise<void> {
  await logSecurityEvent({
    type: SecurityEventType.UNAUTHORIZED_ACCESS,
    userId,
    ip,
    userAgent,
    details: { resource }
  });
}

/**
 * Log a permission denied event
 *
 * @param userId - The ID of the user who was denied permission
 * @param resource - The resource that was accessed
 * @param permission - The permission that was required
 * @param ip - The IP address of the client
 * @param userAgent - The user agent of the client
 */
export async function logPermissionDenied(
  userId: string,
  resource: string,
  permission: string,
  ip?: string,
  userAgent?: string
): Promise<void> {
  await logSecurityEvent({
    type: SecurityEventType.PERMISSION_DENIED,
    userId,
    ip,
    userAgent,
    details: { resource, permission }
  });
}
