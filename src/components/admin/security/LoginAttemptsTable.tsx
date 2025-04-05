'use client';

import React, { useState } from 'react';
import { useLoginAttempts, LoginAttemptsFilter, LoginAttempt } from './hooks/useLoginAttempts';
import { formatDistanceToNow } from 'date-fns';

interface LoginAttemptsTableProps {
  filter: LoginAttemptsFilter;
}

export const LoginAttemptsTable: React.FC<LoginAttemptsTableProps> = ({ filter }) => {
  const { loginAttempts, isLoading, error, hasMore, loadMore, refresh } = useLoginAttempts({
    limit: 10,
    filter,
  });

  const [selectedAttempt, setSelectedAttempt] = useState<LoginAttempt | null>(null);
  const [showBlockDialog, setShowBlockDialog] = useState(false);

  const formatTimestamp = (timestamp: string) => {
    try {
      return formatDistanceToNow(new Date(timestamp), { addSuffix: true });
    } catch (e) {
      return timestamp;
    }
  };

  const handleBlockIP = async (ip: string) => {
    try {
      const response = await fetch('/api/admin/security/block-ip', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ ip }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Error blocking IP: ${response.status}`);
      }

      // Refresh the table after blocking
      refresh();
      setShowBlockDialog(false);
      setSelectedAttempt(null);
    } catch (err) {
      console.error('Error blocking IP:', err);
      // Handle error (show error message)
    }
  };

  const getRiskLevelClass = (level: string) => {
    switch (level.toLowerCase()) {
      case 'low':
        return 'bg-green-100 text-green-800';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800';
      case 'high':
        return 'bg-orange-100 text-orange-800';
      case 'critical':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusClass = (success: boolean) => {
    return success
      ? 'bg-green-100 text-green-800'
      : 'bg-red-100 text-red-800';
  };

  if (isLoading && loginAttempts.length === 0) {
    return (
      <div className="animate-pulse" data-testid="login-attempts-loading">
        <div className="h-10 bg-gray-200 rounded mb-4"></div>
        {[...Array(5)].map((_, i) => (
          <div key={i} className="h-16 bg-gray-100 rounded mb-2"></div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <p className="text-red-500 mb-4">{error.message}</p>
        <button
          onClick={refresh}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Time
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Username
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                IP Address
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Location
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Risk Level
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {loginAttempts.map((attempt) => (
              <tr key={attempt.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {formatTimestamp(attempt.timestamp)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  {attempt.username}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {attempt.ip}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {attempt.location.city}, {attempt.location.country}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusClass(attempt.success)}`}>
                    {attempt.success ? 'Success' : 'Failed'}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getRiskLevelClass(attempt.ipRiskLevel)}`}>
                    {attempt.ipRiskLevel.charAt(0).toUpperCase() + attempt.ipRiskLevel.slice(1)}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  <div className="relative">
                    <button
                      onClick={() => setSelectedAttempt(attempt)}
                      className="text-blue-600 hover:text-blue-900"
                    >
                      Actions
                    </button>
                    {selectedAttempt?.id === attempt.id && (
                      <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg z-10 border border-gray-200">
                        <div className="py-1">
                          <button
                            onClick={() => setShowBlockDialog(true)}
                            className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                          >
                            Block IP
                          </button>
                          <button
                            onClick={() => setSelectedAttempt(null)}
                            className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                          >
                            View Details
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {loginAttempts.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          No login attempts found matching the current filters.
        </div>
      )}

      {hasMore && (
        <div className="mt-4 text-center">
          <button
            onClick={loadMore}
            disabled={isLoading}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:bg-blue-300"
          >
            {isLoading ? 'Loading...' : 'Load More'}
          </button>
        </div>
      )}

      {/* Block IP Confirmation Dialog */}
      {showBlockDialog && selectedAttempt && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg max-w-md w-full">
            <h3 className="text-lg font-semibold mb-4">Block IP Address</h3>
            <p className="mb-4">
              Are you sure you want to block the IP address <span className="font-semibold">{selectedAttempt.ip}</span>?
              This will prevent all login attempts from this IP address.
            </p>
            <div className="flex justify-end space-x-2">
              <button
                onClick={() => {
                  setShowBlockDialog(false);
                  setSelectedAttempt(null);
                }}
                className="px-4 py-2 border border-gray-300 rounded text-gray-700 hover:bg-gray-100"
              >
                Cancel
              </button>
              <button
                onClick={() => handleBlockIP(selectedAttempt.ip)}
                className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
