/**
 * Utilities for search functionality
 */
import { redis } from '../redis-client';
import { searchKeys } from '../tenant';

/**
 * Calculate search score based on term matches
 * @param listingId Listing ID
 * @param terms Search terms
 * @param siteId Site ID
 * @returns Search score
 */
export async function calculateSearchScore(
  listingId: string,
  terms: string[],
  siteId: string
): Promise<number> {
  let score = 0;
  
  // Get listing data
  const indexKey = searchKeys.listingIndex(siteId);
  const listingData = await redis.hget(indexKey, listingId);
  
  if (!listingData) {
    return 0;
  }
  
  const listingInfo = JSON.parse(listingData);
  
  // Score multipliers
  const TITLE_MATCH = 10;
  const DESCRIPTION_MATCH = 5;
  const CONTENT_MATCH = 2;
  const EXACT_MATCH_BONUS = 5;
  
  for (const term of terms) {
    // Check title matches (highest priority)
    if (listingInfo.title.includes(term)) {
      score += TITLE_MATCH;
      
      // Exact title match bonus
      if (listingInfo.title === term) {
        score += EXACT_MATCH_BONUS;
      }
    }
    
    // Check description matches
    if (listingInfo.description.includes(term)) {
      score += DESCRIPTION_MATCH;
    }
    
    // Check content matches
    if (listingInfo.content.includes(term)) {
      score += CONTENT_MATCH;
    }
  }
  
  // Add recency bonus (newer items score higher)
  const DAY_IN_MS = 86400000;
  const now = Date.now();
  const ageInDays = (now - listingInfo.createdAt) / DAY_IN_MS;
  const recencyBonus = Math.max(0, 5 - Math.floor(ageInDays / 30)); // Bonus for items up to 5 months old
  
  score += recencyBonus;
  
  // Featured items get a bonus
  if (listingInfo.featured) {
    score += 3;
  }
  
  return score;
}

/**
 * Get intersection of multiple sets
 * @param sets Arrays to intersect
 * @returns Intersection of all arrays
 */
export function getIntersection<T>(sets: T[][]): T[] {
  if (sets.length === 0) {
    return [];
  }
  
  if (sets.length === 1) {
    return sets[0];
  }
  
  return sets.reduce((a, b) => a.filter(c => b.includes(c)));
}

/**
 * Get union of multiple sets
 * @param sets Arrays to union
 * @returns Union of all arrays
 */
export function getUnion<T>(sets: T[][]): T[] {
  if (sets.length === 0) {
    return [];
  }
  
  if (sets.length === 1) {
    return sets[0];
  }
  
  const union = new Set<T>();
  for (const set of sets) {
    for (const item of set) {
      union.add(item);
    }
  }
  
  return Array.from(union);
}
