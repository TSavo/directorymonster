import { NextRequest, NextResponse } from 'next/server';
import { withSecureTenantPermission } from '@/app/api/middleware/secureTenantContext';
import { ResourceType, Permission } from '@/lib/role/types';
import { kv } from '@/lib/redis-client';

/**
 * Retrieves tenant listings with optional filtering by status and category.
 *
 * This function validates tenant access and the required 'read' permission on listings before fetching all listings
 * associated with the tenant specified in the request's 'x-tenant-id' header. It supports optional query parameters
 * "status" and "categoryId" to filter listings by their status or associated category. On success, it returns a JSON
 * response containing the filtered listings; if an error occurs, it returns a JSON error response with a 500 status.
 *
 * @param req - The incoming request.
 * @returns A response with a JSON object containing the listings data or an error message.
 */
export async function GET(req: NextRequest): Promise<NextResponse> {
  return withSecureTenantPermission(
    req,
    'listing' as ResourceType,
    'read' as Permission,
    async (validatedReq, context) => {
        try {
          // Get tenant context
          const tenantId = validatedReq.headers.get('x-tenant-id') as string;

          // Get query parameters
          const url = new URL(validatedReq.url);
          const status = url.searchParams.get('status');
          const categoryId = url.searchParams.get('categoryId');

          // Get all listing keys for this tenant
          const listingKeys = await kv.keys(`listing:tenant:${tenantId}:*`);

          // Fetch all listings
          const listingsPromises = listingKeys.map(key => kv.get(key));
          const listingsData = await Promise.all(listingsPromises);

          // Filter out null values and apply filters
          let listings = listingsData.filter(listing => listing !== null);

          // Apply status filter if provided
          if (status) {
            listings = listings.filter(listing => listing.status === status);
          }

          // Apply category filter if provided
          if (categoryId) {
            listings = listings.filter(listing => listing.categoryId === categoryId);
          }

          return NextResponse.json({ listings });
        } catch (error) {
          console.error('Error retrieving listings:', error);
          return NextResponse.json(
            { error: 'Failed to retrieve listings' },
            { status: 500 }
          );
        }
    }
  );
}

/**
 * Creates a new listing for the current tenant.
 *
 * This function validates the incoming request to ensure a title is provided and extracts the tenant identifier from the request headers.
 * It generates a unique ID and slug for the listing, constructs the listing object with provided and default values, and saves the listing
 * in the key-value store under keys scoped by tenant and listing ID.
 *
 * On a successful creation, the function returns a JSON response with the created listing and a 201 status code.
 * If the title is missing, it returns a 400 error, and unexpected errors result in a 500 error response.
 *
 * Note: The request must have valid tenant access and 'create' permission on the listing resource.
 *
 * @param req - The incoming NextRequest containing listing details and tenant context.
 * @returns A NextResponse with the created listing data or an error message.
 */
export async function POST(req: NextRequest): Promise<NextResponse> {
  return withSecureTenantPermission(
    req,
    'listing' as ResourceType,
    'create' as Permission,
    async (validatedReq, context) => {
        try {
          // Get tenant context
          const tenantId = validatedReq.headers.get('x-tenant-id') as string;

          // Parse the request body
          const data = await validatedReq.json();

          // Validate required fields
          if (!data.title) {
            return NextResponse.json(
              { error: 'Title is required' },
              { status: 400 }
            );
          }

          // Generate a unique ID and slug for the listing
          const timestamp = Date.now();
          const id = `listing_${timestamp}`;
          const slug = data.title
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/(^-|-$)/g, '');

          // Create the listing object
          const listing = {
            id,
            tenantId,
            title: data.title,
            slug,
            description: data.description || '',
            status: data.status || 'draft',
            categoryIds: data.categoryIds || [],
            media: data.media || [],
            customFields: data.customFields || {},
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          };

          // Save the listing to Redis
          await kv.set(`listing:tenant:${tenantId}:${id}`, listing);
          await kv.set(`listing:id:${id}`, listing);

          // Return the created listing
          return NextResponse.json({ listing }, { status: 201 });
        } catch (error) {
          console.error('Error creating listing:', error);
          return NextResponse.json(
            { error: 'Failed to create listing' },
            { status: 500 }
          );
        }
    }
  );
}
