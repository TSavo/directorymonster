import { NextRequest, NextResponse } from 'next/server';
import { withACL } from '@/lib/middleware/withACL';
import { withTenant } from '@/lib/middleware/withTenant';
import { comparePermissions } from '@/lib/role/role-service';

/**
 * POST /api/admin/permissions/compare
 * 
 * Compare permissions between roles or users
 * 
 * @param req - The request object
 * @returns A response with the comparison results
 */
export const POST = withACL(
  withTenant(async (req: NextRequest) => {
    try {
      const tenantId = req.tenant?.id;
      
      if (!tenantId) {
        return NextResponse.json(
          { error: 'Tenant not found' },
          { status: 404 }
        );
      }
      
      const data = await req.json();
      const { type, ids } = data;
      
      if (!type || !Array.isArray(ids) || ids.length < 2) {
        return NextResponse.json(
          { error: 'Invalid request format. Type and at least two IDs are required.' },
          { status: 400 }
        );
      }
      
      // Compare permissions
      const comparisonResults = await comparePermissions(type, ids, tenantId);
      
      return NextResponse.json(comparisonResults);
    } catch (error) {
      console.error('Error comparing permissions:', error);
      return NextResponse.json(
        { error: 'Failed to compare permissions' },
        { status: 500 }
      );
    }
  }),
  { resource: 'role', action: 'read' }
);
