import { NextRequest, NextResponse } from 'next/server';
import { kv } from '@/lib/redis-client';

/**
 * Rate limit configuration options
 */
export interface RateLimitOptions {
  /**
   * Maximum number of requests allowed within the window
   * @default 60
   */
  limit?: number;
  
  /**
   * Time window in seconds
   * @default 60 (1 minute)
   */
  windowInSeconds?: number;
  
  /**
   * Custom identifier function to determine the rate limit key
   * Default uses IP address
   */
  identifierFn?: (req: NextRequest) => string;
  
  /**
   * Custom response function when rate limit is exceeded
   */
  onRateLimitExceeded?: (req: NextRequest, remainingSeconds: number) => NextResponse;
}

/**
 * Rate limit information returned by the middleware
 */
export interface RateLimitInfo {
  /**
   * Whether the rate limit was exceeded
   */
  exceeded: boolean;
  
  /**
   * Number of requests remaining in the current window
   */
  remaining: number;
  
  /**
   * Total limit for the window
   */
  limit: number;
  
  /**
   * Time in seconds until the rate limit resets
   */
  resetInSeconds: number;
}

/**
 * Higher-order function that creates a rate-limited handler
 * 
 * @param handler The API route handler to wrap with rate limiting
 * @param options Rate limiting options
 * @returns A new handler with rate limiting applied
 */
export function withRateLimit<T extends (...args: any[]) => Promise<NextResponse>>(
  handler: T,
  options: RateLimitOptions = {}
): T {
  // Default options
  const {
    limit = 60,
    windowInSeconds = 60,
    identifierFn = (req: NextRequest) => req.ip || req.headers.get('x-forwarded-for') || 'unknown',
    onRateLimitExceeded = (req: NextRequest, remainingSeconds: number) => 
      NextResponse.json(
        { 
          error: 'Too many requests', 
          message: `Rate limit exceeded. Please try again in ${remainingSeconds} seconds.` 
        },
        { status: 429, headers: { 'Retry-After': remainingSeconds.toString() } }
      )
  } = options;

  // Create the rate-limited handler
  const rateLimitedHandler = async (...args: Parameters<T>): Promise<NextResponse> => {
    const req = args[0] as NextRequest;
    
    // Get the identifier for this request
    const identifier = identifierFn(req);
    
    // Create a unique key for this rate limit
    const key = `ratelimit:${identifier}`;
    
    try {
      // Get the current count and expiration time from Redis
      const rateLimitData = await kv.get(key) as { count: number, expires: number } | null;
      const now = Math.floor(Date.now() / 1000);
      
      // If no data exists or it has expired, create a new entry
      if (!rateLimitData || rateLimitData.expires <= now) {
        await kv.set(key, { count: 1, expires: now + windowInSeconds });
        await kv.expire(key, windowInSeconds);
        
        // Add rate limit headers
        const response = await handler(...args);
        response.headers.set('X-RateLimit-Limit', limit.toString());
        response.headers.set('X-RateLimit-Remaining', (limit - 1).toString());
        response.headers.set('X-RateLimit-Reset', (now + windowInSeconds).toString());
        
        return response;
      }
      
      // If the rate limit has been exceeded
      if (rateLimitData.count >= limit) {
        const resetInSeconds = rateLimitData.expires - now;
        return onRateLimitExceeded(req, resetInSeconds);
      }
      
      // Increment the count
      await kv.set(key, { 
        count: rateLimitData.count + 1, 
        expires: rateLimitData.expires 
      });
      
      // Add rate limit headers
      const response = await handler(...args);
      response.headers.set('X-RateLimit-Limit', limit.toString());
      response.headers.set('X-RateLimit-Remaining', (limit - rateLimitData.count - 1).toString());
      response.headers.set('X-RateLimit-Reset', rateLimitData.expires.toString());
      
      return response;
    } catch (error) {
      console.error('Rate limiting error:', error);
      
      // If there's an error with rate limiting, allow the request to proceed
      // This is a fail-open approach, which is better than blocking legitimate users
      return handler(...args);
    }
  };

  // Return the rate-limited handler with the same type as the original handler
  return rateLimitedHandler as T;
}

/**
 * Check if a request exceeds the rate limit without applying it
 * Useful for checking rate limits in middleware or custom handlers
 * 
 * @param req The Next.js request object
 * @param options Rate limiting options
 * @returns Rate limit information
 */
export async function checkRateLimit(
  req: NextRequest,
  options: RateLimitOptions = {}
): Promise<RateLimitInfo> {
  // Default options
  const {
    limit = 60,
    windowInSeconds = 60,
    identifierFn = (req: NextRequest) => req.ip || req.headers.get('x-forwarded-for') || 'unknown',
  } = options;

  // Get the identifier for this request
  const identifier = identifierFn(req);
  
  // Create a unique key for this rate limit
  const key = `ratelimit:${identifier}`;
  
  try {
    // Get the current count and expiration time from Redis
    const rateLimitData = await kv.get(key) as { count: number, expires: number } | null;
    const now = Math.floor(Date.now() / 1000);
    
    // If no data exists or it has expired
    if (!rateLimitData || rateLimitData.expires <= now) {
      return {
        exceeded: false,
        remaining: limit,
        limit,
        resetInSeconds: windowInSeconds
      };
    }
    
    // Calculate remaining requests and reset time
    const remaining = Math.max(0, limit - rateLimitData.count);
    const resetInSeconds = Math.max(0, rateLimitData.expires - now);
    
    return {
      exceeded: rateLimitData.count >= limit,
      remaining,
      limit,
      resetInSeconds
    };
  } catch (error) {
    console.error('Rate limit check error:', error);
    
    // If there's an error checking the rate limit, assume it's not exceeded
    return {
      exceeded: false,
      remaining: limit,
      limit,
      resetInSeconds: windowInSeconds
    };
  }
}
