import { NextRequest, NextResponse } from 'next/server';

/**
 * Middleware to extract and add tenant and site context to requests
 * 
 * This middleware extracts tenant and site context from:
 * 1. Request headers (x-tenant-id, x-site-id)
 * 2. Cookies (currentTenantId, {tenantId}_currentSiteId)
 * 
 * It then adds this context to the request headers for use by API routes.
 * 
 * @param req The Next.js request
 * @param handler The handler function to execute with the enhanced request
 * @returns Response from handler
 */
export async function withTenantSiteContext(
  req: NextRequest,
  handler: (req: NextRequest) => Promise<NextResponse>
): Promise<NextResponse> {
  try {
    // Extract tenant ID from headers or cookies
    let tenantId = req.headers.get('x-tenant-id');
    if (!tenantId) {
      const tenantCookie = req.cookies.get('currentTenantId');
      if (tenantCookie) {
        tenantId = tenantCookie.value;
      }
    }
    
    // Extract site ID from headers or cookies
    let siteId = req.headers.get('x-site-id');
    if (!siteId && tenantId) {
      const siteCookie = req.cookies.get(`${tenantId}_currentSiteId`);
      if (siteCookie) {
        siteId = siteCookie.value;
      }
    }
    
    // Clone the request to create a new headers object
    const newHeaders = new Headers(req.headers);
    
    // Add tenant and site context to the headers
    if (tenantId) {
      newHeaders.set('x-tenant-id', tenantId);
    }
    
    if (siteId) {
      newHeaders.set('x-site-id', siteId);
    }
    
    // Create a new request with the updated headers
    const requestWithContext = new NextRequest(req.url, {
      method: req.method,
      headers: newHeaders,
      body: req.body,
      redirect: req.redirect,
      signal: req.signal
    });
    
    // Proceed to the handler with the enhanced request
    return await handler(requestWithContext);
  } catch (error) {
    console.error('Tenant/site context error:', error);
    return NextResponse.json(
      {
        error: 'Context extraction failed',
        message: 'An error occurred adding tenant and site context'
      },
      { status: 500 }
    );
  }
}
