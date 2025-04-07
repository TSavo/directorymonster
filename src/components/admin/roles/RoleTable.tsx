"use client";

import React from 'react';
import { useRouter } from 'next/navigation';
import { format } from 'date-fns';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { 
  MoreHorizontal, 
  Edit, 
  Trash, 
  Users, 
  Shield, 
  Copy, 
  AlertCircle, 
  XCircle 
} from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Role, RolePagination, RoleScope, RoleType } from '@/types/role';

interface RoleTableProps {
  roles: Role[];
  isLoading: boolean;
  error: string | null;
  pagination: RolePagination | null;
  onRetry: () => void;
  onPageChange: (page: number) => void;
}

export function RoleTable({
  roles,
  isLoading,
  error,
  pagination,
  onRetry,
  onPageChange
}: RoleTableProps) {
  const router = useRouter();

  // Function to get role type badge
  const getRoleTypeBadge = (type: RoleType) => {
    switch (type) {
      case RoleType.SYSTEM:
        return <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">System</Badge>;
      case RoleType.CUSTOM:
        return <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">Custom</Badge>;
      default:
        return <Badge variant="outline">{type}</Badge>;
    }
  };

  // Function to get role scope badge
  const getRoleScopeBadge = (scope: RoleScope) => {
    switch (scope) {
      case RoleScope.GLOBAL:
        return <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200">Global</Badge>;
      case RoleScope.TENANT:
        return <Badge variant="outline" className="bg-indigo-50 text-indigo-700 border-indigo-200">Tenant</Badge>;
      case RoleScope.SITE:
        return <Badge variant="outline" className="bg-teal-50 text-teal-700 border-teal-200">Site</Badge>;
      default:
        return <Badge variant="outline">{scope}</Badge>;
    }
  };

  // Function to navigate to role edit page
  const handleEditRole = (roleId: string) => {
    router.push(`/admin/roles/${roleId}/edit`);
  };

  // Function to navigate to role permissions page
  const handleManagePermissions = (roleId: string) => {
    router.push(`/admin/roles/${roleId}/permissions`);
  };

  // Function to navigate to role users page
  const handleViewUsers = (roleId: string) => {
    router.push(`/admin/roles/${roleId}/users`);
  };

  // Function to navigate to role clone page
  const handleCloneRole = (roleId: string) => {
    router.push(`/admin/roles/${roleId}/clone`);
  };

  // Function to navigate to role delete page
  const handleDeleteRole = (roleId: string) => {
    router.push(`/admin/roles/${roleId}/delete`);
  };

  // Loading state
  if (isLoading) {
    return (
      <div data-testid="roles-loading">
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
      <div className="rounded-md bg-red-50 p-4 my-4" data-testid="roles-error">
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
                onClick={onRetry}
                data-testid="retry-button"
              >
                Retry
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Empty state
  if (!roles.length) {
    return (
      <div className="text-center py-10 border rounded-md bg-gray-50" data-testid="roles-empty">
        <h3 className="mt-2 text-sm font-semibold text-gray-900">No roles found</h3>
        <p className="mt-1 text-sm text-gray-500">No roles found matching the current filters.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4" data-testid="roles-table">
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Description</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Scope</TableHead>
              <TableHead>Users</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {roles.map((role) => (
              <TableRow key={role.id}>
                <TableCell className="font-medium">{role.name}</TableCell>
                <TableCell>{role.description}</TableCell>
                <TableCell>{getRoleTypeBadge(role.type)}</TableCell>
                <TableCell>{getRoleScopeBadge(role.scope)}</TableCell>
                <TableCell>{role.userCount}</TableCell>
                <TableCell className="text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm">
                        <MoreHorizontal className="h-4 w-4" />
                        <span className="sr-only">Actions</span>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => handleEditRole(role.id)}>
                        <Edit className="mr-2 h-4 w-4" />
                        Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleManagePermissions(role.id)}>
                        <Shield className="mr-2 h-4 w-4" />
                        Manage Permissions
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleViewUsers(role.id)}>
                        <Users className="mr-2 h-4 w-4" />
                        View Users
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleCloneRole(role.id)}>
                        <Copy className="mr-2 h-4 w-4" />
                        Clone
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        onClick={() => handleDeleteRole(role.id)}
                        className="text-red-600"
                        disabled={role.type === RoleType.SYSTEM}
                      >
                        <Trash className="mr-2 h-4 w-4" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {pagination && pagination.totalPages > 1 && (
        <div className="flex items-center justify-between px-2">
          <div className="text-sm text-gray-500">
            Showing {(pagination.page - 1) * pagination.perPage + 1} to{' '}
            {Math.min(pagination.page * pagination.perPage, pagination.total)} of{' '}
            {pagination.total} roles
          </div>
          <div className="flex space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange(pagination.page - 1)}
              disabled={pagination.page <= 1}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange(pagination.page + 1)}
              disabled={pagination.page >= pagination.totalPages}
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

export default RoleTable;
