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
  const domainKey = `site:domain:${normalizedHostname}`;
  console.log(`DEBUG: Looking up domain key: ${domainKey}`);
  let site = await kv.get<SiteConfig>(domainKey);
  console.log(`DEBUG: Direct domain lookup result: ${site?.name || 'null'}`);

  if (site) return site;

  // If running in test/development environment, use the configured default site for localhost
  if (normalizedHostname === 'localhost' || normalizedHostname.includes('localhost')) {
    // First, check if a default site is explicitly configured
    console.log('DEBUG: Looking up configured default site');
    const defaultSiteSlug = await getDefaultSiteSlug();

    if (defaultSiteSlug) {
      console.log(`DEBUG: Found configured default site: ${defaultSiteSlug}`);
      const defaultSite = await kv.get<SiteConfig>(`site:slug:${defaultSiteSlug}`);
      if (defaultSite) {
        console.log(`DEBUG: Using configured default site: ${defaultSite.name}`);
        return defaultSite;
      }
    }

    // If no default site configured or not found, try to use hiking-gear
    console.log('DEBUG: No default site configured, trying hiking-gear');
    const hikingGearSite = await kv.get<SiteConfig>('site:slug:hiking-gear');
    if (hikingGearSite) {
      console.log('DEBUG: Using hiking-gear as default site');
      return hikingGearSite;
    }

    // Last resort - try to get any site from the database
    console.log('DEBUG: Trying to find any site to use as default');
    const siteKeys = await kv.keys('site:slug:*');
    if (siteKeys.length > 0) {
      const firstSiteKey = siteKeys[0];
      const firstSite = await kv.get<SiteConfig>(firstSiteKey);
      if (firstSite) {
        console.log(`DEBUG: Using first available site as default: ${firstSite.name}`);
        return firstSite;
      }
    }

    // Ultimate fallback - return a dummy test site
    console.log('DEBUG: No sites found, using basic test site');
    return {
      id: 'test-site',
      slug: 'test-site',
      name: 'Test Site',
      domain: 'localhost',
      description: 'Default site for testing',
      logoUrl: '/logo.png',
      themeColor: '#4F46E5',
      secondaryColor: '#10B981',
      settings: {
        allowSignups: true,
        enableSearch: true,
      },
      seo: {
        title: 'Test Site',
        description: 'A test site for development and testing',
        keywords: ['test', 'development'],
        noindexPages: []
      },
      owner: 'test-user',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
  }

  // Check for subdomain match (e.g., fishing-gear.mydirectory.com or test-fishing.localhost)
  const subdomainMatch = normalizedHostname.match(/^([^.]+)\.(?:mydirectory\.com|localhost)$/);
  console.log(`DEBUG: Subdomain match result:`, subdomainMatch);

  if (subdomainMatch) {
    const slug = subdomainMatch[1];
    const slugKey = `site:slug:${slug}`;
    console.log(`DEBUG: Looking up site by slug key: "${slugKey}"`);
    site = await kv.get<SiteConfig>(slugKey);
    console.log(`DEBUG: Slug lookup result: ${site?.name || 'null'}`);

    // If not found, try to list all keys to see what's available
    if (!site) {
      console.log('DEBUG: Site not found by slug, listing all site keys:');
      const allKeys = await kv.keys('site:*');
      console.log(`DEBUG: Available site keys: ${JSON.stringify(allKeys)}`);

      // Try to get all sites to see what's available
      const allSites = await Promise.all(allKeys.map(async key => {
        const siteData = await kv.get<SiteConfig>(key);
        return { key, name: siteData?.name, slug: siteData?.slug, domain: siteData?.domain };
      }));
      console.log(`DEBUG: Available sites: ${JSON.stringify(allSites)}`);
    }

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
 * Get the configured default site slug
 */
export async function getDefaultSiteSlug(): Promise<string | null> {
  try {
    // Try to get the default site slug from Redis
    const defaultSiteSlug = await kv.get<string>('config:default-site');
    return defaultSiteSlug;
  } catch (error) {
    console.error('Error getting default site slug:', error);
    return null;
  }
}

/**
 * Set the default site slug
 */
export async function setDefaultSite(siteSlug: string): Promise<boolean> {
  try {
    // Verify the site exists before setting it as default
    const site = await kv.get<SiteConfig>(`site:slug:${siteSlug}`);
    if (!site) {
      console.error(`Site with slug "${siteSlug}" not found`);
      return false;
    }

    // Set the default site slug in Redis
    await kv.set('config:default-site', siteSlug);
    return true;
  } catch (error) {
    console.error('Error setting default site:', error);
    return false;
  }
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