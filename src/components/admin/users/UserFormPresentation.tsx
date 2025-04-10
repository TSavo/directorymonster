'use client';

import React from 'react';
import { UserBasicInfo } from './UserBasicInfo';
import { UserSiteAssociations } from './UserSiteAssociations';
import { UserPermissions } from './UserPermissions';
import { ACL } from '../auth/utils/accessControl';
import { UserFormData } from './hooks/useUserForm';
import { Button } from '@/components/ui/Button';

export interface UserFormPresentationProps {
  // Form data
  formData: UserFormData;
  acl: ACL;
  errors: Record<string, string>;

  // Form state
  isExistingUser: boolean;
  isSubmitting: boolean;
  error?: string | null;
  sites: { id: string; name: string }[];

  // Handlers
  updateFormField: (name: string, value: any) => void;
  handleACLChange: (updatedAcl: ACL) => void;
  handleSubmit: (e: React.FormEvent) => Promise<void>;
  onCancel: () => void;
}

/**
 * UserFormPresentation Component
 *
 * Pure UI component for rendering the user form
 */
export function UserFormPresentation({
  // Form data
  formData,
  acl,
  errors,

  // Form state
  isExistingUser,
  isSubmitting,
  error,
  sites,

  // Handlers
  updateFormField,
  handleACLChange,
  handleSubmit,
  onCancel
}: UserFormPresentationProps) {
  return (
    <form onSubmit={handleSubmit} className="space-y-6" data-testid="user-form">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded" role="alert" data-testid="form-error">
          {error}
        </div>
      )}

      <UserBasicInfo
        formData={formData}
        errors={errors}
        onChange={updateFormField}
        isExistingUser={isExistingUser}
      />

      <UserSiteAssociations
        selectedSiteIds={formData.siteIds}
        sites={sites}
        onChange={updateFormField}
        error={errors.siteIds}
      />

      <div className="border-t border-gray-200 pt-4 mt-4">
        <h2 className="text-lg font-medium mb-4">User Permissions</h2>
        <UserPermissions
          acl={acl}
          sites={sites.filter(site => formData.siteIds.includes(site.id))}
          onChange={handleACLChange}
        />
      </div>

      <div className="flex justify-end space-x-3 pt-4">
        <Button
          type="button"
          onClick={onCancel}
          variant="secondary"
          isLoading={isSubmitting}
          data-testid="cancel-button"
        >
          Cancel
        </Button>
        <Button
          type="submit"
          variant="primary"
          isLoading={isSubmitting}
          data-testid="submit-button"
        >
          {isExistingUser ? 'Update User' : 'Create User'}
        </Button>
      </div>
    </form>
  );
}
