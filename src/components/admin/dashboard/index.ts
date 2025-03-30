"use client";

// Standardized barrel file - Updated on 2025-03-29

// Import components directly
import { ActivityFeed as ActivityFeedComponent } from './ActivityFeed';
import { StatisticCards as StatisticCardsComponent } from './StatisticCards';

// Also import default exports
import ActivityFeedDefault from './ActivityFeed';
import StatisticCardsDefault from './StatisticCards';

// Export all named exports from component files
export * from './ActivityFeed';
export * from './StatisticCards';

// Re-export default as named exports
export { default as ActivityFeed } from './ActivityFeed';
export { default as StatisticCards } from './StatisticCards';

// Default export object for backward compatibility
// Make sure the default exports are properly defined before being used
const dashboard = {
  ActivityFeed: ActivityFeedDefault,
  StatisticCards: StatisticCardsDefault
};

export default dashboard;
