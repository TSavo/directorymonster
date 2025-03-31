/**
 * Main component for managing global roles
 */
import React, { useState } from 'react';
import { useGlobalRoles } from './useGlobalRoles';
import { useAuth } from '@/components/admin/auth/hooks/useAuth';
import { Role } from '@/components/admin/auth/utils/roles';
import GlobalRoleForm from './GlobalRoleForm';
import UserAssignment from './UserAssignment';
import GlobalRoleCard from './GlobalRoleCard';
import { GlobalRoleFormData } from './types';
import LoadingSpinner from '@/components/ui/LoadingSpinner';

const GlobalRoleManager: React.FC = () => {
  const { globalRoles, isLoading, error, refresh, createRole, updateRole, deleteRole } = useGlobalRoles();
  const { hasGlobalPermission } = useAuth();
  const [showEditor, setShowEditor] = useState(false);
  const [editingRole, setEditingRole] = useState<Role | null>(null);
  const [showAssignment, setShowAssignment] = useState(false);
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  
  // Check if user has permission to manage global roles
  const hasPermission = hasGlobalPermission('role', 'manage');
  
  // Handle role creation
  const handleCreateRole = async (roleData: GlobalRoleFormData) => {
    try {
      setActionError(null);
      await createRole(roleData);
      setShowEditor(false);
      return Promise.resolve();
    } catch (error) {
      setActionError('Failed to create global role');
      console.error('Error creating global role:', error);
      return Promise.reject(error);
    }
  };
  
  // Handle role update
  const handleUpdateRole = async (roleData: GlobalRoleFormData) => {
    if (!editingRole) return Promise.reject('No role selected for editing');
    
    try {
      setActionError(null);
      await updateRole(editingRole.id, roleData);
      setShowEditor(false);
      setEditingRole(null);
      return Promise.resolve();
    } catch (error) {
      setActionError('Failed to update global role');
      console.error('Error updating global role:', error);
      return Promise.reject(error);
    }
  };
  
  // Handle role deletion with confirmation
  const handleDeleteRole = async (roleId: string) => {
    if (!confirm('Are you sure you want to delete this global role? This action cannot be undone.')) {
      return;
    }
    
    try {
      setActionError(null);
      await deleteRole(roleId);
    } catch (error) {
      setActionError('Failed to delete global role');
      console.error('Error deleting global role:', error);
    }
  };
  
  // Start editing a role
  const handleEditRole = (role: Role) => {
    setEditingRole(role);
    setShowEditor(true);
  };
  
  // Start user assignment for a role
  const handleManageUsers = (role: Role) => {
    setSelectedRole(role);
    setShowAssignment(true);
  };
  
  if (!hasPermission) {
    return (
      <div className="p-6 bg-yellow-50 border border-yellow-300 rounded-md">
        <h3 className="text-lg font-medium text-yellow-800 mb-2">Access Restricted</h3>
        <p className="text-yellow-700">
          You don't have permission to manage global roles. Please contact a system administrator.
        </p>
      </div>
    );
  }
  
  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="p-6 border-b border-gray-200">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Global Role Management</h2>
              <p className="mt-1 text-sm text-gray-600">
                Manage roles that operate across tenant boundaries with proper tenant isolation.
              </p>
            </div>
            
            <button
              onClick={() => {
                setEditingRole(null);
                setShowEditor(true);
              }}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors flex items-center"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clipRule="evenodd" />
              </svg>
              Create Global Role
            </button>
          </div>
        </div>
        
        {actionError && (
          <div className="mx-6 my-4 p-4 bg-red-50 border-l-4 border-red-500 rounded">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-red-700">{actionError}</p>
              </div>
              <div className="ml-auto pl-3">
                <button
                  onClick={() => setActionError(null)}
                  className="inline-flex rounded-md p-1.5 text-red-500 hover:bg-red-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                >
                  <span className="sr-only">Dismiss</span>
                  <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        )}
        
        {isLoading ? (
          <div className="flex justify-center items-center py-16">
            <LoadingSpinner />
          </div>
        ) : error ? (
          <div className="p-6 bg-red-50 border-t border-red-100">
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">Error loading global roles</h3>
                <div className="mt-2 text-sm text-red-700">
                  <p>{error}</p>
                </div>
                <div className="mt-4">
                  <button
                    onClick={refresh}
                    className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-red-700 bg-red-100 hover:bg-red-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                  >
                    Try again
                  </button>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="p-6">
            {globalRoles.length === 0 ? (
              <div className="text-center py-12 bg-gray-50 rounded-lg">
                <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
                <h3 className="mt-2 text-sm font-medium text-gray-900">No global roles</h3>
                <p className="mt-1 text-sm text-gray-500">
                  Get started by creating a new global role.
                </p>
                <div className="mt-6">
                  <button
                    onClick={() => {
                      setEditingRole(null);
                      setShowEditor(true);
                    }}
                    className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    <svg className="-ml-1 mr-2 h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clipRule="evenodd" />
                    </svg>
                    Create Global Role
                  </button>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {globalRoles.map((role) => (
                  <GlobalRoleCard
                    key={role.id}
                    role={role}
                    onEdit={() => handleEditRole(role)}
                    onManageUsers={() => handleManageUsers(role)}
                    onDelete={() => handleDeleteRole(role.id)}
                  />
                ))}
              </div>
            )}
          </div>
        )}
      </div>
      
      {/* Role Editor Modal */}
      {showEditor && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center z-50">
          <div className="max-w-lg w-full m-4">
            <GlobalRoleForm
              initialData={editingRole || undefined}
              onSubmit={editingRole ? handleUpdateRole : handleCreateRole}
              onCancel={() => {
                setShowEditor(false);
                setEditingRole(null);
              }}
            />
          </div>
        </div>
      )}
      
      {/* User Assignment Modal */}
      {showAssignment && selectedRole && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center z-50">
          <div className="max-w-2xl w-full m-4">
            <UserAssignment
              roleId={selectedRole.id}
              roleName={selectedRole.name}
              onClose={() => {
                setShowAssignment(false);
                setSelectedRole(null);
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default GlobalRoleManager;
