/**
 * Concurrency Management for Authentication
 * 
 * This module provides functions to manage concurrent authentication
 * requests using Redis for distributed locking and atomic operations.
 */

import { kv } from '@/lib/redis-client';
import { v4 as uuidv4 } from 'uuid';

// Key prefixes
const LOCK_PREFIX = 'auth:lock:';
const REQUEST_PREFIX = 'auth:request:';

// Configuration
const LOCK_EXPIRY = 10; // 10 seconds
const MAX_CONCURRENT_REQUESTS = 100;

/**
 * Acquire a distributed lock
 * 
 * @param resource The resource to lock
 * @param ttl The time-to-live for the lock in seconds
 * @returns The lock identifier if successful, null otherwise
 */
export async function acquireLock(resource: string, ttl: number = LOCK_EXPIRY): Promise<string | null> {
  try {
    // Generate a unique lock identifier
    const lockId = uuidv4();
    
    // Try to set the lock key with NX (only if it doesn't exist)
    const key = `${LOCK_PREFIX}${resource}`;
    const result = await kv.set(key, lockId, { nx: true, ex: ttl });
    
    // If the result is OK, the lock was acquired
    return result === 'OK' ? lockId : null;
  } catch (error) {
    console.error('Error acquiring lock:', error);
    return null;
  }
}

/**
 * Release a distributed lock
 * 
 * @param resource The resource to unlock
 * @param lockId The lock identifier
 * @returns Whether the lock was released
 */
export async function releaseLock(resource: string, lockId: string): Promise<boolean> {
  try {
    // Get the key for this lock
    const key = `${LOCK_PREFIX}${resource}`;
    
    // Get the current lock value
    const currentLockId = await kv.get(key);
    
    // Only release the lock if it's still held by the same ID
    if (currentLockId === lockId) {
      await kv.del(key);
      return true;
    }
    
    return false;
  } catch (error) {
    console.error('Error releasing lock:', error);
    return false;
  }
}

/**
 * Track a new authentication request
 * 
 * @param username The username for the request
 * @returns Whether the request was successfully tracked
 */
export async function trackAuthRequest(username: string): Promise<boolean> {
  try {
    // Get the key for concurrent requests
    const key = `${REQUEST_PREFIX}concurrent`;
    
    // Get the current count
    const currentCount = await kv.get(key) || 0;
    
    // Check if we're at the limit
    if (currentCount >= MAX_CONCURRENT_REQUESTS) {
      return false;
    }
    
    // Increment the count atomically
    await kv.incr(key);
    
    // Set expiry if this is a new key
    if (currentCount === 0) {
      await kv.expire(key, 60); // 1 minute expiry
    }
    
    // Track this specific user's request
    const userKey = `${REQUEST_PREFIX}${username}`;
    await kv.incr(userKey);
    await kv.expire(userKey, 60); // 1 minute expiry
    
    return true;
  } catch (error) {
    console.error('Error tracking auth request:', error);
    return true; // Fail open
  }
}

/**
 * Complete an authentication request
 * 
 * @param username The username for the request
 */
export async function completeAuthRequest(username: string): Promise<void> {
  try {
    // Get the key for concurrent requests
    const key = `${REQUEST_PREFIX}concurrent`;
    
    // Decrement the count atomically
    await kv.decr(key);
    
    // Decrement this specific user's request count
    const userKey = `${REQUEST_PREFIX}${username}`;
    await kv.decr(userKey);
  } catch (error) {
    console.error('Error completing auth request:', error);
  }
}

/**
 * Get the number of concurrent requests for a user
 * 
 * @param username The username to check
 * @returns The number of concurrent requests
 */
export async function getUserConcurrentRequests(username: string): Promise<number> {
  try {
    // Get the key for this user
    const userKey = `${REQUEST_PREFIX}${username}`;
    
    // Get the current count
    return await kv.get(userKey) || 0;
  } catch (error) {
    console.error('Error getting user concurrent requests:', error);
    return 0;
  }
}

/**
 * Get the total number of concurrent authentication requests
 * 
 * @returns The number of concurrent requests
 */
export async function getTotalConcurrentRequests(): Promise<number> {
  try {
    // Get the key for concurrent requests
    const key = `${REQUEST_PREFIX}concurrent`;
    
    // Get the current count
    return await kv.get(key) || 0;
  } catch (error) {
    console.error('Error getting total concurrent requests:', error);
    return 0;
  }
}
