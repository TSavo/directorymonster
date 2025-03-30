'use client';

import React from 'react';
import { DomainManager } from '../DomainManager';

export interface DomainStepProps {
  /**
   * Initial domain data
   */
  values: {
    id?: string;
    domains: string[];
  };
  /**
   * Callback for domain changes
   */
  onDomainsChange: (domains: string[]) => void;
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
  values,
  onDomainsChange,
  isLoading = false
}) => {
  // Handle domain changes from the DomainManager
  const handleDomainsChange = (data: any) => {
    if (data.domains) {
      onDomainsChange(data.domains);
    }
  };

  return (
    <DomainManager
      initialData={values}
      mode={values.id ? 'edit' : 'create'}
      onSuccess={handleDomainsChange}
      // In the multi-step form, we'll handle submission in the parent component
      apiEndpoint={undefined} // Prevent direct API submission
    />
  );
};

export default DomainStep;