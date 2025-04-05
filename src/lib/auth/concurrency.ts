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
 * Attempts to acquire a distributed lock for a given resource.
 *
 * This function generates a unique identifier and performs an atomic operation in the underlying key-value store
 * (e.g., Redis) to set a lock key with a specified time-to-live (TTL). If the lock is successfully acquired,
 * it returns the unique lock identifier; otherwise, it returns null. Any errors encountered during the process
 * are logged and result in a null return value.
 *
 * @param resource - The identifier of the resource to be locked.
 * @param ttl - The lock's time-to-live in seconds (defaults to {@link LOCK_EXPIRY}).
 * @returns The unique lock identifier if the lock is acquired; otherwise, null.
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
 * Releases a distributed lock for a given resource.
 *
 * This function verifies that the lock for the specified resource is held by the provided lock identifier.
 * If the lock identifier matches the current lock value, it deletes the associated key to release the lock.
 * It returns true if the lock is successfully released; otherwise, it returns false (including cases where
 * the lock is held by a different identifier or an error occurs).
 *
 * @param resource - The identifier of the resource to unlock.
 * @param lockId - The unique identifier used to validate lock ownership.
 * @returns A boolean indicating whether the lock was released.
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
 * Tracks a new authentication request for the provided user.
 *
 * The function increments both a global counter for ongoing authentication requests 
 * and a user-specific counter, both stored in Redis with a 1-minute expiry. If the 
 * global request count has reached the allowed maximum, the function returns false. 
 * In case of an error, it logs the error and fails open by returning true.
 *
 * @param username - The identifier of the user initiating the authentication request.
 * @returns A Promise that resolves to true if the request is tracked (or on error) and false if the global request limit is reached.
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
 * Completes an authentication request by decrementing both the total and per-user concurrent request counts.
 *
 * This function updates the Redis store by atomically decrementing the overall count of concurrent authentication requests
 * as well as the count specific to the provided username. Any errors encountered during these operations are caught and logged.
 *
 * @param username - The username associated with the completed authentication request.
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
 * Retrieves the number of concurrent authentication requests for a specified user.
 *
 * This function builds a user-specific key using a predefined prefix and the provided username,
 * then queries a key-value store for the associated request count. If the key doesn't exist or an error
 * occurs, it returns 0.
 *
 * @param username - The username for which to retrieve the concurrent request count.
 * @returns A promise that resolves to the number of concurrent requests for the user.
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
 * This function queries the key-value store for the counter associated with all
 * active authentication requests. If an error occurs while fetching the count, it
 * logs the error and returns a default value of 0.
 *
 * @returns The total count of concurrent authentication requests, or 0 if unavailable.
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
