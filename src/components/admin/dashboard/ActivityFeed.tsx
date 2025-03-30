'use client';

import React, { useState, useEffect } from 'react';
import { ActivityFeedProps, ActivityItem } from './types';

// Import modular components
import ActivityFeedHeader from './components/ActivityFeedHeader';
import ActivityFeedList from './components/ActivityFeedList';
import ActivityFeedLoading from './components/ActivityFeedLoading';
import ActivityFeedEmpty from './components/ActivityFeedEmpty';
import ActivityFeedError from './components/ActivityFeedError';
import ActivityFeedLoadMore from './components/ActivityFeedLoadMore';
import ActivityFeedFilter, { ActivityFilter } from './components/ActivityFeedFilter';
import DateRangeSelector, { DateRange } from './components/DateRangeSelector';

/**
 * ActivityFeed component displays a feed of recent activities
 * Uses composition pattern with smaller, specialized components
 *
 * @param {string} siteSlug - Optional site slug to fetch activities for a specific site
 * @param {number} limit - Number of activities to display
 * @param {object} filter - Optional filters for the activity feed
 * @param {boolean} showHeader - Whether to show the header
 * @param {string} className - Additional CSS classes
 * @param {boolean} isLoading - Whether the component is in loading state
 */
export const ActivityFeed: React.FC<ActivityFeedProps> = ({
  siteSlug,
  limit = 10,
  filter: initialFilter,
  showHeader = true,
  className = '',
  isLoading: propIsLoading,
}) => {
  // State for activity feed
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [hookIsLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);
  const [hasMore, setHasMore] = useState<boolean>(true);
  const [filter, setFilter] = useState<ActivityFilter>(initialFilter || {});
  
  // Default date range - last 30 days
  const today = new Date();
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(today.getDate() - 30);
  
  const [dateRange, setDateRange] = useState<DateRange>({
    startDate: thirtyDaysAgo.toISOString().split('T')[0],
    endDate: today.toISOString().split('T')[0]
  });

  // Function to get mock activity data 
  const getMockActivityData = (count: number = 10): ActivityItem[] => {
    const baseActivities: ActivityItem[] = [
      {
        id: '1',
        type: 'creation',
        entityType: 'listing',
        entityId: '123',
        entityName: 'Hiking Boots XYZ',
        timestamp: new Date(Date.now() - 1000 * 60 * 30).toISOString(), // 30 minutes ago
        userId: 'user1',
        userName: 'John Smith',
      },
      {
        id: '2',
        type: 'update',
        entityType: 'category',
        entityId: '456',
        entityName: 'Camping Equipment',
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(), // 2 hours ago
        userId: 'user2',
        userName: 'Jane Doe',
        details: 'Updated description and image',
      },
      {
        id: '3',
        type: 'deletion',
        entityType: 'listing',
        entityId: '789',
        entityName: 'Outdated Product',
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 5).toISOString(), // 5 hours ago
        userId: 'user1',
        userName: 'John Smith',
      },
      {
        id: '4',
        type: 'publication',
        entityType: 'listing',
        entityId: '101',
        entityName: 'New Tent Collection',
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 8).toISOString(), // 8 hours ago
        userId: 'user3',
        userName: 'Sarah Johnson',
      },
      {
        id: '5',
        type: 'import',
        entityType: 'listing',
        entityId: 'batch123',
        entityName: 'Summer Products Batch',
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(), // 1 day ago
        userId: 'user2',
        userName: 'Jane Doe',
        details: 'Imported 15 products',
      }
    ];
    
    // Add more mock items if needed
    const extendedActivities = [...baseActivities];
    for (let i = 6; i < count + 6; i++) {
      extendedActivities.push({
        id: `${i}`,
        type: ['creation', 'update', 'deletion', 'publication', 'import'][Math.floor(Math.random() * 5)] as ActivityItem['type'],
        entityType: ['listing', 'category', 'site'][Math.floor(Math.random() * 3)] as ActivityItem['entityType'],
        entityId: `${Math.floor(Math.random() * 1000)}`,
        entityName: `Test Entity ${i}`,
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * i).toISOString(),
        userId: [`user1`, `user2`, `user3`][Math.floor(Math.random() * 3)],
        userName: [`John Smith`, `Jane Doe`, `Sarah Johnson`][Math.floor(Math.random() * 3)],
      });
    }
    
    return extendedActivities.slice(0, count);
  };

  // Function to fetch activities
  const fetchActivities = async (reset: boolean = true) => {
    setIsLoading(true);
    setError(null);

    try {
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 500));
      
      const data = getMockActivityData(limit);
      
      // Apply filters if any
      let filteredData = [...data];
      
      // Apply entity type filter
      if (filter.entityType?.length) {
        filteredData = filteredData.filter(item => 
          filter.entityType?.includes(item.entityType)
        );
      }
      
      // Apply action type filter
      if (filter.actionType?.length) {
        filteredData = filteredData.filter(item => 
          filter.actionType?.includes(item.type)
        );
      }
      
      // Apply user ID filter
      if (filter.userId) {
        filteredData = filteredData.filter(item => 
          item.userId === filter.userId
        );
      }
      
      // Apply date range filter
      filteredData = filteredData.filter(item => {
        const itemDate = new Date(item.timestamp).toISOString().split('T')[0];
        return itemDate >= dateRange.startDate && itemDate <= dateRange.endDate;
      });
      
      // Sort by timestamp (newest first)
      filteredData.sort((a, b) => 
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      );
      
      // Update state
      if (reset) {
        setActivities(filteredData);
      } else {
        setActivities(prev => [...prev, ...filteredData]);
      }
      setHasMore(filteredData.length >= limit);
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to fetch activities');
      setError(error);
    } finally {
      setIsLoading(false);
    }
  };

  // Load data on mount and when dependencies change
  useEffect(() => {
    fetchActivities();
  }, [siteSlug, limit, filter, dateRange]);

  // Function to load more items
  const loadMore = async () => {
    if (!hookIsLoading && hasMore) {
      await fetchActivities(false);
    }
  };

  // Function to refresh the feed
  const refresh = async () => {
    await fetchActivities(true);
  };

  // Handle filter changes
  const handleFilterChange = (newFilter: ActivityFilter) => {
    setFilter(newFilter);
  };

  // Handle date range changes
  const handleDateRangeChange = (newRange: DateRange) => {
    setDateRange(newRange);
  };

  // Clear all filters
  const clearFilters = () => {
    setFilter({});
    setDateRange({
      startDate: thirtyDaysAgo.toISOString().split('T')[0],
      endDate: today.toISOString().split('T')[0]
    });
  };

  // Combine loading state from props and hook
  const isLoading = propIsLoading !== undefined ? propIsLoading : hookIsLoading;

  // Determine if filters are active
  const hasActiveFilters = Boolean(
    (filter.entityType && filter.entityType.length > 0) || 
    (filter.actionType && filter.actionType.length > 0) ||
    filter.userId
  );

  return (
    <div 
      className={`bg-white rounded-lg shadow border border-gray-100 ${className}`}
      data-testid="activity-feed"
    >
      {/* Header section with title and filter controls */}
      {showHeader && (
        <>
          <ActivityFeedHeader 
            onRefresh={refresh}
            onFilterChange={handleFilterChange}
            currentFilter={filter}
          />
          
          {/* Filter and date controls row */}
          <div className="px-4 py-3 border-b border-gray-200 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
            <ActivityFeedFilter 
              onApplyFilter={handleFilterChange}
              initialFilter={filter}
            />
            
            <DateRangeSelector 
              onChange={handleDateRangeChange}
              initialRange={dateRange}
            />
          </div>
        </>
      )}

      {/* Content area */}
      <div className="p-2" data-testid="activity-feed-content">
        {/* Error state */}
        {error && (
          <ActivityFeedError 
            message={error.message} 
            onRetry={refresh} 
          />
        )}

        {/* Loading state */}
        {isLoading && activities.length === 0 && (
          <ActivityFeedLoading count={3} />
        )}

        {/* Empty state */}
        {!isLoading && activities.length === 0 && !error && (
          <ActivityFeedEmpty 
            hasFilters={hasActiveFilters}
            onClearFilters={clearFilters}
            message={hasActiveFilters ? "No activity matches the current filters" : "No activity found"}
          />
        )}

        {/* Activity items list */}
        {activities.length > 0 && (
          <ActivityFeedList activities={activities} />
        )}

        {/* Load more button */}
        {hasMore && activities.length > 0 && (
          <ActivityFeedLoadMore 
            onClick={loadMore}
            isLoading={isLoading}
          />
        )}
      </div>
    </div>
  );
};

// Also export as default for backward compatibility
export default ActivityFeed;