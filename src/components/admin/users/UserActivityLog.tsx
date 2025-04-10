"use client";

import React, { useState } from 'react';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter,
  DialogDescription
} from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  AlertCircle, 
  Download, 
  Filter, 
  Calendar, 
  Clock, 
  Info
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel
} from '@/components/ui/dropdown-menu';

interface User {
  id: string;
  name: string;
  email: string;
  avatarUrl?: string;
}

interface Activity {
  id: string;
  action: string;
  resource: string;
  resourceId: string | null;
  description: string;
  ipAddress: string;
  userAgent: string;
  timestamp: string;
}

interface ActivityFilter {
  action?: string;
  resource?: string;
  dateRange?: string;
  startDate?: string;
  endDate?: string;
}

interface UserActivityLogProps {
  user: User;
  activities: Activity[];
  isLoading: boolean;
  error: string | null;
  onFilterChange: (filter: ActivityFilter) => void;
  onExport: () => void;
}

export function UserActivityLog({
  user,
  activities,
  isLoading,
  error,
  onFilterChange,
  onExport
}: UserActivityLogProps) {
  const [selectedActivity, setSelectedActivity] = useState<Activity | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);

  // Action options for filter
  const actionOptions = [
    { value: 'login', label: 'Login' },
    { value: 'logout', label: 'Logout' },
    { value: 'create', label: 'Create' },
    { value: 'read', label: 'Read' },
    { value: 'update', label: 'Update' },
    { value: 'delete', label: 'Delete' }
  ];

  // Resource options for filter
  const resourceOptions = [
    { value: 'auth', label: 'Auth' },
    { value: 'user', label: 'User' },
    { value: 'role', label: 'Role' },
    { value: 'site', label: 'Site' },
    { value: 'listing', label: 'Listing' },
    { value: 'category', label: 'Category' },
    { value: 'content', label: 'Content' },
    { value: 'setting', label: 'Setting' }
  ];

  // Date range options for filter
  const dateRangeOptions = [
    { value: 'today', label: 'Today' },
    { value: 'yesterday', label: 'Yesterday' },
    { value: 'last7days', label: 'Last 7 days' },
    { value: 'last30days', label: 'Last 30 days' },
    { value: 'thisMonth', label: 'This month' },
    { value: 'lastMonth', label: 'Last month' },
    { value: 'custom', label: 'Custom range' }
  ];

  // Handle filter by action
  const handleFilterByAction = (action: string) => {
    onFilterChange({ action });
  };

  // Handle filter by resource
  const handleFilterByResource = (resource: string) => {
    onFilterChange({ resource });
  };

  // Handle filter by date range
  const handleFilterByDateRange = (dateRange: string) => {
    onFilterChange({ dateRange });
  };

  // Handle view activity details
  const handleViewDetails = (activity: Activity) => {
    setSelectedActivity(activity);
    setIsDetailsOpen(true);
  };

  // Get action badge color
  const getActionBadgeColor = (action: string) => {
    switch (action) {
      case 'login':
      case 'logout':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'create':
        return 'bg-green-50 text-green-700 border-green-200';
      case 'read':
        return 'bg-gray-50 text-gray-700 border-gray-200';
      case 'update':
        return 'bg-yellow-50 text-yellow-700 border-yellow-200';
      case 'delete':
        return 'bg-red-50 text-red-700 border-red-200';
      default:
        return 'bg-gray-50 text-gray-700 border-gray-200';
    }
  };

  // Get resource badge color
  const getResourceBadgeColor = (resource: string) => {
    switch (resource) {
      case 'auth':
        return 'bg-purple-50 text-purple-700 border-purple-200';
      case 'user':
        return 'bg-indigo-50 text-indigo-700 border-indigo-200';
      case 'role':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'site':
        return 'bg-teal-50 text-teal-700 border-teal-200';
      case 'listing':
        return 'bg-green-50 text-green-700 border-green-200';
      case 'category':
        return 'bg-yellow-50 text-yellow-700 border-yellow-200';
      case 'content':
        return 'bg-orange-50 text-orange-700 border-orange-200';
      case 'setting':
        return 'bg-gray-50 text-gray-700 border-gray-200';
      default:
        return 'bg-gray-50 text-gray-700 border-gray-200';
    }
  };

  // Format timestamp
  const formatTimestamp = (timestamp: string) => {
    return format(new Date(timestamp), 'PPP, p');
  };

  // Loading state
  if (isLoading) {
    return (
      <div data-testid="activity-log-loading">
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
      <div className="rounded-md bg-red-50 p-4 my-4" data-testid="activity-log-error">
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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-medium">Activity Log for {user.name}</h2>
          <p className="text-sm text-gray-500 mt-1">
            View user activity history
          </p>
        </div>
        <div className="flex space-x-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="flex items-center gap-1">
                <Filter className="h-4 w-4" />
                Filter by Action
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Select Action</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => onFilterChange({})}>
                All Actions
              </DropdownMenuItem>
              {actionOptions.map(option => (
                <DropdownMenuItem 
                  key={option.value}
                  onClick={() => handleFilterByAction(option.value)}
                >
                  {option.label}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="flex items-center gap-1">
                <Filter className="h-4 w-4" />
                Filter by Resource
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Select Resource</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => onFilterChange({})}>
                All Resources
              </DropdownMenuItem>
              {resourceOptions.map(option => (
                <DropdownMenuItem 
                  key={option.value}
                  onClick={() => handleFilterByResource(option.value)}
                >
                  {option.label}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="flex items-center gap-1">
                <Calendar className="h-4 w-4" />
                Filter by Date
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Select Date Range</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => onFilterChange({})}>
                All Time
              </DropdownMenuItem>
              {dateRangeOptions.map(option => (
                <DropdownMenuItem 
                  key={option.value}
                  onClick={() => handleFilterByDateRange(option.value)}
                >
                  {option.label}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          <Button 
            variant="outline" 
            className="flex items-center gap-1"
            onClick={onExport}
          >
            <Download className="h-4 w-4" />
            Export
          </Button>
        </div>
      </div>

      {/* Empty state */}
      {activities.length === 0 ? (
        <div className="text-center py-10 border rounded-md bg-gray-50" data-testid="activity-log-empty">
          <Clock className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-semibold text-gray-900">No activity found</h3>
          <p className="mt-1 text-sm text-gray-500">No activity logs found for this user.</p>
        </div>
      ) : (
        <div className="border rounded-md divide-y">
          {activities.map(activity => (
            <div 
              key={activity.id} 
              className="p-4 hover:bg-gray-50 cursor-pointer"
              onClick={() => handleViewDetails(activity)}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Badge variant="outline" className={getActionBadgeColor(activity.action)}>
                    {activity.action}
                  </Badge>
                  <Badge variant="outline" className={getResourceBadgeColor(activity.resource)}>
                    {activity.resource}
                  </Badge>
                </div>
                <div className="text-sm text-gray-500 flex items-center">
                  <Clock className="h-4 w-4 mr-1" />
                  {formatTimestamp(activity.timestamp)}
                </div>
              </div>
              <div className="mt-2">
                <p className="text-sm font-medium">{activity.description}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Activity Details Dialog */}
      <Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Activity Details</DialogTitle>
          </DialogHeader>
          
          {selectedActivity && (
            <div className="py-4">
              <div className="space-y-4">
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Action</h3>
                  <p className="mt-1">
                    <Badge variant="outline" className={getActionBadgeColor(selectedActivity.action)}>
                      {selectedActivity.action}
                    </Badge>
                  </p>
                </div>
                
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Resource</h3>
                  <p className="mt-1">
                    <Badge variant="outline" className={getResourceBadgeColor(selectedActivity.resource)}>
                      {selectedActivity.resource}
                    </Badge>
                    {selectedActivity.resourceId && (
                      <span className="ml-2 text-sm text-gray-500">
                        ID: {selectedActivity.resourceId}
                      </span>
                    )}
                  </p>
                </div>
                
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Description</h3>
                  <p className="mt-1 text-sm">{selectedActivity.description}</p>
                </div>
                
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Timestamp</h3>
                  <p className="mt-1 text-sm">{formatTimestamp(selectedActivity.timestamp)}</p>
                </div>
                
                <div>
                  <h3 className="text-sm font-medium text-gray-500">IP Address:</h3>
                  <p className="mt-1 text-sm">{selectedActivity.ipAddress}</p>
                </div>
                
                <div>
                  <h3 className="text-sm font-medium text-gray-500">User Agent:</h3>
                  <p className="mt-1 text-sm">{selectedActivity.userAgent}</p>
                </div>
              </div>
            </div>
          )}
          
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsDetailsOpen(false)}
            >
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default UserActivityLog;
