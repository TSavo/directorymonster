'use client';

import React from 'react';

export interface SEOPreviewProps {
  /**
   * Site SEO configuration
   */
  seoTitle?: string;
  seoDescription?: string;
  seoKeywords?: string;
  enableCanonicalUrls?: boolean;
}

/**
 * SEOPreview - Preview site SEO settings
 */
export const SEOPreview: React.FC<SEOPreviewProps> = ({
  seoTitle,
  seoDescription,
  seoKeywords,
  enableCanonicalUrls = true
}) => {
  return (
    <div className="mb-6">
      <h3 className="text-md font-medium border-b pb-2 mb-2">SEO Configuration</h3>
      <div className="grid grid-cols-1 gap-4">
        <div>
          <p className="text-sm font-medium text-gray-600">Meta Title</p>
          <p className="mt-1" data-testid="preview-seo-title">
            {seoTitle || <span className="text-gray-400 italic">Default title will be used</span>}
          </p>
        </div>
        <div>
          <p className="text-sm font-medium text-gray-600">Meta Description</p>
          <p className="mt-1" data-testid="preview-seo-description">
            {seoDescription || <span className="text-gray-400 italic">No meta description</span>}
          </p>
        </div>
        <div>
          <p className="text-sm font-medium text-gray-600">Meta Keywords</p>
          <p className="mt-1" data-testid="preview-seo-keywords">
            {seoKeywords || <span className="text-gray-400 italic">No keywords</span>}
          </p>
        </div>
        <div>
          <p className="text-sm font-medium text-gray-600">Canonical URLs</p>
          <p className="mt-1" data-testid="preview-canonical-urls">
            {enableCanonicalUrls !== false ? 'Enabled' : 'Disabled'}
          </p>
        </div>
      </div>
    </div>
  );
};

export default SEOPreview;