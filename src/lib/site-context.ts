import { NextRequest } from 'next/server';
import { headers } from 'next/headers';
import { kv } from '@/lib/redis-client';
import { SiteConfig } from '@/types';

/**
 * Determines the site slug from various sources without querying the database
 *
 * Priority order:
 * 1. URL path parameter (for site-specific APIs)
 * 2. Request headers (set by middleware)
 * 3. Hostname-based resolution
 * 4. Query parameter (for testing)
 *
 * @param request The Next.js request
 * @param params Optional route parameters that might contain siteSlug
 * @returns The site slug or null if it couldn't be determined
 */
export function getSiteSlug(
  request: NextRequest,
  params?: { siteSlug?: string }
): string | null {
  // 1. Check URL path parameter (for site-specific APIs)
  if (params?.siteSlug) {
    return params.siteSlug;
  }

  // 2. Check request headers (set by middleware)
  const siteSlugHeader = request.headers.get('x-site-slug');
  if (siteSlugHeader) {
    return siteSlugHeader;
  }

  // 3. Check for hostname-based resolution
  const hostname = request.headers.get('host') || '';
  const normalizedHostname = hostname
    .replace(/^https?:\/\//, '') // Remove protocol
    .replace(/:\d+$/, '');       // Remove port

  // 3a. Check for subdomain pattern (e.g., hiking-gear.mydirectory.com)
  const subdomainMatch = normalizedHostname.match(/^([^.]+)\.(?:mydirectory\.com|localhost)$/);
  if (subdomainMatch) {
    return subdomainMatch[1];
  }

  // 4. Check for query parameter (for testing)
  const url = new URL(request.url);
  const siteSlugParam = url.searchParams.get('siteSlug');
  if (siteSlugParam) {
    return siteSlugParam;
  }

  // If we can't determine the site slug, return null
  return null;
}

/**
 * Gets the site configuration based on the site slug
 *
 * This function does query the database, but only after we've determined
 * the site slug through other means.
 *
 * @param siteSlug The site slug
 * @returns The site configuration or null if not found
 */
export async function getSiteBySiteSlug(siteSlug: string): Promise<SiteConfig | null> {
  if (!siteSlug) return null;

  // Determine if we're in test mode
  const isTestMode = process.env.NODE_ENV === 'test';
  const keyPrefix = isTestMode ? 'test:' : '';

  // Query the database for the site configuration
  const site = await kv.get<SiteConfig>(`${keyPrefix}site:slug:${siteSlug}`);
  return site;
}

/**
 * Gets the site configuration from the request context
 *
 * This combines getSiteSlug and getSiteBySiteSlug to provide a complete
 * solution for getting the site configuration from the request context.
 *
 * @param request The Next.js request
 * @param params Optional route parameters that might contain siteSlug
 * @returns The site configuration or null if not found
 */
export async function getSiteFromRequest(
  request: NextRequest,
  params?: { siteSlug?: string }
): Promise<SiteConfig | null> {
  // First, try to get the site slug from the request context
  const siteSlug = getSiteSlug(request, params);
  if (!siteSlug) return null;

  // Then, get the site configuration based on the slug
  return await getSiteBySiteSlug(siteSlug);
}

/**
 * Get the site slug from the request headers in server components
 * This is set by the middleware based on hostname or debug parameters
 *
 * @returns The site slug or null if not found
 */
export function getServerSiteSlug(): string | null {
  try {
    const headersList = headers();
    return headersList.get('x-site-slug');
  } catch (error) {
    console.error('Error getting site slug from headers:', error);
    return null;
  }
}

/**
 * Get the current site configuration from the request context in server components
 * This is the recommended way to get the current site in server components
 *
 * @returns The site configuration or null if not found
 */
export async function getCurrentSite(): Promise<SiteConfig | null> {
  // Get the site slug from the request headers
  const siteSlug = getServerSiteSlug();
  if (!siteSlug) return null;

  // Get the site configuration based on the slug
  return await getSiteBySiteSlug(siteSlug);
}
