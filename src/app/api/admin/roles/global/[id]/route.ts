import { NextRequest, NextResponse } from 'next/server';
import { withSecureTenantPermission } from '@/app/api/middleware/secureTenantContext';
import { ResourceType, Permission } from '@/lib/role/types';
import { RoleService } from '@/lib/role-service';
import { AuditService } from '@/lib/audit/audit-service';

/**
 * GET handler for retrieving a specific global role by ID
 *
 * @param req - The incoming Next.js request
 * @param params - The route parameters containing the role ID
 * @returns A JSON response containing the role or an error message
 */
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
): Promise<NextResponse> {
  return withSecureTenantPermission(
    req,
    'role' as ResourceType,
    'read' as Permission,
    async (validatedReq, context) => {
      try {
        const roleId = params.id;

        // Ensure the role exists
        const existingRole = await RoleService.getGlobalRole(roleId);
        if (!existingRole) {
          return NextResponse.json(
            { error: 'Global role not found' },
            { status: 404 }
          );
        }

        return NextResponse.json({ role: existingRole });
      } catch (error) {
        console.error(`Error retrieving global role ${params.id}:`, error);
        return NextResponse.json(
          { error: 'Failed to retrieve global role' },
          { status: 500 }
        );
      }
    },
    params.id // Pass the resource ID for specific permission check
  );
}

/**
 * PATCH handler for updating a global role
 *
 * @param req - The incoming Next.js request
 * @param params - The route parameters containing the role ID
 * @returns A JSON response indicating success or an error message
 */
export async function PATCH(
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

        // Ensure the role exists
        const existingRole = await RoleService.getGlobalRole(roleId);
        if (!existingRole) {
          return NextResponse.json(
            { error: 'Global role not found' },
            { status: 404 }
          );
        }

        // Update the role
        const updatedRole = await RoleService.updateGlobalRole(roleId, body);

        // Log the action
        await AuditService.log({
          action: 'role.update',
          userId: context.userId,
          tenantId: context.tenantId,
          details: {
            roleId,
            roleName: existingRole.name,
            updates: body
          }
        });

        return NextResponse.json({ role: updatedRole });
      } catch (error) {
        console.error(`Error updating global role ${params.id}:`, error);
        return NextResponse.json(
          { error: 'Failed to update global role' },
          { status: 500 }
        );
      }
    },
    params.id // Pass the resource ID for specific permission check
  );
}

/**
 * DELETE handler for removing a global role
 *
 * @param req - The incoming Next.js request
 * @param params - The route parameters containing the role ID
 * @returns A JSON response indicating success or an error message
 */
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
): Promise<NextResponse> {
  return withSecureTenantPermission(
    req,
    'role' as ResourceType,
    'delete' as Permission,
    async (validatedReq, context) => {
      try {
        const roleId = params.id;

        // Ensure the role exists
        const existingRole = await RoleService.getGlobalRole(roleId);
        if (!existingRole) {
          return NextResponse.json(
            { error: 'Global role not found' },
            { status: 404 }
          );
        }

        // Delete the role
        await RoleService.deleteGlobalRole(roleId);

        // Log the action
        await AuditService.log({
          action: 'role.delete',
          userId: context.userId,
          tenantId: context.tenantId,
          details: {
            roleId,
            roleName: existingRole.name
          }
        });

        return NextResponse.json({ success: true });
      } catch (error) {
        console.error(`Error deleting global role ${params.id}:`, error);
        return NextResponse.json(
          { error: 'Failed to delete global role' },
          { status: 500 }
        );
      }
    },
    params.id // Pass the resource ID for specific permission check
  );
}
