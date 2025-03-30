'use client';

import React, { useState, useEffect } from 'react';
import { 
  ACL, 
  ResourceType, 
  Permission,
  hasPermission,
  grantPermission,
  revokePermission
} from '../../auth/utils/accessControl';

interface UserPermissionsProps {
  acl: ACL;
  sites: { id: string; name: string; }[];
  onChange: (updatedAcl: ACL) => void;
}

export function UserPermissions({ acl, sites, onChange }: UserPermissionsProps) {
  const resourceTypes: ResourceType[] = ['site', 'category', 'listing', 'user', 'setting'];
  const permissions: Permission[] = ['create', 'read', 'update', 'delete', 'manage'];
  
  // Track if user is a superadmin (has all global permissions)
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  
  // Initialize superadmin status
  useEffect(() => {
    const hasAllPermissions = resourceTypes.every(resourceType => 
      permissions.every(permission => 
        hasPermission(acl, resourceType, permission)
      )
    );
    
    setIsSuperAdmin(hasAllPermissions);
  }, [acl]);
  
  // Handle toggling superadmin status
  const handleSuperAdminToggle = () => {
    if (isSuperAdmin) {
      // Remove all global permissions
      let updatedAcl = { ...acl, entries: [] };
      onChange(updatedAcl);
      setIsSuperAdmin(false);
    } else {
      // Add all global permissions
      let updatedAcl = { ...acl };
      
      resourceTypes.forEach(resourceType => {
        permissions.forEach(permission => {
          updatedAcl = grantPermission(
            updatedAcl,
            resourceType,
            permission
          );
        });
      });
      
      onChange(updatedAcl);
      setIsSuperAdmin(true);
    }
  };
  
  // Handle toggling site admin status
  const handleSiteAdminToggle = (siteId: string, isAdmin: boolean) => {
    let updatedAcl = { ...acl };
    
    if (isAdmin) {
      // Remove all permissions for this site
      updatedAcl.entries = updatedAcl.entries.filter(entry => 
        entry.resource.siteId !== siteId
      );
    } else {
      // Grant site admin permissions
      resourceTypes.forEach(resourceType => {
        permissions.forEach(permission => {
          updatedAcl = grantPermission(
            updatedAcl,
            resourceType,
            permission,
            undefined,
            siteId
          );
        });
      });
    }
    
    onChange(updatedAcl);
  };
  
  // Check if user is admin for a specific site
  const isSiteAdmin = (siteId: string): boolean => {
    return resourceTypes.every(resourceType => 
      permissions.every(permission => 
        hasPermission(acl, resourceType, permission, undefined, siteId)
      )
    );
  };
  
  // Toggle specific permission
  const togglePermission = (
    resourceType: ResourceType,
    permission: Permission,
    siteId?: string
  ) => {
    let updatedAcl = { ...acl };
    
    if (hasPermission(acl, resourceType, permission, undefined, siteId)) {
      updatedAcl = revokePermission(
        updatedAcl,
        resourceType,
        permission,
        undefined,
        siteId
      );
    } else {
      updatedAcl = grantPermission(
        updatedAcl,
        resourceType,
        permission,
        undefined,
        siteId
      );
    }
    
    onChange(updatedAcl);
  };
  
  return (
    <div className="space-y-6" data-testid="user-permissions">
      <div className="border rounded-md p-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-medium">Super Administrator</h3>
            <p className="text-sm text-gray-500">Full access to all sites and resources</p>
          </div>
          <div className="form-control">
            <label className="cursor-pointer label">
              <input 
                type="checkbox" 
                className="toggle toggle-primary" 
                checked={isSuperAdmin}
                onChange={handleSuperAdminToggle}
                data-testid="super-admin-toggle"
              />
            </label>
          </div>
        </div>
      </div>
      
      {!isSuperAdmin && (
        <div>
          <h3 className="font-medium mb-3">Site Permissions</h3>
          
          {sites.map(site => {
            const isAdmin = isSiteAdmin(site.id);
            
            return (
              <div key={site.id} className="border rounded-md p-4 mb-4">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h4 className="font-medium">{site.name}</h4>
                    <p className="text-sm text-gray-500">Site ID: {site.id}</p>
                  </div>
                  <div className="form-control">
                    <label className="cursor-pointer label">
                      <span className="mr-2">Site Admin</span>
                      <input 
                        type="checkbox" 
                        className="toggle toggle-primary" 
                        checked={isAdmin}
                        onChange={() => handleSiteAdminToggle(site.id, isAdmin)}
                        data-testid={`site-admin-toggle-${site.id}`}
                      />
                    </label>
                  </div>
                </div>
                
                {!isAdmin && (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {resourceTypes.map(resourceType => (
                      <div key={resourceType} className="border rounded p-2">
                        <h5 className="font-medium capitalize mb-2">{resourceType}s</h5>
                        <div className="space-y-1">
                          {permissions.map(permission => (
                            <div key={permission} className="flex items-center">
                              <input
                                type="checkbox"
                                className="checkbox checkbox-sm mr-2"
                                checked={hasPermission(acl, resourceType, permission, undefined, site.id)}
                                onChange={() => togglePermission(resourceType, permission, site.id)}
                                data-testid={`permission-${resourceType}-${permission}-${site.id}`}
                              />
                              <span className="capitalize text-sm">{permission}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default UserPermissions;
