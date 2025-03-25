import { redis } from './redis-client';

export async function checkRedisConnection(): Promise<{
  status: 'ok' | 'error';
  message?: string;
  timestamp: number;
}> {
  try {
    // Try to ping Redis server
    const pong = await redis.ping();
    
    if (pong === 'PONG') {
      return {
        status: 'ok',
        message: 'Redis connection is healthy',
        timestamp: Date.now(),
      };
    } else {
      return {
        status: 'error',
        message: 'Redis returned unexpected response',
        timestamp: Date.now(),
      };
    }
  } catch (error) {
    return {
      status: 'error',
      message: error instanceof Error ? error.message : 'Unknown Redis connection error',
      timestamp: Date.now(),
    };
  }
}