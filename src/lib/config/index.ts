/**
 * Configuration Service
 * 
 * This module provides a centralized configuration service for the application.
 * It reads configuration from environment variables and provides sensible defaults.
 * 
 * Using this service instead of directly accessing process.env makes testing easier
 * and provides better type safety and documentation of configuration options.
 */

// Security configuration interface
export interface SecurityConfig {
  jwt: {
    // Secret key for symmetric algorithms (HS256, HS384, HS512)
    secret?: string;
    // Private key for asymmetric algorithms (RS256, RS384, RS512, ES256, ES384, ES512)
    privateKey?: string;
    // Public key for asymmetric algorithms
    publicKey?: string;
    // Algorithm to use for signing and verification
    algorithm: string;
    // Access token lifetime in seconds
    accessTokenLifetime: number;
    // Refresh token lifetime in seconds
    refreshTokenLifetime: number;
  };
  rateLimiting: {
    // Whether rate limiting is enabled
    enabled: boolean;
    // Default rate limit (requests per window)
    defaultLimit: number;
    // Default rate limit window in seconds
    defaultWindow: number;
    // Specific rate limits for different operations
    limits: {
      login: { limit: number; window: number };
      refresh: { limit: number; window: number };
      passwordReset: { limit: number; window: number };
      api: { limit: number; window: number };
    };
  };
  security: {
    // Whether to enable security headers
    enableSecurityHeaders: boolean;
    // Content Security Policy
    contentSecurityPolicy: string;
    // Whether to enable strict transport security
    enableHSTS: boolean;
    // Whether to enable XSS protection
    enableXSSProtection: boolean;
    // Whether to enable security logging
    enableSecurityLogging: boolean;
  };
  redis: {
    // Redis connection URL
    url?: string;
    // Whether to use in-memory fallback when Redis is unavailable
    useMemoryFallback: boolean;
    // Prefix for Redis keys
    keyPrefix: string;
  };
}

// Redis configuration
export interface RedisConfig {
  // Redis connection URL
  url?: string;
  // Whether to use in-memory fallback when Redis is unavailable
  useMemoryFallback: boolean;
  // Prefix for Redis keys
  keyPrefix: string;
}

// Application configuration interface
export interface AppConfig {
  // Environment (development, test, production)
  env: string;
  // Whether the application is running in development mode
  isDevelopment: boolean;
  // Whether the application is running in test mode
  isTest: boolean;
  // Whether the application is running in production mode
  isProduction: boolean;
  // Security configuration
  security: SecurityConfig;
  // Redis configuration
  redis: RedisConfig;
  // Base URL of the application
  baseUrl: string;
  // API base URL
  apiBaseUrl: string;
}

/**
 * Get the security configuration
 * 
 * @returns The security configuration
 */
export function getSecurityConfig(): SecurityConfig {
  return {
    jwt: {
      secret: process.env.JWT_SECRET,
      privateKey: process.env.JWT_PRIVATE_KEY,
      publicKey: process.env.JWT_PUBLIC_KEY,
      algorithm: process.env.JWT_ALGORITHM || 'HS256',
      accessTokenLifetime: parseInt(process.env.JWT_ACCESS_TOKEN_LIFETIME || '3600', 10),
      refreshTokenLifetime: parseInt(process.env.JWT_REFRESH_TOKEN_LIFETIME || '604800', 10),
    },
    rateLimiting: {
      enabled: process.env.RATE_LIMITING_ENABLED !== 'false',
      defaultLimit: parseInt(process.env.RATE_LIMITING_DEFAULT_LIMIT || '100', 10),
      defaultWindow: parseInt(process.env.RATE_LIMITING_DEFAULT_WINDOW || '60', 10),
      limits: {
        login: {
          limit: parseInt(process.env.RATE_LIMITING_LOGIN_LIMIT || '5', 10),
          window: parseInt(process.env.RATE_LIMITING_LOGIN_WINDOW || '60', 10),
        },
        refresh: {
          limit: parseInt(process.env.RATE_LIMITING_REFRESH_LIMIT || '10', 10),
          window: parseInt(process.env.RATE_LIMITING_REFRESH_WINDOW || '60', 10),
        },
        passwordReset: {
          limit: parseInt(process.env.RATE_LIMITING_PASSWORD_RESET_LIMIT || '3', 10),
          window: parseInt(process.env.RATE_LIMITING_PASSWORD_RESET_WINDOW || '3600', 10),
        },
        api: {
          limit: parseInt(process.env.RATE_LIMITING_API_LIMIT || '100', 10),
          window: parseInt(process.env.RATE_LIMITING_API_WINDOW || '60', 10),
        },
      },
    },
    security: {
      enableSecurityHeaders: process.env.ENABLE_SECURITY_HEADERS !== 'false',
      contentSecurityPolicy: process.env.CONTENT_SECURITY_POLICY || "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline';",
      enableHSTS: process.env.ENABLE_HSTS !== 'false',
      enableXSSProtection: process.env.ENABLE_XSS_PROTECTION !== 'false',
      enableSecurityLogging: process.env.ENABLE_SECURITY_LOGGING !== 'false',
    },
    redis: {
      url: process.env.REDIS_URL,
      useMemoryFallback: process.env.REDIS_USE_MEMORY_FALLBACK !== 'false',
      keyPrefix: process.env.REDIS_KEY_PREFIX || 'app:',
    },
  };
}

/**
 * Get the Redis configuration
 * 
 * @returns The Redis configuration
 */
export function getRedisConfig(): RedisConfig {
  return {
    url: process.env.REDIS_URL,
    useMemoryFallback: process.env.REDIS_USE_MEMORY_FALLBACK !== 'false',
    keyPrefix: process.env.REDIS_KEY_PREFIX || 'app:',
  };
}

/**
 * Get the application configuration
 * 
 * @returns The application configuration
 */
export function getConfig(): AppConfig {
  const env = process.env.NODE_ENV || 'development';
  
  return {
    env,
    isDevelopment: env === 'development',
    isTest: env === 'test',
    isProduction: env === 'production',
    security: getSecurityConfig(),
    redis: getRedisConfig(),
    baseUrl: process.env.BASE_URL || 'http://localhost:3000',
    apiBaseUrl: process.env.API_BASE_URL || '/api',
  };
}

// Export a singleton instance of the configuration
export const config = getConfig();
