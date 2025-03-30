'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { CategoryFormProps } from './components/form/types';
import {
  TextInput,
  TextArea,
  SelectField,
  StatusMessage,
  FormActions
} from './components/form';
import { useCategoryForm } from './components/form/useCategoryForm';

/**
 * Category form component for creating and editing categories
 */
export function CategoryForm({ siteSlug, categoryId, initialData, onCancel, onSaved }: CategoryFormProps) {
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
  const handleCancel = () => {
    if (onCancel) {
      onCancel();
    } else {
      router.push(`/admin/sites/${siteSlug}/categories`);
    }
  };
  
  // Convert parent categories to options for select field
  const parentOptions = [
    { value: '', label: 'No Parent (Top Level)' },
    ...parentCategories.map(category => ({
      value: category.id,
      label: category.name
    }))
  ];
  
  return (
    <form 
      onSubmit={handleSubmit} 
      className="space-y-6" 
      data-testid="category-form"
    >
      {/* Status messages */}
      <StatusMessage 
        error={error} 
        success={success} 
        isEditMode={isEditMode} 
      />
      
      {/* Name field */}
      <TextInput
        id="name"
        name="name"
        label="Name"
        value={formData.name}
        onChange={handleChange}
        onBlur={handleBlur}
        error={validationErrors.name}
        touched={touched.name}
        required
        testId="category-form-name"
      />
      
      {/* Slug field */}
      <TextInput
        id="slug"
        name="slug"
        label="Slug"
        value={formData.slug}
        onChange={handleChange}
        onBlur={handleBlur}
        error={validationErrors.slug}
        touched={touched.slug}
        required
        pattern="[a-z0-9-]+"
        title="Lowercase letters, numbers, and hyphens only"
        helperText="URL-friendly identifier. Use lowercase letters, numbers, and hyphens only."
        testId="category-form-slug"
      />
      
      {/* Meta Description field */}
      <TextArea
        id="metaDescription"
        name="metaDescription"
        label="Meta Description"
        value={formData.metaDescription}
        onChange={handleChange}
        onBlur={handleBlur}
        error={validationErrors.metaDescription}
        touched={touched.metaDescription}
        rows={3}
        helperText="Brief description used for SEO. Recommended 120-155 characters."
        testId="category-form-meta-description"
      />
      
      {/* Parent Category select */}
      <SelectField
        id="parentId"
        name="parentId"
        label="Parent Category"
        value={formData.parentId}
        onChange={handleChange}
        onBlur={handleBlur}
        error={validationErrors.parentId}
        touched={touched.parentId}
        options={parentOptions}
        loading={loadingParents}
        testId="category-form-parent"
      />
      
      {/* Order field */}
      <TextInput
        id="order"
        name="order"
        label="Display Order"
        value={formData.order}
        onChange={handleChange}
        onBlur={handleBlur}
        error={validationErrors.order}
        touched={touched.order}
        type="number"
        min={0}
        helperText="Categories are sorted by this value, lowest first."
        testId="category-form-order"
      />
      
      {/* Submit and cancel buttons */}
      <FormActions
        isLoading={isLoading}
        isEditMode={isEditMode}
        onCancel={handleCancel}
      />
    </form>
  );
}

// Also export as default for backward compatibility
export default CategoryForm;
