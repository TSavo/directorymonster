/**
 * Utility functions for role management
 */

/**
 * Generates a universally unique identifier (UUID) string.
 *
 * This function first attempts to use `crypto.randomUUID` (available in Node.js v14.17.0+ and modern browsers).
 * If that is not available, it falls back to a manual implementation that produces a UUID compliant with version 4.
 *
 * @returns A UUID string.
 */
export function generateUUID(): string {
  // Use crypto.randomUUID if available (Node.js 14.17.0+ and modern browsers)
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  
  // Fallback implementation for testing environments
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

/**
 * Scans and retrieves all Redis keys matching a specified pattern.
 *
 * This asynchronous function repeatedly issues the Redis `SCAN` command using a cursor-based approach until
 * the entire keyspace has been processed. Matching keys from each scan iteration are accumulated into an array,
 * which is returned as a promise.
 *
 * @param pattern - The pattern used to match Redis keys.
 * @returns A promise that resolves to an array of keys matching the pattern.
 */
export async function scanKeys(redisClient: any, pattern: string): Promise<string[]> {
  const keys: string[] = [];
  let cursor = '0';
  
  do {
    // Scan with the current cursor
    const result = await redisClient.scan(cursor, 'MATCH', pattern, 'COUNT', '100');
    cursor = result[0];
    const batch = result[1];
    
    // Add keys to the result
    keys.push(...batch);
    
    // Continue until cursor is 0
  } while (cursor !== '0');
  
  return keys;
}
