import React, { useState, useEffect } from 'react';
import { PredefinedRoles } from '@/lib/role/predefined-roles';
import { useAuth } from '@/components/admin/auth/hooks/useAuth';
import { useTenant } from '@/components/admin/auth/hooks/useTenant';
import { usePermission } from '@/components/admin/auth/hooks/usePermission';
import { PermissionGuard } from '@/components/admin/auth/guards/PermissionGuard';

interface RoleAssignmentProps {
  userId: string;
  siteId?: string;
  onRoleAssigned?: () => void;
}

/**
 * RoleAssignment component allows administrators to assign predefined roles to users
 */
export function RoleAssignment({ userId, siteId, onRoleAssigned }: RoleAssignmentProps) {
  const { tenant } = useTenant();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [userRoles, setUserRoles] = useState<string[]>([]);
  const [availableRoles, setAvailableRoles] = useState<{ id: string; name: string; description: string }[]>([]);
  const [predefinedRoles, setPredefinedRoles] = useState<{ tenantRoles: any[]; siteRoles: any[] }>({ tenantRoles: [], siteRoles: [] });
  const [activeTab, setActiveTab] = useState<'tenant' | 'site'>('tenant');

  const canManageRoles = usePermission({
    resourceType: 'role',
    permission: 'manage'
  });

  // Fetch user's current roles and available roles
  useEffect(() => {
    if (!tenant || !userId) return;

    const fetchRoles = async () => {
      try {
        setLoading(true);
        setError(null);

        // Fetch user's current roles
        const response = await fetch(`/api/tenants/${tenant.id}/users/${userId}/roles`);

        if (!response.ok) {
          throw new Error('Failed to fetch user roles');
        }

        const data = await response.json();
        setUserRoles(data.map((role: any) => role.id));

        // Fetch available roles
        const rolesResponse = await fetch(`/api/tenants/${tenant.id}/roles`);

        if (!rolesResponse.ok) {
          throw new Error('Failed to fetch available roles');
        }

        const rolesData = await rolesResponse.json();
        setAvailableRoles(rolesData);

        // Fetch predefined role templates
        const predefinedResponse = await fetch(`/api/tenants/${tenant.id}/roles/predefined`);

        if (!predefinedResponse.ok) {
          throw new Error('Failed to fetch predefined roles');
        }

        const predefinedData = await predefinedResponse.json();
        setPredefinedRoles(predefinedData);

        // Set active tab based on whether siteId is provided
        if (siteId) {
          setActiveTab('site');
        }
      } catch (err: any) {
        setError(err.message || 'An error occurred');
      } finally {
        setLoading(false);
      }
    };

    fetchRoles();
  }, [tenant, userId, siteId]);

  // Handle role assignment
  const handleRoleAssignment = async (roleId: string, assigned: boolean) => {
    if (!tenant || !userId) return;

    try {
      setLoading(true);
      setError(null);
      setSuccess(null);

      const method = assigned ? 'POST' : 'DELETE';
      const response = await fetch(`/api/tenants/${tenant.id}/users/${userId}/roles/${roleId}`, {
        method,
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to ${assigned ? 'assign' : 'remove'} role`);
      }

      // Update user roles
      setUserRoles(prev =>
        assigned
          ? [...prev, roleId]
          : prev.filter(id => id !== roleId)
      );

      setSuccess(`Role ${assigned ? 'assigned' : 'removed'} successfully`);

      // Call the callback if provided
      if (onRoleAssigned) {
        onRoleAssigned();
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  // Handle predefined role assignment
  const handlePredefinedRoleAssignment = async (roleName: string) => {
    if (!tenant || !userId) return;

    try {
      setLoading(true);
      setError(null);
      setSuccess(null);

      // Determine if this is a site-specific role
      const isSiteRole = roleName.startsWith('Site ');

      if (isSiteRole && !siteId) {
        throw new Error('Site ID is required for site-specific roles');
      }

      // Create the predefined role if it doesn't exist
      const response = await fetch(`/api/tenants/${tenant.id}/roles/predefined/${roleName}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          siteId: isSiteRole ? siteId : undefined
        })
      });

      if (!response.ok) {
        throw new Error('Failed to create predefined role');
      }

      const role = await response.json();

      // Assign the role to the user
      await handleRoleAssignment(role.id, true);

      setSuccess(`Predefined role '${roleName}' assigned successfully`);
    } catch (err: any) {
      setError(err.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  if (!canManageRoles) {
    return (
      <div className="p-4 bg-gray-100 rounded-md">
        <p className="text-gray-600">You don't have permission to manage roles.</p>
      </div>
    );
  }

  return (
    <PermissionGuard resourceType="role" permission="manage">
      <div className="bg-white shadow-md rounded-lg p-6">
        <h2 className="text-xl font-semibold mb-4">Role Assignment</h2>

        {loading && <p className="text-gray-500">Loading...</p>}

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}

        {success && (
          <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
            {success}
          </div>
        )}

        {/* Tab navigation */}
        <div className="flex border-b mb-4">
          <button
            className={`py-2 px-4 ${activeTab === 'tenant' ? 'border-b-2 border-blue-500 text-blue-600' : 'text-gray-500'}`}
            onClick={() => setActiveTab('tenant')}
          >
            Tenant-wide Roles
          </button>
          <button
            className={`py-2 px-4 ${activeTab === 'site' ? 'border-b-2 border-blue-500 text-blue-600' : 'text-gray-500'}`}
            onClick={() => setActiveTab('site')}
            disabled={!siteId}
          >
            Site-specific Roles
          </button>
        </div>

        {/* Tenant-wide roles */}
        {activeTab === 'tenant' && (
          <div className="mb-6">
            <h3 className="text-lg font-medium mb-2">Predefined Tenant Roles</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div
                className="border rounded-md p-4 cursor-pointer hover:bg-blue-50"
                onClick={() => handlePredefinedRoleAssignment('Tenant Admin')}
              >
                <h4 className="font-semibold">Tenant Admin</h4>
                <p className="text-sm text-gray-600">Full administrative access to all resources across all sites</p>
              </div>

              <div
                className="border rounded-md p-4 cursor-pointer hover:bg-blue-50"
                onClick={() => handlePredefinedRoleAssignment('Tenant Editor')}
              >
                <h4 className="font-semibold">Tenant Editor</h4>
                <p className="text-sm text-gray-600">Can create, edit, and publish content across all sites</p>
              </div>

              <div
                className="border rounded-md p-4 cursor-pointer hover:bg-blue-50"
                onClick={() => handlePredefinedRoleAssignment('Tenant Author')}
              >
                <h4 className="font-semibold">Tenant Author</h4>
                <p className="text-sm text-gray-600">Can create and edit their own content across all sites</p>
              </div>

              <div
                className="border rounded-md p-4 cursor-pointer hover:bg-blue-50"
                onClick={() => handlePredefinedRoleAssignment('Tenant Viewer')}
              >
                <h4 className="font-semibold">Tenant Viewer</h4>
                <p className="text-sm text-gray-600">Read-only access to content across all sites</p>
              </div>
            </div>
          </div>
        )}

        {/* Site-specific roles */}
        {activeTab === 'site' && siteId && (
          <div className="mb-6">
            <h3 className="text-lg font-medium mb-2">Predefined Site Roles</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div
                className="border rounded-md p-4 cursor-pointer hover:bg-blue-50"
                onClick={() => handlePredefinedRoleAssignment('Site Admin')}
              >
                <h4 className="font-semibold">Site Admin</h4>
                <p className="text-sm text-gray-600">Full administrative access to a specific site</p>
              </div>

              <div
                className="border rounded-md p-4 cursor-pointer hover:bg-blue-50"
                onClick={() => handlePredefinedRoleAssignment('Site Editor')}
              >
                <h4 className="font-semibold">Site Editor</h4>
                <p className="text-sm text-gray-600">Can create, edit, and publish content for a specific site</p>
              </div>

              <div
                className="border rounded-md p-4 cursor-pointer hover:bg-blue-50"
                onClick={() => handlePredefinedRoleAssignment('Site Author')}
              >
                <h4 className="font-semibold">Site Author</h4>
                <p className="text-sm text-gray-600">Can create and edit their own content for a specific site</p>
              </div>

              <div
                className="border rounded-md p-4 cursor-pointer hover:bg-blue-50"
                onClick={() => handlePredefinedRoleAssignment('Site Viewer')}
              >
                <h4 className="font-semibold">Site Viewer</h4>
                <p className="text-sm text-gray-600">Read-only access to content for a specific site</p>
              </div>
            </div>
          </div>
        )}

        {!siteId && activeTab === 'site' && (
          <div className="p-4 bg-yellow-100 text-yellow-800 rounded-md mb-6">
            <p>Site ID is required to assign site-specific roles. Please select a site first.</p>
          </div>
        )}

        <div>
          <h3 className="text-lg font-medium mb-2">Available Roles</h3>
          {availableRoles.length === 0 ? (
            <p className="text-gray-500">No custom roles available</p>
          ) : (
            <div className="space-y-2">
              {availableRoles
                .filter(role => {
                  // Filter roles based on active tab
                  if (activeTab === 'tenant') {
                    return role.name.startsWith('Tenant ') || (!role.name.startsWith('Tenant ') && !role.name.startsWith('Site '));
                  } else {
                    return role.name.startsWith('Site ');
                  }
                })
                .map(role => (
                  <div key={role.id} className="flex items-center justify-between border-b pb-2">
                    <div>
                      <h4 className="font-medium">{role.name}</h4>
                      <p className="text-sm text-gray-600">{role.description}</p>
                    </div>
                    <div>
                      <input
                        type="checkbox"
                        checked={userRoles.includes(role.id)}
                        onChange={(e) => handleRoleAssignment(role.id, e.target.checked)}
                        className="h-5 w-5 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                    </div>
                  </div>
                ))
              }
            </div>
          )}
        </div>
      </div>
    </PermissionGuard>
  );
}
