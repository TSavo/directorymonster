import { NextResponse } from 'next/server';
import { getUserFromSession } from '@/lib/auth';
import { db } from '@/lib/db';
import { createSuperAdminACL, createSiteAdminACL } from '@/components/admin/auth/utils/accessControl';
import { hashPassword } from '@/lib/crypto';
import { PublicTenantService } from '@/lib/tenant';

// GET handler - fetch all users
export async function GET(request: Request) {
  try {
    // Get current user from session
    const currentUser = await getUserFromSession();
    
    if (!currentUser) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }
    
    // Check if user has permission to view users
    if (!currentUser.acl.entries.some(entry => 
      entry.resource.type === 'user' && 
      entry.permission === 'read'
    )) {
      return NextResponse.json(
        { error: 'Permission denied' },
        { status: 403 }
      );
    }
    
    // Filter by site permissions if not a super admin
    const isSuperAdmin = currentUser.acl.entries.some(entry => 
      entry.resource.type === 'user' && 
      entry.permission === 'read' && 
      !entry.resource.siteId
    );
    
    let users;
    
    if (isSuperAdmin) {
      // Super admin can see all users
      users = await db.user.findMany({
        orderBy: { createdAt: 'desc' }
      });
    } else {
      // Regular admin can only see users for their sites
      const siteIds = currentUser.acl.entries
        .filter(entry => 
          entry.resource.type === 'user' && 
          entry.permission === 'read' && 
          entry.resource.siteId
        )
        .map(entry => entry.resource.siteId)
        .filter(Boolean) as string[];
      
      users = await db.user.findMany({
        where: {
          siteIds: {
            hasSome: siteIds
          }
        },
        orderBy: { createdAt: 'desc' }
      });
    }
    
    return NextResponse.json({ users });
  } catch (error) {
    console.error('Error fetching users:', error);
    return NextResponse.json(
      { error: 'Failed to fetch users' },
      { status: 500 }
    );
  }
}

// POST handler - create new user
export async function POST(request: Request) {
  try {
    // Get current user from session
    const currentUser = await getUserFromSession();
    
    if (!currentUser) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }
    
    const { name, email, password, siteIds, isSuperAdmin, isAdmin } = await request.json();
    
    // Validate required fields
    if (!name || !email || !password) {
      return NextResponse.json(
        { error: 'Name, email, and password are required' },
        { status: 400 }
      );
    }
    
    // Check if user already exists
    const existingUser = await db.user.findUnique({
      where: { email }
    });
    
    if (existingUser) {
      return NextResponse.json(
        { error: 'User with this email already exists' },
        { status: 409 }
      );
    }
    
    // Check if current user has permission to create a user for all requested sites
    const hasPermission = siteIds.every((siteId: string) => 
      currentUser.acl.entries.some(entry => 
        entry.resource.type === 'user' && 
        entry.permission === 'create' && 
        (
          !entry.resource.siteId || // Global permission
          entry.resource.siteId === siteId // Site-specific permission
        )
      )
    );
    
    if (!hasPermission) {
      return NextResponse.json(
        { error: 'Permission denied' },
        { status: 403 }
      );
    }
    
    // Create appropriate ACL
    let userAcl;
    
    if (isSuperAdmin) {
      // Check if current user can create super admins
      const canCreateSuperAdmin = currentUser.acl.entries.some(entry => 
        entry.resource.type === 'user' && 
        entry.permission === 'create' && 
        !entry.resource.siteId
      );
      
      if (!canCreateSuperAdmin) {
        return NextResponse.json(
          { error: 'Permission denied - cannot create super admin' },
          { status: 403 }
        );
      }
      
      // Create a temporary user ID to use for ACL creation
      const tempId = 'new-user-' + Date.now();
      userAcl = createSuperAdminACL(tempId);
    } else if (isAdmin) {
      // Check if current user can create site admins
      const canCreateSiteAdmin = siteIds.every((siteId: string) => 
        currentUser.acl.entries.some(entry => 
          entry.resource.type === 'user' && 
          entry.permission === 'create' && 
          (
            !entry.resource.siteId || // Global permission
            entry.resource.siteId === siteId // Site-specific permission
          )
        )
      );
      
      if (!canCreateSiteAdmin) {
        return NextResponse.json(
          { error: 'Permission denied - cannot create site admin' },
          { status: 403 }
        );
      }
      
      // Create a temporary user ID to use for ACL creation
      const tempId = 'new-user-' + Date.now();
      
      // Initialize with empty ACL
      userAcl = { userId: tempId, entries: [] };
      
      // Add site admin permissions for each site
      for (const siteId of siteIds) {
        const siteAdminAcl = createSiteAdminACL(tempId, siteId);
        userAcl.entries = [...userAcl.entries, ...siteAdminAcl.entries];
      }
    } else {
      // Regular user with minimal permissions
      userAcl = {
        userId: 'new-user-' + Date.now(),
        entries: siteIds.flatMap((siteId: string) => [
          {
            resource: { type: 'category', siteId },
            permission: 'read'
          },
          {
            resource: { type: 'listing', siteId },
            permission: 'read'
          }
        ])
      };
    }
    
    // Hash password
    const hashedPassword = await hashPassword(password);
    
    // Create new user
    const user = await db.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        siteIds,
        acl: userAcl,
      }
    });
    
    // Update ACL with correct user ID
    userAcl.userId = user.id;
    
    await db.user.update({
      where: { id: user.id },
      data: { acl: userAcl }
    });
    
    // Add user to public tenant
    try {
      // Ensure public tenant exists and add user to it
      await PublicTenantService.ensurePublicTenant();
      await PublicTenantService.addUserToPublicTenant(user.id);
      console.log(`User ${user.id} added to public tenant`);
    } catch (publicTenantError) {
      // Log error but don't fail the entire user creation process
      console.error('Error adding user to public tenant:', publicTenantError);
    }
    
    // Remove password from response
    const { password: _, ...userWithoutPassword } = user;
    
    return NextResponse.json({ user: userWithoutPassword }, { status: 201 });
  } catch (error) {
    console.error('Error creating user:', error);
    return NextResponse.json(
      { error: 'Failed to create user' },
      { status: 500 }
    );
  }
}
