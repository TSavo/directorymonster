"use client";

// Import the components directly
import BasicInfoStep from './BasicInfoStepNew';
import DomainStep from './DomainStepFixed';
import ThemeStep from './ThemeStepNew';
import SEOStep from './SEOStepNew';
import SiteFormPreview from './SiteFormPreviewNew';

// Export all named exports from each component
export * from './BasicInfoStepNew';
export * from './DomainStepFixed';
export * from './ThemeStepNew';
export * from './SEOStepNew';
export * from './SiteFormPreviewNew';

// Re-export default exports as named exports
export { default as BasicInfoStep } from './BasicInfoStepNew';
export { default as DomainStep } from './DomainStepFixed';
export { default as ThemeStep } from './ThemeStepNew';
export { default as SEOStep } from './SEOStepNew';
export { default as SiteFormPreview } from './SiteFormPreviewNew';

// Default export with all components grouped together
export default {
  BasicInfoStep,
  DomainStep,
  ThemeStep,
  SEOStep,
  SiteFormPreview
};