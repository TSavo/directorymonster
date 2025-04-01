'use client';

import React, { useState, useEffect } from 'react';
import { TenantGuard } from '../guards';
import { useTenantPermission } from '../hooks';
import { ResourceType, Permission } from '../utils/accessControl';

/**
 * Example component demonstrating TenantGuard usage
 */
export function TenantGuardExample() {
  // Simple example of protected content
  return (
    <div className="space-y-8 p-4">
      <h2 className="text-xl font-semibold">TenantGuard Examples</h2>
      
      {/* Basic tenant membership check */}
      <section className="p-4 border rounded-md">
        <h3 className="text-lg font-medium mb-2">Basic Tenant Membership</h3>
        <TenantGuard>
          <div className="bg-green-100 p-3 rounded">
            This content is only visible to tenant members
          </div>
        </TenantGuard>
      </section>
      
      {/* Permission-based check */}
      <section className="p-4 border rounded-md">
        <h3 className="text-lg font-medium mb-2">Permission Check: Manage Listings</h3>
        <TenantGuard 
          resourceType="listing"
          permission="manage"
          fallback={
            <div className="bg-red-100 p-3 rounded">
              You need "manage" permission for listings to view this content
            </div>
          }
        >
          <div className="bg-green-100 p-3 rounded">
            This content is only visible to users with "manage" permission for listings
          </div>
        </TenantGuard>
      </section>
      
      {/* Multiple permissions - any */}
      <section className="p-4 border rounded-md">
        <h3 className="text-lg font-medium mb-2">Multiple Permissions (Any)</h3>
        <TenantGuard 
          resourceType="category"
          permissions={['create', 'update']}
          requireAll={false}
          fallback={
            <div className="bg-red-100 p-3 rounded">
              You need either "create" or "update" permission for categories
            </div>
          }
        >
          <div className="bg-green-100 p-3 rounded">
            Visible with either "create" or "update" permission for categories
          </div>
        </TenantGuard>
      </section>
      
      {/* Multiple permissions - all */}
      <section className="p-4 border rounded-md">
        <h3 className="text-lg font-medium mb-2">Multiple Permissions (All)</h3>
        <TenantGuard 
          resourceType="user"
          permissions={['read', 'update']}
          requireAll={true}
          fallback={
            <div className="bg-red-100 p-3 rounded">
              You need both "read" and "update" permissions for users
            </div>
          }
        >
          <div className="bg-green-100 p-3 rounded">
            Visible only with both "read" and "update" permissions for users
          </div>
        </TenantGuard>
      </section>
      
      {/* Dynamic permission check with hook */}
      <DynamicPermissionExample />
    </div>
  );
}

/**
 * Example component demonstrating dynamic permission checking with the hook
 */
function DynamicPermissionExample() {
  const { checkPermission, checkGlobalPermission, getAccessibleResources } = useTenantPermission();
  const [canCreateSite, setCanCreateSite] = useState<boolean>(false);
  const [canManageAllListings, setCanManageAllListings] = useState<boolean>(false);
  const [accessibleCategoryIds, setAccessibleCategoryIds] = useState<string[]>([]);
  
  useEffect(() => {
    async function checkPermissions() {
      // Check if user can create sites
      const hasCreatePermission = await checkPermission('site', 'create');
      setCanCreateSite(hasCreatePermission);
      
      // Check if user has global manage permission for all listings
      const hasGlobalPermission = await checkGlobalPermission('listing', 'manage');
      setCanManageAllListings(hasGlobalPermission);
      
      // Get all categories user can update
      const categoryIds = await getAccessibleResources('category', 'update');
      setAccessibleCategoryIds(categoryIds);
    }
    
    checkPermissions();
  }, [checkPermission, checkGlobalPermission, getAccessibleResources]);
  
  return (
    <section className="p-4 border rounded-md">
      <h3 className="text-lg font-medium mb-2">Dynamic Permission Checking</h3>
      
      <div className="space-y-2">
        <div className="flex items-center">
          <span className="mr-2">Can create sites:</span>
          {canCreateSite ? (
            <span className="text-green-600">✓</span>
          ) : (
            <span className="text-red-600">✗</span>
          )}
        </div>
        
        <div className="flex items-center">
          <span className="mr-2">Can manage all listings:</span>
          {canManageAllListings ? (
            <span className="text-green-600">✓</span>
          ) : (
            <span className="text-red-600">✗</span>
          )}
        </div>
        
        <div>
          <span>Accessible category IDs:</span>
          {accessibleCategoryIds.length > 0 ? (
            <ul className="list-disc ml-6 mt-1">
              {accessibleCategoryIds.map(id => (
                <li key={id}>{id}</li>
              ))}
            </ul>
          ) : (
            <p className="italic ml-4 mt-1">No accessible categories</p>
          )}
        </div>
      </div>
    </section>
  );
}

export default TenantGuardExample;