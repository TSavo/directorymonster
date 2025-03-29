'use client';

import React, { useState, useEffect } from 'react';
import { ActivityFeedProps, ActivityItem } from './types';
import ActivityFeedItem from './components/ActivityFeedItem';

/**
 * ActivityFeed component displays a feed of recent activities
 *
 * @param {string} siteSlug - Optional site slug to fetch activities for a specific site
 * @param {number} limit - Number of activities to display
 * @param {object} filter - Optional filters for the activity feed
 * @param {boolean} showHeader - Whether to show the header
 * @param {string} className - Additional CSS classes
 * @param {boolean} isLoading - Whether the component is in loading state
 */
const ActivityFeed: React.FC<ActivityFeedProps> = ({
  siteSlug,
  limit = 10,
  filter,
  showHeader = true,
  className = '',
  isLoading: propIsLoading,
}) => {
  // State for activity feed
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [hookIsLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);
  const [hasMore, setHasMore] = useState<boolean>(true);

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
      if (filter) {
        if (filter.entityType?.length) {
          filteredData = filteredData.filter(item => 
            filter.entityType?.includes(item.entityType)
          );
        }
        if (filter.actionType?.length) {
          filteredData = filteredData.filter(item => 
            filter.actionType?.includes(item.type)
          );
        }
        if (filter.userId) {
          filteredData = filteredData.filter(item => 
            item.userId === filter.userId
          );
        }
      }
      
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
  }, [siteSlug, limit, filter]);

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

  const isLoading = propIsLoading !== undefined ? propIsLoading : hookIsLoading;

  return (
    <div 
      className={`bg-white rounded-lg shadow border border-gray-100 ${className}`}
      data-testid="activity-feed"
    >
      {showHeader && (
        <div className="px-4 py-3 border-b border-gray-200 flex justify-between items-center">
          <h3 className="text-lg font-medium text-gray-900">Recent Activity</h3>
          <button
            onClick={refresh}
            className="text-sm text-blue-600 hover:text-blue-700"
            data-testid="refresh-button"
            aria-label="Refresh activity feed"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd" />
            </svg>
          </button>
        </div>
      )}

      <div className="p-2" data-testid="activity-feed-content">
        {/* Display error if there is one */}
        {error && (
          <div 
            className="px-3 py-2 bg-red-50 border border-red-200 rounded-lg text-red-700 mb-2"
            data-testid="activity-feed-error"
          >
            <p>Failed to load activities: {error.message}</p>
            <button 
              className="text-red-600 underline mt-1" 
              onClick={refresh}
            >
              Retry
            </button>
          </div>
        )}

        {/* Loading state */}
        {isLoading && activities.length === 0 && (
          <div data-testid="activity-feed-loading">
            {[...Array(3)].map((_, index) => (
              <div key={index} className="flex items-start space-x-3 py-3 px-3 animate-pulse">
                <div className="bg-gray-200 rounded-full h-10 w-10"></div>
                <div className="flex-1">
                  <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                  <div className="h-3 bg-gray-100 rounded w-1/2"></div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Empty state */}
        {!isLoading && activities.length === 0 && !error && (
          <div 
            className="py-6 text-center text-gray-500"
            data-testid="activity-feed-empty"
          >
            <svg 
              xmlns="http://www.w3.org/2000/svg" 
              className="h-12 w-12 mx-auto text-gray-400 mb-2" 
              fill="none" 
              viewBox="0 0 24 24" 
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p>No activity found</p>
            {filter && (
              <button 
                className="text-blue-600 underline mt-1" 
                onClick={refresh}
              >
                Clear filters
              </button>
            )}
          </div>
        )}

        {/* Activity items */}
        {activities.length > 0 && (
          <div className="divide-y divide-gray-100">
            {activities.map((activity) => (
              <div key={activity.id} className="px-3">
                <ActivityFeedItem activity={activity} />
              </div>
            ))}
          </div>
        )}

        {/* Load more button */}
        {hasMore && activities.length > 0 && (
          <div className="pt-2 pb-3 px-4 text-center">
            <button
              onClick={loadMore}
              className="text-sm text-blue-600 hover:text-blue-700 font-medium"
              disabled={isLoading}
              data-testid="load-more-button"
            >
              {isLoading ? 'Loading...' : 'Load more'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ActivityFeed;
