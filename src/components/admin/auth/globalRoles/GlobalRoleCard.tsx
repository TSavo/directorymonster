/**
 * Component for displaying a global role in a card format
 */
import React from 'react';
import { Role } from '@/components/admin/auth/utils/roles';
import { formatDistanceToNow } from 'date-fns';
import { Button } from '@/components/ui/Button';

interface GlobalRoleCardProps {
  role: Role;
  onEdit: (role: Role) => void;
  onManageUsers: (roleId: string) => void;
  onDelete: (roleId: string) => void;
}

const GlobalRoleCard: React.FC<GlobalRoleCardProps> = ({
  role,
  onEdit,
  onManageUsers,
  onDelete
}) => {
  // Format the updated date
  const getUpdatedTime = () => {
    try {
      return formatDistanceToNow(new Date(role.updatedAt), { addSuffix: true });
    } catch (error) {
      return 'Unknown date';
    }
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-sm hover:shadow-md transition-shadow p-4">
      <div className="flex justify-between items-start mb-2">
        <h3 className="text-lg font-medium text-gray-900">{role.name}</h3>
        <div className="flex space-x-2">
          <Button
            onClick={() => onEdit(role)}
            variant="ghost"
            size="icon"
            className="text-indigo-600 hover:text-indigo-800"
            title="Edit role"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 0L11.414 15l-4.242.707L7.879 11.465l9.707-9.707z" />
            </svg>
          </Button>
          <Button
            onClick={() => onManageUsers(role.id)}
            variant="ghost"
            size="icon"
            className="text-green-600 hover:text-green-800"
            title="Manage users"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
          </Button>
          <Button
            onClick={() => onDelete(role.id)}
            variant="ghost"
            size="icon"
            className="text-red-600 hover:text-red-800"
            title="Delete role"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </Button>
        </div>
      </div>

      <div className="text-sm text-gray-500 mb-3">
        {role.description || 'No description provided'}
      </div>

      <div className="mb-3">
        <h4 className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Permissions</h4>
        <div className="flex flex-wrap gap-1">
          {role.aclEntries.length === 0 ? (
            <span className="text-xs text-gray-400 italic">No permissions</span>
          ) : (
            role.aclEntries.slice(0, 5).map((entry, index) => (
              <span
                key={index}
                className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800"
                title={`${entry.resource.type} - ${entry.permission}`}
              >
                {entry.resource.type}:{entry.permission}
              </span>
            ))
          )}
          {role.aclEntries.length > 5 && (
            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800">
              +{role.aclEntries.length - 5} more
            </span>
          )}
        </div>
      </div>

      <div className="flex justify-between items-center text-xs text-gray-500">
        <div>ID: {role.id}</div>
        <div>Updated {getUpdatedTime()}</div>
      </div>
    </div>
  );
};

export default GlobalRoleCard;
