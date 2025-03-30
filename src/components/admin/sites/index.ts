"use client";

// Export all named exports from each component
export * from './DomainManager';
export * from './SEOSettings';
export * from './SiteForm';
export * from './SiteSettings';
export * from './hooks';

// Re-export default exports as named exports
export { default as DomainManager } from './DomainManager';
export { default as SEOSettings } from './SEOSettings';
export { default as SiteForm } from './SiteForm';
export { default as SiteSettings } from './SiteSettings';

// Default export for backward compatibility
export default {
  DomainManager,
  SEOSettings,
  SiteForm,
  SiteSettings,
};
