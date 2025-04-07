"use client";

import React, { useState } from 'react';
import { 
  AlertCircle, 
  ChevronDown, 
  ChevronRight, 
  Filter, 
  Shield
} from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel
} from '@/components/ui/dropdown-menu';
import { Role, Permission, ResourceType, PermissionAction } from '@/types/role';

interface User {
  id: string;
  name: string;
  email: string;
  avatarUrl?: string;
}

interface EffectivePermissionsProps {
  user: User;
  roles: Role[];
  effectivePermissions: Record<string, Permission[]>;
  permissionSources: Record<string, string[]>;
  isLoading: boolean;
  error: string | null;
}

export function EffectivePermissions({
  user,
  roles,
  effectivePermissions,
  permissionSources,
  isLoading,
  error
}: EffectivePermissionsProps) {
  const [resourceFilter, setResourceFilter] = useState<string | null>(null);
  const [roleFilter, setRoleFilter] = useState<string | null>(null);
  const [expandedResources, setExpandedResources] = useState<Record<string, boolean>>({});

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
    
    return resourceMap[resource as ResourceType] || resource;
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
    
    return `${actionMap[action as PermissionAction]} ${resourceSingular.charAt(0).toUpperCase() + resourceSingular.slice(1)}s`;
  };

  // Toggle resource expansion
  const toggleResourceExpansion = (resource: string) => {
    setExpandedResources(prev => ({
      ...prev,
      [resource]: !prev[resource]
    }));
  };

  // Check if resource is expanded
  const isResourceExpanded = (resource: string) => {
    return expandedResources[resource] !== false; // Default to expanded
  };

  // Filter resources by role
  const filterResourcesByRole = (resources: string[]): string[] => {
    if (!roleFilter) return resources;
    
    return resources.filter(resource => {
      const permissions = effectivePermissions[resource];
      if (!permissions) return false;
      
      return permissions.some(permission => {
        return permission.actions.some(action => {
          const key = `${resource}-${action}`;
          return permissionSources[key]?.includes(roleFilter);
        });
      });
    });
  };

  // Filter resources by resource type
  const filterResources = (resources: string[]): string[] => {
    if (!resourceFilter) return resources;
    return resources.filter(resource => resource === resourceFilter);
  };

  // Get filtered resources
  const getFilteredResources = (): string[] => {
    const resources = Object.keys(effectivePermissions);
    const filteredByRole = filterResourcesByRole(resources);
    return filterResources(filteredByRole);
  };

  // Filter actions by role
  const filterActionsByRole = (resource: string, actions: PermissionAction[]): PermissionAction[] => {
    if (!roleFilter) return actions;
    
    return actions.filter(action => {
      const key = `${resource}-${action}`;
      return permissionSources[key]?.includes(roleFilter);
    });
  };

  // Loading state
  if (isLoading) {
    return (
      <div data-testid="effective-permissions-loading">
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
      <div className="rounded-md bg-red-50 p-4 my-4" data-testid="effective-permissions-error">
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

  // Get filtered resources
  const filteredResources = getFilteredResources();

  // Empty state
  if (filteredResources.length === 0) {
    return (
      <div className="text-center py-10 border rounded-md bg-gray-50" data-testid="effective-permissions-empty">
        <Shield className="mx-auto h-12 w-12 text-gray-400" />
        <h3 className="mt-2 text-sm font-semibold text-gray-900">No permissions found</h3>
        <p className="mt-1 text-sm text-gray-500">
          {resourceFilter || roleFilter 
            ? 'No permissions match the current filters.' 
            : 'This user does not have any permissions.'}
        </p>
        {(resourceFilter || roleFilter) && (
          <div className="mt-6">
            <Button
              variant="outline"
              onClick={() => {
                setResourceFilter(null);
                setRoleFilter(null);
              }}
              className="mx-auto"
            >
              Clear Filters
            </Button>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-medium">Effective Permissions for {user.name}</h2>
          <p className="text-sm text-gray-500 mt-1">
            All permissions granted to this user through their assigned roles
          </p>
        </div>
        <div className="flex space-x-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="flex items-center gap-1">
                <Filter className="h-4 w-4" />
                Filter by Resource
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Select Resource</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => setResourceFilter(null)}>
                All Resources
              </DropdownMenuItem>
              {Object.keys(effectivePermissions).map(resource => (
                <DropdownMenuItem 
                  key={resource}
                  onClick={() => setResourceFilter(resource)}
                >
                  {getResourceDisplayName(resource as ResourceType)}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="flex items-center gap-1">
                <Filter className="h-4 w-4" />
                Filter by Role
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Select Role</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => setRoleFilter(null)}>
                All Roles
              </DropdownMenuItem>
              {roles.map(role => (
                <DropdownMenuItem 
                  key={role.id}
                  onClick={() => setRoleFilter(role.name)}
                >
                  {role.name}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <div className="border rounded-md divide-y">
        {filteredResources.map(resource => {
          const permissions = effectivePermissions[resource];
          if (!permissions) return null;
          
          // Get all actions for this resource
          const allActions = permissions.flatMap(p => p.actions);
          
          // Filter actions by role if needed
          const filteredActions = filterActionsByRole(resource, allActions as PermissionAction[]);
          
          if (filteredActions.length === 0) return null;
          
          const isExpanded = isResourceExpanded(resource);
          
          return (
            <div key={resource} className="bg-white">
              <div 
                className="p-4 flex items-center justify-between cursor-pointer hover:bg-gray-50"
                onClick={() => toggleResourceExpansion(resource)}
              >
                <div className="flex items-center">
                  {isExpanded ? (
                    <ChevronDown className="h-5 w-5 text-gray-400 mr-2" />
                  ) : (
                    <ChevronRight className="h-5 w-5 text-gray-400 mr-2" />
                  )}
                  <h3 className="font-medium">{getResourceDisplayName(resource as ResourceType)}</h3>
                </div>
                <Badge className="bg-gray-100 text-gray-700">
                  {filteredActions.length} permission{filteredActions.length !== 1 ? 's' : ''}
                </Badge>
              </div>
              
              {isExpanded && (
                <div className="px-4 pb-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {filteredActions.map(action => {
                    const key = `${resource}-${action}`;
                    const sources = permissionSources[key] || [];
                    
                    return (
                      <div key={key} className="bg-gray-50 p-3 rounded-md">
                        <div className="font-medium">
                          {getActionDisplayName(resource as ResourceType, action as PermissionAction)}
                        </div>
                        <div className="text-xs text-gray-500 mt-1">
                          From: {sources.join(', ')}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default EffectivePermissions;
