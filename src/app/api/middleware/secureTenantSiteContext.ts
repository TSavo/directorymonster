import { NextRequest, NextResponse } from 'next/server';
import { AuditService } from '@/lib/audit/audit-service';
import { AuditAction } from '@/lib/audit/types';

/**
 * Middleware to secure tenant and site context by preventing cross-tenant and cross-site access
 *
 * This middleware checks if the request is trying to access resources from a different tenant
 * or site than the one in the current context, and blocks such attempts.
 *
 * @param req The Next.js request
 * @param handler The handler function to execute if the context is secure
 * @returns Response from handler or error response
 */
export async function secureTenantSiteContext(
  req: NextRequest,
  handler: (req: NextRequest) => Promise<NextResponse>
): Promise<NextResponse> {
  try {
    // Extract context from headers
    const tenantId = req.headers.get('x-tenant-id');
    const siteId = req.headers.get('x-site-id');
    const userId = req.headers.get('x-user-id');
    const requestId = req.headers.get('x-request-id') || 'unknown';

    if (!tenantId) {
      return NextResponse.json(
        {
          error: 'Missing tenant context',
          message: 'Tenant context is required for this operation',
          requestId
        },
        { status: 400 }
      );
    }

    // Create context object for easier reference
    const context = {
      tenantId,
      siteId,
      userId: userId || 'anonymous',
      requestId
    };

    // Parse URL to check for tenant or site parameters
    const url = new URL(req.url);

    // Check for tenant ID mismatch in URL
    const tenantIdParam = url.searchParams.get('tenantId');

    if (tenantIdParam && tenantIdParam !== context.tenantId) {
      // Log cross-tenant access attempt
      await AuditService.logCrossTenantAccessAttempt(
        context.userId,
        context.tenantId,
        tenantIdParam,
        {
          requestId: context.requestId,
          method: req.method,
          url: req.url
        }
      );

      return NextResponse.json(
        {
          error: 'Cross-tenant access denied',
          message: 'Cannot access resources from another tenant',
          requestId: context.requestId
        },
        { status: 403 }
      );
    }

    // Check for site ID mismatch in URL
    const siteIdParam = url.searchParams.get('siteId');

    if (siteIdParam && context.siteId && siteIdParam !== context.siteId) {
      // Log cross-site access attempt
      await AuditService.logCrossSiteAccessAttempt(
        context.userId,
        context.tenantId,
        context.siteId,
        siteIdParam,
        {
          requestId: context.requestId,
          method: req.method,
          url: req.url
        }
      );

      return NextResponse.json(
        {
          error: 'Cross-site access denied',
          message: 'Cannot access resources from another site',
          requestId: context.requestId
        },
        { status: 403 }
      );
    }

    // Context is secure, proceed to handler
    return await handler(req);
  } catch (error) {
    console.error('Error in secureTenantSiteContext middleware:', error);
    return NextResponse.json(
      {
        error: 'Internal Server Error',
        message: 'An error occurred while validating tenant and site context'
      },
      { status: 500 }
    );
  }
}
