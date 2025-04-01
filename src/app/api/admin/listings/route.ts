import { NextRequest, NextResponse } from 'next/server';
import { withTenantAccess } from '@/middleware/tenant-validation';
import { withPermission } from '@/middleware/withPermission';
import { ResourceType, Permission } from '@/types/permissions';
import { kv } from '@/lib/redis-client';

/**
 * GET /api/admin/listings
 *
 * Retrieves all listings for the tenant
 * Requires 'read' permission on 'listing' resource
 *
 * @param req The incoming request
 * @returns Listings data
 */
export async function GET(req: NextRequest): Promise<NextResponse> {
  return withTenantAccess(
    req,
    withPermission(
      req,
      'listing' as ResourceType,
      'read' as Permission,
      async (validatedReq) => {
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
    )
  );
}

/**
 * POST /api/admin/listings
 *
 * Creates a new listing
 * Requires 'create' permission on 'listing' resource
 *
 * @param req The incoming request
 * @returns The created listing data
 */
export async function POST(req: NextRequest): Promise<NextResponse> {
  return withTenantAccess(
    req,
    withPermission(
      req,
      'listing' as ResourceType,
      'create' as Permission,
      async (validatedReq) => {
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
          const slug = data.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

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
          return NextResponse.json({
            listing
          }, { status: 201 });
        } catch (error) {
          console.error('Error creating listing:', error);
          return NextResponse.json(
            { error: 'Failed to create listing' },
            { status: 500 }
          );
        }
      }
    )
  );
}
