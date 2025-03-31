/**
 * Hook for managing global roles
 */

import { useState, useEffect, useCallback } from 'react';
import { Role } from '@/components/admin/auth/utils/roles';
import { ResourceType, Permission } from '@/components/admin/auth/utils/accessControl';

// API interface for global roles
interface GlobalRoleAPI {
  getGlobalRoles: () => Promise<Role[]>;
  createGlobalRole: (role: Omit<Role, 'id' | 'createdAt' | 'updatedAt' | 'tenantId' | 'isGlobal'>) => Promise<Role>;
  updateGlobalRole: (roleId: string, updates: Partial<Role>) => Promise<Role | null>;
  deleteGlobalRole: (roleId: string) => Promise<boolean>;
  getUsersWithGlobalRole: (roleId: string) => Promise<string[]>;
  assignGlobalRole: (userId: string, tenantId: string, roleId: string) => Promise<boolean>;
  removeGlobalRole: (userId: string, tenantId: string, roleId: string) => Promise<boolean>;
}

/**
 * Hook for managing global roles
 */
export function useGlobalRoles(): {
  globalRoles: Role[];
  isLoading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  createRole: (role: Omit<Role, 'id' | 'createdAt' | 'updatedAt' | 'tenantId' | 'isGlobal'>) => Promise<Role | null>;
  updateRole: (roleId: string, updates: Partial<Role>) => Promise<Role | null>;
  deleteRole: (roleId: string) => Promise<boolean>;
  getUsersWithRole: (roleId: string) => Promise<string[]>;
  assignRole: (userId: string, tenantId: string, roleId: string) => Promise<boolean>;
  removeRole: (userId: string, tenantId: string, roleId: string) => Promise<boolean>;
} {
  const [globalRoles, setGlobalRoles] = useState<Role[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Create API client
  const api: GlobalRoleAPI = {
    getGlobalRoles: async () => {
      try {
        const response = await fetch('/api/admin/roles/global');
        if (!response.ok) {
          throw new Error(`Failed to get global roles: ${response.status}`);
        }
        return await response.json();
      } catch (error) {
        console.error('Error getting global roles:', error);
        throw error;
      }
    },

    createGlobalRole: async (role) => {
      try {
        const response = await fetch('/api/admin/roles/global', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(role),
        });
        if (!response.ok) {
          throw new Error(`Failed to create global role: ${response.status}`);
        }
        return await response.json();
      } catch (error) {
        console.error('Error creating global role:', error);
        throw error;
      }
    },

    updateGlobalRole: async (roleId, updates) => {
      try {
        const response = await fetch(`/api/admin/roles/global/${roleId}`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(updates),
        });
        if (!response.ok) {
          throw new Error(`Failed to update global role: ${response.status}`);
        }
        return await response.json();
      } catch (error) {
        console.error('Error updating global role:', error);
        throw error;
      }
    },

    deleteGlobalRole: async (roleId) => {
      try {
        const response = await fetch(`/api/admin/roles/global/${roleId}`, {
          method: 'DELETE',
        });
        if (!response.ok) {
          throw new Error(`Failed to delete global role: ${response.status}`);
        }
        return true;
      } catch (error) {
        console.error('Error deleting global role:', error);
        throw error;
      }
    },

    getUsersWithGlobalRole: async (roleId) => {
      try {
        const response = await fetch(`/api/admin/roles/global/${roleId}/users`);
        if (!response.ok) {
          throw new Error(`Failed to get users with global role: ${response.status}`);
        }
        return await response.json();
      } catch (error) {
        console.error('Error getting users with global role:', error);
        throw error;
      }
    },

    assignGlobalRole: async (userId, tenantId, roleId) => {
      try {
        const response = await fetch(`/api/admin/roles/global/${roleId}/assign`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ userId, tenantId }),
        });
        if (!response.ok) {
          throw new Error(`Failed to assign global role: ${response.status}`);
        }
        return true;
      } catch (error) {
        console.error('Error assigning global role:', error);
        throw error;
      }
    },

    removeGlobalRole: async (userId, tenantId, roleId) => {
      try {
        const response = await fetch(`/api/admin/roles/global/${roleId}/remove`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ userId, tenantId }),
        });
        if (!response.ok) {
          throw new Error(`Failed to remove global role: ${response.status}`);
        }
        return true;
      } catch (error) {
        console.error('Error removing global role:', error);
        throw error;
      }
    },
  };

  // Load global roles
  const fetchGlobalRoles = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const roles = await api.getGlobalRoles();
      setGlobalRoles(roles);
    } catch (error) {
      setError(error instanceof Error ? error.message : String(error));
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Initial load
  useEffect(() => {
    fetchGlobalRoles();
  }, [fetchGlobalRoles]);

  // Create a new global role
  const createRole = async (role: Omit<Role, 'id' | 'createdAt' | 'updatedAt' | 'tenantId' | 'isGlobal'>) => {
    try {
      const newRole = await api.createGlobalRole(role);
      await fetchGlobalRoles(); // Refresh the list
      return newRole;
    } catch (error) {
      setError(error instanceof Error ? error.message : String(error));
      return null;
    }
  };

  // Update an existing global role
  const updateRole = async (roleId: string, updates: Partial<Role>) => {
    try {
      const updatedRole = await api.updateGlobalRole(roleId, updates);
      if (updatedRole) {
        // Update the local state
        setGlobalRoles(prev =>
          prev.map(role => (role.id === roleId ? { ...role, ...updates, updatedAt: updatedRole.updatedAt } : role))
        );
      }
      return updatedRole;
    } catch (error) {
      setError(error instanceof Error ? error.message : String(error));
      return null;
    }
  };

  // Delete a global role
  const deleteRole = async (roleId: string) => {
    try {
      const success = await api.deleteGlobalRole(roleId);
      if (success) {
        // Update the local state
        setGlobalRoles(prev => prev.filter(role => role.id !== roleId));
      }
      return success;
    } catch (error) {
      setError(error instanceof Error ? error.message : String(error));
      return false;
    }
  };

  // Get users with a specific global role
  const getUsersWithRole = async (roleId: string) => {
    try {
      return await api.getUsersWithGlobalRole(roleId);
    } catch (error) {
      setError(error instanceof Error ? error.message : String(error));
      return [];
    }
  };

  // Assign a global role to a user in a specific tenant
  const assignRole = async (userId: string, tenantId: string, roleId: string) => {
    try {
      return await api.assignGlobalRole(userId, tenantId, roleId);
    } catch (error) {
      setError(error instanceof Error ? error.message : String(error));
      return false;
    }
  };

  // Remove a global role from a user in a specific tenant
  const removeRole = async (userId: string, tenantId: string, roleId: string) => {
    try {
      return await api.removeGlobalRole(userId, tenantId, roleId);
    } catch (error) {
      setError(error instanceof Error ? error.message : String(error));
      return false;
    }
  };

  return {
    globalRoles,
    isLoading,
    error,
    refresh: fetchGlobalRoles,
    createRole,
    updateRole,
    deleteRole,
    getUsersWithRole,
    assignRole,
    removeRole,
  };
}

export default useGlobalRoles;
