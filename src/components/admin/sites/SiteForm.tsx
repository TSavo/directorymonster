'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

/**
 * SiteForm - Form for creating and editing site configurations
 * 
 * A form component for creating and editing Site data.
 * 
 * Features:
 * - Form validation with error messages
 * - API integration for submission
 * - Loading states and error handling
 * - Accessibility support with ARIA attributes
 * - Keyboard navigation
 */
export interface SiteFormProps {
  /**
   * Initial data for editing an existing item
   */
  initialData?: {
    id?: string;
    name?: string;
    slug?: string;
    description?: string;
    domains?: string[];
  };
  /**
   * Mode for the form (create or edit)
   */
  mode?: 'create' | 'edit';
  /**
   * Callback when form is canceled
   */
  onCancel?: () => void;
  /**
   * Callback when form is submitted successfully
   */
  onSuccess?: (data: any) => void;
  /**
   * API endpoint for form submission
   */
  apiEndpoint?: string;
}

export const SiteForm: React.FC<SiteFormProps> = ({
  initialData = {},
  mode = 'create',
  onCancel,
  onSuccess,
  apiEndpoint = '/api/sites'
}) => {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  // Form state
  const [name, setName] = useState<string>(initialData.name || '');
  const [slug, setSlug] = useState<string>(initialData.slug || '');
  const [description, setDescription] = useState<string>(initialData.description || '');
  const [domains, setDomains] = useState<string[]>(initialData.domains || []);
  const [newDomain, setNewDomain] = useState<string>('');
  
  // Validation state
  const [errors, setErrors] = useState<{
    name?: string;
    slug?: string;
    description?: string;
    domains?: string;
    newDomain?: string;
    format?: string;
  }>({});
  
  // Handle input changes
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    
    if (name === 'name') setName(value);
    if (name === 'slug') setSlug(value);
    if (name === 'description') setDescription(value);
    if (name === 'newDomain') setNewDomain(value);
    
    // Clear error when field is changed
    if (errors[name as keyof typeof errors]) {
      setErrors(prev => ({
        ...prev,
        [name]: undefined
      }));
    }
  };
  
  // Handle domain management
  const addDomain = () => {
    if (!newDomain.trim()) return;
    
    // Validate domain format
    const domainRegex = /^[a-zA-Z0-9][a-zA-Z0-9-]{1,61}[a-zA-Z0-9](\.[a-zA-Z]{2,})+$/;
    if (!domainRegex.test(newDomain)) {
      setErrors(prev => ({
        ...prev,
        newDomain: 'Please enter a valid domain name'
      }));
      return;
    }
    
    // Check if domain already exists
    if (domains.includes(newDomain)) {
      setErrors(prev => ({
        ...prev,
        newDomain: 'This domain has already been added'
      }));
      return;
    }
    
    // Add domain and clear input
    setDomains(prev => [...prev, newDomain]);
    setNewDomain('');
    
    // Clear domain-related errors
    setErrors(prev => ({
      ...prev,
      domains: undefined,
      newDomain: undefined
    }));
  };
  
  const removeDomain = (domain: string) => {
    setDomains(prev => prev.filter(d => d !== domain));
  };
  
  // Validation function
  const validateForm = (): boolean => {
    const newErrors: typeof errors = {};
    let isValid = true;
    
    // Validate name
    if (!name.trim()) {
      newErrors.name = 'Name is required';
      isValid = false;
    } else if (name.length > 50) {
      newErrors.name = 'Name cannot exceed 50 characters';
      isValid = false;
    }
    
    // Validate slug
    if (!slug.trim()) {
      newErrors.slug = 'Slug is required';
      isValid = false;
    } else if (!/^[a-z0-9-]+$/.test(slug)) {
      newErrors.slug = 'Slug can only contain lowercase letters, numbers, and hyphens';
      isValid = false;
    } else if (slug.length > 50) {
      newErrors.slug = 'Slug cannot exceed 50 characters';
      isValid = false;
    }
    
    // Validate description (optional field)
    if (description && description.length > 500) {
      newErrors.description = 'Description cannot exceed 500 characters';
      isValid = false;
    }
    
    // Validate domains
    if (domains.length === 0) {
      newErrors.domains = 'At least one domain is required';
      isValid = false;
    }
    
    setErrors(newErrors);
    return isValid;
  };
  
  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate form before submission
    if (!validateForm()) {
      return;
    }
    
    setIsLoading(true);
    setError(null);
    setSuccess(null);
    
    try {
      // Prepare form data
      const formData = {
        name,
        slug,
        description,
        domains
      };
      
      // Add ID for edit mode
      if (mode === 'edit' && initialData.id) {
        formData.id = initialData.id;
      }
      
      // Determine endpoint and method based on mode
      const method = mode === 'edit' ? 'PUT' : 'POST';
      const endpoint = mode === 'edit' && initialData.id 
        ? `${apiEndpoint}/${initialData.id}` 
        : apiEndpoint;
      
      // Submit form data
      const response = await fetch(endpoint, {
        method,
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      });
      
      const result = await response.json();
      
      if (response.ok) {
        setSuccess(mode === 'edit' ? 'Site updated successfully' : 'Site created successfully');
        
        // Call success callback if provided
        if (onSuccess) {
          onSuccess(result);
        }
        
        // Redirect after successful submission
        setTimeout(() => {
          router.push(`/admin/sites/${result.id || result.slug}`);
        }, 1500);
      } else {
        throw new Error(result.error || 'An error occurred');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to submit form');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto p-6 bg-white rounded shadow">
      <h1 
        id="siteForm-header" 
        className="text-xl font-bold mb-6"
        data-testid="siteForm-header"
      >
        {mode === 'edit' ? 'Edit' : 'Create'} Site
      </h1>
      
      {/* Error message */}
      {error && (
        <div 
          className="mb-4 p-3 bg-red-100 text-red-700 rounded" 
          role="alert"
          data-testid="siteForm-error"
        >
          {error}
        </div>
      )}
      
      {/* Success message */}
      {success && (
        <div 
          className="mb-4 p-3 bg-green-100 text-green-700 rounded" 
          role="alert"
          data-testid="siteForm-success"
        >
          {success}
        </div>
      )}
      
      <form 
        onSubmit={handleSubmit} 
        role="form" 
        aria-labelledby="siteForm-header"
        data-testid="siteForm-form"
      >
        <fieldset 
          className="mb-6" 
          disabled={isLoading}
          data-testid="siteForm-fieldset"
        >
          <legend className="text-lg font-semibold mb-3" data-testid="siteForm-basic-info-heading">
            Basic Information
          </legend>
          
          {/* Name field */}
          <div className="mb-4">
            <label 
              htmlFor="siteForm-name" 
              className="block text-sm font-medium mb-1"
            >
              Site Name *
            </label>
            <input
              type="text"
              id="siteForm-name"
              name="name"
              value={name}
              onChange={handleChange}
              className={`w-full p-2 border rounded focus:ring-2 focus:border-blue-500 ${errors.name ? 'border-red-500' : 'border-gray-300'}`}
              aria-invalid={errors.name ? "true" : "false"}
              aria-describedby={errors.name ? "siteForm-name-error" : undefined}
              data-testid="siteForm-name"
            />
            {errors.name && (
              <p 
                className="mt-1 text-sm text-red-500" 
                role="alert" 
                id="siteForm-name-error"
                data-testid="siteForm-name-error"
              >
                {errors.name}
              </p>
            )}
          </div>
          
          {/* Slug field */}
          <div className="mb-4">
            <label 
              htmlFor="siteForm-slug" 
              className="block text-sm font-medium mb-1"
            >
              Slug * <span className="text-xs text-gray-500">(URL-friendly name)</span>
            </label>
            <input
              type="text"
              id="siteForm-slug"
              name="slug"
              value={slug}
              onChange={handleChange}
              className={`w-full p-2 border rounded focus:ring-2 focus:border-blue-500 ${errors.slug ? 'border-red-500' : 'border-gray-300'}`}
              aria-invalid={errors.slug ? "true" : "false"}
              aria-describedby={errors.slug ? "siteForm-slug-error" : undefined}
              data-testid="siteForm-slug"
            />
            {errors.slug && (
              <p 
                className="mt-1 text-sm text-red-500" 
                role="alert" 
                id="siteForm-slug-error"
                data-testid="siteForm-slug-error"
              >
                {errors.slug}
              </p>
            )}
          </div>
          
          {/* Description field */}
          <div className="mb-4">
            <label 
              htmlFor="siteForm-description" 
              className="block text-sm font-medium mb-1"
            >
              Description <span className="text-xs text-gray-500">(Optional)</span>
            </label>
            <textarea
              id="siteForm-description"
              name="description"
              value={description}
              onChange={handleChange}
              rows={3}
              className={`w-full p-2 border rounded focus:ring-2 focus:border-blue-500 ${errors.description ? 'border-red-500' : 'border-gray-300'}`}
              aria-invalid={errors.description ? "true" : "false"}
              aria-describedby={errors.description ? "siteForm-description-error" : undefined}
              data-testid="siteForm-description"
            />
            {errors.description && (
              <p 
                className="mt-1 text-sm text-red-500" 
                role="alert" 
                id="siteForm-description-error"
                data-testid="siteForm-description-error"
              >
                {errors.description}
              </p>
            )}
          </div>
        </fieldset>
        
        <fieldset 
          className="mb-6" 
          disabled={isLoading}
          data-testid="siteForm-domains-fieldset"
        >
          <legend className="text-lg font-semibold mb-3" data-testid="siteForm-domains-heading">
            Domains
          </legend>
          
          {/* Domain list */}
          <div className="mb-4">
            <h3 className="text-md font-medium mb-2">Current Domains</h3>
            
            {domains.length === 0 ? (
              <p className="text-gray-500 italic">No domains added yet</p>
            ) : (
              <ul className="mb-4 border rounded divide-y">
                {domains.map((domain, index) => (
                  <li key={domain} className="flex justify-between items-center p-2 hover:bg-gray-50">
                    <span data-testid={`siteForm-domain-${index}`}>
                      {domain}
                    </span>
                    <button
                      type="button"
                      onClick={() => removeDomain(domain)}
                      className="text-red-500 hover:text-red-700 p-1"
                      aria-label={`Remove domain ${domain}`}
                      data-testid={`siteForm-remove-domain-${index}`}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" className="w-5 h-5">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                      <span className="sr-only">Remove</span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
            
            {errors.domains && (
              <p 
                className="mt-1 text-sm text-red-500" 
                role="alert" 
                data-testid="siteForm-domains-error"
              >
                {errors.domains}
              </p>
            )}
          </div>
          
          {/* Add domain */}
          <div className="mb-4">
            <h3 className="text-md font-medium mb-2">Add Domain</h3>
            
            <div className="flex items-center">
              <input
                type="text"
                id="siteForm-new-domain"
                name="newDomain"
                value={newDomain}
                onChange={handleChange}
                placeholder="Enter domain (e.g., example.com)"
                className={`flex-grow p-2 border rounded focus:ring-2 focus:border-blue-500 ${errors.newDomain ? 'border-red-500' : 'border-gray-300'}`}
                aria-invalid={errors.newDomain ? "true" : "false"}
                aria-describedby={errors.newDomain ? "siteForm-new-domain-error" : undefined}
                data-testid="siteForm-new-domain"
              />
              
              <button
                type="button"
                onClick={addDomain}
                className="ml-2 px-4 py-2 bg-blue-100 hover:bg-blue-200 rounded flex-shrink-0"
                data-testid="siteForm-add-domain"
                disabled={!newDomain.trim()}
              >
                + Add
              </button>
            </div>
            
            {errors.newDomain && (
              <p 
                className="mt-1 text-sm text-red-500" 
                role="alert" 
                id="siteForm-new-domain-error"
                data-testid="siteForm-new-domain-error"
              >
                {errors.newDomain}
              </p>
            )}
            
            <p className="text-sm text-gray-500 mt-2">
              Enter valid domain names without http:// or www prefixes
            </p>
          </div>
        </fieldset>
        
        <div className="flex justify-end space-x-3 mt-8">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded focus:outline-none focus:ring-2"
            data-testid="siteForm-cancel"
            disabled={isLoading}
          >
            Cancel
          </button>
          <button
            type="submit"
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded focus:outline-none focus:ring-2 disabled:opacity-50"
            data-testid="siteForm-submit"
            disabled={isLoading}
          >
            {isLoading ? (
              <span data-testid="siteForm-submit-loading">
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white inline" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Loading...
              </span>
            ) : (
              mode === 'edit' ? `Update Site` : `Create Site`
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default SiteForm;
