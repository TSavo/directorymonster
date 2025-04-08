'use client';

import React from 'react';
import { Button } from '@/components/ui/Button';

export interface UserTableHeaderPresentationProps {
  onAddUser: () => void;
}

/**
 * UserTableHeaderPresentation Component
 *
 * Pure UI component for rendering the user table header
 */
export function UserTableHeaderPresentation({
  onAddUser
}: UserTableHeaderPresentationProps) {
  return (
    <div className="flex justify-between items-center mb-4">
      <h2 className="text-xl font-bold">User Management</h2>
      <Button
        variant="primary"
        onClick={onAddUser}
        data-testid="add-user-button"
      >
        Add User
      </Button>
    </div>
  );
}
