import { NextRequest, NextResponse } from 'next/server';
import { kv } from '@/lib/redis-client';
import { getSiteByHostname } from '@/lib/site-utils';
import { SiteConfig } from '@/types';

export async function GET(request: NextRequest) {
    // Get the host from the request headers
    const host = request.headers.get('host') || 'localhost:3001';
    
    // Get hostname from query parameter for testing
    const { searchParams } = new URL(request.url);
    const hostnameParam = searchParams.get('hostname');
    
    // Use the query parameter if provided, otherwise use the host header
    const hostname = hostnameParam || host;
    
    console.log(`DEBUG: site-info API - Hostname: ${hostname}`);
    
    // Try to get site by hostname
    let site = await getSiteByHostname(hostname);
    
    // Debugging: Log all sites
    const siteKeys = await kv.keys('site:slug:*');
    const sites = await Promise.all(
        siteKeys.map(async (key) => await kv.get<SiteConfig>(key))
    );
    
    console.log(`DEBUG: Available sites:`, sites.map(s => ({ name: s?.name, slug: s?.slug, domain: s?.domain })));
    
    // If no site is found, use the first site
    if (!site && sites.length > 0) {
        site = sites[0];
        console.log(`DEBUG: Falling back to first site: ${site?.name}`);
    }
    
    // Keys used for site lookup
    const lookupKeys = {
        domainKey: `site:domain:${hostname}`,
        slugKey: `site:slug:${hostname}`,
    };
    
    // Subdomain check info
    const subdomainMatch = hostname.match(/^([^.]+)\.(?:mydirectory\.com)$/);
    const subdomainInfo = subdomainMatch ? {
        match: true,
        slug: subdomainMatch[1],
        lookupKey: `site:slug:${subdomainMatch[1]}`,
    } : { match: false };
    
    return NextResponse.json({
        requestedHostname: hostname,
        originalHost: host,
        hostnameParam,
        site: site ? {
            id: site.id,
            name: site.name,
            slug: site.slug,
            domain: site.domain,
        } : null,
        lookupInfo: {
            keys: lookupKeys,
            subdomain: subdomainInfo,
        },
        availableSites: sites.map(s => ({
            name: s?.name,
            slug: s?.slug,
            domain: s?.domain,
        })),
    });
}