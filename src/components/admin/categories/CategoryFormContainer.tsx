'use client';

import React, { useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { CategoryFormProps } from './components/form/types';
import { useCategoryForm } from './components/form/useCategoryForm';
import { CategoryFormPresentation } from './CategoryFormPresentation';

export function CategoryFormContainer({ 
  siteSlug, 
  categoryId, 
  initialData, 
  onCancel, 
  onSaved 
}: CategoryFormProps) {
  const router = useRouter();
  
  // Use custom hook for form logic
  const {
    formData,
    touched,
    validationErrors,
    isLoading,
    error,
    success,
    isEditMode,
    parentCategories,
    loadingParents,
    handleChange,
    handleBlur,
    handleSubmit
  } = useCategoryForm(siteSlug, categoryId, initialData, onSaved);
  
  // Handle cancel button click
  const handleCancel = useCallback(() => {
    if (onCancel) {
      onCancel();
    } else {
      router.push(`/admin/sites/${siteSlug}/categories`);
    }
  }, [onCancel, router, siteSlug]);
  
  return (
    <CategoryFormPresentation
      formData={formData}
      touched={touched}
      validationErrors={validationErrors}
      isLoading={isLoading}
      error={error}
      success={success}
      isEditMode={isEditMode}
      parentCategories={parentCategories}
      loadingParents={loadingParents}
      handleChange={handleChange}
      handleBlur={handleBlur}
      handleSubmit={handleSubmit}
      handleCancel={handleCancel}
    />
  );
}

export default CategoryFormContainer;
