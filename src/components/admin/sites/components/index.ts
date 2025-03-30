"use client";

// Export all named exports from each component
export * from './BasicInfoStep';
export * from './DomainStep';
export * from './ThemeStep';
export * from './SEOStep';
export * from './SiteFormPreview';
export * from './StepNavigation';
export * from './FormActions';

// Re-export default exports as named exports
export { default as BasicInfoStep } from './BasicInfoStep';
export { default as DomainStep } from './DomainStep';
export { default as ThemeStep } from './ThemeStep';
export { default as SEOStep } from './SEOStep';
export { default as SiteFormPreview } from './SiteFormPreview';
export { default as StepNavigation } from './StepNavigation';
export { default as FormActions } from './FormActions';

// Default export for backward compatibility
export default {
  BasicInfoStep,
  DomainStep,
  ThemeStep,
  SEOStep,
  SiteFormPreview,
  StepNavigation,
  FormActions,
};