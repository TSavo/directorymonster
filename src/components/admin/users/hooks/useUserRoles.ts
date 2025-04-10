import { useState, useEffect } from 'react';

export interface Role {
  id: string;
  name: string;
  description: string;
  scope: 'tenant' | 'site';
  siteId?: string;
}

/**
 * Hook to manage user roles
 * 
 * @param userId - The user ID
 * @returns User roles and functions to manage them
 */
export function useUserRoles(userId: string) {
  const [userRoles, setUserRoles] = useState<Role[]>([]);
  const [availableRoles, setAvailableRoles] = useState<Role[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchUserRoles = async () => {
      try {
        setIsLoading(true);
        setError(null);

        // In a real implementation, this would fetch from the API
        const response = await fetch(`/api/admin/users/${userId}/roles`);
        
        if (!response.ok) {
          throw new Error('Failed to fetch user roles');
        }

        const data = await response.json();
        setUserRoles(data.roles || []);
        setAvailableRoles(data.availableRoles || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setIsLoading(false);
      }
    };

    if (userId) {
      fetchUserRoles();
    }
  }, [userId]);

  const addRolesToUser = async (roleIds: string[]) => {
    try {
      setError(null);

      // In a real implementation, this would call the API
      const response = await fetch(`/api/admin/users/${userId}/roles`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ roleIds }),
      });

      if (!response.ok) {
        throw new Error('Failed to add roles to user');
      }

      // Refresh the roles
      const updatedResponse = await fetch(`/api/admin/users/${userId}/roles`);
      const data = await updatedResponse.json();
      
      setUserRoles(data.roles || []);
      setAvailableRoles(data.availableRoles || []);

      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      return false;
    }
  };

  const removeRoleFromUser = async (roleId: string) => {
    try {
      setError(null);

      // In a real implementation, this would call the API
      const response = await fetch(`/api/admin/users/${userId}/roles/${roleId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to remove role from user');
      }

      // Refresh the roles
      const updatedResponse = await fetch(`/api/admin/users/${userId}/roles`);
      const data = await updatedResponse.json();
      
      setUserRoles(data.roles || []);
      setAvailableRoles(data.availableRoles || []);

      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      return false;
    }
  };

  return {
    userRoles,
    availableRoles,
    isLoading,
    error,
    addRolesToUser,
    removeRoleFromUser,
  };
}
