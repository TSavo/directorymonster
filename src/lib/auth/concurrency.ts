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
 * Attempts to acquire a distributed lock for a specified resource.
 *
 * Generates a unique lock identifier and sets a Redis key with a given time-to-live (TTL)
 * if the key does not already exist. If successful, the function returns the generated identifier;
 * otherwise, it returns null.
 *
 * @param resource - The resource to lock.
 * @param ttl - The time-to-live for the lock in seconds.
 * @returns The unique lock identifier if the lock is acquired, null otherwise.
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
 * Releases a distributed lock for a specified resource.
 *
 * The lock is released only if the current lock identifier in Redis matches the provided lockId.
 * If the identifiers match, the lock is deleted, and the function returns true; otherwise, it returns false.
 * In case of any errors during the process, the function logs the error and returns false.
 *
 * @param resource - The identifier of the resource whose lock is to be released.
 * @param lockId - The unique lock identifier that must match the current lock value.
 * @returns A boolean indicating whether the lock was successfully released.
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
 * Tracks an authentication request for the specified user.
 *
 * This function atomically increments the global concurrent request count and the user-specific request count.
 * Before incrementing, it verifies that the global count does not exceed the maximum concurrent requests limit.
 * If the limit is reached, it returns false; otherwise, it applies a fixed expiry to both counters.
 * In case of an error, the function logs the error and returns true to fail open.
 *
 * @param username - Identifier of the user initiating the authentication request.
 * @returns A promise that resolves to true if the request is tracked or if the function fails open, or false if the request limit is reached.
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
 * Completes an authentication request.
 *
 * Decrements both the global concurrent request count and the specific user's request count in the key-value store. Any errors encountered during the operation are caught and logged.
 *
 * @param username - The username whose authentication request is being completed.
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
 * Retrieves the current number of concurrent authentication requests for the specified user.
 *
 * This function queries the key-value store with a user-specific key to obtain the count of active requests.
 * If the key is not found or an error occurs during retrieval, it returns 0.
 *
 * @param username - The username whose concurrent request count is queried.
 * @returns The number of concurrent requests for the specified user, or 0 if not found or on error.
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
 * Retrieves the total number of concurrent authentication requests.
 *
 * This function queries the datastore for the current count of active authentication requests.
 * It returns 0 if the count is not set or an error occurs during retrieval.
 *
 * @returns The total count of concurrent authentication requests, or 0 on error.
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
