import { NextRequest, NextResponse } from 'next/server';
import { kv, redis } from '@/lib/redis-client';
import { SiteConfig } from '@/types';
import { withRedis } from '@/middleware/withRedis';

export const GET = withRedis(async (request: NextRequest) => {
  // TODO: Add authentication
  
  const sites = await kv.keys('site:slug:*');
  const siteData = await Promise.all(
    sites.map(async (key) => await kv.get<SiteConfig>(key))
  );
  
  return NextResponse.json(siteData);
});

export const POST = withRedis(async (request: NextRequest) => {
  // TODO: Add authentication
  
  try {
    const data = await request.json();
    
    // Validate required fields
    if (!data.name || !data.slug || !data.primaryKeyword || !data.metaDescription || !data.headerText) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }
    
    // Check if site slug already exists
    const existingSite = await kv.get(`site:slug:${data.slug}`);
    if (existingSite) {
      return NextResponse.json(
        { error: 'Site slug already exists' },
        { status: 409 }
      );
    }
    
    // Create new site
    const timestamp = Date.now();
    const site: SiteConfig = {
      id: `site_${timestamp}`,
      name: data.name,
      slug: data.slug,
      domain: data.domain,
      primaryKeyword: data.primaryKeyword,
      metaDescription: data.metaDescription,
      logoUrl: data.logoUrl,
      headerText: data.headerText,
      defaultLinkAttributes: data.defaultLinkAttributes || 'dofollow',
      createdAt: timestamp,
      updatedAt: timestamp,
    };
    
    // Use a Redis transaction for atomicity
    const multi = redis.multi();
    
    multi.set(`site:id:${site.id}`, JSON.stringify(site));
    multi.set(`site:slug:${site.slug}`, JSON.stringify(site));
    
    if (site.domain) {
      multi.set(`site:domain:${site.domain}`, JSON.stringify(site));
    }
    
    // Execute all commands as a transaction
    await multi.exec();
    
    return NextResponse.json(site, { status: 201 });
  } catch (error) {
    console.error('Error creating site:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
});