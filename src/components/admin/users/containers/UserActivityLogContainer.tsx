"use client";

import React, { useState, useEffect } from 'react';
import { UserActivityLog } from '../UserActivityLog';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertCircle } from 'lucide-react';

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

interface UserActivityLogContainerProps {
  userId: string;
}

export function UserActivityLogContainer({ userId }: UserActivityLogContainerProps) {
  const [user, setUser] = useState<User | null>(null);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<ActivityFilter>({});

  // Fetch user and activity data
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
        
        // Fetch user activities with filter
        await fetchActivities(filter);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to fetch data';
        setError(errorMessage);
        setIsLoading(false);
      }
    };
    
    fetchData();
  }, [userId]);

  // Fetch activities with filter
  const fetchActivities = async (activityFilter: ActivityFilter) => {
    try {
      setIsLoading(true);
      
      // Build query parameters
      const queryParams = new URLSearchParams();
      if (activityFilter.action) queryParams.append('action', activityFilter.action);
      if (activityFilter.resource) queryParams.append('resource', activityFilter.resource);
      if (activityFilter.dateRange) queryParams.append('dateRange', activityFilter.dateRange);
      if (activityFilter.startDate) queryParams.append('startDate', activityFilter.startDate);
      if (activityFilter.endDate) queryParams.append('endDate', activityFilter.endDate);
      
      const activitiesResponse = await fetch(
        `/api/admin/users/${userId}/activities?${queryParams.toString()}`
      );
      
      if (!activitiesResponse.ok) {
        const errorData = await activitiesResponse.json();
        throw new Error(errorData.error || 'Failed to fetch activities');
      }
      
      const activitiesData = await activitiesResponse.json();
      setActivities(activitiesData.activities || []);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch activities';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle filter change
  const handleFilterChange = (newFilter: ActivityFilter) => {
    const updatedFilter = { ...filter, ...newFilter };
    setFilter(updatedFilter);
    fetchActivities(updatedFilter);
  };

  // Handle export
  const handleExport = async () => {
    try {
      // Build query parameters
      const queryParams = new URLSearchParams();
      if (filter.action) queryParams.append('action', filter.action);
      if (filter.resource) queryParams.append('resource', filter.resource);
      if (filter.dateRange) queryParams.append('dateRange', filter.dateRange);
      if (filter.startDate) queryParams.append('startDate', filter.startDate);
      if (filter.endDate) queryParams.append('endDate', filter.endDate);
      queryParams.append('export', 'true');
      
      // Trigger file download
      window.location.href = `/api/admin/users/${userId}/activities/export?${queryParams.toString()}`;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to export activities';
      setError(errorMessage);
    }
  };

  // Loading state
  if (isLoading && !activities.length) {
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
  if (error && !activities.length) {
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
    <UserActivityLog
      user={user}
      activities={activities}
      isLoading={isLoading}
      error={error}
      onFilterChange={handleFilterChange}
      onExport={handleExport}
    />
  );
}

export default UserActivityLogContainer;
