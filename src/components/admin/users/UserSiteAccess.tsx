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
import { Skeleton } from '@/components/ui/skeleton';
import { 
  Globe, 
  AlertCircle, 
  Shield, 
  Check, 
  X, 
  Plus, 
  Trash
} from 'lucide-react';
import { Role, RoleScope, RoleType } from '@/types/role';
import { Badge } from '@/components/ui/badge';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';

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

interface UserSiteAccessProps {
  user: User;
  sites: Site[];
  availableRoles: Role[];
  isLoading: boolean;
  error: string | null;
  onGrantAccess: (siteId: string) => void;
  onRevokeAccess: (siteId: string) => void;
  onAddRole: (siteId: string, roleId: string) => void;
  onRemoveRole: (roleId: string) => void;
}

export function UserSiteAccess({
  user,
  sites,
  availableRoles,
  isLoading,
  error,
  onGrantAccess,
  onRevokeAccess,
  onAddRole,
  onRemoveRole
}: UserSiteAccessProps) {
  const [isRevokeDialogOpen, setIsRevokeDialogOpen] = useState(false);
  const [siteToRevoke, setSiteToRevoke] = useState<Site | null>(null);
  const [isRemoveRoleDialogOpen, setIsRemoveRoleDialogOpen] = useState(false);
  const [roleToRemove, setRoleToRemove] = useState<Role | null>(null);
  const [isAddRoleDialogOpen, setIsAddRoleDialogOpen] = useState(false);
  const [siteForRole, setSiteForRole] = useState<Site | null>(null);
  const [selectedRoleId, setSelectedRoleId] = useState<string>('');

  // Handle grant access
  const handleGrantAccess = (siteId: string) => {
    onGrantAccess(siteId);
  };

  // Open revoke access dialog
  const openRevokeDialog = (site: Site) => {
    setSiteToRevoke(site);
    setIsRevokeDialogOpen(true);
  };

  // Handle revoke access
  const handleRevokeAccess = () => {
    if (siteToRevoke) {
      onRevokeAccess(siteToRevoke.id);
      setSiteToRevoke(null);
      setIsRevokeDialogOpen(false);
    }
  };

  // Open add role dialog
  const openAddRoleDialog = (site: Site) => {
    setSiteForRole(site);
    setSelectedRoleId('');
    setIsAddRoleDialogOpen(true);
  };

  // Handle add role
  const handleAddRole = () => {
    if (siteForRole && selectedRoleId) {
      onAddRole(siteForRole.id, selectedRoleId);
      setSiteForRole(null);
      setSelectedRoleId('');
      setIsAddRoleDialogOpen(false);
    }
  };

  // Open remove role dialog
  const openRemoveRoleDialog = (role: Role) => {
    setRoleToRemove(role);
    setIsRemoveRoleDialogOpen(true);
  };

  // Handle remove role
  const handleRemoveRole = () => {
    if (roleToRemove) {
      onRemoveRole(roleToRemove.id);
      setRoleToRemove(null);
      setIsRemoveRoleDialogOpen(false);
    }
  };

  // Get available roles for a site
  const getAvailableRolesForSite = (siteId: string): Role[] => {
    return availableRoles.filter(role => role.siteId === siteId);
  };

  // Loading state
  if (isLoading) {
    return (
      <div data-testid="user-sites-loading">
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
      <div className="rounded-md bg-red-50 p-4 my-4" data-testid="user-sites-error">
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

  // Empty state
  if (sites.length === 0) {
    return (
      <div className="text-center py-10 border rounded-md bg-gray-50" data-testid="user-sites-empty">
        <Globe className="mx-auto h-12 w-12 text-gray-400" />
        <h3 className="mt-2 text-sm font-semibold text-gray-900">No sites available</h3>
        <p className="mt-1 text-sm text-gray-500">There are no sites available in this tenant.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-medium">Site Access for {user.name}</h2>
        <p className="text-sm text-gray-500 mt-1">
          Manage which sites this user can access and their site-specific roles
        </p>
      </div>

      <div className="border rounded-md overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Site
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Domain
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Access
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Roles
              </th>
              <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {sites.map(site => (
              <tr key={site.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <Globe className="h-5 w-5 text-gray-400 mr-2" />
                    <div className="text-sm font-medium text-gray-900">{site.name}</div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-500">{site.domain}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {site.hasAccess ? (
                    <Badge className="bg-green-50 text-green-700 border-green-200">
                      <Check className="h-3 w-3 mr-1" />
                      Has Access
                    </Badge>
                  ) : (
                    <Badge className="bg-gray-100 text-gray-700 border-gray-200">
                      <X className="h-3 w-3 mr-1" />
                      No Access
                    </Badge>
                  )}
                </td>
                <td className="px-6 py-4">
                  <div className="flex flex-wrap gap-2">
                    {site.roles.map(role => (
                      <div key={role.id} className="flex items-center bg-gray-100 rounded-full px-3 py-1 text-xs">
                        <span className="font-medium">{role.name}</span>
                        <button
                          type="button"
                          onClick={() => openRemoveRoleDialog(role)}
                          className="ml-1 text-gray-500 hover:text-red-500"
                          data-testid={`remove-role-${role.id}`}
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    ))}
                    {site.hasAccess && getAvailableRolesForSite(site.id).length > 0 && (
                      <button
                        type="button"
                        onClick={() => openAddRoleDialog(site)}
                        className="flex items-center bg-blue-50 rounded-full px-3 py-1 text-xs text-blue-700 hover:bg-blue-100"
                        data-testid={`add-role-${site.id}`}
                      >
                        <Plus className="h-3 w-3 mr-1" />
                        Add Role
                      </button>
                    )}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  {site.hasAccess ? (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => openRevokeDialog(site)}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      data-testid={`revoke-access-${site.id}`}
                    >
                      Revoke Access
                    </Button>
                  ) : (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleGrantAccess(site.id)}
                      className="text-green-600 hover:text-green-700 hover:bg-green-50"
                      data-testid={`grant-access-${site.id}`}
                    >
                      Grant Access
                    </Button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Revoke Access Alert Dialog */}
      <AlertDialog open={isRevokeDialogOpen} onOpenChange={setIsRevokeDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Revoke Site Access</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to revoke {user.name}'s access to {siteToRevoke?.name}?
              This will also remove all site-specific roles.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleRevokeAccess}
              className="bg-red-600 hover:bg-red-700"
            >
              Revoke Access
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Remove Role Alert Dialog */}
      <AlertDialog open={isRemoveRoleDialogOpen} onOpenChange={setIsRemoveRoleDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove Site Role</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to remove the {roleToRemove?.name} role from {user.name}?
              This will revoke all permissions associated with this role.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleRemoveRole}
              className="bg-red-600 hover:bg-red-700"
            >
              Remove
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Add Role Dialog */}
      <Dialog open={isAddRoleDialogOpen} onOpenChange={setIsAddRoleDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add Site Role</DialogTitle>
            <DialogDescription>
              Select a role to assign to {user.name} for {siteForRole?.name}.
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-4">
            {siteForRole && getAvailableRolesForSite(siteForRole.id).length === 0 ? (
              <div className="text-center py-4 text-sm text-gray-500">
                No available roles for this site.
              </div>
            ) : (
              <RadioGroup value={selectedRoleId} onValueChange={setSelectedRoleId}>
                {siteForRole && getAvailableRolesForSite(siteForRole.id).map(role => (
                  <div key={role.id} className="flex items-center space-x-2 p-2 rounded hover:bg-gray-50">
                    <RadioGroupItem 
                      value={role.id} 
                      id={`role-${role.id}`}
                      data-testid={`select-role-${role.id}`}
                    />
                    <Label htmlFor={`role-${role.id}`} className="flex-1 cursor-pointer">
                      <div className="font-medium">{role.name}</div>
                      <div className="text-sm text-gray-500">{role.description}</div>
                    </Label>
                  </div>
                ))}
              </RadioGroup>
            )}
          </div>
          
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsAddRoleDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={handleAddRole}
              disabled={!selectedRoleId}
            >
              Add Role
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default UserSiteAccess;
