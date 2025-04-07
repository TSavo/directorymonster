"use client";

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Role, Permission, PermissionAction, ResourceType, RoleType } from '@/types/role';

interface ResourceConfig {
  type: ResourceType;
  label: string;
  description: string;
}

interface ActionConfig {
  type: PermissionAction;
  label: string;
  description: string;
}

interface RolePermissionsProps {
  role: Role;
  onSave: (permissions: Permission[]) => void;
  onCancel: () => void;
}

export function RolePermissions({ role, onSave, onCancel }: RolePermissionsProps) {
  // Define available resources
  const resources: ResourceConfig[] = [
    { type: 'user', label: 'Users', description: 'User management' },
    { type: 'role', label: 'Roles', description: 'Role management' },
    { type: 'site', label: 'Sites', description: 'Site management' },
    { type: 'category', label: 'Categories', description: 'Category management' },
    { type: 'listing', label: 'Listings', description: 'Listing management' },
    { type: 'content', label: 'Content', description: 'Content management' },
    { type: 'setting', label: 'Settings', description: 'Settings management' },
    { type: 'tenant', label: 'Tenants', description: 'Tenant management' },
    { type: 'audit', label: 'Audit Logs', description: 'Audit log access' }
  ];

  // Define available actions
  const actions: ActionConfig[] = [
    { type: 'create', label: 'Create', description: 'Create new items' },
    { type: 'read', label: 'Read', description: 'View items' },
    { type: 'update', label: 'Update', description: 'Edit existing items' },
    { type: 'delete', label: 'Delete', description: 'Delete items' },
    { type: 'manage', label: 'Manage', description: 'Full control' }
  ];

  // Initialize permission state from role
  const [permissions, setPermissions] = useState<Record<string, boolean>>({});
  const isSystemRole = role.type === RoleType.SYSTEM;

  // Convert role permissions to a flat map for easier state management
  useEffect(() => {
    const permMap: Record<string, boolean> = {};

    // Initialize all permissions to false
    resources.forEach(resource => {
      actions.forEach(action => {
        permMap[`${resource.type}-${action.type}`] = false;
      });
    });

    // Set permissions from role
    role.permissions.forEach(permission => {
      permission.actions.forEach(action => {
        permMap[`${permission.resource}-${action}`] = true;
      });
    });

    setPermissions(permMap);
  }, [role]);

  // Toggle a single permission
  const togglePermission = (resource: ResourceType, action: PermissionAction) => {
    if (isSystemRole) return; // Don't allow editing system roles

    setPermissions(prev => {
      const newPermissions = { ...prev };
      newPermissions[`${resource}-${action}`] = !prev[`${resource}-${action}`];
      return newPermissions;
    });
  };

  // Toggle all permissions for a resource
  const toggleResourcePermissions = (resource: ResourceType) => {
    if (isSystemRole) return; // Don't allow editing system roles

    // Check if any permission is already set for this resource
    const hasAnyPermission = actions.some(
      action => permissions[`${resource}-${action.type}`]
    );

    // Toggle all permissions for this resource
    const newPermissions = { ...permissions };
    actions.forEach(action => {
      newPermissions[`${resource}-${action.type}`] = !hasAnyPermission;
    });

    setPermissions(newPermissions);
  };

  // Toggle all permissions for an action
  const toggleActionPermissions = (action: PermissionAction) => {
    if (isSystemRole) return; // Don't allow editing system roles

    // Check if any permission is already set for this action
    const hasAnyPermission = resources.some(
      resource => permissions[`${resource.type}-${action}`]
    );

    // Toggle all permissions for this action
    const newPermissions = { ...permissions };
    resources.forEach(resource => {
      newPermissions[`${resource.type}-${action}`] = !hasAnyPermission;
    });

    setPermissions(newPermissions);
  };

  // Convert permissions state back to role permissions format
  const getPermissionsForSave = (): Permission[] => {
    const result: Permission[] = [];

    resources.forEach(resource => {
      const resourceActions: PermissionAction[] = [];

      // Collect all actions for this resource
      actions.forEach(action => {
        if (permissions[`${resource.type}-${action.type}`]) {
          resourceActions.push(action.type);
        }
      });

      // Only add resource if it has any actions
      if (resourceActions.length > 0) {
        result.push({
          resource: resource.type,
          actions: resourceActions
        });
      }
    });

    return result;
  };

  // Handle save button click
  const handleSave = () => {
    onSave(getPermissionsForSave());
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-medium">Manage Permissions</h2>
        <p className="text-sm text-gray-500 mt-1">
          for {role.name}
          {isSystemRole && (
            <span className="ml-2 text-amber-600 font-medium">
              (System role permissions cannot be modified)
            </span>
          )}
        </p>
      </div>

      <div className="border rounded-md overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">
                Resource
              </th>
              {actions.map(action => (
                <th key={action.type} className="px-4 py-3 text-center text-sm font-medium text-gray-500">
                  <div className="flex flex-col items-center">
                    <span>{action.label}</span>
                    <Checkbox
                      id={`toggle-all-action-${action.type}`}
                      data-testid={`toggle-all-action-${action.type}`}
                      checked={resources.every(resource => permissions[`${resource.type}-${action.type}`])}
                      onCheckedChange={() => toggleActionPermissions(action.type)}
                      disabled={isSystemRole}
                      className="mt-1"
                    />
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {resources.map(resource => (
              <tr key={resource.type} className="hover:bg-gray-50">
                <td className="px-4 py-3 text-sm font-medium text-gray-900">
                  <div className="flex items-center">
                    <Checkbox
                      id={`toggle-all-${resource.type}`}
                      data-testid={`toggle-all-${resource.type}`}
                      checked={actions.every(action => permissions[`${resource.type}-${action.type}`])}
                      onCheckedChange={() => toggleResourcePermissions(resource.type)}
                      disabled={isSystemRole}
                      className="mr-2"
                    />
                    <label htmlFor={`toggle-all-${resource.type}`} className="cursor-pointer">
                      {resource.label}
                    </label>
                  </div>
                </td>
                {actions.map(action => (
                  <td key={`${resource.type}-${action.type}`} className="px-4 py-3 text-center">
                    <Checkbox
                      id={`permission-${resource.type}-${action.type}`}
                      data-testid={`permission-${resource.type}-${action.type}`}
                      checked={permissions[`${resource.type}-${action.type}`] || false}
                      onCheckedChange={() => togglePermission(resource.type, action.type)}
                      disabled={isSystemRole}
                    />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex justify-end space-x-2">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
        >
          Cancel
        </Button>
        <Button
          type="button"
          onClick={handleSave}
          disabled={isSystemRole}
        >
          Save Permissions
        </Button>
      </div>
    </div>
  );
}

export default RolePermissions;
