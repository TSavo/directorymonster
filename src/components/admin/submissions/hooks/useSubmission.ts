import { useState, useEffect, useCallback } from 'react';
import { Submission } from '@/types/submission';

interface UseSubmissionOptions {
  submissionId: string;
  siteSlug?: string;
  autoFetch?: boolean;
  fetchApi?: typeof fetchSubmissionApi;
  approveApi?: typeof approveSubmissionApi;
  rejectApi?: typeof rejectSubmissionApi;
}

interface UseSubmissionResult {
  submission: Submission | null;
  isLoading: boolean;
  error: string | null;
  isSubmitting: boolean;
  fetchSubmission: () => Promise<Submission | null>;
  approveSubmission: (notes?: string) => Promise<boolean>;
  rejectSubmission: (notes?: string) => Promise<boolean>;
}

// API function to fetch a single submission
async function fetchSubmissionApi(
  submissionId: string,
  siteSlug?: string
): Promise<Submission> {
  // Construct the API URL
  const apiUrl = siteSlug
    ? `/api/admin/sites/${siteSlug}/submissions/${submissionId}`
    : `/api/admin/submissions/${submissionId}`;
  
  try {
    const response = await fetch(apiUrl);
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to fetch submission');
    }
    
    const data = await response.json();
    return data.submission;
  } catch (error) {
    console.error('Error fetching submission:', error);
    throw error;
  }
}

// API function to approve a submission
async function approveSubmissionApi(
  submissionId: string,
  notes?: string,
  siteSlug?: string
): Promise<boolean> {
  // Construct the API URL
  const apiUrl = siteSlug
    ? `/api/admin/sites/${siteSlug}/submissions/${submissionId}/approve`
    : `/api/admin/submissions/${submissionId}/approve`;
  
  try {
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ notes })
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to approve submission');
    }
    
    return true;
  } catch (error) {
    console.error('Error approving submission:', error);
    throw error;
  }
}

// API function to reject a submission
async function rejectSubmissionApi(
  submissionId: string,
  notes?: string,
  siteSlug?: string
): Promise<boolean> {
  // Construct the API URL
  const apiUrl = siteSlug
    ? `/api/admin/sites/${siteSlug}/submissions/${submissionId}/reject`
    : `/api/admin/submissions/${submissionId}/reject`;
  
  try {
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ notes })
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to reject submission');
    }
    
    return true;
  } catch (error) {
    console.error('Error rejecting submission:', error);
    throw error;
  }
}

export function useSubmission({
  submissionId,
  siteSlug,
  autoFetch = true,
  fetchApi = fetchSubmissionApi,
  approveApi = approveSubmissionApi,
  rejectApi = rejectSubmissionApi
}: UseSubmissionOptions): UseSubmissionResult {
  const [submission, setSubmission] = useState<Submission | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch submission
  const fetchSubmission = useCallback(async (): Promise<Submission | null> => {
    if (!submissionId) return null;
    
    setIsLoading(true);
    setError(null);
    
    try {
      const fetchedSubmission = await fetchApi(submissionId, siteSlug);
      setSubmission(fetchedSubmission);
      return fetchedSubmission;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch submission';
      setError(errorMessage);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [submissionId, siteSlug, fetchApi]);

  // Approve submission
  const approveSubmission = useCallback(async (notes?: string): Promise<boolean> => {
    if (!submissionId) return false;
    
    setIsSubmitting(true);
    setError(null);
    
    try {
      const success = await approveApi(submissionId, notes, siteSlug);
      if (success) {
        await fetchSubmission();
      }
      return success;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to approve submission';
      setError(errorMessage);
      return false;
    } finally {
      setIsSubmitting(false);
    }
  }, [submissionId, siteSlug, approveApi, fetchSubmission]);

  // Reject submission
  const rejectSubmission = useCallback(async (notes?: string): Promise<boolean> => {
    if (!submissionId) return false;
    
    setIsSubmitting(true);
    setError(null);
    
    try {
      const success = await rejectApi(submissionId, notes, siteSlug);
      if (success) {
        await fetchSubmission();
      }
      return success;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to reject submission';
      setError(errorMessage);
      return false;
    } finally {
      setIsSubmitting(false);
    }
  }, [submissionId, siteSlug, rejectApi, fetchSubmission]);

  // Fetch submission on mount
  useEffect(() => {
    if (autoFetch && submissionId) {
      fetchSubmission();
    }
  }, [autoFetch, submissionId, fetchSubmission]);

  return {
    submission,
    isLoading,
    error,
    isSubmitting,
    fetchSubmission,
    approveSubmission,
    rejectSubmission
  };
}

export default useSubmission;
