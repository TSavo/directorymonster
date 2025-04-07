import { NextRequest, NextResponse } from 'next/server';
import { withACL } from '@/lib/middleware/withACL';
import { withTenant } from '@/lib/middleware/withTenant';
import { ResourceType, PermissionAction } from '@/types/role';

/**
 * GET /api/admin/permissions/resources
 * 
 * Get available permission resources and actions
 * 
 * @param req - The request object
 * @returns A response with the resources and actions
 */
export const GET = withACL(
  withTenant(async (req: NextRequest) => {
    try {
      // These would typically come from a database or configuration
      const resources: ResourceType[] = [
        'user',
        'role',
        'site',
        'category',
        'listing',
        'content',
        'setting',
        'tenant',
        'audit'
      ];
      
      const actions: PermissionAction[] = [
        'create',
        'read',
        'update',
        'delete',
        'manage'
      ];
      
      return NextResponse.json({ resources, actions });
    } catch (error) {
      console.error('Error fetching permission resources:', error);
      return NextResponse.json(
        { error: 'Failed to fetch permission resources' },
        { status: 500 }
      );
    }
  }),
  { resource: 'role', action: 'read' }
);
