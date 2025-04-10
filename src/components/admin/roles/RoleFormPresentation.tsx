"use client";

import React from 'react';
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
import { Button } from '@/components/ui/Button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { RoleScope, RoleType } from '@/types/role';
import { UseRoleFormReturn, SiteOption } from './hooks/useRoleForm';

export interface RoleFormPresentationProps extends UseRoleFormReturn {
  siteOptions: SiteOption[];
  onCancel: () => void;
}

export function RoleFormPresentation({
  form,
  isEditMode,
  selectedScope,
  handleSubmit,
  handleScopeChange,
  siteOptions,
  onCancel
}: RoleFormPresentationProps) {
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
                    disabled={isEditMode && form.getValues('type') === RoleType.SYSTEM}
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
              variant="secondary"
              onClick={onCancel}
            >
              Cancel
            </Button>
            <Button type="submit" variant="primary">
              {isEditMode ? 'Save' : 'Create'}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
