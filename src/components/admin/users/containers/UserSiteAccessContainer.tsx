"use client";

import React, { useState, useEffect } from 'react';
import { UserSiteAccess } from '../UserSiteAccess';
import { Role } from '@/types/role';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertCircle } from 'lucide-react';

interface User {
  id: string;
  name: string;
  email: string;
  avatarUrl?: string;
}

interface Site {
  id: string;
  name: string;
  slug: string;
  domain: string;
  hasAccess: boolean;
  roles: Role[];
}

interface UserSiteAccessContainerProps {
  userId: string;
}

export function UserSiteAccessContainer({ userId }: UserSiteAccessContainerProps) {
  const [user, setUser] = useState<User | null>(null);
  const [sites, setSites] = useState<Site[]>([]);
  const [availableRoles, setAvailableRoles] = useState<Role[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch user and sites data
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        // Fetch user details
        const userResponse = await fetch(`/api/admin/users/${userId}`);
        
        if (!userResponse.ok) {
          const errorData = await userResponse.json();
          throw new Error(errorData.error || 'Failed to fetch user');
        }
        
        const userData = await userResponse.json();
        setUser(userData.user);
        
        // Fetch user sites
        const sitesResponse = await fetch(`/api/admin/users/${userId}/sites`);
        
        if (!sitesResponse.ok) {
          const errorData = await sitesResponse.json();
          throw new Error(errorData.error || 'Failed to fetch sites');
        }
        
        const sitesData = await sitesResponse.json();
        setSites(sitesData.sites || []);
        setAvailableRoles(sitesData.availableRoles || []);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to fetch data';
        setError(errorMessage);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchData();
  }, [userId]);

  // Handle granting access to a site
  const handleGrantAccess = async (siteId: string) => {
    try {
      const response = await fetch(`/api/admin/users/${userId}/sites/${siteId}/access`, {
        method: 'POST'
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to grant access');
      }
      
      // Refresh sites data
      const sitesResponse = await fetch(`/api/admin/users/${userId}/sites`);
      const sitesData = await sitesResponse.json();
      
      setSites(sitesData.sites || []);
      setAvailableRoles(sitesData.availableRoles || []);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to grant access';
      setError(errorMessage);
    }
  };

  // Handle revoking access from a site
  const handleRevokeAccess = async (siteId: string) => {
    try {
      const response = await fetch(`/api/admin/users/${userId}/sites/${siteId}/access`, {
        method: 'DELETE'
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to revoke access');
      }
      
      // Refresh sites data
      const sitesResponse = await fetch(`/api/admin/users/${userId}/sites`);
      const sitesData = await sitesResponse.json();
      
      setSites(sitesData.sites || []);
      setAvailableRoles(sitesData.availableRoles || []);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to revoke access';
      setError(errorMessage);
    }
  };

  // Handle adding a role to a site
  const handleAddRole = async (siteId: string, roleId: string) => {
    try {
      const response = await fetch(`/api/admin/users/${userId}/sites/${siteId}/roles`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ roleId })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to add role');
      }
      
      // Refresh sites data
      const sitesResponse = await fetch(`/api/admin/users/${userId}/sites`);
      const sitesData = await sitesResponse.json();
      
      setSites(sitesData.sites || []);
      setAvailableRoles(sitesData.availableRoles || []);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to add role';
      setError(errorMessage);
    }
  };

  // Handle removing a role
  const handleRemoveRole = async (roleId: string) => {
    try {
      const response = await fetch(`/api/admin/users/${userId}/roles/${roleId}`, {
        method: 'DELETE'
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to remove role');
      }
      
      // Refresh sites data
      const sitesResponse = await fetch(`/api/admin/users/${userId}/sites`);
      const sitesData = await sitesResponse.json();
      
      setSites(sitesData.sites || []);
      setAvailableRoles(sitesData.availableRoles || []);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to remove role';
      setError(errorMessage);
    }
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-1/4" />
        <Skeleton className="h-20 w-full" />
        <Skeleton className="h-20 w-full" />
        <Skeleton className="h-10 w-1/3" />
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="rounded-md bg-red-50 p-4 my-4">
        <div className="flex">
          <div className="flex-shrink-0">
            <AlertCircle className="h-5 w-5 text-red-400" aria-hidden="true" />
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-red-800">{error}</h3>
            <div className="mt-2 text-sm text-red-700">
              <p>Please try again later or contact support if the problem persists.</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // If user not found
  if (!user) {
    return (
      <div className="rounded-md bg-yellow-50 p-4 my-4">
        <div className="flex">
          <div className="flex-shrink-0">
            <AlertCircle className="h-5 w-5 text-yellow-400" aria-hidden="true" />
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-yellow-800">User not found</h3>
            <div className="mt-2 text-sm text-yellow-700">
              <p>The requested user could not be found.</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <UserSiteAccess
      user={user}
      sites={sites}
      availableRoles={availableRoles}
      isLoading={isLoading}
      error={error}
      onGrantAccess={handleGrantAccess}
      onRevokeAccess={handleRevokeAccess}
      onAddRole={handleAddRole}
      onRemoveRole={handleRemoveRole}
    />
  );
}

export default UserSiteAccessContainer;
