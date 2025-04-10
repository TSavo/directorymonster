"use client";

import React from 'react';
import { RoleFormContainer, RoleFormContainerProps } from './RoleFormContainer';
import { RoleFormValues } from './hooks/useRoleForm';
import { Role } from '@/types/role';

interface SiteOption {
  id: string;
  name: string;
}

interface RoleFormProps {
  role?: Role;
  tenantId: string;
  siteOptions: SiteOption[];
  onSubmit: (data: RoleFormValues) => void;
  onCancel: () => void;
}

export function RoleForm(props: RoleFormProps) {
  return <RoleFormContainer {...props} />;
}

export default RoleForm;
