'use client';

import { useState, useEffect, useCallback } from 'react';
import { User, NewUser, UpdateUser } from './useUsers';
import { ACL } from '../../auth/utils/accessControl';

export interface UserFormData {
  id: string;
  name: string;
  email: string;
  password: string;
  siteIds: string[];
}

export interface UseUserFormProps {
  user?: User;
  onSubmit: (user: NewUser | UpdateUser) => Promise<void>;
  onCancel: () => void;
  isSubmitting: boolean;
  error?: string | null;
  sites: { id: string; name: string }[];
}

export interface UseUserFormReturn {
  // Form data
  formData: UserFormData;
  acl: ACL;
  errors: Record<string, string>;
  
  // Form state
  isExistingUser: boolean;
  
  // Handlers
  updateFormField: (name: string, value: any) => void;
  handleACLChange: (updatedAcl: ACL) => void;
  handleSubmit: (e: React.FormEvent) => Promise<void>;
}

/**
 * Hook for UserForm component
 * 
 * Handles form state, validation, and submission
 */
export function useUserForm({
  user,
  onSubmit,
  onCancel,
  isSubmitting,
  error,
  sites = []
}: UseUserFormProps): UseUserFormReturn {
  // Form data state
  const [formData, setFormData] = useState<UserFormData>({
    id: user?.id || '',
    name: user?.name || '',
    email: user?.email || '',
    password: '',
    siteIds: user?.siteIds || [],
  });
  
  // ACL state
  const [acl, setAcl] = useState<ACL>(
    user?.acl || { userId: 'new-user', entries: [] }
  );
  
  // Validation errors
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
  
  // Validate form data
  const validate = useCallback((): boolean => {
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
  }, [formData, user]);
  
  // Update form field
  const updateFormField = useCallback((name: string, value: any) => {
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Clear error when field is edited
    if (errors[name]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  }, [errors]);
  
  // Handle ACL change
  const handleACLChange = useCallback((updatedAcl: ACL) => {
    setAcl(updatedAcl);
  }, []);
  
  // Handle form submission
  const handleSubmit = useCallback(async (e: React.FormEvent) => {
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
  }, [formData, acl, user, onSubmit, validate]);
  
  return {
    // Form data
    formData,
    acl,
    errors,
    
    // Form state
    isExistingUser: !!user,
    
    // Handlers
    updateFormField,
    handleACLChange,
    handleSubmit
  };
}
