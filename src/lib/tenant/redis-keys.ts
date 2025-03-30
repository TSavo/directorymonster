/**
 * Helper functions for generating consistent Redis keys with proper tenant isolation
 */

/**
 * Generate a Redis key for site-related data
 */
export const siteKeys = {
  /**
   * Key for a site by its ID
   */
  byId: (siteId: string) => `site:id:${siteId}`,
  
  /**
   * Key for a site by its slug
   */
  bySlug: (slug: string) => `site:slug:${slug}`,
  
  /**
   * Key for a site by its domain
   */
  byDomain: (domain: string) => `site:domain:${domain}`,
  
  /**
   * Pattern for all sites
   */
  all: () => 'site:id:*',
};

/**
 * Generate a Redis key for category-related data
 */
export const categoryKeys = {
  /**
   * Key for a category by its ID
   */
  byId: (categoryId: string) => `category:id:${categoryId}`,
  
  /**
   * Key for a category by its site and slug
   */
  bySlug: (siteId: string, slug: string) => `category:site:${siteId}:${slug}`,
  
  /**
   * Pattern for all categories belonging to a site
   */
  allForSite: (siteId: string) => `category:site:${siteId}:*`,
  
  /**
   * Pattern for all categories with a specific parent
   */
  byParent: (parentId: string) => `category:parent:${parentId}:*`,
  
  /**
   * Key for storing child categories of a parent
   */
  childList: (parentId: string) => `category:parent:${parentId}:children`,
};

/**
 * Generate a Redis key for listing-related data
 */
export const listingKeys = {
  /**
   * Key for a listing by its ID
   */
  byId: (listingId: string) => `listing:id:${listingId}`,
  
  /**
   * Key for a listing by its site and slug
   */
  bySlug: (siteId: string, slug: string) => `listing:site:${siteId}:${slug}`,
  
  /**
   * Key for a listing by its category and slug
   */
  byCategoryAndSlug: (categoryId: string, slug: string) => `listing:category:${categoryId}:${slug}`,
  
  /**
   * Pattern for all listings belonging to a site
   */
  allForSite: (siteId: string) => `listing:site:${siteId}:*`,
  
  /**
   * Pattern for all listings belonging to a category
   */
  allForCategory: (categoryId: string) => `listing:category:${categoryId}:*`,
  
  /**
   * Key for storing the list of featured listings
   */
  featured: (siteId: string) => `listing:site:${siteId}:featured`,
};

/**
 * Generate a Redis key for user-related data
 */
export const userKeys = {
  /**
   * Key for a user by its ID
   */
  byId: (userId: string) => `user:id:${userId}`,
  
  /**
   * Key for a user by email
   */
  byEmail: (email: string) => `user:email:${email}`,
  
  /**
   * Pattern for all users
   */
  all: () => 'user:id:*',
  
  /**
   * Key for storing site admin access
   */
  siteAdmin: (userId: string, siteId: string) => `user:${userId}:admin:${siteId}`,
  
  /**
   * Pattern for all sites a user is admin of
   */
  adminSites: (userId: string) => `user:${userId}:admin:*`,
};

/**
 * Generate a Redis key for API key data
 */
export const apiKeyKeys = {
  /**
   * Key for an API key
   */
  byKey: (key: string) => `apikey:${key}`,
  
  /**
   * Pattern for all API keys for a site
   */
  allForSite: (siteId: string) => `apikey:site:${siteId}:*`,
};

/**
 * Generate a Redis key for search index data
 */
export const searchKeys = {
  /**
   * Key for category search index
   */
  categoryIndex: (siteId: string) => `search:site:${siteId}:categories`,
  
  /**
   * Key for listing search index
   */
  listingIndex: (siteId: string) => `search:site:${siteId}:listings`,
};

/**
 * Generate a Redis key for rate limiting
 */
export const rateLimitKeys = {
  /**
   * Key for IP-based rate limiting
   */
  byIp: (ip: string, endpoint: string) => `ratelimit:ip:${ip}:${endpoint}`,
  
  /**
   * Key for user-based rate limiting
   */
  byUser: (userId: string, endpoint: string) => `ratelimit:user:${userId}:${endpoint}`,
};
