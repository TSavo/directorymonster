/**
 * Redis connection management with fallback support
 */
import { MemoryRedis } from './memory-store';

// Dynamically import Redis to avoid 'dns' module issues in browser
let Redis: any = null;
let EventEmitter: any = null;

// Only import in server context
if (typeof window === 'undefined') {
  // This import style is compatible with Next.js and doesn't break browser builds
  try {
    const ioredis = require('ioredis');
    Redis = ioredis.Redis;
    EventEmitter = require('events');
    console.log('Successfully loaded ioredis');
  } catch (error) {
    console.warn('[Redis] Failed to load ioredis, using memory implementation:', error);
    // Don't set Redis, which will trigger the fallback later
  }
}

// Redis connection configuration
export const REDIS_URL = process.env.REDIS_URL || 'redis://redis:6379';
export const MAX_RECONNECT_ATTEMPTS = parseInt(process.env.REDIS_MAX_RECONNECT_ATTEMPTS || '20', 10); // Increased from 10 to 20
export const RECONNECT_INTERVAL_MS = parseInt(process.env.REDIS_RECONNECT_INTERVAL_MS || '3000', 10); // Reduced from 5000 to 3000
export const MAX_RECONNECT_INTERVAL_MS = parseInt(process.env.REDIS_MAX_RECONNECT_INTERVAL_MS || '20000', 10); // Reduced from 30000 to 20000
export const REDIS_CONNECT_TIMEOUT = parseInt(process.env.REDIS_CONNECT_TIMEOUT || '15000', 10); // Added explicit connect timeout
export const REDIS_KEEPALIVE_INTERVAL = parseInt(process.env.REDIS_KEEPALIVE_INTERVAL || '30000', 10); // Added keepalive interval
export const USE_MEMORY_FALLBACK = process.env.NODE_ENV === "test" || (process.env.USE_MEMORY_FALLBACK === 'true');

// Connection state enum
export enum ConnectionState {
  DISCONNECTED = 'disconnected',
  CONNECTING = 'connecting',
  CONNECTED = 'connected',
  RECONNECTING = 'reconnecting',
  FAILED = 'failed'
}

// Declare globals for state management
declare global {
  var redisClient: any;
  var redisConnectionState: ConnectionState;
  var redisConnectionEvents: any;
  var redisReconnectAttempts: number;
  var redisReconnectTimer: NodeJS.Timeout | null;
  var redisLastReconnectTime: number;
}

// Initialize connection state globals
if (typeof global !== 'undefined') {
  if (!global.redisConnectionState) {
    global.redisConnectionState = ConnectionState.DISCONNECTED;
  }
  
  if (global.redisReconnectAttempts === undefined) {
    global.redisReconnectAttempts = 0;
  }
  
  if (global.redisLastReconnectTime === undefined) {
    global.redisLastReconnectTime = 0;
  }
  
  if (!global.redisConnectionEvents && typeof window === 'undefined' && EventEmitter) {
    global.redisConnectionEvents = new EventEmitter();
  }
}

/**
 * Updates the connection state and emits events
 */
export function updateConnectionState(newState: ConnectionState): void {
  if (typeof global === 'undefined') return;
  
  const previousState = global.redisConnectionState;
  global.redisConnectionState = newState;
  
  // Log state change
  if (previousState !== newState) {
    console.log(`[Redis] Connection state changed: ${previousState} -> ${newState}`);
    
    // Emit events
    if (global.redisConnectionEvents) {
      if (newState === ConnectionState.CONNECTED) {
        global.redisConnectionEvents.emit('connected');
      } else if (newState === ConnectionState.DISCONNECTED) {
        global.redisConnectionEvents.emit('disconnected');
      } else if (newState === ConnectionState.RECONNECTING) {
        global.redisConnectionEvents.emit('reconnecting');
      } else if (newState === ConnectionState.FAILED) {
        global.redisConnectionEvents.emit('failed');
      }
    }
  }
}

/**
 * Rate-limits reconnection attempts to prevent rapid cycling
 */
function shouldThrottleReconnect(): boolean {
  const now = Date.now();
  const timeSinceLastReconnect = now - global.redisLastReconnectTime;
  
  // If we've recently tried to reconnect, throttle new attempts
  // This prevents connection thrashing when there are persistent issues
  if (timeSinceLastReconnect < 2000) {  // 2 seconds minimum between reconnect attempts
    console.log(`[Redis] Throttling reconnection (last attempt ${timeSinceLastReconnect}ms ago)`);
    return true;
  }
  
  global.redisLastReconnectTime = now;
  return false;
}

/**
 * Attempt to reconnect to Redis after connection is lost
 */
export async function attemptReconnect(): Promise<void> {
  if (typeof global === 'undefined') return;
  
  // Prevent reconnection thrashing
  if (shouldThrottleReconnect()) {
    return;
  }
  
  // Clear any existing reconnect timer
  if (global.redisReconnectTimer) {
    clearTimeout(global.redisReconnectTimer);
    global.redisReconnectTimer = null;
  }

  // Exit if we're already connected or have exceeded max attempts
  if (global.redisConnectionState === ConnectionState.CONNECTED) {
    global.redisReconnectAttempts = 0;
    return;
  }
  
  if (global.redisReconnectAttempts >= MAX_RECONNECT_ATTEMPTS) {
    console.log(`[Redis] Max reconnection attempts (${MAX_RECONNECT_ATTEMPTS}) reached, falling back to memory implementation`);
    updateConnectionState(ConnectionState.FAILED);
    
    // Switch to memory implementation
    if (!(global.redisClient instanceof MemoryRedis)) {
      global.redisClient = new MemoryRedis();
      console.log('[Redis] Switched to in-memory implementation after max reconnection attempts');
    }
    return;
  }
  
  // Update state and increment attempts
  updateConnectionState(ConnectionState.RECONNECTING);
  global.redisReconnectAttempts++;
  
  // Calculate backoff interval (exponential with max limit)
  const backoff = Math.min(
    RECONNECT_INTERVAL_MS * Math.pow(1.5, global.redisReconnectAttempts - 1),
    MAX_RECONNECT_INTERVAL_MS
  );
  
  console.log(`[Redis] Reconnection attempt ${global.redisReconnectAttempts}/${MAX_RECONNECT_ATTEMPTS} in ${backoff}ms`);
  
  // Schedule reconnection attempt
  global.redisReconnectTimer = setTimeout(async () => {
    try {
      if (Redis) {
        // Create new Redis client with improved options
        const newClient = new Redis(REDIS_URL, {
          lazyConnect: true,
          connectTimeout: REDIS_CONNECT_TIMEOUT,
          keepAlive: true,
          keepAliveDelay: REDIS_KEEPALIVE_INTERVAL,
          maxRetriesPerRequest: 3,
          enableOfflineQueue: true,
          enableReadyCheck: true,
          reconnectOnError: (err) => {
            // Only reconnect for specific errors that indicate connection issues
            const targetErrors = ['READONLY', 'ETIMEDOUT', 'ECONNREFUSED', 'ECONNRESET'];
            const shouldReconnect = targetErrors.some(e => err.message.includes(e));
            console.log(`[Redis] Error "${err.message}" - Reconnect? ${shouldReconnect}`);
            return shouldReconnect;
          }
        });
        
        // Improve error handling by capturing more details
        newClient.on('error', (err) => {
          console.error('[Redis] Connection error:', err.message, 'Stack:', err.stack);
          if (global.redisConnectionState === ConnectionState.CONNECTED) {
            updateConnectionState(ConnectionState.DISCONNECTED);
            attemptReconnect();
          }
        });
        
        newClient.on('connect', () => {
          console.log('[Redis] Connected successfully');
          updateConnectionState(ConnectionState.CONNECTED);
          global.redisReconnectAttempts = 0;
        });
        
        newClient.on('ready', () => {
          console.log('[Redis] Client ready for commands');
        });
        
        newClient.on('close', () => {
          if (global.redisConnectionState === ConnectionState.CONNECTED) {
            console.log('[Redis] Connection closed unexpectedly');
            updateConnectionState(ConnectionState.DISCONNECTED);
            attemptReconnect();
          }
        });
        
        // Try to connect with timeout
        const connectPromise = newClient.connect();
        const timeoutPromise = new Promise((_, reject) => {
          setTimeout(() => reject(new Error('Connection timeout')), REDIS_CONNECT_TIMEOUT);
        });
        
        await Promise.race([connectPromise, timeoutPromise]);
        
        // Test connection with ping and a short timeout
        const pingPromise = newClient.ping();
        const pingTimeoutPromise = new Promise((_, reject) => {
          setTimeout(() => reject(new Error('Ping timeout')), 5000);
        });
        
        const pong = await Promise.race([pingPromise, pingTimeoutPromise]);
        
        if (pong === 'PONG') {
          console.log('[Redis] Ping successful - connection verified');
          
          // Update global client reference
          global.redisClient = newClient;
          updateConnectionState(ConnectionState.CONNECTED);
          global.redisReconnectAttempts = 0;
          
          // Set up a periodic ping to keep connection alive
          setInterval(async () => {
            try {
              if (global.redisConnectionState === ConnectionState.CONNECTED) {
                await global.redisClient.ping();
              }
            } catch (error) {
              console.error('[Redis] Keepalive ping failed:', error);
            }
          }, REDIS_KEEPALIVE_INTERVAL);
        } else {
          throw new Error(`Unexpected ping response: ${pong}`);
        }
      }
    } catch (error) {
      console.error('[Redis] Reconnection attempt failed:', error.message);
      // Schedule next attempt
      attemptReconnect();
    }
  }, backoff);
}

/**
 * Gets the current Redis connection state
 */
export function getRedisConnectionState(): ConnectionState {
  return global.redisConnectionState;
}

/**
 * Subscribe to Redis connection state changes
 * @param event The event to listen for
 * @param listener The callback function
 */
export function onRedisConnectionStateChange(
  event: 'connected' | 'disconnected' | 'reconnecting' | 'failed', 
  listener: () => void
): void {
  if (global.redisConnectionEvents) {
    global.redisConnectionEvents.on(event, listener);
  }
}

/**
 * Initialize Redis client with automatic fallback
 */
export function createRedisClient(): any {
  if (typeof window !== 'undefined') {
    // In browser context, always use memory implementation
    return new MemoryRedis();
  }
  
  // Check for Edge runtime by looking for missing Node.js features
  const isEdgeRuntime = typeof process === 'undefined' || typeof require === 'undefined' || !Redis;
  if (isEdgeRuntime) {
    console.log('[Redis] Detected Edge runtime, using in-memory implementation');
    const memoryClient = new MemoryRedis();
    updateConnectionState(ConnectionState.CONNECTED);
    return memoryClient;
  }
  
  // Use memory implementation if explicitly configured
  if (USE_MEMORY_FALLBACK) {
    console.log('[Redis] Using in-memory implementation (configured fallback)');
    const memoryClient = new MemoryRedis();
    updateConnectionState(ConnectionState.CONNECTED);
    return memoryClient;
  }
  
  // Try to connect to Redis
  console.log(`[Redis] Connecting to Redis at ${REDIS_URL}`);
  updateConnectionState(ConnectionState.CONNECTING);
  
  try {
    if (Redis) {
      // Create client with improved configuration
      const client = new Redis(REDIS_URL, {
        // Disable Redis' built-in retry to use our custom implementation
        retryStrategy: () => null,
        lazyConnect: false,
        connectTimeout: REDIS_CONNECT_TIMEOUT,
        keepAlive: true,
        keepAliveDelay: REDIS_KEEPALIVE_INTERVAL,
        maxRetriesPerRequest: 3,
        enableOfflineQueue: true,
        enableReadyCheck: true,
        reconnectOnError: (err) => {
          // Only reconnect for specific errors that indicate connection issues
          const targetErrors = ['READONLY', 'ETIMEDOUT', 'ECONNREFUSED', 'ECONNRESET'];
          const shouldReconnect = targetErrors.some(e => err.message.includes(e));
          console.log(`[Redis] Error "${err.message}" - Reconnect? ${shouldReconnect}`);
          return shouldReconnect;
        }
      });
      
      // Setup improved event handlers
      client.on('error', (err) => {
        console.error('[Redis] Connection error:', err.message, 'Stack:', err.stack);
        if (global.redisConnectionState === ConnectionState.CONNECTED) {
          updateConnectionState(ConnectionState.DISCONNECTED);
          attemptReconnect();
        }
      });
      
      client.on('connect', () => {
        console.log('[Redis] Connected successfully');
        updateConnectionState(ConnectionState.CONNECTED);
        global.redisReconnectAttempts = 0;
      });
      
      client.on('ready', () => {
        console.log('[Redis] Client ready for commands');
      });
      
      client.on('close', () => {
        if (global.redisConnectionState === ConnectionState.CONNECTED) {
          console.log('[Redis] Connection closed unexpectedly');
          updateConnectionState(ConnectionState.DISCONNECTED);
          attemptReconnect();
        }
      });
      
      // Set up a periodic ping to keep connection alive
      setInterval(async () => {
        try {
          if (global.redisConnectionState === ConnectionState.CONNECTED && 
              global.redisClient && 
              !(global.redisClient instanceof MemoryRedis)) {
            await global.redisClient.ping();
          }
        } catch (error) {
          console.error('[Redis] Keepalive ping failed:', error);
        }
      }, REDIS_KEEPALIVE_INTERVAL);
      
      return client;
    } else {
      // Fallback to memory Redis if Redis class is not available
      console.log('[Redis] Redis class not available, using memory implementation');
      const memoryClient = new MemoryRedis();
      updateConnectionState(ConnectionState.CONNECTED);
      return memoryClient;
    }
  } catch (error) {
    console.error('[Redis] Connection initialization error:', error.message, 'Stack:', error.stack);
    console.log('[Redis] Falling back to memory implementation due to initialization error');
    const memoryClient = new MemoryRedis();
    updateConnectionState(ConnectionState.FAILED);
    return memoryClient;
  }
}

/**
 * Force a reconnection attempt
 */
export function forceRedisReconnect(): void {
  if (global.redisConnectionState !== ConnectionState.RECONNECTING) {
    updateConnectionState(ConnectionState.DISCONNECTED);
    attemptReconnect();
  }
}

/**
 * Checks if Redis is currently connected
 * Will return true for memory implementation
 */
export async function isRedisConnected(): Promise<boolean> {
  if (!global.redisClient) return false;
  
  try {
    if (global.redisClient instanceof MemoryRedis) {
      return true;
    }
    
    // Perform ping to verify connection with timeout to prevent hanging
    const pingPromise = global.redisClient.ping();
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Ping timeout')), 2000);
    });
    
    const pong = await Promise.race([pingPromise, timeoutPromise]);
    return pong === 'PONG';
  } catch (error) {
    console.error('[Redis] Connection check failed:', error.message);
    
    // On ping failure, trigger reconnection
    if (global.redisConnectionState === ConnectionState.CONNECTED) {
      updateConnectionState(ConnectionState.DISCONNECTED);
      attemptReconnect();
    }
    
    return false;
  }
}
