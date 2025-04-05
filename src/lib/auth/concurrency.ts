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
 * Releases a distributed lock for the specified resource if the provided lock identifier matches
 * the current lock value.
 *
 * The function retrieves the lock value from the datastore using a generated key based on the resource.
 * If the stored lock identifier matches the provided one, it deletes the key to release the lock.
 * If the lock identifier does not match or an error occurs, the lock is not released and the function
 * returns false.
 *
 * @param resource - The resource key to unlock.
 * @param lockId - The identifier to verify lock ownership.
 * @returns True if the lock was successfully released; otherwise, false.
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
 * Tracks a new authentication request for a given user.
 *
 * This function increments both the global authentication request counter and the individual user's request count, provided
 * the global count is below a predefined limit. It sets a one-minute expiration on the counters when they are first initialized.
 * In case of an error, the function logs the issue and returns true to allow the authentication process to continue (fail open).
 *
 * @param username - The username associated with the authentication request.
 * @returns True if the request is tracked (or on error), or false if the global concurrency limit is reached.
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
 * Completes an authentication request by decrementing both the total and the user-specific concurrent request counts in Redis.
 *
 * This function atomically decrements the counter for total concurrent requests as well as the counter for the
 * specified user's requests. Any errors encountered during the process are caught and logged.
 *
 * @param username - The username associated with the authentication request.
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
 * Retrieves the current number of concurrent authentication requests for a specified user.
 *
 * This function constructs a user-specific key and queries the key-value store to obtain the count of ongoing requests.
 * If no count is found or an error occurs during retrieval, it returns 0.
 *
 * @param username The username for which to retrieve the concurrent request count.
 * @returns The current number of concurrent requests for the user, or 0 if none are registered or an error occurs.
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
 * This function constructs a key using a predefined prefix to query a key-value store for the current
 * total count of concurrent authentication requests. If the key is not set or an error occurs during
 * the retrieval, it returns 0.
 *
 * @returns The total concurrent authentication requests, or 0 if the count is unavailable or an error occurs.
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
