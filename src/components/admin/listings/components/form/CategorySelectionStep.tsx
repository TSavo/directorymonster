"use client";

import React, { useEffect, useState } from 'react';
import { ListingFormData } from '../../../types';
import { Category } from '../../../categories/types';

interface CategorySelectionStepProps {
  formData: ListingFormData;
  errors: Record<string, any>;
  updateField: <K extends keyof ListingFormData>(field: K, value: ListingFormData[K]) => void;
  isSubmitting: boolean;
  siteSlug?: string;
}

export function CategorySelectionStep({
  formData,
  errors,
  updateField,
  isSubmitting,
  siteSlug
}: CategorySelectionStepProps) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch categories on component mount
  useEffect(() => {
    const fetchCategories = async () => {
      if (!siteSlug) return;
      
      try {
        setLoading(true);
        const response = await fetch(`/api/sites/${siteSlug}/categories`);
        
        if (!response.ok) {
          throw new Error('Failed to fetch categories');
        }
        
        const data = await response.json();
        setCategories(data.categories || []);
      } catch (err) {
        console.error('Error fetching categories:', err);
        setError('Failed to load categories. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchCategories();
  }, [siteSlug]);

  // Handle category selection
  const handleCategoryChange = (categoryId: string, isChecked: boolean) => {
    const newCategories = isChecked
      ? [...formData.categoryIds, categoryId]
      : formData.categoryIds.filter((id) => id !== categoryId);
    
    updateField('categoryIds', newCategories);
  };

  if (loading) {
    return <div className="text-center py-4">Loading categories...</div>;
  }

  if (error) {
    return <div className="text-red-500 py-4">{error}</div>;
  }

  return (
    <div className="space-y-4" data-testid="listing-form-category-selection">
      <h3 className="text-lg font-medium text-gray-900">Select Categories</h3>
      
      {errors.categoryIds && (
        <p className="mt-1 text-sm text-red-600">
          {errors.categoryIds}
        </p>
      )}
      
      <div className="mt-4 space-y-2">
        {categories.length === 0 ? (
          <p className="text-gray-500">No categories available.</p>
        ) : (
          categories.map((category) => (
            <div key={category.id} className="flex items-start">
              <div className="flex items-center h-5">
                <input
                  id={`category-${category.id}`}
                  type="checkbox"
                  checked={formData.categoryIds.includes(category.id)}
                  onChange={(e) => handleCategoryChange(category.id, e.target.checked)}
                  disabled={isSubmitting}
                  className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  data-testid={`category-checkbox-${category.id}`}
                />
              </div>
              <div className="ml-3 text-sm">
                <label 
                  htmlFor={`category-${category.id}`} 
                  className="font-medium text-gray-700"
                >
                  {category.name}
                </label>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default CategorySelectionStep;
