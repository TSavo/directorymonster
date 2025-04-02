'use client';

import React from 'react';
import { useSiteForm } from '../context/SiteFormContext';

export interface BasicInfoStepProps {
  /**
   * Form values for basic site information
   */
  values?: {
    name: string;
    slug: string;
    description: string;
  };
  /**
   * Errors for form validation
   */
  errors?: {
    name?: string;
    slug?: string;
    description?: string;
  };
  /**
   * Handler for input changes
   */
  onValueChange?: (field: string, value: any) => void;
  /**
   * Is the form in a loading state
   */
  loading?: boolean;
}

/**
 * BasicInfoStep - Form step for site name, slug, and description
 *
 * First step in the site creation/editing process
 */
export const BasicInfoStep: React.FC<BasicInfoStepProps> = ({
  values: propValues,
  errors: propErrors,
  onValueChange,
  loading = false
}) => {
  // Use context if available, otherwise use props
  let siteFormContext = null;
  try {
    if (typeof useSiteForm === 'function') {
      siteFormContext = useSiteForm();
    }
  } catch (error) {
    // If context is not available, we'll use props instead
    siteFormContext = null;
  }

  const values = propValues || (siteFormContext?.state.formData || { name: '', slug: '', description: '' });
  const errors = propErrors || (siteFormContext?.state.errors || {});

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    if (onValueChange) {
      onValueChange(name, value);
    } else if (siteFormContext) {
      siteFormContext.updateField(name, value);
    }
  };
  return (
    <fieldset
      className="mb-6"
      disabled={loading}
      data-testid="siteForm-fieldset"
    >
      <legend className="text-lg font-semibold mb-3" data-testid="siteForm-basic-info-heading">
        Basic Information
      </legend>

      {/* Name field */}
      <div className="mb-4">
        <label
          htmlFor="siteForm-name"
          className="block text-sm font-medium mb-1"
        >
          Site Name *
        </label>
        <input
          type="text"
          id="siteForm-name"
          name="name"
          value={values.name}
          onChange={handleChange}
          className={`w-full p-2 border rounded focus:ring-2 focus:border-blue-500 ${errors.name ? 'border-red-500' : 'border-gray-300'}`}
          aria-invalid={errors.name ? "true" : "false"}
          aria-describedby={errors.name ? "siteForm-name-error" : undefined}
          data-testid="siteForm-name"
        />
        {errors.name && (
          <p
            className="mt-1 text-sm text-red-500"
            role="alert"
            id="siteForm-name-error"
            data-testid="siteForm-name-error"
          >
            {errors.name}
          </p>
        )}
      </div>

      {/* Slug field */}
      <div className="mb-4">
        <label
          htmlFor="siteForm-slug"
          className="block text-sm font-medium mb-1"
        >
          Slug * <span className="text-xs text-gray-500">(URL-friendly name)</span>
        </label>
        <input
          type="text"
          id="siteForm-slug"
          name="slug"
          value={values.slug}
          onChange={handleChange}
          className={`w-full p-2 border rounded focus:ring-2 focus:border-blue-500 ${errors.slug ? 'border-red-500' : 'border-gray-300'}`}
          aria-invalid={errors.slug ? "true" : "false"}
          aria-describedby={errors.slug ? "siteForm-slug-error" : undefined}
          data-testid="siteForm-slug"
        />
        {errors.slug && (
          <p
            className="mt-1 text-sm text-red-500"
            role="alert"
            id="siteForm-slug-error"
            data-testid="siteForm-slug-error"
          >
            {errors.slug}
          </p>
        )}
      </div>

      {/* Description field */}
      <div className="mb-4">
        <label
          htmlFor="siteForm-description"
          className="block text-sm font-medium mb-1"
        >
          Description <span className="text-xs text-gray-500">(Optional)</span>
        </label>
        <textarea
          id="siteForm-description"
          name="description"
          value={values.description}
          onChange={handleChange}
          rows={3}
          className={`w-full p-2 border rounded focus:ring-2 focus:border-blue-500 ${errors.description ? 'border-red-500' : 'border-gray-300'}`}
          aria-invalid={errors.description ? "true" : "false"}
          aria-describedby={errors.description ? "siteForm-description-error" : undefined}
          data-testid="siteForm-description"
        />
        {errors.description && (
          <p
            className="mt-1 text-sm text-red-500"
            role="alert"
            id="siteForm-description-error"
            data-testid="siteForm-description-error"
          >
            {errors.description}
          </p>
        )}
      </div>
    </fieldset>
  );
};

export default BasicInfoStep;
