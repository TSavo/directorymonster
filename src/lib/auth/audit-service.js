/**
 * Audit Service
 * 
 * This service provides audit logging functionality for security events.
 */
class AuditService {
  constructor(config = {}) {
    this.enabled = config.enabled !== false;
    this.logLevel = config.logLevel || 'info';
    this.loggers = {
      console: console,
    };
  }

  /**
   * Log a message with the specified level
   * 
   * @param {string} level - The log level (debug, info, warn, error)
   * @param {string} message - The message to log
   * @param {object} data - Additional data to log
   */
  log(level, message, data = {}) {
    if (!this.enabled) {
      return;
    }

    const timestamp = new Date().toISOString();
    const logEntry = {
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
   * @param {object} params - Authentication attempt parameters
   * @param {string} params.username - The username
   * @param {string} params.ip - The IP address
   * @param {boolean} params.success - Whether the authentication was successful
   * @param {string} params.timestamp - The timestamp
   * @param {string} params.reason - The reason for failure (if applicable)
   */
  logAuthenticationAttempt(params) {
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
   * @param {object} params - Security event parameters
   * @param {string} params.type - The event type
   * @param {string} params.ip - The IP address
   * @param {string} params.timestamp - The timestamp
   * @param {string} params.reason - The reason for the event
   */
  logSecurityEvent(params) {
    const { type, ip, reason, timestamp } = params;
    
    const message = `Security event: ${type} from ${ip}: ${reason || 'No reason provided'}`;
    
    this.log('warn', message, params);
  }

  /**
   * Log a ZKP verification event
   * 
   * @param {object} params - ZKP verification parameters
   * @param {string} params.username - The username
   * @param {boolean} params.success - Whether the verification was successful
   * @param {string} params.timestamp - The timestamp
   * @param {string} params.reason - The reason for failure (if applicable)
   */
  logZkpVerification(params) {
    const { username, success, timestamp, reason } = params;
    
    const level = success ? 'info' : 'warn';
    const message = success 
      ? `ZKP verification successful for user ${username}`
      : `ZKP verification failed for user ${username}: ${reason || 'Unknown reason'}`;
    
    this.log(level, message, params);
  }
}

module.exports = { AuditService };
