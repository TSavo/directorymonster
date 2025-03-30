import { NextResponse } from 'next/server';
import { getUserFromSession } from '@/lib/auth';
import { db } from '@/lib/db';
import { hashPassword } from '@/lib/crypto';

interface RouteParams {
  params: {
    id: string;
  };
}

// GET specific user
export async function GET(request: Request, { params }: RouteParams) {
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
    
    // Check if current user has permission to view this user
    const canViewUser = currentUser.acl.entries.some(entry => 
      // Global user read permission
      (entry.resource.type === 'user' && 
       entry.permission === 'read' && 
       !entry.resource.siteId) ||
      // Site-specific permission and user belongs to that site
      (entry.resource.type === 'user' && 
       entry.permission === 'read' && 
       entry.resource.siteId && 
       user.siteIds.includes(entry.resource.siteId))
    );
    
    if (!canViewUser) {
      return NextResponse.json(
        { error: 'Permission denied' },
        { status: 403 }
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
}

// PATCH update user
export async function PATCH(request: Request, { params }: RouteParams) {
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
    
    // Check if current user has permission to update this user
    const canUpdateUser = currentUser.acl.entries.some(entry => 
      // Global user update permission
      (entry.resource.type === 'user' && 
       entry.permission === 'update' && 
       !entry.resource.siteId) ||
      // Site-specific permission and user belongs to that site
      (entry.resource.type === 'user' && 
       entry.permission === 'update' && 
       entry.resource.siteId && 
       existingUser.siteIds.includes(entry.resource.siteId))
    );
    
    if (!canUpdateUser) {
      return NextResponse.json(
        { error: 'Permission denied' },
        { status: 403 }
      );
    }
    
    // Get update data
    const updateData = await request.json();
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
}

// DELETE user
export async function DELETE(request: Request, { params }: RouteParams) {
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
    
    // Check if current user has permission to delete this user
    const canDeleteUser = currentUser.acl.entries.some(entry => 
      // Global user delete permission
      (entry.resource.type === 'user' && 
       entry.permission === 'delete' && 
       !entry.resource.siteId) ||
      // Site-specific permission and user belongs to that site
      (entry.resource.type === 'user' && 
       entry.permission === 'delete' && 
       entry.resource.siteId && 
       userToDelete.siteIds.includes(entry.resource.siteId))
    );
    
    if (!canDeleteUser) {
      return NextResponse.json(
        { error: 'Permission denied' },
        { status: 403 }
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
}
