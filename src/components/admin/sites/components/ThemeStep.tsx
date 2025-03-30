'use client';

import React from 'react';

export interface ThemeStepProps {
  /**
   * Theme configuration values
   */
  values: {
    theme: string;
    customStyles?: string;
  };
  /**
   * Validation errors
   */
  errors: {
    customStyles?: string;
  };
  /**
   * Handler for input changes
   */
  onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => void;
  /**
   * Is the form in a loading state
   */
  isLoading?: boolean;
}

/**
 * ThemeStep - Form step for visual customization
 * 
 * Allows selection of theme and custom CSS styles
 */
export const ThemeStep: React.FC<ThemeStepProps> = ({
  values,
  errors,
  onChange,
  isLoading = false
}) => {
  // Available themes
  const availableThemes = [
    { id: 'default', name: 'Default' },
    { id: 'light', name: 'Light' },
    { id: 'dark', name: 'Dark' },
    { id: 'blue', name: 'Blue' },
    { id: 'green', name: 'Green' }
  ];

  return (
    <fieldset 
      className="mb-8 border p-4 rounded" 
      disabled={isLoading}
      data-testid="siteSettings-appearance-fieldset"
    >
      <legend className="text-lg font-semibold px-2">Visual Theme</legend>
      
      <div className="space-y-4">
        {/* Theme selection */}
        <div>
          <label 
            htmlFor="siteSettings-theme" 
            className="block text-sm font-medium mb-1"
          >
            Theme
          </label>
          <select
            id="siteSettings-theme"
            name="theme"
            value={values.theme}
            onChange={onChange}
            className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:border-blue-500"
            data-testid="siteSettings-theme"
          >
            {availableThemes.map(t => (
              <option key={t.id} value={t.id}>{t.name}</option>
            ))}
          </select>
        </div>
        
        {/* Custom CSS */}
        <div>
          <label 
            htmlFor="siteSettings-customStyles" 
            className="block text-sm font-medium mb-1"
          >
            Custom CSS
          </label>
          <textarea
            id="siteSettings-customStyles"
            name="customStyles"
            value={values.customStyles || ''}
            onChange={onChange}
            rows={8}
            placeholder=".my-class { color: blue; }"
            className={`w-full p-2 border rounded focus:ring-2 focus:border-blue-500 font-mono text-sm ${errors.customStyles ? 'border-red-500' : 'border-gray-300'}`}
            aria-invalid={errors.customStyles ? "true" : "false"}
            aria-describedby={errors.customStyles ? "siteSettings-customStyles-error" : undefined}
            data-testid="siteSettings-customStyles"
          />
          {errors.customStyles && (
            <p 
              className="mt-1 text-sm text-red-500" 
              role="alert" 
              id="siteSettings-customStyles-error"
              data-testid="siteSettings-customStyles-error"
            >
              {errors.customStyles}
            </p>
          )}
          <p className="text-sm text-gray-600 mt-1">
            Custom CSS will be applied to the entire site.
          </p>
        </div>
      </div>
    </fieldset>
  );
};

export default ThemeStep;