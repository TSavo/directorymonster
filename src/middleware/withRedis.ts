import { NextResponse } from 'next/server';
import { redis } from '@/lib/redis-client';

// Higher-order function to wrap API handlers with Redis error handling
export function withRedis(handler: Function) {
  return async (req: Request, ...args: any[]) => {
    try {
      // First check if Redis is connected without throwing
      let isConnected = false;
      try {
        await redis.ping();
        isConnected = true;
      } catch (pingError) {
        console.warn('[withRedis] Redis ping failed, using degraded functionality:', pingError.message);
      }

      // If Redis is connected, proceed with the handler normally
      // Otherwise, add a header and proceed anyway, letting the handler
      // use fallback mechanisms if available
      const response = await handler(req, ...args);

      // Add Redis status header to the response if it exists
      if (response?.headers) {
        if (!isConnected) {
          response.headers.set('x-redis-unavailable', 'true');
        }
      }

      return response;
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