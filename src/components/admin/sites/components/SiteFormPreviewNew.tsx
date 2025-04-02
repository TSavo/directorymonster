'use client';

import React from 'react';
import { useSiteForm } from '../context/SiteFormContext';

export const SiteFormPreview: React.FC = () => {
  const { state } = useSiteForm();
  const { formData } = state;
  
  return (
    <div className="space-y-6">
      <h2 className="text-lg font-semibold mb-4" data-testid="previewStep-heading">
        Review Your Site
      </h2>
      <p className="text-gray-600 mb-4">
        Please review your site information before submitting.
      </p>
      
      {/* Basic Info Preview */}
      <div className="mb-6 border rounded p-4 bg-gray-50">
        <h3 className="text-md font-medium mb-2">Basic Information</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <p className="text-sm font-medium text-gray-500">Name</p>
            <p className="text-md" data-testid="preview-name">{formData.name || 'Not provided'}</p>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500">Slug</p>
            <p className="text-md" data-testid="preview-slug">{formData.slug || 'Not provided'}</p>
          </div>
          <div className="col-span-1 md:col-span-2">
            <p className="text-sm font-medium text-gray-500">Description</p>
            <p className="text-md" data-testid="preview-description">
              {formData.description || 'No description provided'}
            </p>
          </div>
        </div>
      </div>
      
      {/* Domains Preview */}
      <div className="mb-6 border rounded p-4 bg-gray-50">
        <h3 className="text-md font-medium mb-2">Domains</h3>
        <div data-testid="preview-domains">
          {formData.domains && formData.domains.length > 0 ? (
            <ul className="list-disc pl-5">
              {formData.domains.map((domain, index) => (
                <li key={index} className="text-md">{domain}</li>
              ))}
            </ul>
          ) : (
            <p className="text-md text-gray-500">No domains added</p>
          )}
        </div>
      </div>
      
      {/* Theme Preview */}
      <div className="mb-6 border rounded p-4 bg-gray-50">
        <h3 className="text-md font-medium mb-2">Appearance</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <p className="text-sm font-medium text-gray-500">Theme</p>
            <p className="text-md" data-testid="preview-theme">{formData.theme || 'Default'}</p>
          </div>
          {formData.customStyles && (
            <div className="col-span-1 md:col-span-2">
              <p className="text-sm font-medium text-gray-500">Custom CSS</p>
              <pre className="text-xs bg-gray-100 p-2 rounded overflow-auto max-h-40">
                {formData.customStyles}
              </pre>
            </div>
          )}
        </div>
      </div>
      
      {/* SEO Preview */}
      <div className="mb-6 border rounded p-4 bg-gray-50">
        <h3 className="text-md font-medium mb-2">SEO Settings</h3>
        <div className="space-y-3" data-testid="preview-seo">
          <div>
            <p className="text-sm font-medium text-gray-500">SEO Title</p>
            <p className="text-md">{formData.seoTitle || 'Not provided'}</p>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500">Meta Description</p>
            <p className="text-md">{formData.seoDescription || 'Not provided'}</p>
          </div>
          {formData.seoKeywords && (
            <div>
              <p className="text-sm font-medium text-gray-500">Meta Keywords</p>
              <p className="text-md">{formData.seoKeywords}</p>
            </div>
          )}
          <div>
            <p className="text-sm font-medium text-gray-500">Canonical URLs</p>
            <p className="text-md">{formData.enableCanonicalUrls ? 'Enabled' : 'Disabled'}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SiteFormPreview;
