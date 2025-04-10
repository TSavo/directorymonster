"use client";

import React, { useState, useEffect } from 'react';
import { Role, RoleScope } from '@/types/role';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertCircle, HelpCircle, Info, Shield } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { ScrollArea } from '@/components/ui/scroll-area';

interface RoleInheritanceStepProps {
  data: {
    parentRoles: Role[];
  };
  onUpdate: (data: Partial<RoleInheritanceStepProps['data']>) => void;
  scope: RoleScope;
  siteId?: string;
}

export function RoleInheritanceStep({ data, onUpdate, scope, siteId }: RoleInheritanceStepProps) {
  const [availableRoles, setAvailableRoles] = useState<Role[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchAvailableRoles = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        // Build query parameters
        const params = new URLSearchParams();
        params.append('scope', scope);
        if (scope === 'site' && siteId) {
          params.append('siteId', siteId);
        }
        
        const response = await fetch(`/api/admin/roles?${params.toString()}`);
        
        if (!response.ok) {
          throw new Error('Failed to fetch roles');
        }
        
        const rolesData = await response.json();
        setAvailableRoles(rolesData.roles || []);
      } catch (error) {
        console.error('Error fetching roles:', error);
        setError('Failed to load available roles. Please try again.');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchAvailableRoles();
  }, [scope, siteId]);

  const toggleRoleSelection = (role: Role) => {
    const isSelected = data.parentRoles.some(r => r.id === role.id);
    
    if (isSelected) {
      onUpdate({
        parentRoles: data.parentRoles.filter(r => r.id !== role.id)
      });
    } else {
      onUpdate({
        parentRoles: [...data.parentRoles, role]
      });
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-medium">Role Inheritance</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Optionally inherit permissions from existing roles.
        </p>
      </div>
      
      <Alert>
        <Info className="h-4 w-4" />
        <AlertTitle>About Role Inheritance</AlertTitle>
        <AlertDescription>
          When a role inherits from another role, it automatically receives all permissions from the parent role.
          This is useful for creating role hierarchies and avoiding permission duplication.
        </AlertDescription>
      </Alert>
      
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-medium">Available Roles</h3>
          <Badge variant="outline" className="text-xs">
            {data.parentRoles.length} selected
          </Badge>
        </div>
        
        {isLoading ? (
          <div className="space-y-2">
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
          </div>
        ) : availableRoles.length === 0 ? (
          <div className="text-center p-4 border rounded-md bg-muted/20">
            <Shield className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">No roles available for inheritance.</p>
          </div>
        ) : (
          <ScrollArea className="h-[300px] border rounded-md p-2">
            <div className="space-y-2">
              {availableRoles.map(role => {
                const isSelected = data.parentRoles.some(r => r.id === role.id);
                
                return (
                  <div 
                    key={role.id} 
                    className={`flex items-start space-x-3 p-3 rounded-md transition-colors ${
                      isSelected ? 'bg-primary/5 border border-primary/20' : 'hover:bg-muted/20 border border-transparent'
                    }`}
                  >
                    <Checkbox
                      id={`role-${role.id}`}
                      checked={isSelected}
                      onCheckedChange={() => toggleRoleSelection(role)}
                      className="mt-1"
                    />
                    <div className="flex-1">
                      <div className="flex items-center">
                        <Label 
                          htmlFor={`role-${role.id}`} 
                          className="font-medium cursor-pointer"
                        >
                          {role.name}
                        </Label>
                        {role.type === 'system' && (
                          <Badge variant="secondary" className="ml-2">System</Badge>
                        )}
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <HelpCircle className="h-4 w-4 text-muted-foreground ml-1" />
                            </TooltipTrigger>
                            <TooltipContent>
                              <p className="max-w-xs">
                                {role.scope === 'tenant' ? 'Tenant-wide role' : 'Site-specific role'}
                              </p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </div>
                      <p className="text-sm text-muted-foreground">{role.description}</p>
                      <div className="mt-1 flex flex-wrap gap-1">
                        {role.permissions.slice(0, 3).map((permission, index) => (
                          <Badge key={index} variant="outline" className="text-xs">
                            {permission.resource}
                          </Badge>
                        ))}
                        {role.permissions.length > 3 && (
                          <Badge variant="outline" className="text-xs">
                            +{role.permissions.length - 3} more
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </ScrollArea>
        )}
      </div>
    </div>
  );
}
