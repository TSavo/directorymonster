'use client';

import React from 'react';
import { useSiteForm } from '../context/SiteFormContext';

export const SEOStep: React.FC = () => {
  const { state, updateField } = useSiteForm();
  const { formData, errors } = state;
  
  // Handle checkbox change
  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    updateField(e.target.name, e.target.checked);
  };
  
  return (
    <div className="space-y-6">
      <h2 className="text-lg font-semibold mb-4" data-testid="seoStep-heading">
        SEO Settings
      </h2>
      <p className="text-gray-600 mb-4">
        Optimize your site for search engines with these settings.
      </p>
      
      {/* SEO Title */}
      <div className="mb-4">
        <label 
          htmlFor="siteForm-seoTitle" 
          className="block text-sm font-medium mb-1"
        >
          SEO Title <span className="text-xs text-gray-500">(Recommended: 50-60 characters)</span>
        </label>
        <input
          type="text"
          id="siteForm-seoTitle"
          name="seoTitle"
          value={formData.seoTitle || ''}
          onChange={(e) => updateField('seoTitle', e.target.value)}
          className={`w-full p-2 border rounded focus:ring-2 focus:border-blue-500 ${errors.seoTitle ? 'border-red-500' : 'border-gray-300'}`}
          aria-invalid={!!errors.seoTitle}
          aria-describedby={errors.seoTitle ? "siteForm-seoTitle-error" : undefined}
          data-testid="siteForm-seoTitle"
          placeholder="Enter SEO title"
        />
        {errors.seoTitle && (
          <p 
            className="mt-1 text-sm text-red-500" 
            role="alert" 
            id="siteForm-seoTitle-error"
            data-testid="siteForm-seoTitle-error"
          >
            {errors.seoTitle}
          </p>
        )}
        <p className="mt-1 text-xs text-gray-500">
          {formData.seoTitle ? `${formData.seoTitle.length} characters` : '0 characters'}
        </p>
      </div>
      
      {/* SEO Description */}
      <div className="mb-4">
        <label 
          htmlFor="siteForm-seoDescription" 
          className="block text-sm font-medium mb-1"
        >
          Meta Description <span className="text-xs text-gray-500">(Recommended: 150-160 characters)</span>
        </label>
        <textarea
          id="siteForm-seoDescription"
          name="seoDescription"
          value={formData.seoDescription || ''}
          onChange={(e) => updateField('seoDescription', e.target.value)}
          rows={3}
          className={`w-full p-2 border rounded focus:ring-2 focus:border-blue-500 ${errors.seoDescription ? 'border-red-500' : 'border-gray-300'}`}
          aria-invalid={!!errors.seoDescription}
          aria-describedby={errors.seoDescription ? "siteForm-seoDescription-error" : undefined}
          data-testid="siteForm-seoDescription"
          placeholder="Enter meta description"
        />
        {errors.seoDescription && (
          <p 
            className="mt-1 text-sm text-red-500" 
            role="alert" 
            id="siteForm-seoDescription-error"
            data-testid="siteForm-seoDescription-error"
          >
            {errors.seoDescription}
          </p>
        )}
        <p className="mt-1 text-xs text-gray-500">
          {formData.seoDescription ? `${formData.seoDescription.length} characters` : '0 characters'}
        </p>
      </div>
      
      {/* SEO Keywords */}
      <div className="mb-4">
        <label 
          htmlFor="siteForm-seoKeywords" 
          className="block text-sm font-medium mb-1"
        >
          Meta Keywords <span className="text-xs text-gray-500">(Comma separated)</span>
        </label>
        <input
          type="text"
          id="siteForm-seoKeywords"
          name="seoKeywords"
          value={formData.seoKeywords || ''}
          onChange={(e) => updateField('seoKeywords', e.target.value)}
          className="w-full p-2 border rounded focus:ring-2 focus:border-blue-500 border-gray-300"
          data-testid="siteForm-seoKeywords"
          placeholder="keyword1, keyword2, keyword3"
        />
        <p className="mt-1 text-xs text-gray-500">
          Less important for modern SEO, but still useful for content organization.
        </p>
      </div>
      
      {/* Canonical URLs */}
      <div className="mb-4">
        <div className="flex items-center">
          <input
            type="checkbox"
            id="siteForm-enableCanonicalUrls"
            name="enableCanonicalUrls"
            checked={formData.enableCanonicalUrls || false}
            onChange={handleCheckboxChange}
            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            data-testid="siteForm-enableCanonicalUrls"
          />
          <label 
            htmlFor="siteForm-enableCanonicalUrls" 
            className="ml-2 block text-sm font-medium"
          >
            Enable Canonical URLs
          </label>
        </div>
        <p className="mt-1 text-xs text-gray-500 ml-6">
          Automatically add canonical URL tags to prevent duplicate content issues.
        </p>
      </div>
    </div>
  );
};

export default SEOStep;
