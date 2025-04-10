"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { PlusCircle, Search } from 'lucide-react';
import { RoleTable } from './RoleTable';
import { useRoles } from './hooks/useRoles';
import { RoleFilter } from '@/types/role';
import { useAuth } from '@/components/admin/auth/AuthProvider';

interface RoleDashboardProps {
  initialFilter?: RoleFilter;
}

export function RoleDashboard({ initialFilter = {} }: RoleDashboardProps) {
  const router = useRouter();
  const { user, currentTenant } = useAuth();
  const [filter, setFilter] = useState<RoleFilter>(initialFilter);
  const [searchInput, setSearchInput] = useState(initialFilter.search || '');
  
  const { 
    roles, 
    isLoading, 
    error, 
    pagination,
    fetchRoles,
    setPage
  } = useRoles({
    initialFilter: filter,
    autoFetch: true
  });

  // Handle search input change
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchInput(e.target.value);
  };

  // Handle search submit
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setFilter(prev => ({ ...prev, search: searchInput }));
  };

  // Handle scope change
  const handleScopeChange = (value: string) => {
    setFilter(prev => ({ 
      ...prev, 
      scope: value === 'all' ? undefined : value as 'global' | 'tenant' 
    }));
  };

  // Handle create role button click
  const handleCreateRole = () => {
    router.push('/admin/roles/new');
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">Role Management</h1>
        <Button 
          onClick={handleCreateRole}
          className="flex items-center gap-1"
          data-testid="create-role-button"
        >
          <PlusCircle className="h-4 w-4" />
          Create Role
        </Button>
      </div>
      
      <div className="flex flex-col sm:flex-row gap-4">
        <form onSubmit={handleSearch} className="flex-1 flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
            <Input
              type="search"
              placeholder="Search roles..."
              className="pl-8"
              value={searchInput}
              onChange={handleSearchChange}
              data-testid="role-search-input"
            />
          </div>
          <Button type="submit" variant="secondary" data-testid="role-search-button">
            Search
          </Button>
        </form>
        
        <div className="w-full sm:w-[200px]">
          <Select 
            value={filter.scope || 'all'} 
            onValueChange={handleScopeChange}
          >
            <SelectTrigger data-testid="role-scope-select">
              <SelectValue placeholder="Scope" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Roles</SelectItem>
              <SelectItem value="global">Global Roles</SelectItem>
              <SelectItem value="tenant">Tenant Roles</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      
      <RoleTable 
        roles={roles}
        isLoading={isLoading}
        error={error}
        pagination={pagination}
        onRetry={fetchRoles}
        onPageChange={setPage}
      />
      
      <div className="bg-gray-50 border rounded-md p-4 mt-8">
        <h2 className="text-lg font-medium mb-2">About Role Management</h2>
        <p className="text-sm text-gray-600 mb-4">
          Roles define sets of permissions that can be assigned to users. Each role contains a collection of 
          access control entries (ACEs) that grant specific permissions to resources.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div>
            <h3 className="font-medium mb-1">Global Roles</h3>
            <p className="text-gray-600">
              Apply across all tenants and provide system-wide permissions. Only super administrators 
              can create and manage global roles.
            </p>
          </div>
          <div>
            <h3 className="font-medium mb-1">Tenant Roles</h3>
            <p className="text-gray-600">
              Apply only within a specific tenant. Tenant administrators can create and manage 
              roles for their own tenant.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default RoleDashboard;
