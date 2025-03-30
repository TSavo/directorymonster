'use client';

import React, { useState } from 'react';
import { useUsers, User } from './hooks/useUsers';
import { UserFormModal } from './UserFormModal';
import { useSites } from '../sites/hooks/useSites';

export function UserTable() {
  const { 
    users, 
    isLoading, 
    error, 
    createUser, 
    updateUser, 
    deleteUser 
  } = useUsers();
  
  const { sites } = useSites();
  
  const [selectedUser, setSelectedUser] = useState<User | undefined>(undefined);
  const [showModal, setShowModal] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const handleAddUser = () => {
    setSelectedUser(undefined);
    setFormError(null);
    setShowModal(true);
  };
  
  const handleEditUser = (user: User) => {
    setSelectedUser(user);
    setFormError(null);
    setShowModal(true);
  };
  
  const handleDeleteUser = async (userId: string) => {
    if (confirm('Are you sure you want to delete this user?')) {
      await deleteUser(userId);
    }
  };
  
  const handleFormSubmit = async (userData: any) => {
    try {
      setIsSubmitting(true);
      setFormError(null);
      
      if (selectedUser) {
        await updateUser(userData);
      } else {
        await createUser(userData);
      }
      
      setShowModal(false);
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // Map siteIds to site names for display
  const getSiteNames = (siteIds: string[]) => {
    return siteIds
      .map(id => sites.find(site => site.id === id)?.name || id)
      .join(', ');
  };
  
  if (isLoading) {
    return <div className="p-4">Loading users...</div>;
  }
  
  if (error) {
    return <div className="p-4 text-red-600">Error: {error}</div>;
  }
  
  return (
    <div data-testid="user-table-container">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold">User Management</h2>
        <button
          onClick={handleAddUser}
          className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
          data-testid="add-user-button"
        >
          Add User
        </button>
      </div>
      
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200" data-testid="user-table">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Name
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Email
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Sites
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Created
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {users.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-6 py-4 text-center text-gray-500">
                  No users found
                </td>
              </tr>
            ) : (
              users.map(user => (
                <tr key={user.id} data-testid={`user-row-${user.id}`}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="font-medium text-gray-900">{user.name}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-gray-900">{user.email}</div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-gray-900">{getSiteNames(user.siteIds)}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-gray-500">
                      {new Date(user.createdAt).toLocaleDateString()}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                    <button
                      onClick={() => handleEditUser(user)}
                      className="text-indigo-600 hover:text-indigo-900 mr-4"
                      data-testid={`edit-user-${user.id}`}
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDeleteUser(user.id)}
                      className="text-red-600 hover:text-red-900"
                      data-testid={`delete-user-${user.id}`}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      
      <UserFormModal
        user={selectedUser}
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        onSubmit={handleFormSubmit}
        isSubmitting={isSubmitting}
        error={formError}
        sites={sites}
      />
    </div>
  );
}

export default UserTable;
