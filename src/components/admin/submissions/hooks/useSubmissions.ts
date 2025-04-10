import { useState, useEffect, useCallback } from 'react';
import { Submission, SubmissionFilters, SubmissionPagination } from '@/types/submission';

interface UseSubmissionsOptions {
  initialFilter?: SubmissionFilters;
  siteSlug?: string;
  autoFetch?: boolean;
  fetchApi?: typeof fetchSubmissionsApi;
}

interface UseSubmissionsResult {
  submissions: Submission[];
  isLoading: boolean;
  error: string | null;
  pagination: SubmissionPagination | null;
  fetchSubmissions: () => Promise<Submission[]>;
  setPage: (page: number) => void;
  setFilter: (filter: SubmissionFilters) => void;
}

// API function to fetch submissions
async function fetchSubmissionsApi(
  filter: SubmissionFilters = {},
  siteSlug?: string
): Promise<{ submissions: Submission[]; pagination: SubmissionPagination }> {
  const queryParams = new URLSearchParams();
  
  // Add filter parameters
  if (filter.search) queryParams.append('search', filter.search);
  if (filter.status && filter.status.length) {
    filter.status.forEach(status => queryParams.append('status', status));
  }
  if (filter.categoryIds && filter.categoryIds.length) {
    filter.categoryIds.forEach(id => queryParams.append('categoryId', id));
  }
  if (filter.fromDate) queryParams.append('fromDate', filter.fromDate);
  if (filter.toDate) queryParams.append('toDate', filter.toDate);
  if (filter.page) queryParams.append('page', filter.page.toString());
  if (filter.limit) queryParams.append('limit', filter.limit.toString());
  
  // Construct the API URL
  const apiUrl = siteSlug
    ? `/api/admin/sites/${siteSlug}/submissions?${queryParams}`
    : `/api/admin/submissions?${queryParams}`;
  
  try {
    const response = await fetch(apiUrl);
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to fetch submissions');
    }
    
    const data = await response.json();
    return {
      submissions: data.submissions,
      pagination: data.pagination
    };
  } catch (error) {
    console.error('Error fetching submissions:', error);
    throw error;
  }
}

export function useSubmissions({
  initialFilter = {},
  siteSlug,
  autoFetch = true,
  fetchApi = fetchSubmissionsApi
}: UseSubmissionsOptions = {}): UseSubmissionsResult {
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<SubmissionFilters>(initialFilter);
  const [pagination, setPagination] = useState<SubmissionPagination | null>(null);

  // Fetch submissions based on current filter
  const fetchSubmissions = useCallback(async (): Promise<Submission[]> => {
    setIsLoading(true);
    setError(null);
    
    try {
      const { submissions: fetchedSubmissions, pagination: fetchedPagination } = 
        await fetchApi(filter, siteSlug);
      
      setSubmissions(fetchedSubmissions);
      setPagination(fetchedPagination);
      return fetchedSubmissions;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch submissions';
      setError(errorMessage);
      return [];
    } finally {
      setIsLoading(false);
    }
  }, [filter, siteSlug, fetchApi]);

  // Set page number
  const setPage = useCallback((page: number) => {
    setFilter(prev => ({ ...prev, page }));
  }, []);

  // Update filter
  const updateFilter = useCallback((newFilter: SubmissionFilters) => {
    // Reset to page 1 when filter changes
    setFilter({ ...newFilter, page: 1 });
  }, []);

  // Fetch submissions on mount or when filter changes
  useEffect(() => {
    if (autoFetch) {
      fetchSubmissions();
    }
  }, [autoFetch, fetchSubmissions]);

  return {
    submissions,
    isLoading,
    error,
    pagination,
    fetchSubmissions,
    setPage,
    setFilter: updateFilter
  };
}

export default useSubmissions;
