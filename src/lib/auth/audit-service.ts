/**
 * Audit Service
 * 
 * This service provides audit logging functionality for security events.
 */

// Define interfaces for the audit service
export interface AuditConfig {
  enabled?: boolean;
  logLevel?: string;
}

export interface LogEntry {
  timestamp: string;
  level: string;
  message: string;
  [key: string]: any;
}

export interface AuthAttempt {
  username: string;
  ip: string;
  success: boolean;
  timestamp: string;
  reason?: string;
}

export interface SecurityEvent {
  type: string;
  ip: string;
  username?: string;
  timestamp: string;
  reason?: string;
}

export interface ZkpVerificationEvent {
  username: string;
  success: boolean;
  timestamp: string;
  reason?: string;
}

export interface Logger {
  debug: (message: string, ...args: any[]) => void;
  info: (message: string, ...args: any[]) => void;
  warn: (message: string, ...args: any[]) => void;
  error: (message: string, ...args: any[]) => void;
  log: (message: string, ...args: any[]) => void;
}

export class AuditService {
  private enabled: boolean;
  private logLevel: string;
  private loggers: Record<string, Logger>;

  constructor(config: AuditConfig = {}) {
    this.enabled = config.enabled !== false;
    this.logLevel = config.logLevel || 'info';
    this.loggers = {
      console: console,
    };
  }

  /**
   * Log a message with the specified level
   * 
   * @param level - The log level (debug, info, warn, error)
   * @param message - The message to log
   * @param data - Additional data to log
   */
  log(level: string, message: string, data: Record<string, any> = {}): void {
    if (!this.enabled) {
      return;
    }

    const timestamp = new Date().toISOString();
    const logEntry: LogEntry = {
      timestamp,
      level,
      message,
      ...data,
    };

    // Log to console
    if (this.loggers.console) {
      switch (level) {
        case 'debug':
          this.loggers.console.debug(message, logEntry);
          break;
        case 'info':
          this.loggers.console.info(message, logEntry);
          break;
        case 'warn':
          this.loggers.console.warn(message, logEntry);
          break;
        case 'error':
          this.loggers.console.error(message, logEntry);
          break;
        default:
          this.loggers.console.log(message, logEntry);
      }
    }

    // Additional loggers could be added here (e.g., file, database, etc.)
  }

  /**
   * Log an authentication attempt
   * 
   * @param params - Authentication attempt parameters
   */
  logAuthenticationAttempt(params: AuthAttempt): void {
    const { username, ip, success, timestamp, reason } = params;
    
    const level = success ? 'info' : 'warn';
    const message = success 
      ? `Authentication successful for user ${username} from ${ip}`
      : `Authentication failed for user ${username} from ${ip}: ${reason || 'Unknown reason'}`;
    
    this.log(level, message, params);
  }

  /**
   * Log a security event
   * 
   * @param params - Security event parameters
   */
  logSecurityEvent(params: SecurityEvent): void {
    const { type, ip, reason, timestamp } = params;
    
    const message = `Security event: ${type} from ${ip}: ${reason || 'No reason provided'}`;
    
    this.log('warn', message, params);
  }

  /**
   * Log a ZKP verification event
   * 
   * @param params - ZKP verification parameters
   */
  logZkpVerification(params: ZkpVerificationEvent): void {
    const { username, success, timestamp, reason } = params;
    
    const level = success ? 'info' : 'warn';
    const message = success 
      ? `ZKP verification successful for user ${username}`
      : `ZKP verification failed for user ${username}: ${reason || 'Unknown reason'}`;
    
    this.log(level, message, params);
  }
}
