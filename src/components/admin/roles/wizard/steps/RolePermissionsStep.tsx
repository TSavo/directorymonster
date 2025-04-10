"use client";

import React, { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PermissionTemplateSelector } from '../../templates/PermissionTemplateSelector';
import { PermissionMatrix } from '../../PermissionMatrix';
import { ResourceType, PermissionAction, RoleScope } from '@/types/role';
import { Button } from '@/components/ui/button';
import { AlertCircle, RefreshCw } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

interface PermissionTemplate {
  id: string;
  name: string;
  description: string;
  permissions: Record<string, string[]>;
  category: string;
}

interface RolePermissionsStepProps {
  data: Record<string, string[]>;
  onUpdate: (data: Record<string, string[]>) => void;
  scope: RoleScope;
  siteId?: string;
}

export function RolePermissionsStep({ data, onUpdate, scope, siteId }: RolePermissionsStepProps) {
  const [activeTab, setActiveTab] = useState<string>('templates');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resources, setResources] = useState<ResourceType[]>([]);
  const [actions, setActions] = useState<PermissionAction[]>([]);
  
  useEffect(() => {
    const fetchResourcesAndActions = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        const response = await fetch('/api/admin/permissions/resources');
        
        if (!response.ok) {
          throw new Error('Failed to fetch permission resources');
        }
        
        const data = await response.json();
        setResources(data.resources || []);
        setActions(data.actions || []);
      } catch (error) {
        console.error('Error fetching resources:', error);
        setError('Failed to load permission resources. Please try again.');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchResourcesAndActions();
  }, []);

  const handleSelectTemplate = (template: PermissionTemplate) => {
    onUpdate(template.permissions);
    setActiveTab('custom');
  };

  const handleResetPermissions = () => {
    onUpdate({});
  };

  const hasPermissions = Object.keys(data).length > 0;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-medium">Role Permissions</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Define what actions this role can perform.
        </p>
      </div>
      
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="templates">Permission Templates</TabsTrigger>
          <TabsTrigger value="custom">Custom Permissions</TabsTrigger>
        </TabsList>
        
        <TabsContent value="templates" className="pt-4">
          <PermissionTemplateSelector 
            onSelectTemplate={handleSelectTemplate}
            scope={scope}
            siteId={siteId}
          />
        </TabsContent>
        
        <TabsContent value="custom" className="pt-4">
          <div className="space-y-4">
            {hasPermissions && (
              <div className="flex justify-end">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleResetPermissions}
                  className="flex items-center gap-1"
                >
                  <RefreshCw className="h-4 w-4" />
                  Reset Permissions
                </Button>
              </div>
            )}
            
            <PermissionMatrix
              selectedPermissions={data}
              onChange={onUpdate}
              resources={resources}
              actions={actions}
              isLoading={isLoading}
              scope={scope}
              siteId={siteId}
            />
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
