import { useState } from 'react';

/**
 * Interface for domain-related errors
 */
export interface DomainErrors {
  domains?: string;
  domainInput?: string;
  format?: string;
  [key: string]: string | undefined;
}

/**
 * Options for useDomains hook
 */
export interface UseDomainsOptions {
  /**
   * Initial list of domains
   */
  initialDomains?: string[];
  /**
   * API endpoint for domain operations
   */
  apiEndpoint?: string;
  /**
   * Custom domain validation function
   */
  customValidation?: (domain: string) => boolean | string;
}

/**
 * Custom hook for managing domains
 * 
 * Features:
 * - Domain validation with error messages
 * - Add and remove domains
 * - API integration for submission
 * - Loading states and error handling
 * 
 * @param options - Configuration options
 * @returns Domain management utilities
 */
export const useDomains = (options: UseDomainsOptions = {}) => {
  const { 
    initialDomains = [], 
    apiEndpoint = '/api/domain-manager',
    customValidation
  } = options;
  
  // Domain state
  const [domains, setDomains] = useState<string[]>(initialDomains);
  const [domainInput, setDomainInput] = useState('');
  
  // UI state
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  // Validation state
  const [errors, setErrors] = useState<DomainErrors>({});

  // Domain validation
  const validateDomain = (domain: string): boolean => {
    // If custom validation is provided, use it
    if (customValidation) {
      const result = customValidation(domain);
      if (typeof result === 'string') {
        setErrors(prev => ({
          ...prev,
          domainInput: result
        }));
        return false;
      }
      return result;
    }
    
    // Default domain validation regex
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

  // Validate domains list
  const validateDomains = (): boolean => {
    const newErrors: DomainErrors = {};
    let isValid = true;

    // Validate domains
    if (domains.length === 0) {
      newErrors.domains = 'At least one domain is required';
      isValid = false;
    }

    setErrors(newErrors);
    return isValid;
  };

  // Handle input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    
    if (name === 'domainInput') setDomainInput(value);
    
    // Clear error when field is changed
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: undefined
      }));
    }
  };

  // Submit domains to API
  const submitDomains = async (
    id?: string, 
    additionalData: Record<string, any> = {}, 
    method: 'POST' | 'PUT' = 'POST'
  ) => {
    // Validate domains
    if (!validateDomains()) {
      return { success: false };
    }
    
    setIsLoading(true);
    setError(null);
    setSuccess(null);
    
    try {
      // Prepare data for submission
      const dataToSubmit = {
        domains,
        id,
        ...additionalData
      };
      
      // Determine API endpoint based on ID and method
      const endpoint = id 
        ? `${apiEndpoint}/${id}` 
        : apiEndpoint;
      
      // Submit data
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
        return { success: true, data: result };
      } else {
        throw new Error(result.error || 'An error occurred');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to submit domains');
      return { success: false, error: err };
    } finally {
      setIsLoading(false);
    }
  };

  return {
    // State
    domains,
    domainInput,
    isLoading,
    success,
    error,
    errors,
    
    // Actions
    setDomainInput,
    addDomain,
    removeDomain,
    validateDomains,
    submitDomains,
    handleInputChange,
    
    // Reset functions
    resetErrors: () => setErrors({}),
    resetStatus: () => {
      setError(null);
      setSuccess(null);
    }
  };
};
