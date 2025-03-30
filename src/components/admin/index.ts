"use client";

// Import components explicitly
import listingsDefault from './listings';
import layoutDefault from './layout';
import dashboardDefault from './dashboard';
import categoriesDefault from './categories';
import authDefault from './auth';
import sitesDefault from './sites';

// Export all named exports
export * from './listings';
export * from './layout';
export * from './dashboard';
export * from './auth';
export * from './categories';
export * from './sites';

// Re-export default as named exports
export { default as listings } from './listings';
export { default as layout } from './layout';
export { default as dashboard } from './dashboard';
export { default as categories } from './categories';
export { default as auth } from './auth';
export { default as sites } from './sites';

// Default export for backward compatibility using imported variables
const admin = {
  listings: listingsDefault,
  layout: layoutDefault,
  dashboard: dashboardDefault,
  categories: categoriesDefault,
  auth: authDefault,
  sites: sitesDefault
};

export default admin;
