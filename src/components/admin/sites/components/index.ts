"use client";

// Import the components directly
import BasicInfoStep from './BasicInfoStep';
import DomainStep from './DomainStep';
import ThemeStep from './ThemeStep';
import SEOStep from './SEOStep';
import SiteFormPreview from './SiteFormPreview';
import StepNavigation from './StepNavigation';
import FormActions from './FormActions';

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

// Default export with all components grouped together
export default {
  BasicInfoStep,
  DomainStep,
  ThemeStep,
  SEOStep,
  SiteFormPreview,
  StepNavigation,
  FormActions
};