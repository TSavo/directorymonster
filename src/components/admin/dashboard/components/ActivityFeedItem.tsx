"use client";

import React from 'react';
import { ActivityItem } from '../types';

interface ActivityFeedItemProps {
  activity: ActivityItem;
  className?: string;
}

/**
 * Component for rendering an individual activity feed item
 */
export function ActivityFeedItem({
  activity,
  className = '',
}: ActivityFeedItemProps) {
  // Format the timestamp to a relative time (e.g., "2 hours ago")
  const formatRelativeTime = (timestamp: string): string => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    
    if (diffInSeconds < 60) return `${diffInSeconds} seconds ago`;
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} minutes ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} hours ago`;
    if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)} days ago`;
    return date.toLocaleDateString();
  };

  // Get an icon for the activity type
  const getActivityIcon = (): React.ReactNode => {
    switch (activity.type) {
      case 'creation':
        return (
          <div className="bg-green-100 p-2 rounded-full" data-testid="creation-icon">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-green-600" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
            </svg>
          </div>
        );
      case 'update':
        return (
          <div className="bg-blue-100 p-2 rounded-full" data-testid="update-icon">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-600" viewBox="0 0 20 20" fill="currentColor">
              <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
            </svg>
          </div>
        );
      case 'deletion':
        return (
          <div className="bg-red-100 p-2 rounded-full" data-testid="deletion-icon">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-red-600" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
          </div>
        );
      case 'publication':
        return (
          <div className="bg-purple-100 p-2 rounded-full" data-testid="publication-icon">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-purple-600" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd" />
            </svg>
          </div>
        );
      case 'import':
        return (
          <div className="bg-yellow-100 p-2 rounded-full" data-testid="import-icon">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-yellow-600" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM6.293 6.707a1 1 0 010-1.414l3-3a1 1 0 011.414 0l3 3a1 1 0 01-1.414 1.414L11 5.414V13a1 1 0 11-2 0V5.414L7.707 6.707a1 1 0 01-1.414 0z" clipRule="evenodd" />
            </svg>
          </div>
        );
      default:
        return (
          <div className="bg-gray-100 p-2 rounded-full">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-600" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
          </div>
        );
    }
  };

  // Get a description based on the activity type and entity
  const getActivityDescription = (): string => {
    const entityTypeFormatted = activity.entityType.charAt(0).toUpperCase() + activity.entityType.slice(1);
    
    switch (activity.type) {
      case 'creation':
        return `Created ${activity.entityType} "${activity.entityName}"`;
      case 'update':
        return `Updated ${activity.entityType} "${activity.entityName}"`;
      case 'deletion':
        return `Deleted ${activity.entityType} "${activity.entityName}"`;
      case 'publication':
        return `Published ${activity.entityType} "${activity.entityName}"`;
      case 'import':
        return `Imported ${entityTypeFormatted}s: "${activity.entityName}"`;
      default:
        return `Action on ${activity.entityType} "${activity.entityName}"`;
    }
  };

  return (
    <div 
      className={`flex items-start space-x-3 py-3 ${className}`}
      data-testid="activity-feed-item"
    >
      {getActivityIcon()}
      
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-900 truncate" data-testid="activity-description">
          {getActivityDescription()}
        </p>
        
        <div className="flex text-sm text-gray-500 mt-1">
          <span data-testid="activity-user">
            {activity.userName}
          </span>
          <span className="mx-1">•</span>
          <time 
            dateTime={activity.timestamp} 
            data-testid="activity-time"
          >
            {formatRelativeTime(activity.timestamp)}
          </time>
        </div>
        
        {activity.details && (
          <p className="mt-1 text-sm text-gray-600" data-testid="activity-details">
            {activity.details}
          </p>
        )}
      </div>
    </div>
  );
}

// Add default export for dual-export pattern
export default ActivityFeedItem;
