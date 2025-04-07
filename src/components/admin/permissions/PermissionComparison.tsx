"use client";

import React, { useState } from 'react';
import { 
  AlertCircle, 
  Download, 
  Check, 
  X,
  ChevronDown,
  ChevronRight
} from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Role, Permission, ResourceType, PermissionAction } from '@/types/role';

interface User {
  id: string;
  name: string;
  email: string;
  avatarUrl?: string;
}

interface PermissionComparisonProps {
  roles: Role[];
  users: User[];
  isLoading: boolean;
  error: string | null;
  onExport: (data: any) => void;
}

type ComparisonType = 'roles' | 'users';
type ComparisonItem = Role | User;

export function PermissionComparison({
  roles,
  users,
  isLoading,
  error,
  onExport
}: PermissionComparisonProps) {
  const [comparisonType, setComparisonType] = useState<ComparisonType>('roles');
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [showComparison, setShowComparison] = useState(false);
  const [showDifferencesOnly, setShowDifferencesOnly] = useState(false);
  const [expandedResources, setExpandedResources] = useState<Record<string, boolean>>({});

  // Mock data for comparison results
  // In a real implementation, this would be fetched from the API
  const mockComparisonResults = {
    'user': {
      'create': { 'Admin': true, 'Editor': false, 'Viewer': false },
      'read': { 'Admin': true, 'Editor': false, 'Viewer': true },
      'update': { 'Admin': true, 'Editor': false, 'Viewer': false },
      'delete': { 'Admin': true, 'Editor': false, 'Viewer': false }
    },
    'role': {
      'read': { 'Admin': true, 'Editor': false, 'Viewer': true }
    },
    'content': {
      'create': { 'Admin': false, 'Editor': true, 'Viewer': false },
      'read': { 'Admin': false, 'Editor': true, 'Viewer': true },
      'update': { 'Admin': false, 'Editor': true, 'Viewer': false }
    }
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

  // Toggle item selection
  const toggleItemSelection = (id: string) => {
    setSelectedItems(prev => 
      prev.includes(id)
        ? prev.filter(itemId => itemId !== id)
        : [...prev, id]
    );
  };

  // Start comparison
  const startComparison = () => {
    setShowComparison(true);
  };

  // Reset comparison
  const resetComparison = () => {
    setShowComparison(false);
    setSelectedItems([]);
    setShowDifferencesOnly(false);
  };

  // Export comparison results
  const handleExport = () => {
    onExport({
      type: comparisonType,
      items: selectedItems,
      results: mockComparisonResults
    });
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

  // Check if resource has differences
  const resourceHasDifferences = (resource: string): boolean => {
    const resourceData = mockComparisonResults[resource as keyof typeof mockComparisonResults];
    if (!resourceData) return false;
    
    return Object.keys(resourceData).some(action => {
      const actionData = resourceData[action as keyof typeof resourceData];
      const values = Object.values(actionData);
      return values.some(v => v) && values.some(v => !v); // Some true, some false
    });
  };

  // Get selected items
  const getSelectedItems = (): ComparisonItem[] => {
    if (comparisonType === 'roles') {
      return roles.filter(role => selectedItems.includes(role.id));
    } else {
      return users.filter(user => selectedItems.includes(user.id));
    }
  };

  // Get filtered resources based on differences only toggle
  const getFilteredResources = (): string[] => {
    const resources = Object.keys(mockComparisonResults);
    
    if (!showDifferencesOnly) {
      return resources;
    }
    
    return resources.filter(resource => resourceHasDifferences(resource));
  };

  // Loading state
  if (isLoading) {
    return (
      <div data-testid="permission-comparison-loading">
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
      <div className="rounded-md bg-red-50 p-4 my-4" data-testid="permission-comparison-error">
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
          <h2 className="text-lg font-medium">Permission Comparison</h2>
          <p className="text-sm text-gray-500 mt-1">
            Compare permissions between roles or users
          </p>
        </div>
      </div>

      <Tabs 
        value={comparisonType} 
        onValueChange={(value) => {
          setComparisonType(value as ComparisonType);
          setSelectedItems([]);
          setShowComparison(false);
        }}
      >
        <TabsList className="mb-4">
          <TabsTrigger value="roles">Compare Roles</TabsTrigger>
          <TabsTrigger value="users">Compare Users</TabsTrigger>
        </TabsList>
      </Tabs>

      {!showComparison ? (
        <div className="border rounded-md p-6">
          <h3 className="text-md font-medium mb-4">
            Select {comparisonType} to compare
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
            {comparisonType === 'roles' ? (
              roles.map(role => (
                <div key={role.id} className="flex items-center space-x-2 p-3 border rounded-md">
                  <Checkbox 
                    id={`select-role-${role.id}`}
                    data-testid={`select-role-${role.id}`}
                    checked={selectedItems.includes(role.id)}
                    onCheckedChange={() => toggleItemSelection(role.id)}
                  />
                  <Label htmlFor={`select-role-${role.id}`} className="flex-1 cursor-pointer">
                    <div className="font-medium">{role.name}</div>
                    <div className="text-sm text-gray-500">{role.description}</div>
                  </Label>
                </div>
              ))
            ) : (
              users.map(user => (
                <div key={user.id} className="flex items-center space-x-2 p-3 border rounded-md">
                  <Checkbox 
                    id={`select-user-${user.id}`}
                    data-testid={`select-user-${user.id}`}
                    checked={selectedItems.includes(user.id)}
                    onCheckedChange={() => toggleItemSelection(user.id)}
                  />
                  <Label htmlFor={`select-user-${user.id}`} className="flex-1 cursor-pointer">
                    <div className="font-medium">{user.name}</div>
                    <div className="text-sm text-gray-500">{user.email}</div>
                  </Label>
                </div>
              ))
            )}
          </div>
          
          <div className="flex justify-end">
            <Button
              onClick={startComparison}
              disabled={selectedItems.length < 2}
            >
              Compare
            </Button>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-md font-medium">Comparison Results</h3>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <Switch
                  id="show-differences"
                  checked={showDifferencesOnly}
                  onCheckedChange={setShowDifferencesOnly}
                />
                <Label htmlFor="show-differences">Show differences only</Label>
              </div>
              <Button
                variant="outline"
                onClick={handleExport}
                className="flex items-center gap-1"
              >
                <Download className="h-4 w-4" />
                Export Results
              </Button>
              <Button
                variant="outline"
                onClick={resetComparison}
              >
                New Comparison
              </Button>
            </div>
          </div>
          
          <div className="border rounded-md overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Permission
                  </th>
                  {getSelectedItems().map(item => (
                    <th key={item.id} scope="col" className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {item.name}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {getFilteredResources().map(resource => {
                  const resourceData = mockComparisonResults[resource as keyof typeof mockComparisonResults];
                  if (!resourceData) return null;
                  
                  const isExpanded = isResourceExpanded(resource);
                  
                  return (
                    <React.Fragment key={resource}>
                      <tr className="bg-gray-50">
                        <td 
                          colSpan={getSelectedItems().length + 1}
                          className="px-6 py-3 cursor-pointer hover:bg-gray-100"
                          onClick={() => toggleResourceExpansion(resource)}
                        >
                          <div className="flex items-center">
                            {isExpanded ? (
                              <ChevronDown className="h-5 w-5 text-gray-400 mr-2" />
                            ) : (
                              <ChevronRight className="h-5 w-5 text-gray-400 mr-2" />
                            )}
                            <span className="font-medium">{getResourceDisplayName(resource as ResourceType)}</span>
                          </div>
                        </td>
                      </tr>
                      
                      {isExpanded && Object.keys(resourceData).map(action => {
                        const actionData = resourceData[action as keyof typeof resourceData];
                        
                        // Skip if showing differences only and all values are the same
                        if (showDifferencesOnly) {
                          const values = Object.values(actionData);
                          const allSame = values.every(v => v === values[0]);
                          if (allSame) return null;
                        }
                        
                        return (
                          <tr key={`${resource}-${action}`} className="hover:bg-gray-50">
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                              {getActionDisplayName(resource as ResourceType, action as PermissionAction)}
                            </td>
                            {getSelectedItems().map(item => {
                              const hasPermission = actionData[item.name];
                              
                              return (
                                <td key={`${resource}-${action}-${item.id}`} className="px-6 py-4 whitespace-nowrap text-center">
                                  {hasPermission ? (
                                    <Check className="h-5 w-5 text-green-500 mx-auto" />
                                  ) : (
                                    <X className="h-5 w-5 text-red-500 mx-auto" />
                                  )}
                                </td>
                              );
                            })}
                          </tr>
                        );
                      })}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

export default PermissionComparison;
