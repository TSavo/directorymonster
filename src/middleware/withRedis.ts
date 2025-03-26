import { NextResponse } from 'next/server';
import { redis } from '@/lib/redis-client';

// Higher-order function to wrap API handlers with Redis error handling
export function withRedis(handler: Function) {
  return async (req: Request, ...args: any[]) => {
    try {
      // Verify Redis connection is healthy
      await redis.ping();
      
      // If Redis is connected, proceed with the handler
      return await handler(req, ...args);
    } catch (error) {
      console.error('Redis connection error:', error);
      
      // Return a 503 Service Unavailable response
      return NextResponse.json(
        {
          error: 'Database connection error',
          message: 'The service is temporarily unavailable. Please try again later.',
        },
        {
          status: 503,
          headers: {
            'Retry-After': '30',
            'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
          },
        }
      );
    }
  };
}