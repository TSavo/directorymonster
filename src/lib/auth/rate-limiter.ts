/**
 * Rate Limiting Middleware
 * 
 * This module provides rate limiting functionality to protect against brute force attacks
 * and denial of service attacks. It limits the number of requests that can be made
 * within a specified time window.
 * 
 * Features:
 * - IP-based rate limiting
 * - Configurable limits and time windows
 * - Different limits for different endpoints
 * - Redis-backed storage for distributed environments
 */

import { NextRequest, NextResponse } from 'next/server';
import { getRedisClient } from '@/lib/redis-client';
import { logSecurityEvent, SecurityEventType } from './security-logger';

// Rate limit key prefixes
const RATE_LIMIT_PREFIX = 'rate:';

// Rate limit options interface
export interface RateLimitOptions {
  // Maximum number of requests allowed in the time window
  limit: number;
  
  // Time window in seconds
  window: number;
  
  // Key to identify the rate limited resource (e.g., 'login', 'refresh')
  key: string;
  
  // Whether to include the user ID in the rate limit key (if available)
  includeUserId?: boolean;
  
  // Custom identifier to use instead of IP (optional)
  identifier?: string;
}

/**
 * Default rate limit options for common operations
 */
export const DEFAULT_RATE_LIMITS = {
  // Login attempts: 5 per minute
  login: { limit: 5, window: 60, key: 'login' },
  
  // Token refresh: 10 per minute
  refresh: { limit: 10, window: 60, key: 'refresh' },
  
  // Password reset requests: 3 per hour
  passwordReset: { limit: 3, window: 3600, key: 'password-reset' },
  
  // API requests: 100 per minute
  api: { limit: 100, window: 60, key: 'api' }
};

/**
 * Extract a client identifier from the request
 * 
 * @param req - The Next.js request object
 * @returns A string identifier for the client
 */
function getClientIdentifier(req: NextRequest): string {
  // Try to get the real IP from common headers
  return (
    req.headers.get('x-forwarded-for') ||
    req.headers.get('x-real-ip') ||
    req.ip ||
    'unknown'
  );
}

/**
 * Rate limiting middleware for Next.js API routes
 * 
 * @param req - The Next.js request object
 * @param handler - The handler function to call if rate limit is not exceeded
 * @param options - Rate limiting options
 * @returns The response from the handler or a 429 Too Many Requests response
 */
export async function withRateLimit(
  req: NextRequest,
  handler: (req: NextRequest) => Promise<NextResponse>,
  options: RateLimitOptions
): Promise<NextResponse> {
  const { limit, window, key, includeUserId = false, identifier } = options;
  
  try {
    const redis = getRedisClient();
    
    // Get client identifier
    const clientId = identifier || getClientIdentifier(req);
    
    // Create rate limit key
    let rateKey = `${RATE_LIMIT_PREFIX}${key}:${clientId}`;
    
    // Add user ID to key if requested and available
    if (includeUserId) {
      // In a real implementation, you would extract the user ID from the request
      // For now, we'll just use a placeholder
      const userId = 'unknown';
      rateKey = `${rateKey}:${userId}`;
    }
    
    // Increment the counter
    const count = await redis.incr(rateKey);
    
    // Set expiration on first request
    if (count === 1) {
      await redis.expire(rateKey, window);
    }
    
    // Add rate limit headers to the response
    const handler_response = async () => {
      const response = await handler(req);
      response.headers.set('X-RateLimit-Limit', limit.toString());
      response.headers.set('X-RateLimit-Remaining', Math.max(0, limit - count).toString());
      
      // Get TTL for the rate limit key
      const ttl = await redis.ttl(rateKey);
      response.headers.set('X-RateLimit-Reset', ttl.toString());
      
      return response;
    };
    
    // Check if limit exceeded
    if (count > limit) {
      // Log rate limit exceeded
      await logSecurityEvent({
        type: SecurityEventType.RATE_LIMIT_EXCEEDED,
        details: {
          key,
          clientId,
          count,
          limit
        }
      });
      
      // Return rate limit exceeded response
      const response = NextResponse.json(
        {
          error: 'Too many requests',
          message: 'Please try again later',
          retryAfter: await redis.ttl(rateKey)
        },
        { status: 429 }
      );
      
      // Add rate limit headers
      response.headers.set('X-RateLimit-Limit', limit.toString());
      response.headers.set('X-RateLimit-Remaining', '0');
      response.headers.set('X-RateLimit-Reset', (await redis.ttl(rateKey)).toString());
      response.headers.set('Retry-After', (await redis.ttl(rateKey)).toString());
      
      return response;
    }
    
    // Process the request
    return await handler_response();
  } catch (error) {
    console.error('Rate limiting error:', error);
    
    // Log the error
    await logSecurityEvent({
      type: SecurityEventType.ERROR,
      details: {
        message: 'Rate limiting error',
        error: (error as Error).message
      }
    });
    
    // Continue processing the request on error
    return await handler(req);
  }
}

/**
 * Create a rate-limited handler function
 * 
 * @param handler - The handler function to rate limit
 * @param options - Rate limiting options
 * @returns A rate-limited handler function
 */
export function createRateLimitedHandler(
  handler: (req: NextRequest) => Promise<NextResponse>,
  options: RateLimitOptions
): (req: NextRequest) => Promise<NextResponse> {
  return (req: NextRequest) => withRateLimit(req, handler, options);
}

/**
 * Apply rate limiting to a login handler
 * 
 * @param handler - The login handler function
 * @returns A rate-limited login handler function
 */
export function withLoginRateLimit(
  handler: (req: NextRequest) => Promise<NextResponse>
): (req: NextRequest) => Promise<NextResponse> {
  return createRateLimitedHandler(handler, DEFAULT_RATE_LIMITS.login);
}

/**
 * Apply rate limiting to a token refresh handler
 * 
 * @param handler - The token refresh handler function
 * @returns A rate-limited token refresh handler function
 */
export function withRefreshRateLimit(
  handler: (req: NextRequest) => Promise<NextResponse>
): (req: NextRequest) => Promise<NextResponse> {
  return createRateLimitedHandler(handler, DEFAULT_RATE_LIMITS.refresh);
}

/**
 * Apply rate limiting to a password reset handler
 * 
 * @param handler - The password reset handler function
 * @returns A rate-limited password reset handler function
 */
export function withPasswordResetRateLimit(
  handler: (req: NextRequest) => Promise<NextResponse>
): (req: NextRequest) => Promise<NextResponse> {
  return createRateLimitedHandler(handler, DEFAULT_RATE_LIMITS.passwordReset);
}
