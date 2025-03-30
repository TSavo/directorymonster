'use client';

import React, { useState, useEffect } from 'react';
import { User, NewUser, UpdateUser } from './hooks/useUsers';
import { UserPermissions } from './UserPermissions';
import { UserBasicInfo } from './UserBasicInfo';
import { UserSiteAssociations } from './UserSiteAssociations';
import { ACL } from '../auth/utils/accessControl';

interface UserFormProps {
  user?: User;
  onSubmit: (user: NewUser | UpdateUser) => Promise<void>;
  onCancel: () => void;
  isSubmitting: boolean;
  error?: string | null;
  sites: { id: string; name: string }[];
}

export function UserForm({
  user,
  onSubmit,
  onCancel,
  isSubmitting,
  error,
  sites = [],
}: UserFormProps) {
  const [formData, setFormData] = useState<any>({
    id: user?.id || '',
    name: user?.name || '',
    email: user?.email || '',
    password: '',
    siteIds: user?.siteIds || [],
  });
  
  const [acl, setAcl] = useState<ACL>(
    user?.acl || { userId: 'new-user', entries: [] }
  );
  
  const [errors, setErrors] = useState<Record<string, string>>({});
  
  // Update form data when user prop changes
  useEffect(() => {
    if (user) {
      setFormData({
        id: user.id,
        name: user.name,
        email: user.email,
        siteIds: user.siteIds || [],
        password: '',
      });
      
      setAcl(user.acl);
    }
  }, [user]);
  
  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.name) {
      newErrors.name = 'Name is required';
    }
    
    if (!formData.email) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email is invalid';
    }
    
    if (!user && !formData.password) {
      newErrors.password = 'Password is required for new users';
    } else if (formData.password && formData.password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters';
    }
    
    if (formData.siteIds.length === 0) {
      newErrors.siteIds = 'User must be associated with at least one site';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  const updateFormField = (name: string, value: any) => {
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Clear error when field is edited
    if (errors[name]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validate()) {
      return;
    }
    
    const userData = { ...formData, acl };
    
    // Remove password if it's empty for existing users
    if (user && !userData.password) {
      const { password, ...dataWithoutPassword } = userData;
      await onSubmit(dataWithoutPassword);
    } else {
      await onSubmit(userData);
    }
  };
  
  const handleACLChange = (updatedAcl: ACL) => {
    setAcl(updatedAcl);
  };
  
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
        isExistingUser={!!user}
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
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
          disabled={isSubmitting}
          data-testid="cancel-button"
        >
          Cancel
        </button>
        <button
          type="submit"
          className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700"
          disabled={isSubmitting}
          data-testid="submit-button"
        >
          {isSubmitting ? 'Saving...' : user ? 'Update User' : 'Create User'}
        </button>
      </div>
    </form>
  );
}

export default UserForm;
