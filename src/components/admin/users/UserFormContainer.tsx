'use client';

import React from 'react';
import { useUserForm } from './hooks/useUserForm';
import { UserFormPresentation } from './UserFormPresentation';
import { User, NewUser, UpdateUser } from './hooks/useUsers';

export interface UserFormContainerProps {
  user?: User;
  onSubmit: (user: NewUser | UpdateUser) => Promise<void>;
  onCancel: () => void;
  isSubmitting: boolean;
  error?: string | null;
  sites: { id: string; name: string }[];
}

/**
 * UserFormContainer Component
 * 
 * Container component that connects the hook and presentation components
 */
export function UserFormContainer({
  user,
  onSubmit,
  onCancel,
  isSubmitting,
  error,
  sites = []
}: UserFormContainerProps) {
  // Use the hook to get form data and handlers
  const userFormData = useUserForm({
    user,
    onSubmit,
    onCancel,
    isSubmitting,
    error,
    sites
  });
  
  // Return the presentation component with props from hook
  return (
    <UserFormPresentation
      {...userFormData}
      isSubmitting={isSubmitting}
      error={error}
      sites={sites}
      onCancel={onCancel}
    />
  );
}
