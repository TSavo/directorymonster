'use client';

import React from 'react';
import { useSiteForm } from '../context/SiteFormContext';

export const BasicInfoStep: React.FC = () => {
  const { state, updateField } = useSiteForm();
  const { formData, errors } = state;
  
  return (
    <div className="space-y-6">
      <h2 className="text-lg font-semibold mb-4" data-testid="basicInfoStep-heading">
        Basic Information
      </h2>
      
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
          value={formData.name}
          onChange={(e) => updateField('name', e.target.value)}
          className={`w-full p-2 border rounded focus:ring-2 focus:border-blue-500 ${errors.name ? 'border-red-500' : 'border-gray-300'}`}
          aria-invalid={!!errors.name}
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
          value={formData.slug}
          onChange={(e) => updateField('slug', e.target.value)}
          className={`w-full p-2 border rounded focus:ring-2 focus:border-blue-500 ${errors.slug ? 'border-red-500' : 'border-gray-300'}`}
          aria-invalid={!!errors.slug}
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
          value={formData.description}
          onChange={(e) => updateField('description', e.target.value)}
          rows={3}
          className={`w-full p-2 border rounded focus:ring-2 focus:border-blue-500 ${errors.description ? 'border-red-500' : 'border-gray-300'}`}
          aria-invalid={!!errors.description}
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
    </div>
  );
};

export default BasicInfoStep;
