/**
 * Component for managing user assignments to global roles
 */
import React, { useState, useEffect } from 'react';
import { useGlobalRoles } from './useGlobalRoles';
import { UserAssignmentProps } from './types';
import LoadingSpinner from '@/components/ui/LoadingSpinner';

const UserAssignment: React.FC<UserAssignmentProps> = ({ roleId, roleName, onClose }) => {
  const { getUsersWithRole, assignRole, removeRole } = useGlobalRoles();
  const [users, setUsers] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [newUserId, setNewUserId] = useState('');
  const [tenantId, setTenantId] = useState('');
  const [isAssigning, setIsAssigning] = useState(false);
  
  // Load users with this role
  useEffect(() => {
    const loadUsers = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const roleUsers = await getUsersWithRole(roleId);
        setUsers(roleUsers);
      } catch (err) {
        setError('Failed to load users with this role');
        console.error('Error loading users:', err);
      } finally {
        setIsLoading(false);
      }
    };
    
    loadUsers();
  }, [roleId, getUsersWithRole]);
  
  // Assign role to a new user
  const handleAssignRole = async () => {
    if (!newUserId || !tenantId) {
      setError('User ID and Tenant ID are required');
      return;
    }
    
    setIsAssigning(true);
    setError(null);
    
    try {
      const success = await assignRole(newUserId, tenantId, roleId);
      if (success) {
        // Only add to the list if the user isn't already there
        if (!users.includes(newUserId)) {
          setUsers([...users, newUserId]);
        }
        setNewUserId('');
        setTenantId('');
      } else {
        setError('Failed to assign role');
      }
    } catch (err) {
      setError('Error assigning role');
      console.error('Error assigning role:', err);
    } finally {
      setIsAssigning(false);
    }
  };
  
  // Remove role from a user
  const handleRemoveRole = async (userId: string) => {
    try {
      // For the UI, we'll need to specify a tenant context
      // In a real app, you might need to select which tenant to remove the role from
      const success = await removeRole(userId, 'system', roleId);
      if (success) {
        setUsers(users.filter((id) => id !== userId));
      } else {
        setError('Failed to remove role');
      }
    } catch (err) {
      setError('Error removing role');
      console.error('Error removing role:', err);
    }
  };
  
  return (
    <div className="bg-white p-6 rounded-lg shadow-md max-w-2xl mx-auto">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-medium">Manage Users with Role: {roleName}</h3>
        <button
          onClick={onClose}
          className="text-gray-500 hover:text-gray-700"
          aria-label="Close"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
      
      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded">
          {error}
        </div>
      )}
      
      {isLoading ? (
        <div className="py-8 flex justify-center">
          <LoadingSpinner />
        </div>
      ) : (
        <>
          <div className="mb-6">
            <h4 className="text-sm font-medium text-gray-700 mb-2">Current Users</h4>
            
            {users.length === 0 ? (
              <p className="text-sm text-gray-500 italic p-4 bg-gray-50 rounded">
                No users have this global role.
              </p>
            ) : (
              <div className="max-h-60 overflow-y-auto border border-gray-200 rounded">
                <ul className="divide-y divide-gray-200">
                  {users.map((userId) => (
                    <li key={userId} className="p-3 flex justify-between items-center hover:bg-gray-50">
                      <span className="text-sm font-medium">{userId}</span>
                      <button
                        onClick={() => handleRemoveRole(userId)}
                        className="text-red-500 hover:text-red-700 text-sm flex items-center"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                        </svg>
                        Remove
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
          
          <div className="mb-4">
            <h4 className="text-sm font-medium text-gray-700 mb-2">Assign to User</h4>
            <div className="flex flex-col sm:flex-row gap-2 mb-2">
              <input
                type="text"
                value={newUserId}
                onChange={(e) => setNewUserId(e.target.value)}
                placeholder="User ID"
                className="flex-1 p-2 border border-gray-300 rounded"
                disabled={isAssigning}
              />
              <input
                type="text"
                value={tenantId}
                onChange={(e) => setTenantId(e.target.value)}
                placeholder="Tenant ID"
                className="flex-1 p-2 border border-gray-300 rounded"
                disabled={isAssigning}
              />
              <button
                onClick={handleAssignRole}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
                disabled={isAssigning || !newUserId || !tenantId}
              >
                {isAssigning ? 'Assigning...' : 'Assign'}
              </button>
            </div>
            <p className="text-xs text-gray-500">
              Note: Global roles need a tenant context for assignment. The role will be active for the user in this tenant.
            </p>
          </div>
          
          <div className="flex justify-end">
            <button
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded text-gray-700 hover:bg-gray-50"
            >
              Close
            </button>
          </div>
        </>
      )}
    </div>
  );
};

export default UserAssignment;
