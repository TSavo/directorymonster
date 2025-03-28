import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

/**
 * DomainManager - A reusable DomainManager component
 * 
 * A form component for creating and editing DomainManager data.
 * 
 * Features:
 * - Form validation with error messages
 * - API integration for submission
 * - Loading states and error handling
 * - Accessibility support with ARIA attributes
 * - Keyboard navigation
 */
export interface DomainManagerProps {
  /**
   * Initial data for editing an existing item
   */
  initialData?: {
    id?: string;
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

export const DomainManager: React.FC<DomainManagerProps> = ({
  initialData = {},
  mode = 'create',
  onCancel,
  onSuccess,
  apiEndpoint = '/api/domain-manager'
}) => {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  

  // Form state
  
  // Validation state
  const [errors, setErrors] = useState<{
    format?: string;
  }>({});

  // Handle input changes
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    
    
    // Clear error when field is changed
    if (errors[name as keyof typeof errors]) {
      setErrors(prev => ({
        ...prev,
        [name]: undefined
      }));
    }
  };


  // Validation function
  const validateForm = (): boolean => {
    const newErrors: typeof errors = {};
    let isValid = true;


    setErrors(newErrors);
    return isValid;
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate form
    if (!validateForm()) {
      return;
    }
    
    setIsLoading(true);
    setError(null);
    setSuccess(null);
    
    try {
      // Prepare data for submission
      const dataToSubmit = {
      };
      
      // Determine API endpoint and method based on mode
      const method = mode === 'edit' ? 'PUT' : 'POST';
      const endpoint = mode === 'edit' 
        ? `${apiEndpoint}/${initialData.id}` 
        : apiEndpoint;
      
      // Submit form data
      const response = await fetch(endpoint, {
        method,
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(dataToSubmit)
      });
      
      const result = await response.json();
      
      if (response.ok) {
        setSuccess(mode === 'edit' ? 'DomainManager updated successfully' : 'DomainManager created successfully');
        
        // Call success callback if provided
        if (onSuccess) {
          onSuccess(result);
        }
        
        // Redirect after successful submission
        setTimeout(() => {
          router.push(`/sites/${result.id || result.slug}`);
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
        id="domainManager-header" 
        className="text-xl font-bold mb-6"
        data-testid="domainManager-header"
      >
        {mode === 'edit' ? 'Edit' : 'Create'} DomainManager
      </h1>
      
      {/* Error message */}
      {error && (
        <div 
          className="mb-4 p-3 bg-red-100 text-red-700 rounded" 
          role="alert"
          data-testid="domainManager-error"
        >
          {error}
        </div>
      )}
      
      {/* Success message */}
      {success && (
        <div 
          className="mb-4 p-3 bg-green-100 text-green-700 rounded" 
          role="alert"
          data-testid="domainManager-success"
        >
          {success}
        </div>
      )}
      
      <form 
        onSubmit={handleSubmit} 
        role="form" 
        aria-labelledby="domainManager-header"
        data-testid="domainManager-form"
      >
        <fieldset 
          className="mb-6" 
          data-testid="domainManager-fieldset"
        >
          <legend className="text-lg font-semibold mb-3" data-testid="domainManager-section-heading">
            DomainManager Information
          </legend>
          


          <p className="text-sm text-gray-500 mt-4" data-testid="domainManager-format-help">
            * Required fields. Slugs can only contain lowercase letters, numbers, and hyphens.
          </p>
        </fieldset>
        
        <div className="flex justify-end space-x-3 mt-8">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded focus:outline-none focus:ring-2"
            data-testid="domainManager-cancel"
            disabled={isLoading}
          >
            Cancel
          </button>
          <button
            type="submit"
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded focus:outline-none focus:ring-2 disabled:opacity-50"
            data-testid="domainManager-submit"
            disabled={isLoading || Object.keys(errors).length > 0}
          >
            {isLoading ? (
              <span data-testid="domainManager-submit-loading">
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white inline" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Loading...
              </span>
            ) : (
              mode === 'edit' ? `Update DomainManager` : `Create DomainManager`
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default DomainManager;
