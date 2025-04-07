"use client";

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter,
  DialogDescription
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  UserPlus, 
  UserMinus, 
  ArrowLeft, 
  Search, 
  AlertCircle, 
  UserX 
} from 'lucide-react';
import { Role } from '@/types/role';

interface User {
  id: string;
  name: string;
  email: string;
  avatarUrl?: string;
}

interface RoleUsersProps {
  role: Role;
  users: User[];
  availableUsers: User[];
  isLoading: boolean;
  error: string | null;
  onAddUsers: (userIds: string[]) => void;
  onRemoveUser: (userId: string) => void;
  onBack: () => void;
}

export function RoleUsers({
  role,
  users,
  availableUsers,
  isLoading,
  error,
  onAddUsers,
  onRemoveUser,
  onBack
}: RoleUsersProps) {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isRemoveDialogOpen, setIsRemoveDialogOpen] = useState(false);
  const [userToRemove, setUserToRemove] = useState<User | null>(null);
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

  // Filter available users by search query
  const filteredAvailableUsers = availableUsers.filter(user => 
    user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Handle user selection
  const toggleUserSelection = (userId: string) => {
    setSelectedUserIds(prev => 
      prev.includes(userId)
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    );
  };

  // Handle add users
  const handleAddUsers = () => {
    onAddUsers(selectedUserIds);
    setSelectedUserIds([]);
    setIsAddDialogOpen(false);
  };

  // Handle remove user
  const handleRemoveUser = () => {
    if (userToRemove) {
      onRemoveUser(userToRemove.id);
      setUserToRemove(null);
      setIsRemoveDialogOpen(false);
    }
  };

  // Open remove dialog
  const openRemoveDialog = (user: User) => {
    setUserToRemove(user);
    setIsRemoveDialogOpen(true);
  };

  // Loading state
  if (isLoading) {
    return (
      <div data-testid="role-users-loading">
        <div className="space-y-4">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-20 w-full" />
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="rounded-md bg-red-50 p-4 my-4" data-testid="role-users-error">
        <div className="flex">
          <div className="flex-shrink-0">
            <AlertCircle className="h-5 w-5 text-red-400" aria-hidden="true" />
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-red-800">{error}</h3>
            <div className="mt-2 text-sm text-red-700">
              <p>Please try again later or contact support if the problem persists.</p>
            </div>
            <div className="mt-4">
              <Button
                size="sm"
                variant="outline"
                onClick={onBack}
              >
                Back to Role
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-medium">Users with {role.name} Role</h2>
          <p className="text-sm text-gray-500 mt-1">
            Manage users assigned to this role
          </p>
        </div>
        <div className="flex space-x-2">
          <Button
            variant="outline"
            onClick={onBack}
            className="flex items-center gap-1"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Role
          </Button>
          <Button
            onClick={() => setIsAddDialogOpen(true)}
            className="flex items-center gap-1"
          >
            <UserPlus className="h-4 w-4" />
            Add Users
          </Button>
        </div>
      </div>

      {/* Empty state */}
      {users.length === 0 ? (
        <div className="text-center py-10 border rounded-md bg-gray-50" data-testid="role-users-empty">
          <UserX className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-semibold text-gray-900">No users have this role</h3>
          <p className="mt-1 text-sm text-gray-500">Get started by adding users to this role.</p>
          <div className="mt-6">
            <Button
              onClick={() => setIsAddDialogOpen(true)}
              className="flex items-center gap-1 mx-auto"
            >
              <UserPlus className="h-4 w-4" />
              Add Users
            </Button>
          </div>
        </div>
      ) : (
        <div className="border rounded-md divide-y">
          {users.map(user => (
            <div key={user.id} className="flex items-center justify-between p-4 hover:bg-gray-50">
              <div className="flex items-center">
                <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden">
                  {user.avatarUrl ? (
                    <img src={user.avatarUrl} alt={user.name} className="h-full w-full object-cover" />
                  ) : (
                    <span className="text-gray-500 text-sm font-medium">
                      {user.name.charAt(0).toUpperCase()}
                    </span>
                  )}
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-900">{user.name}</p>
                  <p className="text-sm text-gray-500">{user.email}</p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => openRemoveDialog(user)}
                aria-label="Remove user"
                className="text-red-600 hover:text-red-700 hover:bg-red-50"
              >
                <UserMinus className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>
      )}

      {/* Add Users Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add Users to {role.name} Role</DialogTitle>
            <DialogDescription>
              Select users to add to this role.
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-4">
            <div className="relative mb-4">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
              <Input
                type="search"
                placeholder="Search users..."
                className="pl-8"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            
            <div className="border rounded-md divide-y max-h-[300px] overflow-y-auto">
              {filteredAvailableUsers.length === 0 ? (
                <div className="p-4 text-center text-sm text-gray-500">
                  No users found matching your search.
                </div>
              ) : (
                filteredAvailableUsers.map(user => (
                  <div key={user.id} className="flex items-center p-3 hover:bg-gray-50">
                    <Checkbox
                      id={`select-user-${user.id}`}
                      data-testid={`select-user-${user.id}`}
                      checked={selectedUserIds.includes(user.id)}
                      onCheckedChange={() => toggleUserSelection(user.id)}
                      className="mr-2"
                    />
                    <div className="flex items-center flex-1">
                      <div className="h-8 w-8 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden">
                        {user.avatarUrl ? (
                          <img src={user.avatarUrl} alt={user.name} className="h-full w-full object-cover" />
                        ) : (
                          <span className="text-gray-500 text-xs font-medium">
                            {user.name.charAt(0).toUpperCase()}
                          </span>
                        )}
                      </div>
                      <div className="ml-3">
                        <p className="text-sm font-medium text-gray-900">{user.name}</p>
                        <p className="text-xs text-gray-500">{user.email}</p>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
          
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsAddDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={handleAddUsers}
              disabled={selectedUserIds.length === 0}
            >
              Add Selected Users
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Remove User Alert Dialog */}
      <AlertDialog open={isRemoveDialogOpen} onOpenChange={setIsRemoveDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove User from Role</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to remove {userToRemove?.name} from the {role.name} role?
              This will revoke all permissions associated with this role from the user.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleRemoveUser}
              className="bg-red-600 hover:bg-red-700"
            >
              Remove
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

export default RoleUsers;
