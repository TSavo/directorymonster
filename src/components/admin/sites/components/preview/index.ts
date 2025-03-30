"use client";

// Import the components first
import BasicInfoPreview from './BasicInfoPreview';
import DomainsPreview from './DomainsPreview';
import ThemePreview from './ThemePreview';
import SEOPreview from './SEOPreview';

// Export all named exports
export * from './BasicInfoPreview';
export * from './DomainsPreview';
export * from './ThemePreview';
export * from './SEOPreview';

// Re-export default exports as named exports
export { default as BasicInfoPreview } from './BasicInfoPreview';
export { default as DomainsPreview } from './DomainsPreview';
export { default as ThemePreview } from './ThemePreview';
export { default as SEOPreview } from './SEOPreview';

// Export default for backward compatibility
export default {
  BasicInfoPreview,
  DomainsPreview,
  ThemePreview,
  SEOPreview
};