"use client";

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger
} from '@/components/ui/tabs';
import {
  UserPlus,
  UserMinus,
  Search,
  AlertCircle,
  Shield,
  User,
  Check,
  X
} from 'lucide-react';
import { Role, Permission, ResourceType, PermissionAction } from '@/types/role';
import { Badge } from '@/components/ui/badge';

interface User {
  id: string;
  name: string;
  email: string;
  avatarUrl?: string;
}

interface UserRoleManagerProps {
  user: User;
  roles: Role[];
  availableRoles: Role[];
  isLoading: boolean;
  error: string | null;
  onAddRoles: (roleIds: string[]) => void;
  onRemoveRole: (roleId: string) => void;
}

export function UserRoleManager({
  user,
  roles,
  availableRoles,
  isLoading,
  error,
  onAddRoles,
  onRemoveRole
}: UserRoleManagerProps) {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isRemoveDialogOpen, setIsRemoveDialogOpen] = useState(false);
  const [roleToRemove, setRoleToRemove] = useState<Role | null>(null);
  const [selectedRoleIds, setSelectedRoleIds] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('assigned');

  // Filter available roles by search query
  const filteredAvailableRoles = availableRoles ? availableRoles.filter(role =>
    role.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    role.description.toLowerCase().includes(searchQuery.toLowerCase())
  ) : [];

  // Handle role selection
  const toggleRoleSelection = (roleId: string) => {
    setSelectedRoleIds(prev =>
      prev.includes(roleId)
        ? prev.filter(id => id !== roleId)
        : [...prev, roleId]
    );
  };

  // Handle add roles
  const handleAddRoles = () => {
    onAddRoles(selectedRoleIds);
    setSelectedRoleIds([]);
    setIsAddDialogOpen(false);
  };

  // Handle remove role
  const handleRemoveRole = () => {
    if (roleToRemove) {
      onRemoveRole(roleToRemove.id);
      setRoleToRemove(null);
      setIsRemoveDialogOpen(false);
    }
  };

  // Open remove dialog
  const openRemoveDialog = (role: Role) => {
    setRoleToRemove(role);
    setIsRemoveDialogOpen(true);
  };

  // Calculate effective permissions from all roles
  const getEffectivePermissions = (): Record<ResourceType, PermissionAction[]> => {
    const effectivePermissions: Record<ResourceType, PermissionAction[]> = {} as Record<ResourceType, PermissionAction[]>;

    // Collect all permissions from all roles
    if (roles) {
      roles.forEach(role => {
        role.permissions.forEach(permission => {
          const { resource, actions } = permission;

          if (!effectivePermissions[resource]) {
            effectivePermissions[resource] = [];
          }

          // Add actions that don't already exist
          actions.forEach(action => {
            if (!effectivePermissions[resource].includes(action)) {
              effectivePermissions[resource].push(action);
            }
          });
        });
      });
    }

    return effectivePermissions;
  };

  // Get resource display name
  const getResourceDisplayName = (resource: ResourceType): string => {
    const resourceMap: Record<ResourceType, string> = {
      user: 'User Management',
      role: 'Role Management',
      site: 'Site Management',
      category: 'Category Management',
      listing: 'Listing Management',
      content: 'Content Management',
      setting: 'Settings Management',
      tenant: 'Tenant Management',
      audit: 'Audit Logs'
    };

    return resourceMap[resource] || resource;
  };

  // Get action display name
  const getActionDisplayName = (resource: ResourceType, action: PermissionAction): string => {
    const actionMap: Record<PermissionAction, string> = {
      create: 'Create',
      read: 'Read',
      update: 'Update',
      delete: 'Delete',
      manage: 'Manage'
    };

    const resourceSingular = resource.endsWith('s')
      ? resource.slice(0, -1)
      : resource;

    return `${actionMap[action]} ${resourceSingular.charAt(0).toUpperCase() + resourceSingular.slice(1)}s`;
  };

  // Loading state
  if (isLoading) {
    return (
      <div data-testid="user-roles-loading">
        <div className="space-y-4">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-20 w-full" />
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="rounded-md bg-red-50 p-4 my-4" data-testid="user-roles-error">
        <div className="flex">
          <div className="flex-shrink-0">
            <AlertCircle className="h-5 w-5 text-red-400" aria-hidden="true" />
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-red-800">{error}</h3>
            <div className="mt-2 text-sm text-red-700">
              <p>Please try again later or contact support if the problem persists.</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-medium">Roles for {user?.name || 'User'}</h2>
          <p className="text-sm text-gray-500 mt-1">
            Manage roles assigned to this user
          </p>
        </div>
        <Button
          onClick={() => setIsAddDialogOpen(true)}
          className="flex items-center gap-1"
        >
          <UserPlus className="h-4 w-4" />
          Add Roles
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="assigned">Assigned Roles</TabsTrigger>
          <TabsTrigger value="effective">Effective Permissions</TabsTrigger>
        </TabsList>

        <TabsContent value="assigned">
          {/* Empty state */}
          {roles && roles.length === 0 ? (
            <div className="text-center py-10 border rounded-md bg-gray-50" data-testid="user-roles-empty">
              <Shield className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-semibold text-gray-900">No roles assigned</h3>
              <p className="mt-1 text-sm text-gray-500">This user doesn't have any roles assigned yet.</p>
              <div className="mt-6">
                <Button
                  onClick={() => setIsAddDialogOpen(true)}
                  className="flex items-center gap-1 mx-auto"
                >
                  <UserPlus className="h-4 w-4" />
                  Add Roles
                </Button>
              </div>
            </div>
          ) : (
            <div className="border rounded-md divide-y">
              {roles && roles.map(role => (
                <div key={role.id} className="flex items-center justify-between p-4 hover:bg-gray-50">
                  <div>
                    <div className="flex items-center">
                      <Shield className="h-5 w-5 text-gray-400 mr-2" />
                      <span className="font-medium">{role.name}</span>
                      {role.type === 'system' && (
                        <Badge variant="outline" className="ml-2 bg-blue-50 text-blue-700 border-blue-200">System</Badge>
                      )}
                    </div>
                    <p className="text-sm text-gray-500 mt-1">{role.description}</p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => openRemoveDialog(role)}
                    aria-label="Remove role"
                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    disabled={role.type === 'system'}
                  >
                    <UserMinus className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="effective">
          <div className="border rounded-md">
            {getEffectivePermissions() && Object.entries(getEffectivePermissions()).length === 0 ? (
              <div className="text-center py-10">
                <h3 className="text-sm font-semibold text-gray-900">No permissions</h3>
                <p className="mt-1 text-sm text-gray-500">This user doesn't have any permissions.</p>
              </div>
            ) : (
              <div className="divide-y">
                {getEffectivePermissions() && Object.entries(getEffectivePermissions()).map(([resource, actions]) => (
                  <div key={resource} className="p-4">
                    <h3 className="font-medium mb-2">{getResourceDisplayName(resource as ResourceType)}</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                      {actions && actions.map(action => (
                        <div key={`${resource}-${action}`} className="flex items-center">
                          <Check className="h-4 w-4 text-green-500 mr-2" />
                          <span className="text-sm">
                            {getActionDisplayName(resource as ResourceType, action)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>

      {/* Add Roles Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add Roles to {user?.name || 'User'}</DialogTitle>
            <DialogDescription>
              Select roles to assign to this user.
            </DialogDescription>
          </DialogHeader>

          <div className="py-4">
            <div className="relative mb-4">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
              <Input
                type="search"
                placeholder="Search roles..."
                className="pl-8"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            <div className="border rounded-md divide-y max-h-[300px] overflow-y-auto">
              {filteredAvailableRoles && filteredAvailableRoles.length === 0 ? (
                <div className="p-4 text-center text-sm text-gray-500">
                  No roles found matching your search.
                </div>
              ) : (
                filteredAvailableRoles && filteredAvailableRoles.map(role => (
                  <div key={role.id} className="flex items-center p-3 hover:bg-gray-50">
                    <Checkbox
                      id={`select-role-${role.id}`}
                      data-testid={`select-role-${role.id}`}
                      checked={selectedRoleIds.includes(role.id)}
                      onCheckedChange={() => toggleRoleSelection(role.id)}
                      className="mr-2"
                    />
                    <div className="flex-1">
                      <div className="flex items-center">
                        <label htmlFor={`select-role-${role.id}`} className="font-medium cursor-pointer">
                          {role.name}
                        </label>
                        {role.type === 'system' && (
                          <Badge variant="outline" className="ml-2 bg-blue-50 text-blue-700 border-blue-200">System</Badge>
                        )}
                      </div>
                      <p className="text-xs text-gray-500">{role.description}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsAddDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={handleAddRoles}
              disabled={selectedRoleIds.length === 0}
            >
              Add Selected Roles
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Remove Role Alert Dialog */}
      <AlertDialog open={isRemoveDialogOpen} onOpenChange={setIsRemoveDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove Role from User</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to remove the {roleToRemove?.name} role from {user?.name || 'this user'}?
              This will revoke all permissions associated with this role from the user.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleRemoveRole}
              className="bg-red-600 hover:bg-red-700"
            >
              Remove
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

export default UserRoleManager;
