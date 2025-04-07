"use client";

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { 
  Form, 
  FormControl, 
  FormField, 
  FormItem, 
  FormLabel, 
  FormMessage 
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Role, RoleScope, RoleType } from '@/types/role';

// Form schema
const formSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  description: z.string().optional(),
  scope: z.nativeEnum(RoleScope),
  siteId: z.string().optional(),
  type: z.nativeEnum(RoleType).default(RoleType.CUSTOM),
  tenantId: z.string()
});

type FormValues = z.infer<typeof formSchema>;

interface SiteOption {
  id: string;
  name: string;
}

interface RoleFormProps {
  role?: Role;
  tenantId: string;
  siteOptions: SiteOption[];
  onSubmit: (data: FormValues) => void;
  onCancel: () => void;
}

export function RoleForm({
  role,
  tenantId,
  siteOptions,
  onSubmit,
  onCancel
}: RoleFormProps) {
  const isEditMode = !!role;
  const [selectedScope, setSelectedScope] = useState<RoleScope>(
    role?.scope || RoleScope.TENANT
  );

  // Initialize form with default values or existing role data
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: role?.name || '',
      description: role?.description || '',
      scope: role?.scope || RoleScope.TENANT,
      siteId: role?.siteId || undefined,
      type: role?.type || RoleType.CUSTOM,
      tenantId
    }
  });

  // Handle form submission
  const handleSubmit = (values: FormValues) => {
    onSubmit(values);
  };

  // Handle scope change
  const handleScopeChange = (value: RoleScope) => {
    setSelectedScope(value);
    
    // Clear siteId if scope is not SITE
    if (value !== RoleScope.SITE) {
      form.setValue('siteId', undefined);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-medium">{isEditMode ? 'Edit Role' : 'Create Role'}</h2>
        <p className="text-sm text-gray-500 mt-1">
          {isEditMode 
            ? 'Update the role details below.' 
            : 'Define a new role with specific permissions.'}
        </p>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
          {/* Role Name */}
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Name</FormLabel>
                <FormControl>
                  <Input 
                    placeholder="Enter role name" 
                    {...field} 
                    disabled={isEditMode && role?.type === RoleType.SYSTEM}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Role Description */}
          <FormField
            control={form.control}
            name="description"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Description</FormLabel>
                <FormControl>
                  <Textarea 
                    placeholder="Enter role description" 
                    {...field} 
                    value={field.value || ''}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Role Scope */}
          <FormField
            control={form.control}
            name="scope"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Scope</FormLabel>
                <Select
                  onValueChange={(value) => {
                    field.onChange(value);
                    handleScopeChange(value as RoleScope);
                  }}
                  defaultValue={field.value}
                  disabled={isEditMode} // Can't change scope in edit mode
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select scope" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value={RoleScope.GLOBAL}>Global</SelectItem>
                    <SelectItem value={RoleScope.TENANT}>Tenant</SelectItem>
                    <SelectItem value={RoleScope.SITE}>Site</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Site Selection (only shown when scope is SITE) */}
          {selectedScope === RoleScope.SITE && (
            <FormField
              control={form.control}
              name="siteId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Site</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                    disabled={isEditMode} // Can't change site in edit mode
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select site" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {siteOptions.map((site) => (
                        <SelectItem key={site.id} value={site.id}>
                          {site.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          )}

          {/* Form Actions */}
          <div className="flex justify-end space-x-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
            >
              Cancel
            </Button>
            <Button type="submit">
              {isEditMode ? 'Save' : 'Create'}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}

export default RoleForm;
