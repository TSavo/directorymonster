'use client';

import { useState, useCallback } from 'react';

export interface DomainVerificationStatus {
  domain: string;
  status: 'pending' | 'verified' | 'failed';
  errors?: string[];
}

export interface UseDomainVerificationOptions {
  /**
   * Site slug for API endpoint
   */
  siteSlug: string;
  /**
   * Initial verification statuses
   */
  initialStatuses?: DomainVerificationStatus[];
  /**
   * API endpoint base
   */
  apiEndpoint?: string;
}

/**
 * Custom hook for domain verification
 * 
 * Features:
 * - Verify domain DNS configuration
 * - Track verification status for multiple domains
 * - Handle loading and error states
 * 
 * @param options - Configuration options
 * @returns Domain verification utilities
 */
export const useDomainVerification = (options: UseDomainVerificationOptions) => {
  const { 
    siteSlug,
    initialStatuses = [],
    apiEndpoint = `/api/sites/${siteSlug}/domains/verify`
  } = options;
  
  const [verificationStatuses, setVerificationStatuses] = useState<DomainVerificationStatus[]>(initialStatuses);
  const [isVerifying, setIsVerifying] = useState<Record<string, boolean>>({});
  const [error, setError] = useState<string | null>(null);
  
  /**
   * Verify a domain's DNS configuration
   * 
   * @param domain - Domain to verify
   * @returns Promise resolving to verification result
   */
  const verifyDomain = useCallback(async (domain: string) => {
    setIsVerifying(prev => ({ ...prev, [domain]: true }));
    setError(null);
    
    try {
      const response = await fetch(apiEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ domain })
      });
      
      const result = await response.json();
      
      if (response.ok && result.success) {
        // Update verification status
        setVerificationStatuses(prev => {
          const existing = prev.find(status => status.domain === domain);
          
          if (existing) {
            return prev.map(status => 
              status.domain === domain 
                ? { 
                    ...status, 
                    status: result.verified ? 'verified' : 'failed',
                    errors: result.errors
                  }
                : status
            );
          } else {
            return [
              ...prev,
              { 
                domain, 
                status: result.verified ? 'verified' : 'failed',
                errors: result.errors
              }
            ];
          }
        });
        
        return { success: true, verified: result.verified, errors: result.errors };
      } else {
        throw new Error(result.error || 'Verification failed');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to verify domain');
      
      // Update verification status to failed
      setVerificationStatuses(prev => {
        const existing = prev.find(status => status.domain === domain);
        
        if (existing) {
          return prev.map(status => 
            status.domain === domain 
              ? { ...status, status: 'failed' }
              : status
          );
        } else {
          return [
            ...prev,
            { domain, status: 'failed' }
          ];
        }
      });
      
      return { success: false, error: err.message };
    } finally {
      setIsVerifying(prev => ({ ...prev, [domain]: false }));
    }
  }, [apiEndpoint]);
  
  /**
   * Get verification status for a domain
   * 
   * @param domain - Domain to get status for
   * @returns Verification status or null if not found
   */
  const getDomainStatus = useCallback((domain: string) => {
    return verificationStatuses.find(status => status.domain === domain) || null;
  }, [verificationStatuses]);
  
  /**
   * Check if a domain is being verified
   * 
   * @param domain - Domain to check
   * @returns True if domain is being verified
   */
  const isDomainVerifying = useCallback((domain: string) => {
    return !!isVerifying[domain];
  }, [isVerifying]);
  
  return {
    verificationStatuses,
    isVerifying,
    error,
    verifyDomain,
    getDomainStatus,
    isDomainVerifying
  };
};

export default useDomainVerification;
