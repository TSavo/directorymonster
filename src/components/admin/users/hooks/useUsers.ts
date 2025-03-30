'use client';

import { useState, useCallback, useEffect } from 'react';

import { ACL } from '../../auth/utils/accessControl';

export interface User {
  id: string;
  name: string;
  email: string;
  createdAt: string;
  updatedAt: string;
  acl: ACL; // Access control list for this user
  siteIds: string[]; // Sites this user is associated with (for easy filtering)
}

export interface NewUser {
  name: string;
  email: string;
  password: string;
  siteIds: string[]; // Initial site associations
  isSuperAdmin?: boolean; // If true, will create a superadmin ACL
  isAdmin?: boolean; // If true, will create admin ACLs for the specified sites
}

export interface UpdateUser {
  id: string;
  name?: string;
  email?: string;
  password?: string;
  siteIds?: string[]; // Updated site associations
  acl?: ACL; // Updated ACL if permissions have changed
}

interface UseUsersResult {
  users: User[];
  isLoading: boolean;
  error: string | null;
  getUsers: () => Promise<void>;
  getUserById: (id: string) => Promise<User | null>;
  createUser: (user: NewUser) => Promise<User | null>;
  updateUser: (user: UpdateUser) => Promise<User | null>;
  deleteUser: (id: string) => Promise<boolean>;
  resetPassword: (email: string) => Promise<boolean>;
}

/**
 * Hook for managing user data
 */
export function useUsers(): UseUsersResult {
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Fetch all users
   */
  const getUsers = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const response = await fetch('/api/admin/users');
      
      if (!response.ok) {
        throw new Error('Failed to fetch users');
      }
      
      const data = await response.json();
      setUsers(data.users);
      
      return data.users;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      setError(errorMessage);
      console.error('Error fetching users:', err);
      return [];
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Fetch a single user by ID
   */
  const getUserById = useCallback(async (id: string): Promise<User | null> => {
    try {
      setIsLoading(true);
      setError(null);
      
      const response = await fetch(`/api/admin/users/${id}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch user');
      }
      
      const data = await response.json();
      return data.user;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      setError(errorMessage);
      console.error('Error fetching user:', err);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Create a new user
   */
  const createUser = useCallback(async (user: NewUser): Promise<User | null> => {
    try {
      setIsLoading(true);
      setError(null);
      
      const response = await fetch('/api/admin/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(user),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to create user');
      }
      
      const data = await response.json();
      
      // Update the users list with the new user
      setUsers(prev => [...prev, data.user]);
      
      return data.user;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      setError(errorMessage);
      console.error('Error creating user:', err);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Update an existing user
   */
  const updateUser = useCallback(async (user: UpdateUser): Promise<User | null> => {
    try {
      setIsLoading(true);
      setError(null);
      
      const response = await fetch(`/api/admin/users/${user.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(user),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to update user');
      }
      
      const data = await response.json();
      
      // Update the users list with the updated user
      setUsers(prev => 
        prev.map(u => u.id === data.user.id ? data.user : u)
      );
      
      return data.user;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      setError(errorMessage);
      console.error('Error updating user:', err);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Delete a user
   */
  const deleteUser = useCallback(async (id: string): Promise<boolean> => {
    try {
      setIsLoading(true);
      setError(null);
      
      const response = await fetch(`/api/admin/users/${id}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to delete user');
      }
      
      // Remove the deleted user from the list
      setUsers(prev => prev.filter(user => user.id !== id));
      
      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      setError(errorMessage);
      console.error('Error deleting user:', err);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Request a password reset for a user
   */
  const resetPassword = useCallback(async (email: string): Promise<boolean> => {
    try {
      setIsLoading(true);
      setError(null);
      
      const response = await fetch('/api/admin/users/reset-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to request password reset');
      }
      
      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      setError(errorMessage);
      console.error('Error requesting password reset:', err);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Load users on initial mount
  useEffect(() => {
    getUsers();
  }, [getUsers]);

  return {
    users,
    isLoading,
    error,
    getUsers,
    getUserById,
    createUser,
    updateUser,
    deleteUser,
    resetPassword,
  };
}

export default useUsers;
