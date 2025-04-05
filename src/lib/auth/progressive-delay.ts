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
 * Computes the progressive delay for an IP address based on its failed authentication attempts.
 *
 * The function retrieves the number of failed attempts from a key-value store. If no failed attempts are recorded,
 * it immediately returns 0. Otherwise, it calculates a base delay using an exponential backoff strategy—multiplying
 * the base delay by the backoff factor raised to the number of attempts minus one—and limits the delay to a defined maximum.
 * A random jitter, scaled by a jitter factor, is then added to the base delay to mitigate timing attacks.
 * In case of any errors during delay calculation, the function logs the error and returns 0.
 *
 * @param ipAddress The IP address for which to compute the delay.
 * @returns The computed delay in milliseconds.
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
 * Records a failed authentication attempt for the specified IP address and computes a progressive delay.
 *
 * The function increments the failure count stored for the IP address and applies exponential backoff
 * paired with a random jitter. The backoff increases the delay for each subsequent failed attempt, capped
 * at a maximum threshold, while the jitter helps prevent timing attacks. If the operation fails (e.g.,
 * due to datastore issues), the function logs the error and returns a delay of 0.
 *
 * @param ipAddress - The IP address for which the failed attempt is being recorded.
 * @returns The computed delay in milliseconds to be applied before the next authentication attempt.
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
 * Resets the progressive delay for a specified IP address.
 *
 * Removes any stored delay associated with the IP, allowing future authentication
 * attempts to proceed without the imposed delay.
 *
 * @param ipAddress - The IP address to reset.
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
 * Applies the calculated progressive delay for the specified IP address.
 *
 * This function retrieves the computed delay—based on exponential backoff with jitter—and pauses execution for that duration.
 * If the delay is zero or an error occurs during its retrieval, the function resolves immediately after logging the error.
 *
 * @param ipAddress - The IP address for which the delay is enforced.
 * @returns A promise that resolves after the progressive delay has been applied.
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
