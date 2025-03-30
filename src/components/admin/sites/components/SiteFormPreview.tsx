'use client';

import React from 'react';
import {
  BasicInfoPreview,
  DomainsPreview,
  ThemePreview,
  SEOPreview
} from './preview';

export interface SiteFormPreviewProps {
  /**
   * Complete site data for preview
   */
  siteData: {
    name: string;
    slug: string;
    description?: string;
    domains: string[];
    theme: string;
    customStyles?: string;
    seoTitle?: string;
    seoDescription?: string;
    seoKeywords?: string;
    enableCanonicalUrls?: boolean;
    // Any other site properties
  };
}

/**
 * SiteFormPreview - Preview site configuration before submission
 * 
 * Displays a summary of all site information for final review
 */
export const SiteFormPreview: React.FC<SiteFormPreviewProps> = ({
  siteData
}) => {
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6" data-testid="site-form-preview">
      <h2 className="text-lg font-semibold mb-4">Review Site Configuration</h2>
      
      {/* Basic Information */}
      <BasicInfoPreview
        name={siteData.name}
        slug={siteData.slug}
        description={siteData.description}
      />
      
      {/* Domains */}
      <DomainsPreview domains={siteData.domains} />
      
      {/* Appearance */}
      <ThemePreview
        theme={siteData.theme}
        customStyles={siteData.customStyles}
      />
      
      {/* SEO Information */}
      <SEOPreview
        seoTitle={siteData.seoTitle}
        seoDescription={siteData.seoDescription}
        seoKeywords={siteData.seoKeywords}
        enableCanonicalUrls={siteData.enableCanonicalUrls}
      />
      
      <div className="text-center text-gray-600 text-sm mt-6">
        Review the information above and confirm it's correct before submitting.
      </div>
    </div>
  );
};

export default SiteFormPreview;