"use client";

import React from 'react';
import { ActivityItem } from '../types';
import ActivityFeedItem from './ActivityFeedItem';

interface ActivityFeedListProps {
  activities: ActivityItem[];
  className?: string;
}

export function ActivityFeedList({
  activities,
  className = '',
}: ActivityFeedListProps) {
  return (
    <div 
      className={`divide-y divide-gray-100 ${className}`}
      data-testid="activity-feed-list"
    >
      {activities.map((activity) => (
        <div key={activity.id} className="px-3">
          <ActivityFeedItem activity={activity} />
        </div>
      ))}
    </div>
  );
}

export default ActivityFeedList;