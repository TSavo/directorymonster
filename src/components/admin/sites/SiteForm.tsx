'use client';

import React from 'react';
import { SiteFormContainer } from './SiteFormContainer';

/**
 * SiteForm - Form for creating and editing site configurations
 *
 * A modular multi-step form component for creating and editing Site data.
 *
 * Features:
 * - Multi-step form with step navigation
 * - Form validation with error messages
 * - API integration for submission
 * - Loading states and error handling
 * - Accessibility support with ARIA attributes
 * - Keyboard navigation
 * - Preview mode for reviewing before submission
 */
export interface SiteFormProps {
  /**
   * Initial data for editing an existing item
   */
  initialData?: {
    id?: string;
    name?: string;
    slug?: string;
    description?: string;
    domains?: string[];
    theme?: string;
    customStyles?: string;
    seoTitle?: string;
    seoDescription?: string;
    seoKeywords?: string;
    enableCanonicalUrls?: boolean;
    [key: string]: any;
  };
  /**
   * Mode for the form (create or edit)
   */
  mode?: 'create' | 'edit';
  /**
   * Callback when form is canceled
   */
  onCancel?: () => void;
  /**
   * Callback when form is submitted successfully
   */
  onSuccess?: (data: any) => void;
  /**
   * API endpoint for form submission
   */
  apiEndpoint?: string;
  /**
   * Initial step for the form (for testing)
   */
  initialStep?: string;
}

export function SiteForm(props: SiteFormProps) {
  return <SiteFormContainer {...props} />;
}

export default SiteForm;