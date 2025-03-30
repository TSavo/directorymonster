'use client';

import { useState, useEffect, useCallback } from 'react';
import { Category } from '@/types';
import { CategoryFormData, ValidationErrors } from './types';
import { validateCategoryForm, generateSlugFromName } from './categoryFormValidation';

/**
 * Custom hook for managing category form state and logic
 */
export function useCategoryForm(
  siteSlug: string,
  categoryId?: string,
  initialData?: Partial<Category>,
  onSaved?: (categoryId: string) => void
) {
  const isEditMode = !!categoryId;
  
  // Form state
  const [formData, setFormData] = useState<CategoryFormData>({
    name: initialData?.name || '',
    slug: initialData?.slug || '',
    metaDescription: initialData?.metaDescription || '',
    parentId: initialData?.parentId || '',
    order: initialData?.order ?? 0
  });
  
  // Validation state
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [validationErrors, setValidationErrors] = useState<ValidationErrors>({});
  
  // Loading, error, and success states
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  
  // Parent categories
  const [parentCategories, setParentCategories] = useState<Category[]>([]);
  const [loadingParents, setLoadingParents] = useState(false);
  
  // Validate form data
  const validateForm = useCallback(() => {
    const errors = validateCategoryForm(formData, categoryId);
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  }, [formData, categoryId]);
  
  // Load parent categories on component mount
  useEffect(() => {
    async function fetchParentCategories() {
      setLoadingParents(true);
      
      try {
        const response = await fetch(`/api/sites/${siteSlug}/categories`);
        
        if (!response.ok) {
          throw new Error(`Failed to fetch parent categories: ${response.statusText}`);
        }
        
        const data = await response.json();
        
        // Filter out the current category and its children to prevent circular references
        let filtered = isEditMode
          ? data.filter((cat: Category) => cat.id !== categoryId)
          : data;
        
        // Filter out potential child categories when in edit mode
        if (isEditMode) {
          // Function to check if category is a child of the current category
          const isChildOf = (category: Category, parentId: string): boolean => {
            if (category.parentId === parentId) return true;
            
            const parent = data.find((p: Category) => p.id === category.parentId);
            if (!parent) return false;
            
            return isChildOf(parent, parentId);
          };
          
          filtered = filtered.filter((cat: Category) => !isChildOf(cat, categoryId!));
        }
        
        setParentCategories(filtered);
      } catch (err) {
        console.error('Error fetching parent categories:', err);
        setError('Failed to load parent categories. Please try again.');
      } finally {
        setLoadingParents(false);
      }
    }
    
    fetchParentCategories();
  }, [siteSlug, categoryId, isEditMode]);
  
  // Handle form input changes
  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    
    // Special case for slug: auto-generate from name if empty
    if (name === 'name' && !formData.slug) {
      setFormData(prev => ({
        ...prev,
        [name]: value,
        slug: generateSlugFromName(value)
      }));
    } else if (name === 'order') {
      // Parse order as number
      setFormData(prev => ({
        ...prev,
        [name]: value === '' ? 0 : parseInt(value, 10)
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
    
    // Mark field as touched
    setTouched(prev => ({
      ...prev,
      [name]: true
    }));
  }, [formData.slug]);
  
  // Handle blur event for validation
  const handleBlur = useCallback((e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name } = e.target;
    
    // Mark field as touched
    setTouched(prev => ({
      ...prev,
      [name]: true
    }));
    
    // Validate the form
    validateForm();
  }, [validateForm]);
  
  // Handle form submission
  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Mark all fields as touched
    const allTouched = Object.keys(formData).reduce((acc, key) => {
      acc[key] = true;
      return acc;
    }, {} as Record<string, boolean>);
    
    setTouched(allTouched);
    
    // Validate the form
    if (!validateForm()) {
      return;
    }
    
    setIsLoading(true);
    setError(null);
    setSuccess(false);
    
    try {
      const url = isEditMode
        ? `/api/sites/${siteSlug}/categories/${categoryId}`
        : `/api/sites/${siteSlug}/categories`;
      
      const method = isEditMode ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          ...formData,
          siteId: siteSlug,
          order: typeof formData.order === 'number' ? formData.order : parseInt(String(formData.order), 10) || 0
        })
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `Failed to ${isEditMode ? 'update' : 'create'} category: ${response.statusText}`);
      }

      const result = await response.json();
      
      setSuccess(true);
      
      // Notify about successful save
      if (onSaved && result && result.id) {
        setTimeout(() => {
          onSaved(result.id);
        }, 1500);
      }
    } catch (err) {
      console.error(`Error ${isEditMode ? 'updating' : 'creating'} category:`, err);
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
    } finally {
      setIsLoading(false);
    }
  }, [formData, validateForm, isEditMode, categoryId, siteSlug, onSaved]);
  
  return {
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
    handleSubmit,
    validateForm
  };
}

export default useCategoryForm;
