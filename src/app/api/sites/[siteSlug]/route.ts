import { NextRequest, NextResponse } from 'next/server';
import { kv } from '@/lib/redis-client';
import { SiteConfig } from '@/types';
import { withRedis } from '@/middleware/withRedis';

export const GET = withRedis(async (request: NextRequest, { params }: { params: { siteSlug: string } }) => {
  const siteSlug = params.siteSlug;

  // Determine if we're in test mode
  const isTestMode = process.env.NODE_ENV === 'test';
  const keyPrefix = isTestMode ? 'test:' : '';

  // Get site by slug
  console.log(`Looking for site with slug: ${siteSlug} using key: ${keyPrefix}site:slug:${siteSlug}`);
  let site = await kv.get<SiteConfig>(`${keyPrefix}site:slug:${siteSlug}`);

  // Parse the site if it's a string (sometimes Redis returns JSON strings)
  if (site && typeof site === 'string') {
    try {
      site = JSON.parse(site);
    } catch (e) {
      console.error('Error parsing site JSON:', e);
    }
  }

  console.log('Site found:', site);

  if (!site) {
    return NextResponse.json(
      { error: 'Site not found' },
      { status: 404 }
    );
  }

  return NextResponse.json(site);
});
