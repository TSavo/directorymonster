import { SiteConfig, SiteIdentity } from '@/types';
import { kv } from '@/lib/redis-client';

/**
 * Get hostname from request headers in server component
 */
export async function getHostname(): Promise<string | null> {
  try {
    // This works on the server side to get the current hostname
    const { headers } = await import('next/headers');
    const headersList = headers();
    const hostHeader = headersList.get('host') || '';
    return hostHeader;
  } catch (error) {
    console.error('Error getting hostname:', error);
    return null;
  }
}

/**
 * Get site configuration based on hostname
 */
export async function getSiteByHostname(hostname: string): Promise<SiteConfig | null> {
  // Normalize hostname by removing port and protocol if present
  const normalizedHostname = hostname
    .replace(/^https?:\/\//, '') // Remove protocol
    .replace(/:\d+$/, '');       // Remove port
  
  console.log(`DEBUG: getSiteByHostname called with: "${hostname}", normalized to: "${normalizedHostname}"`);
  
  // Check for direct domain match
  let site = await kv.get<SiteConfig>(`site:domain:${normalizedHostname}`);
  console.log(`DEBUG: Direct domain lookup result: ${site?.name || 'null'}`);
  
  if (site) return site;
  
  // Check for subdomain match (e.g., fishing-gear.mydirectory.com)
  const subdomainMatch = normalizedHostname.match(/^([^.]+)\.(?:mydirectory\.com)$/);
  console.log(`DEBUG: Subdomain match result:`, subdomainMatch);
  
  if (subdomainMatch) {
    const slug = subdomainMatch[1];
    console.log(`DEBUG: Looking up site by slug: "${slug}"`);
    site = await kv.get<SiteConfig>(`site:slug:${slug}`);
    console.log(`DEBUG: Slug lookup result: ${site?.name || 'null'}`);
    if (site) return site;
  }
  
  // Handle direct slug lookup (useful for testing with ?hostname=slug)
  console.log(`DEBUG: Trying direct slug lookup: "${normalizedHostname}"`);
  site = await kv.get<SiteConfig>(`site:slug:${normalizedHostname}`);
  console.log(`DEBUG: Direct slug lookup result: ${site?.name || 'null'}`);
  if (site) return site;
  
  console.log(`DEBUG: No site found for hostname: "${normalizedHostname}"`);
  return null;
}

/**
 * Generate base URL for a site (without path)
 */
export function generateSiteBaseUrl(site: SiteConfig): string {
  return site.domain ? `https://${site.domain}` : `https://${site.slug}.mydirectory.com`;
}

/**
 * Generate SEO-friendly URL for a category
 */
export function generateCategoryUrl(site: SiteConfig, categorySlug: string): string {
  return `${generateSiteBaseUrl(site)}/${categorySlug}`;
}

/**
 * Generate SEO-friendly URL for a listing
 */
export function generateListingUrl(site: SiteConfig, categorySlug: string, listingSlug: string): string {
  return `${generateSiteBaseUrl(site)}/${categorySlug}/${listingSlug}`;
}

/**
 * Generate relative href path for a category (without domain)
 */
export function generateCategoryHref(categorySlug: string): string {
  return `/${categorySlug}`;
}

/**
 * Generate relative href path for a listing (without domain)
 */
export function generateListingHref(categorySlug: string, listingSlug: string): string {
  return `/${categorySlug}/${listingSlug}`;
}

/**
 * Get the site identity from the request
 */
export async function getSiteIdentity(
  hostname: string,
  isAdminPath: boolean,
  isApiPath: boolean
): Promise<SiteIdentity> {
  // For admin paths, return admin identity
  if (isAdminPath) {
    return {
      siteConfig: null,
      isAdmin: true,
      isApiRequest: false,
    };
  }
  
  // For API paths, check if it's a site-specific API or platform API
  if (isApiPath) {
    const siteApiMatch = hostname.match(/^api\.([^.]+)\.(?:mydirectory\.com)$/);
    if (siteApiMatch) {
      const slug = siteApiMatch[1];
      const siteConfig = await kv.get<SiteConfig>(`site:slug:${slug}`);
      return {
        siteConfig,
        isAdmin: false,
        isApiRequest: true,
      };
    }
    
    return {
      siteConfig: null,
      isAdmin: false,
      isApiRequest: true,
    };
  }
  
  // For regular paths, get site config
  const siteConfig = await getSiteByHostname(hostname);
  return {
    siteConfig,
    isAdmin: false,
    isApiRequest: false,
  };
}