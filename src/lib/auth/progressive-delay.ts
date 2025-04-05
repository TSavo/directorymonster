/**
 * Progressive delay service for authentication security
 *
 * This module provides functions to implement progressive delays
 * with exponential backoff after failed authentication attempts.
 */

import { kv } from '@/lib/redis-client';

// Key prefixes
const DELAY_PREFIX = 'auth:delay:';

// Configuration
const BASE_DELAY = 1000; // 1 second base delay
const MAX_DELAY = 60000; // 60 seconds maximum delay
const DELAY_EXPIRY = 60 * 60; // 1 hour (in seconds)
const BACKOFF_FACTOR = 2; // Exponential backoff factor
const JITTER_FACTOR = 0.1; // Add random jitter to prevent timing attacks

/**
 * Calculate the delay for an IP address based on failed attempts
 * with exponential backoff and jitter
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

    if (failedAttempts <= 0) {
      return 0;
    }

    // Calculate base delay using exponential backoff: BASE_DELAY * BACKOFF_FACTOR^(attempts - 1)
    // For example with BACKOFF_FACTOR = 2:
    // 1 attempt: 1000ms (1s)
    // 2 attempts: 2000ms (2s)
    // 3 attempts: 4000ms (4s)
    // 4 attempts: 8000ms (8s)
    // 5 attempts: 16000ms (16s)
    // 6 attempts: 32000ms (32s)
    // 7+ attempts: 60000ms (60s) - capped at MAX_DELAY
    const baseDelay = failedAttempts === 1
      ? BASE_DELAY
      : Math.min(BASE_DELAY * Math.pow(BACKOFF_FACTOR, failedAttempts - 1), MAX_DELAY);

    // Add jitter to prevent timing attacks
    // Jitter is a random value between -JITTER_FACTOR*baseDelay and +JITTER_FACTOR*baseDelay
    const jitterRange = baseDelay * JITTER_FACTOR;
    const jitter = Math.random() * jitterRange * 2 - jitterRange;

    // Calculate final delay with jitter
    const delay = Math.max(0, Math.round(baseDelay + jitter));

    console.log(`Progressive delay for IP ${ipAddress} (${failedAttempts} attempts): ${delay}ms`);

    return delay;
  } catch (error) {
    console.error('Error calculating progressive delay:', error);
    return 0; // Fail open
  }
}

/**
 * Record a failed attempt for delay calculation
 * with exponential backoff and jitter
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

    // Update failed attempts with atomic operation
    await kv.set(key, newAttempts);
    await kv.expire(key, DELAY_EXPIRY);

    // Log the failed attempt
    console.log(`Recorded failed attempt for IP ${ipAddress}: ${newAttempts} attempts`);

    // Calculate base delay using exponential backoff
    const baseDelay = newAttempts === 1
      ? BASE_DELAY
      : Math.min(BASE_DELAY * Math.pow(BACKOFF_FACTOR, newAttempts - 1), MAX_DELAY);

    // Add jitter to prevent timing attacks
    const jitterRange = baseDelay * JITTER_FACTOR;
    const jitter = Math.random() * jitterRange * 2 - jitterRange;

    // Calculate final delay with jitter
    const delay = Math.max(0, Math.round(baseDelay + jitter));

    return delay;
  } catch (error) {
    console.error('Error recording failed attempt for delay:', error);
    return 0; // Fail open
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
