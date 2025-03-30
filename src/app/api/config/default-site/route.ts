import { NextRequest, NextResponse } from 'next/server';
import { setDefaultSite, getDefaultSiteSlug } from '@/lib/site-utils';

/**
 * GET /api/config/default-site
 * Returns the configured default site slug
 */
export async function GET() {
  try {
    const defaultSiteSlug = await getDefaultSiteSlug();
    
    return NextResponse.json({
      success: true,
      defaultSite: defaultSiteSlug || null
    });
  } catch (error) {
    console.error('Error fetching default site:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch default site' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/config/default-site
 * Sets the default site slug
 * Body: { siteSlug: string }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { siteSlug } = body;
    
    if (!siteSlug) {
      return NextResponse.json(
        { success: false, error: 'Site slug is required' },
        { status: 400 }
      );
    }
    
    const success = await setDefaultSite(siteSlug);
    
    if (success) {
      return NextResponse.json({
        success: true,
        message: `Successfully set default site to "${siteSlug}"`
      });
    } else {
      return NextResponse.json(
        { success: false, error: `Site with slug "${siteSlug}" not found` },
        { status: 404 }
      );
    }
  } catch (error) {
    console.error('Error setting default site:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to set default site' },
      { status: 500 }
    );
  }
}
