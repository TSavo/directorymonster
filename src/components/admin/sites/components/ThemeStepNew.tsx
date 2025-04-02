'use client';

import React from 'react';
import { useSiteForm } from '../context/SiteFormContext';

export const ThemeStep: React.FC = () => {
  const { state, updateField } = useSiteForm();
  const { formData, errors } = state;
  
  return (
    <div className="space-y-6">
      <h2 className="text-lg font-semibold mb-4" data-testid="themeStep-heading">
        Appearance Settings
      </h2>
      
      {/* Theme selection */}
      <div className="mb-4">
        <label 
          htmlFor="siteForm-theme" 
          className="block text-sm font-medium mb-1"
        >
          Theme
        </label>
        <select
          id="siteForm-theme"
          name="theme"
          value={formData.theme}
          onChange={(e) => updateField('theme', e.target.value)}
          className="w-full p-2 border rounded focus:ring-2 focus:border-blue-500 border-gray-300"
          data-testid="siteForm-theme"
        >
          <option value="default">Default</option>
          <option value="light">Light</option>
          <option value="dark">Dark</option>
          <option value="custom">Custom</option>
        </select>
      </div>
      
      {/* Custom CSS */}
      <div className="mb-4">
        <label 
          htmlFor="siteForm-customStyles" 
          className="block text-sm font-medium mb-1"
        >
          Custom CSS <span className="text-xs text-gray-500">(Optional)</span>
        </label>
        <textarea
          id="siteForm-customStyles"
          name="customStyles"
          value={formData.customStyles}
          onChange={(e) => updateField('customStyles', e.target.value)}
          rows={8}
          className={`w-full p-2 border rounded focus:ring-2 focus:border-blue-500 ${errors.customStyles ? 'border-red-500' : 'border-gray-300'}`}
          aria-invalid={!!errors.customStyles}
          aria-describedby={errors.customStyles ? "siteForm-customStyles-error" : undefined}
          data-testid="siteForm-customStyles"
          placeholder=".custom-class {\n  color: #333;\n  font-size: 16px;\n}"
        />
        {errors.customStyles && (
          <p 
            className="mt-1 text-sm text-red-500" 
            role="alert" 
            id="siteForm-customStyles-error"
            data-testid="siteForm-customStyles-error"
          >
            {errors.customStyles}
          </p>
        )}
      </div>
    </div>
  );
};

export default ThemeStep;
