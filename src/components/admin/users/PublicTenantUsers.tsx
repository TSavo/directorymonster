'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useUsers, User } from './hooks/useUsers';
import { useSites } from '../sites/hooks/useSites';
import { useRoles } from '../auth/hooks/useRoles';

interface PublicTenantUserProps {
  onSuccess?: () => void;
}

/**
 * Component for managing users in the public tenant.
 * Allows admins to:
 * 1. View users who are only in the public tenant
 * 2. Assign them to specific tenants with roles
 */
export const PublicTenantUsers: React.FC<PublicTenantUserProps> = ({ onSuccess }) => {
  const { users, isLoading: usersLoading, error: usersError, getUsers } = useUsers();
  const { sites, isLoading: sitesLoading } = useSites();
  const { roles, isLoading: rolesLoading, getRolesByTenant } = useRoles();
  
  const [publicUsers, setPublicUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  // User assignment state
  const [selectedUserId, setSelectedUserId] = useState<string>('');
  const [selectedTenantId, setSelectedTenantId] = useState<string>('');
  const [selectedRoleId, setSelectedRoleId] = useState<string>('');
  const [tenantRoles, setTenantRoles] = useState<any[]>([]);
  
  // Fetch public tenant users
  const fetchPublicTenantUsers = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const response = await fetch('/api/tenants/public/users');
      
      if (!response.ok) {
        throw new Error('Failed to fetch public tenant users');
      }
      
      const data = await response.json();
      setPublicUsers(data.users);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      setError(errorMessage);
      console.error('Error fetching public tenant users:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);
  
  // Fetch roles for a tenant when tenant is selected
  useEffect(() => {
    if (selectedTenantId) {
      getRolesByTenant(selectedTenantId).then(fetchedRoles => {
        setTenantRoles(fetchedRoles || []);
      });
    } else {
      setTenantRoles([]);
    }
  }, [selectedTenantId, getRolesByTenant]);
  
  // Load initial data
  useEffect(() => {
    fetchPublicTenantUsers();
  }, [fetchPublicTenantUsers]);
  
  // Handle assigning a user to a tenant
  const handleAssignToTenant = async () => {
    if (!selectedUserId || !selectedTenantId || !selectedRoleId) {
      setError('Please select a user, tenant, and role');
      return;
    }
    
    try {
      setIsLoading(true);
      setError(null);
      setSuccess(null);
      
      const response = await fetch('/api/tenants/users/assign', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: selectedUserId,
          tenantId: selectedTenantId,
          roleId: selectedRoleId,
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to assign user to tenant');
      }
      
      setSuccess('User successfully assigned to tenant');
      
      // Reset selection
      setSelectedUserId('');
      setSelectedTenantId('');
      setSelectedRoleId('');
      
      // Refresh data
      fetchPublicTenantUsers();
      
      if (onSuccess) {
        onSuccess();
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      setError(errorMessage);
      console.error('Error assigning user to tenant:', err);
    } finally {
      setIsLoading(false);
    }
  };
  
  const isAllDataLoading = usersLoading || sitesLoading || rolesLoading || isLoading;
  
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">Public Tenant Users</h2>
        <button
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          onClick={fetchPublicTenantUsers}
          disabled={isLoading}
        >
          {isLoading ? 'Refreshing...' : 'Refresh'}
        </button>
      </div>
      
      {error && (
        <div className="p-4 bg-red-100 border border-red-400 text-red-700 rounded">
          {error}
        </div>
      )}
      
      {success && (
        <div className="p-4 bg-green-100 border border-green-400 text-green-700 rounded">
          {success}
        </div>
      )}
      
      <div className="bg-white shadow rounded-lg p-6">
        <h3 className="text-lg font-medium mb-4">Assign User to Tenant</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          {/* User Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              User
            </label>
            <select
              className="w-full border border-gray-300 rounded px-3 py-2"
              value={selectedUserId}
              onChange={(e) => setSelectedUserId(e.target.value)}
              disabled={isAllDataLoading || publicUsers.length === 0}
            >
              <option value="">Select User</option>
              {publicUsers.map((user) => (
                <option key={user.id} value={user.id}>
                  {user.name} ({user.email})
                </option>
              ))}
            </select>
          </div>
          
          {/* Tenant Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Tenant
            </label>
            <select
              className="w-full border border-gray-300 rounded px-3 py-2"
              value={selectedTenantId}
              onChange={(e) => setSelectedTenantId(e.target.value)}
              disabled={isAllDataLoading || !selectedUserId}
            >
              <option value="">Select Tenant</option>
              {sites.map((site) => (
                <option key={site.id} value={site.id}>
                  {site.name}
                </option>
              ))}
            </select>
          </div>
          
          {/* Role Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Role
            </label>
            <select
              className="w-full border border-gray-300 rounded px-3 py-2"
              value={selectedRoleId}
              onChange={(e) => setSelectedRoleId(e.target.value)}
              disabled={isAllDataLoading || !selectedTenantId}
            >
              <option value="">Select Role</option>
              {tenantRoles.map((role) => (
                <option key={role.id} value={role.id}>
                  {role.name}
                </option>
              ))}
            </select>
          </div>
        </div>
        
        <button
          className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 disabled:opacity-50"
          onClick={handleAssignToTenant}
          disabled={
            isAllDataLoading ||
            !selectedUserId ||
            !selectedTenantId ||
            !selectedRoleId
          }
        >
          Assign to Tenant
        </button>
      </div>
      
      <div className="bg-white shadow rounded-lg overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Name
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Email
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Created
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {isAllDataLoading ? (
              <tr>
                <td colSpan={4} className="px-6 py-4 text-center">
                  Loading users...
                </td>
              </tr>
            ) : publicUsers.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-6 py-4 text-center">
                  No users found in the public tenant.
                </td>
              </tr>
            ) : (
              publicUsers.map((user) => (
                <tr key={user.id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{user.name}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-500">{user.email}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-500">
                      {new Date(user.createdAt).toLocaleDateString()}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button
                      className="text-blue-600 hover:text-blue-900"
                      onClick={() => setSelectedUserId(user.id)}
                    >
                      Assign
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default PublicTenantUsers;
