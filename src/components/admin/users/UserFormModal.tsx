'use client';

import React from 'react';
import { User, NewUser, UpdateUser } from './hooks/useUsers';
import { UserForm } from './UserForm';

interface UserFormModalProps {
  user?: User;
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (user: NewUser | UpdateUser) => Promise<void>;
  isSubmitting: boolean;
  error?: string | null;
  sites: { id: string; name: string }[];
}

export function UserFormModal({
  user,
  isOpen,
  onClose,
  onSubmit,
  isSubmitting,
  error,
  sites,
}: UserFormModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto" data-testid="user-form-modal">
      <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 transition-opacity" aria-hidden="true">
          <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
        </div>

        <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>

        <div 
          className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-3xl sm:w-full"
          role="dialog" 
          aria-modal="true" 
          aria-labelledby="modal-headline"
        >
          <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
            <div className="sm:flex sm:items-start">
              <div className="mt-3 text-center sm:mt-0 sm:text-left w-full">
                <h3 className="text-lg leading-6 font-medium text-gray-900" id="modal-headline">
                  {user ? 'Edit User' : 'Create New User'}
                </h3>
                <div className="mt-4">
                  <UserForm
                    user={user}
                    onSubmit={onSubmit}
                    onCancel={onClose}
                    isSubmitting={isSubmitting}
                    error={error}
                    sites={sites}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default UserFormModal;
