import { NextResponse } from 'next/server';
import { getUserFromSession } from '@/lib/auth';
import { db } from '@/lib/db';
import TenantMembershipService from '@/lib/tenant-membership-service';
import { PublicTenantService } from '@/lib/tenant';

/**
 * GET endpoint for retrieving users who are in the public tenant.
 * 
 * This endpoint:
 * 1. Gets all users in the public tenant
 * 2. Returns their basic information (no sensitive data)
 * 
 * Used by the admin UI to manage users in the public tenant.
 */
export async function GET(request: Request) {
  try {
    // Get current user from session for authorization
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
    
    // Get users from the public tenant
    const userIds = await TenantMembershipService.getTenantUsers(
      PublicTenantService.PUBLIC_TENANT_ID
    );
    
    if (!userIds || userIds.length === 0) {
      return NextResponse.json({ users: [] });
    }
    
    // Get detailed user information from database
    const users = await db.user.findMany({
      where: {
        id: {
          in: userIds
        }
      },
      select: {
        id: true,
        name: true,
        email: true,
        createdAt: true,
        updatedAt: true,
        siteIds: true,
        // Don't include password or other sensitive fields
      }
    });
    
    return NextResponse.json({ users });
  } catch (error) {
    console.error('Error fetching public tenant users:', error);
    return NextResponse.json(
      { error: 'Failed to fetch public tenant users' },
      { status: 500 }
    );
  }
}
