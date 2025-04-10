import { NextRequest, NextResponse } from 'next/server';
import { kv } from '@/lib/redis-client';
import { SiteConfig } from '@/types';
import { withRedis } from '@/middleware/withRedis';

/**
 * GET handler for retrieving information about a specific site
 * 
 * @param request The incoming request
 * @param params The route parameters containing the site slug
 * @returns A NextResponse with the site information or an error
 */
export const GET = withRedis(async (request: NextRequest, { params }: { params: { siteSlug: string } }) => {
  try {
    const { siteSlug } = params;

    // Determine if we're in test mode
    const isTestMode = process.env.NODE_ENV === 'test';
    const keyPrefix = isTestMode ? 'test:' : '';

    // Get site by slug
    let site = await kv.get<SiteConfig>(`${keyPrefix}site:slug:${siteSlug}`);

    // Parse the site if it's a string (sometimes Redis returns JSON strings)
    if (site && typeof site === 'string') {
      try {
        site = JSON.parse(site);
      } catch (e) {
        console.error('Error parsing site JSON:', e);
      }
    }

    if (!site) {
      return NextResponse.json(
        { error: 'Site not found' },
        { status: 404 }
      );
    }

    // Get all sites for comparison (useful for navigation)
    let sites = [];
    try {
      const siteKeys = await kv.keys(`${keyPrefix}site:slug:*`);
      sites = await Promise.all(
        siteKeys.map(async (key) => await kv.get<SiteConfig>(key))
      );
    } catch (error) {
      console.error(`Error fetching available sites: ${error}`);
      sites = [];
    }

    // Return site information
    return NextResponse.json({
      site: {
        id: site.id,
        name: site.name,
        slug: site.slug,
        domain: site.domain,
        settings: site.settings || {},
        createdAt: site.createdAt,
        updatedAt: site.updatedAt
      },
      availableSites: sites.map(s => ({
        id: s?.id,
        name: s?.name,
        slug: s?.slug,
        domain: s?.domain,
      })),
    });
  } catch (error) {
    console.error(`Error in site info API: ${error}`);
    
    return NextResponse.json(
      { error: 'Failed to fetch site information' },
      { status: 500 }
    );
  }
});
