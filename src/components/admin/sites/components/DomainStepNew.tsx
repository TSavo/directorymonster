'use client';

import React, { useState } from 'react';
import { useSiteForm } from '../context/SiteFormContext';

export const DomainStep: React.FC = () => {
  const { state, updateField } = useSiteForm();
  const { formData, errors } = state;
  const [newDomain, setNewDomain] = useState('');
  
  // Add domain to the list
  const addDomain = () => {
    if (!newDomain.trim()) return;
    
    // Validate domain format
    const domainRegex = /^[a-zA-Z0-9][a-zA-Z0-9-]{1,61}[a-zA-Z0-9](\.[a-zA-Z]{2,})+$/;
    if (!domainRegex.test(newDomain)) {
      updateField('errors', {
        ...errors,
        newDomain: 'Please enter a valid domain name'
      });
      return;
    }
    
    // Check if domain already exists
    if (formData.domains.includes(newDomain)) {
      updateField('errors', {
        ...errors,
        newDomain: 'This domain has already been added'
      });
      return;
    }
    
    // Add domain and clear input
    updateField('domains', [...formData.domains, newDomain]);
    setNewDomain('');
    
    // Clear any domain-related errors
    if (errors.domains || errors.newDomain) {
      const newErrors = { ...errors };
      delete newErrors.domains;
      delete newErrors.newDomain;
      updateField('errors', newErrors);
    }
  };
  
  // Remove domain from the list
  const removeDomain = (domain: string) => {
    updateField('domains', formData.domains.filter(d => d !== domain));
  };
  
  return (
    <div className="space-y-6">
      <h2 className="text-lg font-semibold mb-4" data-testid="domainStep-heading">
        Domain Management
      </h2>
      <p className="text-gray-600 mb-4" data-testid="domainStep-description">
        Add one or more domains for your site. At least one domain is required.
      </p>
      
      {/* Domain list */}
      <div className="mb-4">
        <h3 className="text-md font-medium mb-2">Current Domains</h3>
        
        {formData.domains.length === 0 ? (
          <p className="text-gray-500 italic">No domains added yet</p>
        ) : (
          <ul className="mb-4 border rounded divide-y">
            {formData.domains.map((domain, index) => (
              <li key={domain} className="flex justify-between items-center p-2 hover:bg-gray-50">
                <span data-testid={`domainStep-domain-${index}`}>
                  {domain}
                </span>
                <button
                  type="button"
                  onClick={() => removeDomain(domain)}
                  className="text-red-500 hover:text-red-700 p-1"
                  aria-label={`Remove domain ${domain}`}
                  data-testid={`domainStep-remove-domain-${index}`}
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
            onChange={(e) => setNewDomain(e.target.value)}
            placeholder="Enter domain (e.g., example.com)"
            className={`flex-grow p-2 border rounded focus:ring-2 focus:border-blue-500 ${errors.newDomain ? 'border-red-500' : 'border-gray-300'}`}
            aria-invalid={!!errors.newDomain}
            aria-describedby={errors.newDomain ? "domainStep-domain-input-error" : undefined}
            data-testid="domainStep-domain-input"
          />
          
          <button
            type="button"
            onClick={addDomain}
            className="ml-2 px-4 py-2 bg-blue-100 hover:bg-blue-200 rounded flex-shrink-0"
            data-testid="domainStep-add-domain"
            disabled={!newDomain.trim()}
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
