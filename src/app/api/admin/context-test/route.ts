import { NextRequest, NextResponse } from 'next/server';
import { withSecureTenantPermission } from '@/app/api/middleware/secureTenantContext';
import { ResourceType, Permission } from '@/lib/role/types';

/**
 * API route to test tenant and site context
 *
 * This route returns the tenant and site context extracted from the request.
 * It requires a tenant ID but site ID is optional.
 */
export async function GET(req: NextRequest): Promise<NextResponse> {
  return withSecureTenantPermission(
    req,
    'setting' as ResourceType,
    'read' as Permission,
    async (validatedReq, context) => {
      // Return the context
      return NextResponse.json({
        tenantId: context.tenantId,
        siteId: context.siteId,
        userId: context.userId,
        message: 'Context successfully extracted'
      });
    }
  );
}

/**
 * API route that requires both tenant and site context
 */
export async function POST(req: NextRequest): Promise<NextResponse> {
  return withSecureTenantPermission(
    req,
    'setting' as ResourceType,
    'read' as Permission,
    async (validatedReq, context) => {
      // Ensure site ID is provided
      if (!context.siteId) {
        return NextResponse.json(
          { error: 'Site ID is required' },
          { status: 400 }
        );
      }

      // Return the context
      return NextResponse.json({
        tenantId: context.tenantId,
        siteId: context.siteId,
        userId: context.userId,
        message: 'Context successfully extracted with site required'
      });
    }
  );
}
