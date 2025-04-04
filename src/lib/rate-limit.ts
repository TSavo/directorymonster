/**
 * Rate limiting middleware for API routes
 * 
 * This module provides a rate limiting function that can be used to
 * protect API routes from brute force attacks.
 */

import { NextRequest, NextResponse } from 'next/server';
import { kv } from '@/lib/redis-client';

// Rate limit window in seconds
const RATE_LIMIT_WINDOW = 60; // 1 minute

// Default rate limit (requests per window)
const DEFAULT_RATE_LIMIT = 10;

// Rate limit key prefix
const RATE_LIMIT_PREFIX = 'rate-limit:';

/**
 * Rate limiting middleware for API routes
 * 
 * @param req The Next.js request object
 * @param identifier The identifier to rate limit by (e.g., IP address, username)
 * @param limit The maximum number of requests allowed in the window
 * @returns A response if the rate limit is exceeded, null otherwise
 */
export async function rateLimit(
  req: NextRequest,
  identifier: string,
  limit: number = DEFAULT_RATE_LIMIT
): Promise<NextResponse | null> {
  // Create a unique key for this rate limit
  const key = `${RATE_LIMIT_PREFIX}${identifier}`;
  
  try {
    // Get the current count from Redis
    const currentCount = await kv.get(key) || 0;
    
    // If the count exceeds the limit, return a 429 response
    if (currentCount >= limit) {
      return NextResponse.json(
        {
          success: false,
          error: 'Too many requests. Please try again later.'
        },
        { status: 429 }
      );
    }
    
    // Increment the count
    await kv.set(key, currentCount + 1);
    
    // Set the expiration if this is a new key
    if (currentCount === 0) {
      await kv.expire(key, RATE_LIMIT_WINDOW);
    }
    
    // Add rate limit headers to the response
    req.headers.set('X-RateLimit-Limit', limit.toString());
    req.headers.set('X-RateLimit-Remaining', (limit - (currentCount + 1)).toString());
    
    // Rate limit not exceeded
    return null;
  } catch (error) {
    console.error('Rate limiting error:', error);
    
    // If there's an error with rate limiting, allow the request to proceed
    // This is a fail-open approach, which is better than blocking legitimate users
    return null;
  }
}
