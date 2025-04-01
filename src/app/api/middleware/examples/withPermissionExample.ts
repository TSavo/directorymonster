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
 * 
 * Handles GET requests by validating 'read' permission for the 'category' resource.
 *
 * This function uses the withPermission middleware to ensure the requester is authorized to 
 * access category data. Upon successful permission validation, it extracts the tenant ID from 
 * the request headers and returns a JSON response containing a success message along with the tenant ID.
 *
 * @param req - The incoming HTTP request.
 * @returns A JSON response with a success message and tenant ID.
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
 * 
 * Handles a PUT request to update a specific category.
 *
 * This function uses the withPermission middleware to verify that the user has the 'update' permission for
 * the 'category' resource (specifically for the resource with ID "category-123"). If the permission check passes,
 * it extracts the JSON payload from the request, processes the update, and returns a JSON response confirming
 * the successful update along with the provided data.
 *
 * @param req The incoming NextRequest.
 * @returns A JSON response containing a success message and the update data.
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
 * 
 * Processes a POST request to create a category when the requester has either 'create' or 'update' permission.
 *
 * This function employs the `withAnyPermission` middleware to validate that the user is authorized to access the 'category' resource
 * by checking for either permission. If the permission check passes, it parses the JSON body of the request and returns a JSON
 * response with a success message and the received data.
 *
 * @param req - The incoming HTTP request.
 * @returns A JSON response confirming successful category creation.
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
 * 
 * Deletes a category resource if the user has both 'delete' and 'manage' permissions.
 *
 * This function applies a permission middleware to ensure that the requester is authorized to delete a category.
 * Upon successful validation, it extracts the category ID from the URL path and processes the deletion,
 * returning a JSON response that confirms the successful deletion of the specified category.
 *
 * @returns A JSON response with a success message that includes the deleted category's identifier.
 *
 * @example
 * const response = await DELETE(req);
 * console.log(await response.json());
 * // { message: "Category 123 deleted successfully" }
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
 * 
 * Updates a listing resource by validating 'update' permission and dynamically extracting its ID.
 *
 * This function uses a resource permission middleware to verify that the request has the required permission
 * to update a listing. It automatically extracts the listing's identifier from the URL or request body using the
 * custom parameter name "listingId", processes the JSON payload, and returns a JSON response confirming the update.
 *
 * @param req The incoming Next.js API request.
 * @returns A JSON response with a message confirming that the listing was updated and the processed update data.
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
 * 
 * Handles a settings update request with audited permission checking.
 *
 * This function applies a permission middleware that validates whether the caller has the "update" permission
 * for the settings resource, while also logging the access event. If the permission check succeeds, it processes
 * the request body and returns a JSON response confirming that the settings have been updated.
 *
 * @param req - The incoming HTTP request.
 * @returns A JSON response indicating the successful update of settings along with the processed data.
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
 * 
 * Composes multiple permission middleware functions to retrieve site settings.
 *
 * This function first validates that the request has 'read' permission on the 'site' resource.
 * Upon success, it then verifies that the user also has 'manage' permission on the 'setting' resource.
 * If both permission checks pass, it responds with a JSON object confirming the successful retrieval of site settings.
 *
 * @param req - The incoming NextRequest object.
 * @returns A JSON response containing a success message and the site settings data.
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
 * 
 * Handles user management requests with permission validation and error handling.
 *
 * This function uses a permission middleware to verify that the request has 'manage' permission
 * on the 'user' resource. If the permission check passes, it processes the user management request
 * and returns a JSON response confirming success. If an error occurs during validation or processing,
 * the error is logged and a JSON response with a 500 status code is returned.
 *
 * @param req The incoming NextRequest.
 * @returns A NextResponse containing either a success message or an error response with a 500 status code.
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
