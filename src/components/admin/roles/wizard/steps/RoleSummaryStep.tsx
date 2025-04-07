"use client";

import React from 'react';
import { WizardData } from '../RoleWizardContainer';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  ClipboardList, 
  Shield, 
  GitMerge,
  Globe,
  Building,
  Check,
  X
} from 'lucide-react';

interface RoleSummaryStepProps {
  data: WizardData;
}

export function RoleSummaryStep({ data }: RoleSummaryStepProps) {
  const { basicInfo, permissions, inheritance } = data;
  
  // Count total permissions
  const totalPermissions = Object.values(permissions).reduce(
    (total, actions) => total + actions.length, 
    0
  );
  
  // Get resource categories
  const resourceCategories = Object.keys(permissions);
  
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-medium">Review Role</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Review the role configuration before creating it.
        </p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Basic Information */}
        <div className="space-y-4">
          <div className="flex items-center">
            <ClipboardList className="h-5 w-5 text-primary mr-2" />
            <h3 className="text-md font-medium">Basic Information</h3>
          </div>
          
          <div className="bg-muted/20 rounded-md p-4 space-y-3">
            <div>
              <p className="text-sm text-muted-foreground">Name</p>
              <p className="font-medium">{basicInfo.name}</p>
            </div>
            
            <div>
              <p className="text-sm text-muted-foreground">Description</p>
              <p>{basicInfo.description}</p>
            </div>
            
            <div>
              <p className="text-sm text-muted-foreground">Scope</p>
              <div className="flex items-center mt-1">
                {basicInfo.scope === 'tenant' ? (
                  <>
                    <Building className="h-4 w-4 mr-1 text-primary" />
                    <span>Tenant-wide</span>
                  </>
                ) : (
                  <>
                    <Globe className="h-4 w-4 mr-1 text-primary" />
                    <span>Site-specific</span>
                  </>
                )}
              </div>
            </div>
            
            {basicInfo.scope === 'site' && basicInfo.siteId && (
              <div>
                <p className="text-sm text-muted-foreground">Site ID</p>
                <p className="font-mono text-sm">{basicInfo.siteId}</p>
              </div>
            )}
          </div>
        </div>
        
        {/* Inheritance */}
        <div className="space-y-4">
          <div className="flex items-center">
            <GitMerge className="h-5 w-5 text-primary mr-2" />
            <h3 className="text-md font-medium">Role Inheritance</h3>
          </div>
          
          <div className="bg-muted/20 rounded-md p-4">
            {inheritance.parentRoles.length === 0 ? (
              <div className="flex items-center text-muted-foreground">
                <X className="h-4 w-4 mr-1" />
                <span>No parent roles selected</span>
              </div>
            ) : (
              <div className="space-y-3">
                <p className="text-sm text-muted-foreground">Inherits from {inheritance.parentRoles.length} role(s):</p>
                <div className="space-y-2">
                  {inheritance.parentRoles.map(role => (
                    <div key={role.id} className="flex items-center">
                      <Check className="h-4 w-4 text-green-500 mr-1" />
                      <span>{role.name}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* Permissions */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <Shield className="h-5 w-5 text-primary mr-2" />
            <h3 className="text-md font-medium">Permissions</h3>
          </div>
          <Badge variant="secondary">
            {totalPermissions} permission{totalPermissions !== 1 ? 's' : ''}
          </Badge>
        </div>
        
        {totalPermissions === 0 ? (
          <div className="bg-muted/20 rounded-md p-4 text-center">
            <p className="text-muted-foreground">No permissions selected</p>
          </div>
        ) : (
          <div className="bg-muted/20 rounded-md p-4">
            <ScrollArea className="h-[200px] pr-4">
              <div className="space-y-4">
                {resourceCategories.map(resource => {
                  const actions = permissions[resource];
                  
                  return (
                    <div key={resource} className="space-y-2">
                      <h4 className="font-medium capitalize">{resource}</h4>
                      <div className="flex flex-wrap gap-2">
                        {actions.map(action => (
                          <Badge key={action} variant="outline">
                            {action}
                          </Badge>
                        ))}
                      </div>
                      <Separator className="mt-2" />
                    </div>
                  );
                })}
              </div>
            </ScrollArea>
          </div>
        )}
      </div>
    </div>
  );
}
