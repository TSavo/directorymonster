'use client';

import React from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { formatDistanceToNow } from 'date-fns';
import { useActivityFeed } from '@/components/admin/dashboard/hooks';
import { Button } from '@/components/ui/Button';

interface RecentActivityProps {
  siteId?: string;
  limit?: number;
}

/**
 * Component to display recent activity on the admin dashboard
 */
export function RecentActivity({ siteId, limit = 5 }: RecentActivityProps) {
  const { activities, isLoading, error, refresh } = useActivityFeed({
    siteSlug: siteId,
    limit
  });

  if (isLoading) {
    return (
      <div className="space-y-4" data-testid="activities-loading">
        <Skeleton className="h-16 w-full" />
        <Skeleton className="h-16 w-full" />
        <Skeleton className="h-16 w-full" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 text-red-600" data-testid="activities-error">
        <p>Error: {error.message || 'Failed to load activity feed'}</p>
        <Button
          variant="primary"
          size="sm"
          className="mt-2"
          onClick={refresh}
        >
          Retry
        </Button>
      </div>
    );
  }

  if (activities.length === 0) {
    return (
      <div className="p-4 text-neutral-600" data-testid="activities-empty">
        No recent activity
      </div>
    );
  }

  return (
    <div className="space-y-4" data-testid="recent-activity" data-site-id={siteId}>
      {activities.map((activity) => (
        <div key={activity.id} className="bg-white p-4 rounded-lg shadow" data-testid="activity-item">
          <div className="flex justify-between">
            <div>
              <p className="text-sm font-medium text-neutral-900">
                {activity.userName} {getActionText(activity.type)} {activity.entityType}:{' '}
                <span className="font-semibold">{activity.entityName}</span>
              </p>
              <p className="text-xs text-neutral-500">
                {formatDistanceToNow(new Date(activity.timestamp), { addSuffix: true })}
              </p>
            </div>
            <div className="text-xs text-neutral-500">
              {getActivityIcon(activity.entityType, activity.type)}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function getActionText(type: string): string {
  switch (type) {
    case 'creation':
      return 'created';
    case 'update':
      return 'updated';
    case 'deletion':
      return 'deleted';
    case 'publication':
      return 'published';
    case 'import':
      return 'imported';
    default:
      return type;
  }
}

function getActivityIcon(entityType: string, actionType: string): React.ReactNode {
  // In a real implementation, this would return appropriate icons
  return null;
}
