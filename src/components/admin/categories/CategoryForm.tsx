'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Category } from '@/types';

interface CategoryFormProps {
  siteSlug: string;
  categoryId?: string;
  initialData?: Partial<Category>;
}

export function CategoryForm({ siteSlug, categoryId, initialData }: CategoryFormProps) {
  const router = useRouter();
  const isEditMode = !!categoryId;
  
  // Form state
  const [formData, setFormData] = useState({
    name: initialData?.name || '',
    slug: initialData?.slug || '',
    metaDescription: initialData?.metaDescription || '',
    parentId: initialData?.parentId || '',
    order: initialData?.order || 0
  });
  
  // Loading, error, and success states
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  
  // Parent categories
  const [parentCategories, setParentCategories] = useState<Category[]>([]);
  const [loadingParents, setLoadingParents] = useState(false);
  
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
        
        // Filter out the current category (for edit mode)
        const filtered = isEditMode
          ? data.filter((cat: Category) => cat.id !== categoryId)
          : data;
        
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
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    
    // Special case for slug: auto-generate from name if empty
    if (name === 'name' && !formData.slug) {
      setFormData(prev => ({
        ...prev,
        [name]: value,
        slug: value.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };
  
  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
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
          order: parseInt(formData.order.toString(), 10)
        })
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `Failed to ${isEditMode ? 'update' : 'create'} category: ${response.statusText}`);
      }
      
      setSuccess(true);
      
      // Redirect back to categories list after a brief delay
      setTimeout(() => {
        router.push(`/admin/sites/${siteSlug}/categories`);
      }, 1500);
    } catch (err) {
      console.error(`Error ${isEditMode ? 'updating' : 'creating'} category:`, err);
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Error message */}
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-md">
          <p className="text-red-700">{error}</p>
        </div>
      )}
      
      {/* Success message */}
      {success && (
        <div className="p-4 bg-green-50 border border-green-200 rounded-md">
          <p className="text-green-700">
            Category {isEditMode ? 'updated' : 'created'} successfully. Redirecting...
          </p>
        </div>
      )}
      
      {/* Name field */}
      <div>
        <label htmlFor="name" className="block text-sm font-medium text-gray-700">
          Name <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          id="name"
          name="name"
          value={formData.name}
          onChange={handleChange}
          required
          className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
        />
      </div>
      
      {/* Slug field */}
      <div>
        <label htmlFor="slug" className="block text-sm font-medium text-gray-700">
          Slug <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          id="slug"
          name="slug"
          value={formData.slug}
          onChange={handleChange}
          required
          pattern="[a-z0-9-]+"
          title="Lowercase letters, numbers, and hyphens only"
          className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
        />
        <p className="mt-1 text-sm text-gray-500">
          URL-friendly identifier. Use lowercase letters, numbers, and hyphens only.
        </p>
      </div>
      
      {/* Meta Description field */}
      <div>
        <label htmlFor="metaDescription" className="block text-sm font-medium text-gray-700">
          Meta Description
        </label>
        <textarea
          id="metaDescription"
          name="metaDescription"
          value={formData.metaDescription}
          onChange={handleChange}
          rows={3}
          className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
        ></textarea>
        <p className="mt-1 text-sm text-gray-500">
          Brief description used for SEO. Recommended 120-155 characters.
        </p>
      </div>
      
      {/* Parent Category select */}
      <div>
        <label htmlFor="parentId" className="block text-sm font-medium text-gray-700">
          Parent Category
        </label>
        <select
          id="parentId"
          name="parentId"
          value={formData.parentId}
          onChange={handleChange}
          className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
        >
          <option value="">No Parent (Top Level)</option>
          {loadingParents ? (
            <option disabled>Loading...</option>
          ) : (
            parentCategories.map(category => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))
          )}
        </select>
      </div>
      
      {/* Order field */}
      <div>
        <label htmlFor="order" className="block text-sm font-medium text-gray-700">
          Display Order
        </label>
        <input
          type="number"
          id="order"
          name="order"
          value={formData.order}
          onChange={handleChange}
          min="0"
          className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
        />
        <p className="mt-1 text-sm text-gray-500">
          Categories are sorted by this value, lowest first.
        </p>
      </div>
      
      {/* Submit and cancel buttons */}
      <div className="flex justify-end space-x-3">
        <button
          type="button"
          onClick={() => router.push(`/admin/sites/${siteSlug}/categories`)}
          className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
          disabled={isLoading}
        >
          Cancel
        </button>
        <button
          type="submit"
          className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          disabled={isLoading}
        >
          {isLoading ? 'Saving...' : isEditMode ? 'Update Category' : 'Create Category'}
        </button>
      </div>
    </form>
  );
}

// Also export as default for backward compatibility
export default CategoryForm;
