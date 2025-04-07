import { useState, useEffect, useCallback } from 'react';
import { Role, RoleFilter, RolePagination } from '@/types/role';
import { useAuth } from '@/components/admin/auth/AuthProvider';

interface UseRolesOptions {
  initialFilter?: RoleFilter;
  autoFetch?: boolean;
  fetchApi?: typeof fetchRolesApi;
}

interface UseRolesResult {
  roles: Role[];
  isLoading: boolean;
  error: string | null;
  pagination: RolePagination | null;
  fetchRoles: () => Promise<Role[]>;
  setPage: (page: number) => void;
  setFilter: (filter: RoleFilter) => void;
}

// API function to fetch roles
async function fetchRolesApi(
  filter: RoleFilter = {}
): Promise<{ roles: Role[]; pagination: RolePagination }> {
  const queryParams = new URLSearchParams();
  
  // Add filter parameters
  if (filter.search) queryParams.append('search', filter.search);
  if (filter.scope) queryParams.append('scope', filter.scope);
  if (filter.type) queryParams.append('type', filter.type);
  if (filter.siteId) queryParams.append('siteId', filter.siteId);
  if (filter.page) queryParams.append('page', filter.page.toString());
  if (filter.limit) queryParams.append('limit', filter.limit.toString());
  if (filter.sortBy) queryParams.append('sort', filter.sortBy);
  if (filter.sortOrder) queryParams.append('order', filter.sortOrder);
  
  // Construct the API URL
  const apiUrl = `/api/admin/roles?${queryParams}`;
  
  try {
    const response = await fetch(apiUrl);
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to fetch roles');
    }
    
    const data = await response.json();
    return {
      roles: data.roles,
      pagination: data.pagination
    };
  } catch (error) {
    console.error('Error fetching roles:', error);
    throw error;
  }
}

export function useRoles({
  initialFilter = {},
  autoFetch = true,
  fetchApi = fetchRolesApi
}: UseRolesOptions = {}): UseRolesResult {
  const { currentTenant } = useAuth();
  const [roles, setRoles] = useState<Role[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<RoleFilter>(initialFilter);
  const [pagination, setPagination] = useState<RolePagination | null>(null);

  // Fetch roles based on current filter
  const fetchRoles = useCallback(async (): Promise<Role[]> => {
    setIsLoading(true);
    setError(null);
    
    try {
      const { roles: fetchedRoles, pagination: fetchedPagination } = 
        await fetchApi(filter);
      
      setRoles(fetchedRoles);
      setPagination(fetchedPagination);
      return fetchedRoles;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch roles';
      setError(errorMessage);
      return [];
    } finally {
      setIsLoading(false);
    }
  }, [filter, fetchApi]);

  // Set page number
  const setPage = useCallback((page: number) => {
    setFilter(prev => ({ ...prev, page }));
  }, []);

  // Update filter
  const updateFilter = useCallback((newFilter: RoleFilter) => {
    // Reset to page 1 when filter changes
    setFilter({ ...newFilter, page: 1 });
  }, []);

  // Fetch roles on mount or when filter changes
  useEffect(() => {
    if (autoFetch) {
      fetchRoles();
    }
  }, [autoFetch, fetchRoles]);

  return {
    roles,
    isLoading,
    error,
    pagination,
    fetchRoles,
    setPage,
    setFilter: updateFilter
  };
}

export default useRoles;
