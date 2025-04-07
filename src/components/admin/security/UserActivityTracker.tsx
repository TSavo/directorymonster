'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { fetchUserActivity } from '../../../services/securityService';
import { UserActivity } from '../../../types/security';
import ActivitySearch from './activity/ActivitySearch';
import ActivityFilters from './activity/ActivityFilters';
import ActivityTable from './activity/ActivityTable';

interface UserActivityTrackerProps {
  userId?: string;
}

const UserActivityTracker: React.FC<UserActivityTrackerProps> = ({ userId: initialUserId }) => {
  const [activities, setActivities] = useState<UserActivity[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState<string>(initialUserId || '');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [actionType, setActionType] = useState<string>('');
  const [page, setPage] = useState<number>(1);
  const [hasMore, setHasMore] = useState<boolean>(false);

  const fetchActivities = async (reset: boolean = true) => {
    setIsLoading(true);
    setError(null);

    try {
      const currentPage = reset ? 1 : page;
      if (reset) {
        setPage(1);
      }

      // For backward compatibility with tests, use the old signature
      const data = await fetchUserActivity(
        searchTerm || initialUserId || undefined,
        startDate || undefined,
        endDate || undefined,
        currentPage,
        10
      );

      setActivities(prev => reset ? data : [...prev, ...data]);
      setHasMore(data.length === 10);

      if (!reset) {
        setPage(currentPage + 1);
      }
    } catch (err) {
      console.error('Error fetching user activities:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch user activities');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchActivities();
  }, [initialUserId]);

  const handleSearch = () => {
    fetchActivities();
  };

  const handleApplyFilters = () => {
    fetchActivities();
  };

  const handleLoadMore = () => {
    fetchActivities(false);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>User Activity Tracker</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <ActivitySearch
            searchTerm={searchTerm}
            onSearchChange={setSearchTerm}
            onSearch={handleSearch}
          />

          <ActivityFilters
            startDate={startDate}
            endDate={endDate}
            actionType={actionType}
            onStartDateChange={setStartDate}
            onEndDateChange={setEndDate}
            onActionTypeChange={setActionType}
            onApplyFilters={handleApplyFilters}
          />

          <ActivityTable
            activities={activities}
            isLoading={isLoading}
            error={error}
            hasMore={hasMore}
            onLoadMore={handleLoadMore}
          />
        </div>
      </CardContent>
    </Card>
  );
};

export default UserActivityTracker;
