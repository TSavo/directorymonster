"use client";

// Import the component explicitly
import useDomains from './useDomains';

// Export all named exports
export * from './useDomains';

// Re-export default as named exports
export { default as useDomains } from './useDomains';

// Default export for backward compatibility
const hooks = { useDomains };
export default hooks;
