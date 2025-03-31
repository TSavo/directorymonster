/**
 * Form component for creating and editing global roles
 */
import React, { useState } from 'react';
import { ResourceType, Permission } from '@/components/admin/auth/utils/accessControl';
import { TenantACE } from '@/components/admin/auth/utils/roles';
import { GlobalRoleFormProps } from './types';

const GlobalRoleForm: React.FC<GlobalRoleFormProps> = ({ 
  initialData, 
  onSubmit, 
  onCancel 
}) => {
  const [name, setName] = useState(initialData?.name || '');
  const [description, setDescription] = useState(initialData?.description || '');
  const [aclEntries, setAclEntries] = useState<TenantACE[]>(initialData?.aclEntries || []);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Available resource types and permissions
  const resourceTypes: ResourceType[] = ['tenant', 'user', 'site', 'category', 'listing', 'setting', 'audit', 'role'];
  const permissions: Permission[] = ['create', 'read', 'update', 'delete', 'manage'];
  
  // Add a new ACL entry
  const addAclEntry = () => {
    setAclEntries([
      ...aclEntries,
      {
        resource: {
          type: 'tenant',
          tenantId: 'system'
        },
        permission: 'read'
      }
    ]);
  };
  
  // Update an ACL entry
  const updateAclEntry = (index: number, field: string, value: string) => {
    const newEntries = [...aclEntries];
    if (field === 'resourceType') {
      newEntries[index].resource.type = value as ResourceType;
    } else if (field === 'permission') {
      newEntries[index].permission = value as Permission;
    }
    setAclEntries(newEntries);
  };
  
  // Remove an ACL entry
  const removeAclEntry = (index: number) => {
    setAclEntries(aclEntries.filter((_, i) => i !== index));
  };
  
  // Submit the form
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      await onSubmit({
        name,
        description,
        aclEntries
      });
    } catch (error) {
      console.error('Error submitting global role form:', error);
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <form onSubmit={handleSubmit}>
        <h3 className="text-lg font-medium mb-4">
          {initialData ? 'Edit Global Role' : 'Create Global Role'}
        </h3>
        
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Role Name
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full p-2 border border-gray-300 rounded"
            required
          />
        </div>
        
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Description
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full p-2 border border-gray-300 rounded"
            rows={3}
          />
        </div>
        
        <div className="mb-4">
          <div className="flex justify-between items-center mb-2">
            <label className="block text-sm font-medium text-gray-700">
              Permissions
            </label>
            <button
              type="button"
              onClick={addAclEntry}
              className="text-sm bg-blue-50 text-blue-600 px-2 py-1 rounded hover:bg-blue-100"
            >
              Add Permission
            </button>
          </div>
          
          {aclEntries.length === 0 && (
            <p className="text-sm text-gray-500 italic">
              No permissions added. Add at least one permission.
            </p>
          )}
          
          {aclEntries.map((entry, index) => (
            <div key={index} className="flex items-center gap-2 mb-2 p-2 bg-gray-50 rounded">
              <select
                value={entry.resource.type}
                onChange={(e) => updateAclEntry(index, 'resourceType', e.target.value)}
                className="p-1 border border-gray-300 rounded"
              >
                {resourceTypes.map((type) => (
                  <option key={type} value={type}>
                    {type.charAt(0).toUpperCase() + type.slice(1)}
                  </option>
                ))}
              </select>
              
              <select
                value={entry.permission}
                onChange={(e) => updateAclEntry(index, 'permission', e.target.value)}
                className="p-1 border border-gray-300 rounded"
              >
                {permissions.map((perm) => (
                  <option key={perm} value={perm}>
                    {perm.charAt(0).toUpperCase() + perm.slice(1)}
                  </option>
                ))}
              </select>
              
              <button
                type="button"
                onClick={() => removeAclEntry(index)}
                className="text-red-500 hover:text-red-700"
                aria-label="Remove permission"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </button>
            </div>
          ))}
        </div>
        
        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 border border-gray-300 rounded text-gray-700 hover:bg-gray-50"
            disabled={isSubmitting}
          >
            Cancel
          </button>
          <button
            type="submit"
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Saving...' : initialData ? 'Update Role' : 'Create Role'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default GlobalRoleForm;
