/**
 * Example usage of the withPermission middleware
 * This file demonstrates how to use the permission middleware in API routes
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  withPermission,
  withAnyPermission,
  withAllPermissions,
  withResourcePermission,
  withAuditedPermission
} from '@/app/api/middleware';

/**
 * Example 1: Basic permission checking for route handler
 * Check if user has 'read' permission for 'category' resource
 */
export async function GET(req: NextRequest) {
  return withPermission(
    req, 
    'category',
    'read',
    async (validatedReq) => {
      // This code only runs if user has 'read' permission for 'category'
      const tenantId = validatedReq.headers.get('x-tenant-id');
      
      // Process the request...
      return NextResponse.json({
        message: 'Successfully retrieved categories',
        tenantId
      });
    }
  );
}

/**
 * Example 2: Checking permission for a specific resource
 * Check if user has 'update' permission for a specific category
 */
export async function PUT(req: NextRequest) {
  return withPermission(
    req,
    'category',
    'update',
    async (validatedReq) => {
      // This code only runs if user has 'update' permission for this specific category
      const body = await validatedReq.json();
      
      // Process the update...
      return NextResponse.json({
        message: 'Category updated successfully',
        data: body
      });
    },
    'category-123' // Specific resource ID
  );
}

/**
 * Example 3: Checking for any of multiple permissions
 * Allows access if user has either 'create' or 'update' permission for 'category'
 */
export async function POST(req: NextRequest) {
  return withAnyPermission(
    req,
    'category',
    ['create', 'update'],
    async (validatedReq) => {
      // This code runs if user has either 'create' or 'update' permission
      const body = await validatedReq.json();
      
      // Process the request...
      return NextResponse.json({
        message: 'Category created successfully',
        data: body
      });
    }
  );
}

/**
 * Example 4: Checking for multiple required permissions
 * Requires user to have both 'delete' and 'manage' permissions for 'category'
 */
export async function DELETE(req: NextRequest) {
  return withAllPermissions(
    req,
    'category',
    ['delete', 'manage'],
    async (validatedReq) => {
      // This code only runs if user has both 'delete' and 'manage' permissions
      const url = new URL(req.url);
      const categoryId = url.pathname.split('/').pop();
      
      // Process the deletion...
      return NextResponse.json({
        message: `Category ${categoryId} deleted successfully`
      });
    }
  );
}

/**
 * Example 5: Dynamic resource ID extraction
 * Extracts the resource ID from the URL or request body
 */
export async function handleDynamicResource(req: NextRequest) {
  return withResourcePermission(
    req,
    'listing',
    'update',
    async (validatedReq) => {
      // Resource ID is automatically extracted from URL or request body
      const body = await validatedReq.json();
      
      // Process the update...
      return NextResponse.json({
        message: 'Listing updated successfully',
        data: body
      });
    },
    'listingId' // Custom parameter name (default is 'id')
  );
}

/**
 * Example 6: Audited permission check with logging
 * Same as regular permission check but also logs access events
 */
export async function handleAuditedAccess(req: NextRequest) {
  return withAuditedPermission(
    req,
    'setting',
    'update',
    async (validatedReq) => {
      // Permission is granted and access is audited
      const body = await validatedReq.json();
      
      // Process the settings update...
      return NextResponse.json({
        message: 'Settings updated successfully',
        data: body
      });
    }
  );
}

/**
 * Example 7: Combining with other middleware
 * Shows how to compose middleware functions
 */
export async function handleComposedMiddleware(req: NextRequest) {
  // First check if user can access this tenant
  return withPermission(
    req,
    'site',
    'read',
    async (validatedReq) => {
      // Then check if user can manage site settings
      return withPermission(
        validatedReq,
        'setting',
        'manage',
        async (fullyValidatedReq) => {
          // User has both permissions, process the request
          return NextResponse.json({
            message: 'Site settings retrieved successfully',
            data: { /* site settings */ }
          });
        }
      );
    }
  );
}

/**
 * Example 8: Error handling with permission middleware
 * Shows how to handle permission errors gracefully
 */
export async function handleWithErrorHandling(req: NextRequest) {
  try {
    return await withPermission(
      req,
      'user',
      'manage',
      async (validatedReq) => {
        // Process the user management request
        return NextResponse.json({
          message: 'User management successful'
        });
      }
    );
  } catch (error) {
    console.error('Error in user management route:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error',
        message: 'An unexpected error occurred processing your request'
      },
      { status: 500 }
    );
  }
}
