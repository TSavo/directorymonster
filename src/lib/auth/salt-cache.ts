/**
 * Client-side salt cache to reduce API calls
 * 
 * This module provides functions to cache and retrieve salts for users,
 * reducing the number of API calls needed during authentication.
 */

// Cache expiration time in milliseconds (30 minutes)
const CACHE_EXPIRATION = 30 * 60 * 1000;

// Salt cache structure
interface SaltCacheEntry {
  salt: string;
  timestamp: number;
}

// In-memory cache (will be cleared on page refresh)
const saltCache: Record<string, SaltCacheEntry> = {};

/**
 * Get a salt from the cache or fetch it from the server
 * 
 * @param username The username to get the salt for
 * @returns The salt for the user
 */
export async function getSalt(username: string): Promise<string> {
  // Check if we have a cached salt that hasn't expired
  const cachedEntry = saltCache[username];
  const now = Date.now();
  
  if (cachedEntry && (now - cachedEntry.timestamp) < CACHE_EXPIRATION) {
    console.log('Using cached salt for', username);
    return cachedEntry.salt;
  }
  
  // Fetch salt from server
  console.log('Fetching salt for', username);
  const response = await fetch(`/api/auth/salt/${encodeURIComponent(username)}`);
  
  if (!response.ok) {
    throw new Error(`Failed to retrieve salt: ${response.statusText}`);
  }
  
  const data = await response.json();
  
  // Cache the salt
  saltCache[username] = {
    salt: data.salt,
    timestamp: now
  };
  
  return data.salt;
}

/**
 * Clear the salt cache for a specific user or all users
 * 
 * @param username Optional username to clear the cache for
 */
export function clearSaltCache(username?: string): void {
  if (username) {
    delete saltCache[username];
  } else {
    // Clear all entries
    Object.keys(saltCache).forEach(key => {
      delete saltCache[key];
    });
  }
}

/**
 * Invalidate expired cache entries
 */
export function invalidateExpiredCache(): void {
  const now = Date.now();
  
  Object.keys(saltCache).forEach(username => {
    const entry = saltCache[username];
    if ((now - entry.timestamp) >= CACHE_EXPIRATION) {
      delete saltCache[username];
    }
  });
}
