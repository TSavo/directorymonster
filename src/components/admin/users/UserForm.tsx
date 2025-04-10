'use client';

import React from 'react';
import { UserFormContainer } from './UserFormContainer';
import { User, NewUser, UpdateUser } from './hooks/useUsers';

export interface UserFormProps {
  user?: User;
  onSubmit: (user: NewUser | UpdateUser) => Promise<void>;
  onCancel: () => void;
  isSubmitting: boolean;
  error?: string | null;
  sites: { id: string; name: string }[];
}

/**
 * UserForm Component
 *
 * This component provides a form for creating and editing users.
 * It has been refactored to use a container/presentation pattern for better
 * separation of concerns, testability, and maintainability.
 *
 * Features:
 * - Create new users or edit existing ones
 * - Manage user basic information (name, email, password)
 * - Manage site associations
 * - Configure user permissions (ACLs)
 * - Form validation with error messages
 */
export function UserForm({
  user,
  onSubmit,
  onCancel,
  isSubmitting,
  error,
  sites = []
}: UserFormProps) {
  return (
    <UserFormContainer
      user={user}
      onSubmit={onSubmit}
      onCancel={onCancel}
      isSubmitting={isSubmitting}
      error={error}
      sites={sites}
    />
  );
}

export default UserForm;
