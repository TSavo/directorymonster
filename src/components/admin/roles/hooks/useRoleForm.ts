"use client";

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
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

export type RoleFormValues = z.infer<typeof formSchema>;

export interface SiteOption {
  id: string;
  name: string;
}

export interface UseRoleFormProps {
  role?: Role;
  tenantId: string;
  siteOptions: SiteOption[];
  onSubmit: (data: RoleFormValues) => void;
  onCancel: () => void;
}

export interface UseRoleFormReturn {
  form: ReturnType<typeof useForm<RoleFormValues>>;
  isEditMode: boolean;
  selectedScope: RoleScope;
  handleSubmit: (values: RoleFormValues) => void;
  handleScopeChange: (value: RoleScope) => void;
  formSchema: typeof formSchema;
}

export function useRoleForm({
  role,
  tenantId,
  siteOptions,
  onSubmit,
  onCancel
}: UseRoleFormProps): UseRoleFormReturn {
  const isEditMode = !!role;
  const [selectedScope, setSelectedScope] = useState<RoleScope>(
    role?.scope || RoleScope.TENANT
  );

  // Initialize form with default values or existing role data
  const form = useForm<RoleFormValues>({
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
  const handleSubmit = (values: RoleFormValues) => {
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

  return {
    form,
    isEditMode,
    selectedScope,
    handleSubmit,
    handleScopeChange,
    formSchema
  };
}
