'use client';

import { CategoryFormData, ValidationErrors } from './types';

/**
 * Validates the category form data
 * @param formData The form data to validate
 * @param categoryId The current category ID (for edit mode)
 * @returns An object with validation errors, or an empty object if valid
 */
export function validateCategoryForm(
  formData: CategoryFormData, 
  categoryId?: string
): ValidationErrors {
  const errors: ValidationErrors = {};
  
  // Name validation
  if (!formData.name.trim()) {
    errors.name = 'Name is required';
  } else if (formData.name.length > 100) {
    errors.name = 'Name must be less than 100 characters';
  }
  
  // Slug validation
  if (!formData.slug.trim()) {
    errors.slug = 'Slug is required';
  } else if (!/^[a-z0-9-]+$/.test(formData.slug)) {
    errors.slug = 'Slug must contain only lowercase letters, numbers, and hyphens';
  } else if (formData.slug.length > 100) {
    errors.slug = 'Slug must be less than 100 characters';
  }
  
  // Meta description validation
  if (formData.metaDescription.length > 160) {
    errors.metaDescription = 'Meta description should be less than 160 characters';
  }
  
  // Parent category validation
  if (formData.parentId && formData.parentId === categoryId) {
    errors.parentId = 'A category cannot be its own parent';
  }
  
  // Order validation
  if (typeof formData.order !== 'number' && isNaN(Number(formData.order))) {
    errors.order = 'Order must be a number';
  }
  
  return errors;
}

/**
 * Generates a slug from a name
 * @param name The name to generate a slug from
 * @returns A URL-friendly slug
 */
export function generateSlugFromName(name: string): string {
  return name.toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '');
}
