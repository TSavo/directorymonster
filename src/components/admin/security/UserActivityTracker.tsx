'use client';

import React from 'react';
import { UserActivityContainer } from './UserActivityContainer';

interface UserActivityTrackerProps {
  userId?: string;
}

/**
 * User Activity Tracker Component
 *
 * This component displays user activity and provides filtering and search functionality.
 * It has been refactored to use a container/presentation pattern for better testability.
 */
const UserActivityTracker: React.FC<UserActivityTrackerProps> = ({ userId }) => {
  // Use the container component which manages state and data fetching
  return <UserActivityContainer userId={userId} />;
};

export default UserActivityTracker;
