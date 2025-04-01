'use client';

import React from 'react';
import { DomainManager } from '../DomainManager';

export interface DomainStepProps {
  /**
   * List of domains
   */
  domains: string[];
  /**
   * New domain input value
   */
  newDomain?: string;
  /**
   * Validation errors
   */
  errors?: {
    domains?: string;
    newDomain?: string;
  };
  /**
   * Callback for input changes
   */
  onChange: (name: string, value: any) => void;
  /**
   * Callback for adding a domain
   */
  onAdd: () => void;
  /**
   * Callback for removing a domain
   */
  onRemove: (domain: string) => void;
  /**
   * Is the form in a loading state
   */
  isLoading?: boolean;
}

/**
 * DomainStep - Form step for site domain configuration
 *
 * Wraps the DomainManager component to use it in the multi-step form
 */
export const DomainStep: React.FC<DomainStepProps> = ({
  domains,
  newDomain = '',
  errors = {},
  onChange,
  onAdd,
  onRemove,
  isLoading = false
}) => {
  // Handle input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e && e.target) {
      onChange('newDomain', e.target.value);
    }
  };

  return (
    <div className="space-y-6">
      <h2 className="text-lg font-semibold mb-4" data-testid="domainStep-heading">Domain Management</h2>
      <p className="text-gray-600 mb-4" data-testid="domainStep-description">
        Add one or more domains for your site. At least one domain is required.
      </p>

      {/* Domain list */}
      <div className="mb-4">
        <h3 className="text-md font-medium mb-2">Current Domains</h3>

        {domains.length === 0 ? (
          <p className="text-gray-500 italic">No domains added yet</p>
        ) : (
          <ul className="mb-4 border rounded divide-y">
            {domains.map((domain, index) => (
              <li key={domain} className="flex justify-between items-center p-2 hover:bg-gray-50">
                <span data-testid={`domainStep-domain-${index}`}>
                  {domain}
                </span>
                <button
                  type="button"
                  onClick={() => onRemove(domain)}
                  className="text-red-500 hover:text-red-700 p-1"
                  aria-label={`Remove domain ${domain}`}
                  data-testid={`domainStep-remove-domain-${index}`}
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
            data-testid="domainStep-domains-error"
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
            id="domainStep-domain-input"
            name="newDomain"
            value={newDomain}
            onChange={handleInputChange}
            placeholder="Enter domain (e.g., example.com)"
            className={`flex-grow p-2 border rounded focus:ring-2 focus:border-blue-500 ${errors.newDomain ? 'border-red-500' : 'border-gray-300'}`}
            aria-invalid={errors.newDomain ? "true" : "false"}
            aria-describedby={errors.newDomain ? "domainStep-domain-input-error" : undefined}
            data-testid="domainStep-domain-input"
            disabled={isLoading}
          />

          <button
            type="button"
            onClick={onAdd}
            className="ml-2 px-4 py-2 bg-blue-100 hover:bg-blue-200 rounded flex-shrink-0"
            data-testid="domainStep-add-domain"
            disabled={isLoading || !newDomain.trim()}
          >
            + Add
          </button>
        </div>

        {errors.newDomain && (
          <p
            className="mt-1 text-sm text-red-500"
            role="alert"
            id="domainStep-domain-input-error"
            data-testid="domainStep-domain-input-error"
          >
            {errors.newDomain}
          </p>
        )}

        <p className="text-sm text-gray-500 mt-2">
          Enter valid domain names without http:// or www prefixes
        </p>
      </div>
    </div>
  );
};

export default DomainStep;