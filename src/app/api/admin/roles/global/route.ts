/**
 * API Route for managing global roles
 *
 * GET    /api/admin/roles/global           - Get all global roles
 * POST   /api/admin/roles/global           - Create a new global role
 */

import { NextRequest, NextResponse } from 'next/server';
import { withSecureTenantPermission } from '@/app/api/middleware/secureTenantContext';
import { ResourceType, Permission } from '@/lib/role/types';
import { RoleService } from '@/lib/role-service';
import { AuditService } from '@/lib/audit/audit-service';

/**
 * GET handler for retrieving all global roles
 *
 * @param req - The incoming Next.js request
 * @returns A JSON response containing the roles or an error message
 */
export async function GET(req: NextRequest): Promise<NextResponse> {
  return withSecureTenantPermission(
    req,
    'role' as ResourceType,
    'read' as Permission,
    async (validatedReq, context) => {
      try {
        const globalRoles = await RoleService.getGlobalRoles();
        return NextResponse.json({ roles: globalRoles });
      } catch (error) {
        console.error('Error getting global roles:', error);
        return NextResponse.json(
          { error: 'Failed to get global roles' },
          { status: 500 }
        );
      }
    }
  );
}

/**
 * POST handler for creating a new global role
 *
 * @param req - The incoming Next.js request
 * @returns A JSON response containing the created role or an error message
 */
export async function POST(req: NextRequest): Promise<NextResponse> {
  return withSecureTenantPermission(
    req,
    'role' as ResourceType,
    'create' as Permission,
    async (validatedReq, context) => {
      try {
        const body = await validatedReq.json();

        // Ensure required fields are present
        if (!body.name || !Array.isArray(body.aclEntries)) {
          return NextResponse.json(
            { error: 'Name and aclEntries are required' },
            { status: 400 }
          );
        }

        // Create the role
        const role = await RoleService.createGlobalRole(body);

        // Log the action
        await AuditService.log({
          action: 'role.create',
          userId: context.userId,
          tenantId: context.tenantId,
          details: {
            roleName: role.name
          }
        });

        return NextResponse.json({ role });
      } catch (error) {
        console.error('Error creating global role:', error);
        return NextResponse.json(
          { error: 'Failed to create global role' },
          { status: 500 }
        );
      }
    }
  );
}
