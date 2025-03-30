import { redis, isRedisConnected, getRedisConnectionState } from './redis';

/**
 * Check Redis connection health with detailed status information
 */
export async function checkRedisConnection(): Promise<{
  status: 'ok' | 'error';
  message?: string;
  connectionState: string;
  timestamp: number;
}> {
  try {
    // Get current connection state
    const connectionState = getRedisConnectionState();
    
    // Try to ping Redis server
    const connected = await isRedisConnected();
    
    if (connected) {
      return {
        status: 'ok',
        message: 'Redis connection is healthy',
        connectionState,
        timestamp: Date.now(),
      };
    } else {
      return {
        status: 'error',
        message: 'Redis connection failed',
        connectionState,
        timestamp: Date.now(),
      };
    }
  } catch (error) {
    return {
      status: 'error',
      message: error instanceof Error ? error.message : 'Unknown Redis connection error',
      connectionState: getRedisConnectionState(),
      timestamp: Date.now(),
    };
  }
}