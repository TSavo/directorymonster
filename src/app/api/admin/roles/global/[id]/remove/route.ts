import { NextRequest, NextResponse } from 'next/server';
import { withSecureTenantPermission } from '@/app/api/middleware/secureTenantContext';
import { ResourceType, Permission } from '@/lib/role/types';
import { RoleService } from '@/lib/role-service';
import { AuditService } from '@/lib/audit/audit-service';

/**
 * POST handler for removing a global role from a user
 *
 * @param req - The incoming Next.js request
 * @param params - The route parameters containing the role ID
 * @returns A JSON response indicating success or an error message
 */
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
): Promise<NextResponse> {
  return withSecureTenantPermission(
    req,
    'role' as ResourceType,
    'update' as Permission,
    async (validatedReq, context) => {
      try {
        const roleId = params.id;
        const body = await validatedReq.json();

        // Ensure required fields are present
        if (!body.userId || !body.tenantId) {
          return NextResponse.json(
            { error: 'userId and tenantId are required' },
            { status: 400 }
          );
        }

        // Ensure the role exists
        const existingRole = await RoleService.getGlobalRole(roleId);
        if (!existingRole) {
          return NextResponse.json(
            { error: 'Global role not found' },
            { status: 404 }
          );
        }

        // Remove the role from the user
        await RoleService.removeGlobalRoleFromUser(roleId, body.userId, body.tenantId);

        // Log the action
        await AuditService.log({
          action: 'role.remove',
          userId: context.userId,
          tenantId: context.tenantId,
          details: {
            roleId,
            roleName: existingRole.name,
            removedUserId: body.userId,
            removedTenantId: body.tenantId
          }
        });

        return NextResponse.json({ success: true });
      } catch (error) {
        console.error(`Error removing global role ${params.id}:`, error);
        return NextResponse.json(
          { error: 'Failed to remove global role' },
          { status: 500 }
        );
      }
    },
    params.id // Pass the resource ID for specific permission check
  );
}
