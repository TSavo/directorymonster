"use client";

// Import the component explicitly
import useDomains from './useDomains';
import useSites from './useSites';

// Export all named exports
export * from './useDomains';
export * from './useSites';

// Re-export default as named exports
export { default as useDomains } from './useDomains';
export { default as useSites } from './useSites';

// Default export for backward compatibility
const hooks = { useDomains, useSites };
export default hooks;
