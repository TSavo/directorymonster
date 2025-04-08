'use client';

import React from 'react';
import { PermissionGuard } from '../guards/PermissionGuard';
import { usePermission } from '../hooks/usePermission';
import { Button } from '@/components/ui/Button';

/**
 * Example component demonstrating various ways to use PermissionGuard
 * This serves as documentation for developers on how to use the component
 */
export function PermissionGuardExample() {
  // Example of using the permission hook for programmatic checks
  const {
    hasPermission: canManageCategories,
    isLoading: checkingPermission
  } = usePermission({
    resourceType: 'category',
    permission: 'manage'
  });

  return (
    <div className="p-4 space-y-8 bg-white rounded-lg shadow-md">
      <h2 className="text-xl font-semibold">PermissionGuard Component Examples</h2>

      <div className="space-y-4">
        <h3 className="text-lg font-medium">Basic Permission Check</h3>
        <p className="text-gray-600">
          Shows content only if the user has read permission for categories
        </p>
        <div className="border border-gray-200 p-3 rounded-md bg-gray-50">
          <PermissionGuard
            resourceType="category"
            permission="read"
          >
            <div className="p-2 bg-blue-50 text-blue-700 rounded">
              You have read permission for categories
            </div>
          </PermissionGuard>
        </div>
      </div>

      <div className="space-y-4">
        <h3 className="text-lg font-medium">With Custom Fallback</h3>
        <p className="text-gray-600">
          Shows alternative content when permission check fails
        </p>
        <div className="border border-gray-200 p-3 rounded-md bg-gray-50">
          <PermissionGuard
            resourceType="listing"
            permission="delete"
            fallback={
              <div className="p-2 bg-red-50 text-red-700 rounded">
                You do not have permission to delete listings
              </div>
            }
          >
            <Button variant="danger" size="sm">
              Delete Listing
            </Button>
          </PermissionGuard>
        </div>
      </div>

      <div className="space-y-4">
        <h3 className="text-lg font-medium">Resource-Specific Permission</h3>
        <p className="text-gray-600">
          Checks permission for a specific resource ID
        </p>
        <div className="border border-gray-200 p-3 rounded-md bg-gray-50">
          <PermissionGuard
            resourceType="listing"
            permission="update"
            resourceId="listing-123"
            fallback={
              <div className="p-2 bg-gray-100 text-gray-500 rounded">
                You cannot edit this specific listing
              </div>
            }
          >
            <Button variant="primary" size="sm">
              Edit Listing #123
            </Button>
          </PermissionGuard>
        </div>
      </div>

      <div className="space-y-4">
        <h3 className="text-lg font-medium">Multiple Permissions (Any)</h3>
        <p className="text-gray-600">
          Shows content if the user has ANY of the specified permissions
        </p>
        <div className="border border-gray-200 p-3 rounded-md bg-gray-50">
          <PermissionGuard
            resourceType="category"
            permissions={['update', 'delete']}
            requireAll={false}
            fallback={
              <div className="p-2 bg-gray-100 text-gray-500 rounded">
                You need either update or delete permission
              </div>
            }
          >
            <div className="p-2 bg-green-50 text-green-700 rounded">
              You have either update or delete permission for categories
            </div>
          </PermissionGuard>
        </div>
      </div>

      <div className="space-y-4">
        <h3 className="text-lg font-medium">Multiple Permissions (All)</h3>
        <p className="text-gray-600">
          Shows content only if the user has ALL specified permissions
        </p>
        <div className="border border-gray-200 p-3 rounded-md bg-gray-50">
          <PermissionGuard
            resourceType="site"
            permissions={['read', 'update']}
            requireAll={true}
            fallback={
              <div className="p-2 bg-gray-100 text-gray-500 rounded">
                You need both read and update permissions
              </div>
            }
          >
            <div className="p-2 bg-purple-50 text-purple-700 rounded">
              You have both read and update permissions for sites
            </div>
          </PermissionGuard>
        </div>
      </div>

      <div className="space-y-4">
        <h3 className="text-lg font-medium">Silent Mode</h3>
        <p className="text-gray-600">
          No fallback content when permission check fails
        </p>
        <div className="border border-gray-200 p-3 rounded-md bg-gray-50">
          <div className="flex items-center space-x-2">
            <span>Edit User:</span>
            <PermissionGuard
              resourceType="user"
              permission="update"
              silent={true}
            >
              <Button variant="primary" size="sm" className="bg-green-600 hover:bg-green-700">
                Edit Profile
              </Button>
            </PermissionGuard>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <h3 className="text-lg font-medium">Using the usePermission Hook</h3>
        <p className="text-gray-600">
          Programmatic permission checking for complex scenarios
        </p>
        <div className="border border-gray-200 p-3 rounded-md bg-gray-50">
          {checkingPermission ? (
            <div className="animate-pulse p-2">Checking permissions...</div>
          ) : canManageCategories ? (
            <div className="space-y-2">
              <div className="p-2 bg-yellow-50 text-yellow-700 rounded">
                You have full management permission for categories
              </div>
              <div className="flex space-x-2">
                <Button variant="primary" size="sm">
                  Create Category
                </Button>
                <Button variant="primary" size="sm" className="bg-green-600 hover:bg-green-700">
                  Import Categories
                </Button>
                <Button variant="danger" size="sm">
                  Delete All
                </Button>
              </div>
            </div>
          ) : (
            <div className="p-2 bg-gray-100 text-gray-500 rounded">
              You need full management permission to access these actions
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default PermissionGuardExample;