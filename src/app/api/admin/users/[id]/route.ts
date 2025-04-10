import { NextResponse, NextRequest } from 'next/server';
import { getUserFromSession } from '@/lib/auth';
import { db } from '@/lib/db';
import { hashPassword } from '@/lib/crypto';
import { withSecureTenantPermission } from '@/app/api/middleware/secureTenantContext';
import { ResourceType, Permission } from '@/lib/role/types';

interface RouteParams {
  params: {
    id: string;
  };
}

// GET specific user
export async function GET(request: NextRequest, { params }: RouteParams) {
  return withSecureTenantPermission(
    request,
    'user' as ResourceType,
    'read' as Permission,
    async (validatedReq, context) => {
      try {
        const { id } = params;

        // Get current user from session
        const currentUser = await getUserFromSession();

        if (!currentUser) {
          return NextResponse.json(
            { error: 'Authentication required' },
            { status: 401 }
          );
        }

        // Find the requested user
        const user = await db.user.findUnique({
          where: { id }
        });

        if (!user) {
          return NextResponse.json(
            { error: 'User not found' },
            { status: 404 }
          );
        }

        // Remove password from response
        const { password, ...userWithoutPassword } = user;

        return NextResponse.json({ user: userWithoutPassword });
      } catch (error) {
        console.error('Error fetching user:', error);
        return NextResponse.json(
          { error: 'Failed to fetch user' },
          { status: 500 }
        );
      }
    },
    params.id // Pass the resource ID for specific permission check
  );
}

// PATCH update user
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  return withSecureTenantPermission(
    request,
    'user' as ResourceType,
    'update' as Permission,
    async (validatedReq, context) => {
      try {
        const { id } = params;

        // Get current user from session
        const currentUser = await getUserFromSession();

        if (!currentUser) {
          return NextResponse.json(
            { error: 'Authentication required' },
            { status: 401 }
          );
        }

        // Find the user to update
        const existingUser = await db.user.findUnique({
          where: { id }
        });

        if (!existingUser) {
          return NextResponse.json(
            { error: 'User not found' },
            { status: 404 }
          );
        }

        // Get update data
        const updateData = await validatedReq.json();
        const { name, email, password, siteIds, acl } = updateData;

        // Prepare update object
        const data: any = {};

        if (name !== undefined) data.name = name;
        if (email !== undefined) data.email = email;
        if (siteIds !== undefined) data.siteIds = siteIds;
        if (acl !== undefined) data.acl = acl;

        // Handle password update
        if (password) {
          data.password = await hashPassword(password);
        }

        // Update user
        const updatedUser = await db.user.update({
          where: { id },
          data
        });

        // Remove password from response
        const { password: _, ...userWithoutPassword } = updatedUser;

        return NextResponse.json({ user: userWithoutPassword });
      } catch (error) {
        console.error('Error updating user:', error);
        return NextResponse.json(
          { error: 'Failed to update user' },
          { status: 500 }
        );
      }
    },
    params.id // Pass the resource ID for specific permission check
  );
}

// DELETE user
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  return withSecureTenantPermission(
    request,
    'user' as ResourceType,
    'delete' as Permission,
    async (validatedReq, context) => {
      try {
        const { id } = params;

        // Get current user from session
        const currentUser = await getUserFromSession();

        if (!currentUser) {
          return NextResponse.json(
            { error: 'Authentication required' },
            { status: 401 }
          );
        }

        // Find the user to delete
        const userToDelete = await db.user.findUnique({
          where: { id }
        });

        if (!userToDelete) {
          return NextResponse.json(
            { error: 'User not found' },
            { status: 404 }
          );
        }

        // Don't allow deleting yourself
        if (id === currentUser.id) {
          return NextResponse.json(
            { error: 'Cannot delete your own account' },
            { status: 400 }
          );
        }

        // Delete user
        await db.user.delete({
          where: { id }
        });

        return NextResponse.json({ success: true });
      } catch (error) {
        console.error('Error deleting user:', error);
        return NextResponse.json(
          { error: 'Failed to delete user' },
          { status: 500 }
        );
      }
    },
    params.id // Pass the resource ID for specific permission check
  );
}
