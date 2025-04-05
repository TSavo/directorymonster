/**
 * Progressive delay service for authentication security
 * 
 * This module provides functions to implement progressive delays
 * after failed authentication attempts.
 */

import { kv } from '@/lib/redis-client';

// Key prefixes
const DELAY_PREFIX = 'auth:delay:';

// Configuration
const BASE_DELAY = 1000; // 1 second base delay
const MAX_DELAY = 30000; // 30 seconds maximum delay
const DELAY_EXPIRY = 60 * 60; // 1 hour (in seconds)

/**
 * Calculate the delay for an IP address based on failed attempts
 * 
 * @param ipAddress The IP address to calculate the delay for
 * @returns The delay in milliseconds
 */
export async function getProgressiveDelay(ipAddress: string): Promise<number> {
  try {
    // Get the key for this IP
    const key = `${DELAY_PREFIX}${ipAddress}`;
    
    // Get current failed attempts
    const failedAttempts = await kv.get(key) || 0;
    
    // Calculate delay using exponential backoff: BASE_DELAY * 2^(attempts - 1)
    // For example:
    // 1 attempt: 1000ms (1s)
    // 2 attempts: 2000ms (2s)
    // 3 attempts: 4000ms (4s)
    // 4 attempts: 8000ms (8s)
    // 5 attempts: 16000ms (16s)
    // 6+ attempts: 30000ms (30s) - capped at MAX_DELAY
    const delay = failedAttempts <= 1 
      ? BASE_DELAY 
      : Math.min(BASE_DELAY * Math.pow(2, failedAttempts - 1), MAX_DELAY);
    
    return delay;
  } catch (error) {
    console.error('Error calculating progressive delay:', error);
    return 0;
  }
}

/**
 * Record a failed attempt for delay calculation
 * 
 * @param ipAddress The IP address to record the failed attempt for
 * @returns The new delay in milliseconds
 */
export async function recordFailedAttemptForDelay(ipAddress: string): Promise<number> {
  try {
    // Get the key for this IP
    const key = `${DELAY_PREFIX}${ipAddress}`;
    
    // Get current failed attempts
    const currentAttempts = await kv.get(key) || 0;
    const newAttempts = currentAttempts + 1;
    
    // Update failed attempts
    await kv.set(key, newAttempts);
    await kv.expire(key, DELAY_EXPIRY);
    
    // Calculate and return the new delay
    return newAttempts <= 1 
      ? BASE_DELAY 
      : Math.min(BASE_DELAY * Math.pow(2, newAttempts - 1), MAX_DELAY);
  } catch (error) {
    console.error('Error recording failed attempt for delay:', error);
    return 0;
  }
}

/**
 * Reset delay for an IP address
 * 
 * @param ipAddress The IP address to reset
 */
export async function resetDelay(ipAddress: string): Promise<void> {
  try {
    // Get the key for this IP
    const key = `${DELAY_PREFIX}${ipAddress}`;
    
    // Delete the key
    await kv.del(key);
  } catch (error) {
    console.error('Error resetting delay:', error);
  }
}

/**
 * Apply the progressive delay
 * 
 * @param ipAddress The IP address to apply the delay for
 * @returns A promise that resolves after the delay
 */
export async function applyProgressiveDelay(ipAddress: string): Promise<void> {
  try {
    // Get the delay for this IP
    const delay = await getProgressiveDelay(ipAddress);
    
    // If there's a delay, wait
    if (delay > 0) {
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  } catch (error) {
    console.error('Error applying progressive delay:', error);
  }
}
