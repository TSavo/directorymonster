import winston from 'winston';

// Define log levels
const levels = {
  error: 0,
  warn: 1,
  info: 2,
  http: 3,
  debug: 4,
  trace: 5,
};

// Define level colors
const colors = {
  error: 'red',
  warn: 'yellow',
  info: 'green',
  http: 'magenta',
  debug: 'blue',
  trace: 'gray',
};

// Add colors to winston
winston.addColors(colors);

// Determine log level based on environment
const level = () => {
  const env = process.env.NODE_ENV || 'development';
  const isDevelopment = env === 'development';
  return isDevelopment ? 'trace' : 'info';
};

// Define the format for logs
const format = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss:ms' }),
  winston.format.colorize({ all: true }),
  winston.format.printf(
    (info) => `${info.timestamp} ${info.level}: ${info.message}`,
  ),
);

// Define transports
const transports = [
  new winston.transports.Console(),
  // Add file transports if needed
  // new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
  // new winston.transports.File({ filename: 'logs/all.log' }),
];

// Create the logger
const logger = winston.createLogger({
  level: level(),
  levels,
  format,
  transports,
  silent: process.env.NODE_ENV === 'test' && process.env.LOG_IN_TESTS !== 'true',
});

// Create namespaced loggers for different modules
export const createLogger = (namespace: string) => {
  return {
    error: (message: string) => logger.error(`[${namespace}] ${message}`),
    warn: (message: string) => logger.warn(`[${namespace}] ${message}`),
    info: (message: string) => logger.info(`[${namespace}] ${message}`),
    http: (message: string) => logger.http(`[${namespace}] ${message}`),
    debug: (message: string) => logger.debug(`[${namespace}] ${message}`),
    trace: (message: string) => logger.trace(`[${namespace}] ${message}`),
  };
};

// Export the default logger
export default logger;
