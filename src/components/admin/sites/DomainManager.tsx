import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

/**
 * DomainManager - Domain management component for handling site domains
 * 
 * A component for managing domain settings for a site.
 * 
 * Features:
 * - Domain validation with error messages
 * - Add and remove domains
 * - API integration for submission
 * - Loading states and error handling
 * - Accessibility support with ARIA attributes
 */
export interface DomainManagerProps {
  /**
   * Initial data for editing an existing item
   */
  initialData?: {
    id?: string;
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
  
  // Domain state
  const [domains, setDomains] = useState<string[]>(initialData.domains || []);
  const [domainInput, setDomainInput] = useState('');
  
  // Validation state
  const [errors, setErrors] = useState<{
    domains?: string;
    domainInput?: string;
    format?: string;
  }>({});

  // Handle input changes
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    
    if (name === 'domainInput') setDomainInput(value);
    
    // Clear error when field is changed
    if (errors[name as keyof typeof errors]) {
      setErrors(prev => ({
        ...prev,
        [name]: undefined
      }));
    }
  };

  // Domain validation
  const validateDomain = (domain: string): boolean => {
    // Simple domain validation regex
    const domainRegex = /^[a-zA-Z0-9][a-zA-Z0-9-]{1,61}[a-zA-Z0-9](\.[a-zA-Z]{2,})+$/;
    return domainRegex.test(domain);
  };

  // Handle domain management
  const addDomain = () => {
    if (!domainInput.trim()) return;
    
    // Validate domain format
    if (!validateDomain(domainInput)) {
      setErrors(prev => ({
        ...prev,
        domainInput: 'Invalid domain format'
      }));
      return;
    }
    
    // Check if domain already exists
    if (domains.includes(domainInput)) {
      setErrors(prev => ({
        ...prev,
        domainInput: 'Domain already exists'
      }));
      return;
    }
    
    // Add domain and clear input
    setDomains(prev => [...prev, domainInput]);
    setDomainInput('');
    
    // Clear any domain-related errors
    setErrors(prev => ({
      ...prev,
      domains: undefined,
      domainInput: undefined
    }));
  };
  
  const removeDomain = (domain: string) => {
    setDomains(prev => prev.filter(d => d !== domain));
  };

  // Validation function
  const validateForm = (): boolean => {
    const newErrors: typeof errors = {};
    let isValid = true;

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
        domains,
        id: initialData.id
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
        setSuccess('Domain settings updated successfully');
        
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
        {mode === 'edit' ? 'Edit' : 'Create'} Domain Settings
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
            Domain Management
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
                    <span data-testid={`domainManager-domain-${index}`}>
                      {domain}
                    </span>
                    <button
                      type="button"
                      onClick={() => removeDomain(domain)}
                      className="text-red-500 hover:text-red-700 p-1"
                      aria-label={`Remove domain ${domain}`}
                      data-testid={`domainManager-remove-domain-${index}`}
                      disabled={isLoading}
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
                data-testid="domainManager-domains-error"
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
                id="domainManager-domain-input"
                name="domainInput"
                value={domainInput}
                onChange={handleChange}
                placeholder="Enter domain (e.g., example.com)"
                className={`flex-grow p-2 border rounded focus:ring-2 focus:border-blue-500 ${errors.domainInput ? 'border-red-500' : 'border-gray-300'}`}
                aria-invalid={errors.domainInput ? "true" : "false"}
                aria-describedby={errors.domainInput ? "domainManager-domain-input-error" : undefined}
                data-testid="domainManager-domain-input"
                disabled={isLoading}
              />
              
              <button
                type="button"
                onClick={addDomain}
                className="ml-2 px-4 py-2 bg-blue-100 hover:bg-blue-200 rounded flex-shrink-0"
                data-testid="domainManager-add-domain"
                disabled={isLoading || !domainInput.trim()}
              >
                + Add
              </button>
            </div>
            
            {errors.domainInput && (
              <p 
                className="mt-1 text-sm text-red-500" 
                role="alert" 
                id="domainManager-domain-input-error"
                data-testid="domainManager-domain-input-error"
              >
                {errors.domainInput}
              </p>
            )}
            
            <p className="text-sm text-gray-500 mt-2">
              Enter valid domain names without http:// or www prefixes
            </p>
          </div>
          
          <p className="text-sm text-gray-500 mt-4" data-testid="domainManager-format-help">
            * At least one domain is required.
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
              mode === 'edit' ? `Update Domain Settings` : `Create Domain Settings`
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default DomainManager;
