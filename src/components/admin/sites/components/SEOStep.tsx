'use client';

import React from 'react';
import { SEOSettings } from '../SEOSettings';

export interface SEOStepProps {
  /**
   * SEO configuration values
   */
  values: {
    id?: string;
    seoTitle?: string;
    seoDescription?: string;
    seoKeywords?: string;
    ogTitle?: string;
    ogDescription?: string;
    ogImage?: string;
    twitterCard?: string;
    twitterSite?: string;
    enableCanonicalUrls?: boolean;
    noindexPages?: string[];
    structuredData?: string;
    robotsTxt?: string;
  };
  /**
   * Callback for SEO setting changes
   */
  onSEOChange: (seoData: any) => void;
  /**
   * Is the form in a loading state
   */
  isLoading?: boolean;
}

/**
 * SEOStep - Form step for SEO configuration
 * 
 * Wraps the SEOSettings component to use it in the multi-step form
 */
export const SEOStep: React.FC<SEOStepProps> = ({
  values,
  onSEOChange,
  isLoading = false
}) => {
  // Handle SEO changes
  const handleSEOChange = (data: any) => {
    onSEOChange(data);
  };

  return (
    <div>
      <h2 className="text-lg font-semibold mb-4" data-testid="seo-step-heading">
        Search Engine Optimization
      </h2>
      <p className="text-gray-600 mb-4" data-testid="seo-step-description">
        Configure SEO settings to improve visibility in search results
      </p>

      <SEOSettings
        initialData={{
          id: values.id || '',
          seoTitle: values.seoTitle,
          seoDescription: values.seoDescription,
          seoKeywords: values.seoKeywords,
          ogTitle: values.ogTitle,
          ogDescription: values.ogDescription,
          ogImage: values.ogImage,
          twitterCard: values.twitterCard,
          twitterSite: values.twitterSite,
          enableCanonicalUrls: values.enableCanonicalUrls,
          noindexPages: values.noindexPages,
          structuredData: values.structuredData,
          robotsTxt: values.robotsTxt
        }}
        onSuccess={handleSEOChange}
        // In the multi-step form, we'll handle submission in the parent component
        apiEndpoint={undefined} // Prevent direct API submission
      />
    </div>
  );
};

export default SEOStep;