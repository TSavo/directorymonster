import { useState, useEffect } from 'react';
import { UseActivityFeedParams, UseActivityFeedResult, ActivityItem } from '../types';

// Mock data - replace with actual API calls in production
const getMockActivityData = (siteSlug?: string, limit: number = 10): ActivityItem[] => {
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
  for (let i = 6; i < limit + 6; i++) {
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
  
  return extendedActivities.slice(0, limit);
};

/**
 * Hook to fetch and manage activity feed data
 */
export const useActivityFeed = ({
  siteSlug,
  limit = 10,
  filter,
}: UseActivityFeedParams = {}): UseActivityFeedResult => {
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);
  const [hasMore, setHasMore] = useState<boolean>(true);

  const fetchActivities = async (reset: boolean = true) => {
    setIsLoading(true);
    setError(null);

    try {
      // In a real implementation, this would be an API call
      // const response = await fetch(`/api/sites/${siteSlug}/activities?limit=${limit}`);
      // const data = await response.json();
      
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 500));
      
      const data = getMockActivityData(siteSlug, limit);
      
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
      setError(err instanceof Error ? err : new Error('Failed to fetch activities'));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchActivities();
  }, [siteSlug, limit, filter?.entityType?.join(','), filter?.actionType?.join(','), filter?.userId]);

  const loadMore = async () => {
    if (!isLoading && hasMore) {
      await fetchActivities(false);
    }
  };

  const refresh = async () => {
    await fetchActivities(true);
  };

  return {
    activities,
    isLoading,
    error,
    hasMore,
    loadMore,
    refresh,
  };
};

export default useActivityFeed;
