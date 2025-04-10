"use client";

import React, { useState } from 'react';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { ResourceType, PermissionAction, RoleScope } from '@/types/role';
import { Button } from '@/components/ui/button';
import { ChevronDown, ChevronRight, HelpCircle } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { ScrollArea } from '@/components/ui/scroll-area';

interface PermissionMatrixProps {
  selectedPermissions: Record<string, string[]>;
  onChange: (permissions: Record<string, string[]>) => void;
  resources: ResourceType[];
  actions: PermissionAction[];
  isLoading: boolean;
  scope: RoleScope;
  siteId?: string;
}

export function PermissionMatrix({
  selectedPermissions,
  onChange,
  resources,
  actions,
  isLoading,
  scope,
  siteId
}: PermissionMatrixProps) {
  const [expandedResources, setExpandedResources] = useState<Record<string, boolean>>(
    resources.reduce((acc, resource) => ({ ...acc, [resource]: true }), {})
  );

  const toggleResourceExpansion = (resource: string) => {
    setExpandedResources(prev => ({
      ...prev,
      [resource]: !prev[resource]
    }));
  };

  const togglePermission = (resource: string, action: string) => {
    const currentActions = selectedPermissions[resource] || [];
    const newActions = currentActions.includes(action)
      ? currentActions.filter(a => a !== action)
      : [...currentActions, action];

    const newPermissions = {
      ...selectedPermissions,
      [resource]: newActions
    };

    // Remove resource if no actions are selected
    if (newActions.length === 0) {
      delete newPermissions[resource];
    }

    onChange(newPermissions);
  };

  const toggleAllActionsForResource = (resource: string, selected: boolean) => {
    const newPermissions = { ...selectedPermissions };

    if (selected) {
      newPermissions[resource] = [...actions];
    } else {
      delete newPermissions[resource];
    }

    onChange(newPermissions);
  };

  const isAllActionsSelected = (resource: string) => {
    const selectedActions = selectedPermissions[resource] || [];
    return selectedActions.length === actions.length;
  };

  const isSomeActionsSelected = (resource: string) => {
    const selectedActions = selectedPermissions[resource] || [];
    return selectedActions.length > 0 && selectedActions.length < actions.length;
  };

  if (isLoading) {
    return (
      <div className="space-y-4" data-testid="loading-skeleton">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-60 w-full" />
      </div>
    );
  }

  if (resources.length === 0 || actions.length === 0) {
    return (
      <div className="text-center py-10 border rounded-md bg-muted/20">
        <p className="text-muted-foreground">No permission resources available.</p>
      </div>
    );
  }

  return (
    <div className="border rounded-md">
      <ScrollArea className="h-[400px]">
        <div className="p-4 space-y-4">
          <div className="grid grid-cols-[1fr_auto] gap-4 pb-2 border-b">
            <div className="font-medium">Resource</div>
            <div className="grid grid-cols-5 gap-4">
              {actions.map(action => (
                <div key={action} className="text-center font-medium capitalize">
                  {action}
                </div>
              ))}
            </div>
          </div>

          {resources.map(resource => {
            const isExpanded = expandedResources[resource];

            return (
              <div key={resource} className="space-y-2">
                <div className="grid grid-cols-[1fr_auto] gap-4 items-center">
                  <div className="flex items-center">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="p-0 h-6 w-6 mr-2"
                      onClick={() => toggleResourceExpansion(resource)}
                    >
                      {isExpanded ? (
                        <ChevronDown className="h-4 w-4" />
                      ) : (
                        <ChevronRight className="h-4 w-4" />
                      )}
                    </Button>

                    <Checkbox
                      id={`resource-${resource}`}
                      checked={isAllActionsSelected(resource)}
                      indeterminate={isSomeActionsSelected(resource)}
                      onCheckedChange={(checked) =>
                        toggleAllActionsForResource(resource, checked === true)
                      }
                      data-testid={`toggle-all-${resource}`}
                    />

                    <Label
                      htmlFor={`resource-${resource}`}
                      className="ml-2 font-medium capitalize cursor-pointer"
                    >
                      {resource}
                    </Label>

                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <HelpCircle className="h-4 w-4 text-muted-foreground ml-1" />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p className="max-w-xs">
                            Permissions for {resource} management
                          </p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>

                  <div className="grid grid-cols-5 gap-4">
                    {actions.map(action => (
                      <div key={action} className="flex justify-center">
                        <Checkbox
                          id={`permission-${resource}-${action}`}
                          checked={(selectedPermissions[resource] || []).includes(action)}
                          onCheckedChange={() => togglePermission(resource, action)}
                          data-testid={`permission-${resource}-${action}`}
                        />
                      </div>
                    ))}
                  </div>
                </div>

                {isExpanded && (
                  <div className="pl-10 pr-4 py-2 bg-muted/10 rounded-md">
                    <p className="text-sm text-muted-foreground">
                      {getResourceDescription(resource)}
                    </p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </ScrollArea>
    </div>
  );
}

// Helper function to get resource descriptions
function getResourceDescription(resource: string): string {
  const descriptions: Record<string, string> = {
    user: 'Manage user accounts, profiles, and authentication',
    role: 'Manage roles and permissions',
    site: 'Manage sites, domains, and site settings',
    category: 'Manage content categories and hierarchies',
    listing: 'Manage listings and listing properties',
    content: 'Manage content pages and blocks',
    setting: 'Manage system and tenant settings',
    tenant: 'Manage tenant configuration and properties',
    audit: 'Access audit logs and activity history'
  };

  return descriptions[resource] || `Manage ${resource} resources`;
}
