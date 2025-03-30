// Standardized barrel file - Updated on 2025-03-29

// Export all named exports from component files
export * from './ActivityFeed';
export * from './StatisticCards';

// Re-export default as named exports
export { default as ActivityFeed } from './ActivityFeed';
export { default as StatisticCards } from './StatisticCards';

// Default export object for backward compatibility
export default {
  ActivityFeed: ActivityFeed,
  StatisticCards: StatisticCards,
};
