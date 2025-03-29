// Redis healthcheck endpoint
import { NextResponse } from 'next/server';
import { checkRedisConnection } from '@/lib/redis-health';

/**
 * GET /api/healthcheck/redis
 * 
 * Checks Redis connection health and returns status
 */
export async function GET() {
  try {
    const health = await checkRedisConnection();
    
    // If Redis is healthy, return 200 OK
    if (health.status === 'ok') {
      return NextResponse.json(health, { status: 200 });
    }
    
    // If Redis is unhealthy, return 503 Service Unavailable
    // But mention fallback is available
    return NextResponse.json({
      ...health,
      fallbackAvailable: true,
      fallbackMessage: 'Using in-memory Redis fallback'
    }, { status: 503 });
  } catch (error) {
    console.error('Redis health check failed:', error);
    
    return NextResponse.json({
      status: 'error',
      message: error instanceof Error ? error.message : 'Unknown Redis health check error',
      timestamp: Date.now(),
      fallbackAvailable: true
    }, { status: 500 });
  }
}