"use client";

import React, { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RoleScope } from '@/types/role';
import { AlertCircle, HelpCircle } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface Site {
  id: string;
  name: string;
  slug: string;
  domain: string;
}

interface RoleBasicInfoStepProps {
  data: {
    name: string;
    description: string;
    scope: RoleScope;
    siteId?: string;
  };
  onUpdate: (data: Partial<RoleBasicInfoStepProps['data']>) => void;
}

export function RoleBasicInfoStep({ data, onUpdate }: RoleBasicInfoStepProps) {
  const [sites, setSites] = useState<Site[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchSites = async () => {
      if (data.scope === 'site') {
        try {
          setIsLoading(true);
          setError(null);
          
          const response = await fetch('/api/admin/sites');
          
          if (!response.ok) {
            throw new Error('Failed to fetch sites');
          }
          
          const sitesData = await response.json();
          setSites(sitesData.sites || []);
        } catch (error) {
          console.error('Error fetching sites:', error);
          setError('Failed to load sites. Please try again.');
        } finally {
          setIsLoading(false);
        }
      }
    };
    
    fetchSites();
  }, [data.scope]);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-medium">Basic Information</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Provide basic details about the role you're creating.
        </p>
      </div>
      
      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="role-name">
            Role Name <span className="text-destructive">*</span>
          </Label>
          <Input
            id="role-name"
            placeholder="e.g., Content Editor"
            value={data.name}
            onChange={(e) => onUpdate({ name: e.target.value })}
          />
          <p className="text-xs text-muted-foreground">
            Choose a descriptive name that clearly indicates the role's purpose.
          </p>
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="role-description">
            Description <span className="text-destructive">*</span>
          </Label>
          <Textarea
            id="role-description"
            placeholder="Describe the purpose and responsibilities of this role..."
            value={data.description}
            onChange={(e) => onUpdate({ description: e.target.value })}
            rows={3}
          />
          <p className="text-xs text-muted-foreground">
            Provide a clear description to help others understand what this role is for.
          </p>
        </div>
        
        <div className="space-y-2">
          <div className="flex items-center">
            <Label>Role Scope <span className="text-destructive">*</span></Label>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <HelpCircle className="h-4 w-4 text-muted-foreground ml-1" />
                </TooltipTrigger>
                <TooltipContent>
                  <p className="max-w-xs">
                    Tenant-wide roles apply across all sites. Site-specific roles only apply to a single site.
                  </p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
          
          <RadioGroup
            value={data.scope}
            onValueChange={(value) => onUpdate({ scope: value as RoleScope, siteId: value === 'tenant' ? undefined : data.siteId })}
            className="flex flex-col space-y-1"
          >
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="tenant" id="scope-tenant" />
              <Label htmlFor="scope-tenant" className="cursor-pointer">Tenant-wide</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="site" id="scope-site" />
              <Label htmlFor="scope-site" className="cursor-pointer">Site-specific</Label>
            </div>
          </RadioGroup>
        </div>
        
        {data.scope === 'site' && (
          <div className="space-y-2">
            <Label htmlFor="site-select">
              Select Site <span className="text-destructive">*</span>
            </Label>
            <Select
              value={data.siteId}
              onValueChange={(value) => onUpdate({ siteId: value })}
              disabled={isLoading}
            >
              <SelectTrigger id="site-select">
                <SelectValue placeholder="Select a site" />
              </SelectTrigger>
              <SelectContent>
                {error ? (
                  <div className="flex items-center p-2 text-sm text-destructive">
                    <AlertCircle className="h-4 w-4 mr-2" />
                    {error}
                  </div>
                ) : isLoading ? (
                  <div className="p-2 text-sm text-muted-foreground">Loading sites...</div>
                ) : sites.length === 0 ? (
                  <div className="p-2 text-sm text-muted-foreground">No sites available</div>
                ) : (
                  sites.map((site) => (
                    <SelectItem key={site.id} value={site.id}>
                      {site.name} ({site.domain})
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              The role will only be applicable to the selected site.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
