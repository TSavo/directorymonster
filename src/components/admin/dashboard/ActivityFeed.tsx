'use client';

import React from 'react';
import { ActivityFeedProps } from './types';
import { ActivityFeedContainer } from './ActivityFeedContainer';

/**
 * ActivityFeed Component
 *
 * This component displays a feed of recent activities with filtering and date range options.
 * It has been refactored to use a container/presentation pattern for better testability.
 */
export const ActivityFeed: React.FC<ActivityFeedProps> = (props) => {
  return <ActivityFeedContainer {...props} />;
};

// Also export as default for backward compatibility
export default ActivityFeed;