'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';

export interface SEOSettingsProps {
  initialData?: {
    id: string;
    name?: string;
    slug?: string;
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
    sitemapExclusions?: string[];
    robotsTxt?: string;
  };
  onCancel?: () => void;
  onSuccess?: (data: any) => void;
  apiEndpoint?: string;
}

export const SEOSettings: React.FC<SEOSettingsProps> = ({
  initialData = { id: '' },
  onCancel,
  onSuccess,
  apiEndpoint = '/api/sites'
}) => {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  // Form state
  const [seoTitle, setSeoTitle] = useState(initialData.seoTitle || '');
  const [seoDescription, setSeoDescription] = useState(initialData.seoDescription || '');
  const [seoKeywords, setSeoKeywords] = useState(initialData.seoKeywords || '');
  const [ogTitle, setOgTitle] = useState(initialData.ogTitle || '');
  const [ogDescription, setOgDescription] = useState(initialData.ogDescription || '');
  const [ogImage, setOgImage] = useState(initialData.ogImage || '');
  const [twitterCard, setTwitterCard] = useState(initialData.twitterCard || 'summary');
  const [twitterSite, setTwitterSite] = useState(initialData.twitterSite || '');
  const [enableCanonicalUrls, setEnableCanonicalUrls] = useState(
    initialData.enableCanonicalUrls !== undefined ? initialData.enableCanonicalUrls : true
  );
  const [noindexPages, setNoindexPages] = useState<string[]>(initialData.noindexPages || []);
  const [newNoindexPage, setNewNoindexPage] = useState('');
  const [structuredData, setStructuredData] = useState(initialData.structuredData || '');
  const [robotsTxt, setRobotsTxt] = useState(initialData.robotsTxt || '');
  
  // Validation state
  const [errors, setErrors] = useState<{[key: string]: string}>({});
  
  // Twitter card options
  const twitterCardOptions = [
    { id: 'summary', name: 'Summary Card' },
    { id: 'summary_large_image', name: 'Summary with Large Image' },
    { id: 'app', name: 'App Card' },
    { id: 'player', name: 'Player Card' }
  ];
  
  // Handle input changes
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    
    // Update state based on input name
    if (type === 'checkbox' && name === 'enableCanonicalUrls') {
      setEnableCanonicalUrls((e.target as HTMLInputElement).checked);
    } else {
      const setters: {[key: string]: Function} = {
        seoTitle: setSeoTitle,
        seoDescription: setSeoDescription,
        seoKeywords: setSeoKeywords,
        ogTitle: setOgTitle,
        ogDescription: setOgDescription,
        ogImage: setOgImage,
        twitterCard: setTwitterCard,
        twitterSite: setTwitterSite,
        newNoindexPage: setNewNoindexPage,
        structuredData: setStructuredData,
        robotsTxt: setRobotsTxt
      };
      
      if (setters[name]) setters[name](value);
    }
    
    // Clear error when field is changed
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: undefined }));
    }
  };
  
  // Handle noindex pages management
  const addNoindexPage = () => {
    if (!newNoindexPage.trim()) return;
    
    // Validate path format
    if (!newNoindexPage.startsWith('/')) {
      setErrors(prev => ({ ...prev, newNoindexPage: 'Path must start with /' }));
      return;
    }
    
    // Check if path already exists
    if (noindexPages.includes(newNoindexPage)) {
      setErrors(prev => ({ ...prev, newNoindexPage: 'This path is already added' }));
      return;
    }
    
    // Add path and clear input
    setNoindexPages(prev => [...prev, newNoindexPage]);
    setNewNoindexPage('');
    setErrors(prev => ({ ...prev, newNoindexPage: undefined }));
  };
  
  const removeNoindexPage = (path: string) => {
    setNoindexPages(prev => prev.filter(p => p !== path));
  };
  
  // Validation function
  const validateForm = (): boolean => {
    const newErrors: {[key: string]: string} = {};
    let isValid = true;
    
    // Validate field lengths
    if (seoTitle.length > 60) {
      newErrors.seoTitle = 'SEO title should be 60 characters or less';
      isValid = false;
    }
    
    if (seoDescription.length > 160) {
      newErrors.seoDescription = 'SEO description should be 160 characters or less';
      isValid = false;
    }
    
    // Validate Twitter site handle format
    if (twitterSite && !twitterSite.startsWith('@')) {
      newErrors.twitterSite = 'Twitter handle should start with @';
      isValid = false;
    }
    
    // Validate structured data JSON format
    if (structuredData) {
      try {
        JSON.parse(structuredData);
      } catch (err) {
        newErrors.structuredData = 'Invalid JSON format';
        isValid = false;
      }
    }
    
    setErrors(newErrors);
    return isValid;
  };
  
  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setIsLoading(true);
    setError(null);
    setSuccess(null);
    
    try {
      // Prepare settings data
      const settingsData = {
        id: initialData.id,
        seoTitle, seoDescription, seoKeywords,
        ogTitle, ogDescription, ogImage,
        twitterCard, twitterSite,
        enableCanonicalUrls, noindexPages,
        structuredData, robotsTxt
      };
      
      // Submit settings data
      const response = await fetch(`${apiEndpoint}/${initialData.id}/seo`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settingsData)
      });
      
      const result = await response.json();
      
      if (response.ok) {
        setSuccess('SEO settings updated successfully');
        if (onSuccess) onSuccess(result);
      } else {
        throw new Error(result.error || 'An error occurred');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to save SEO settings');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-3xl mx-auto p-6 bg-white rounded shadow">
      <h1 data-testid="seoSettings-header" className="text-xl font-bold mb-6">
        SEO Settings
      </h1>
      
      {/* Site info */}
      {initialData.name && (
        <div className="mb-6">
          <h2 className="text-lg font-semibold">{initialData.name}</h2>
          <p className="text-gray-600 text-sm">ID: {initialData.id}</p>
        </div>
      )}
      
      {/* Messages */}
      {error && (
        <div data-testid="seoSettings-error" className="mb-4 p-3 bg-red-100 text-red-700 rounded" role="alert">
          {error}
        </div>
      )}
      
      {success && (
        <div data-testid="seoSettings-success" className="mb-4 p-3 bg-green-100 text-green-700 rounded" role="alert">
          {success}
        </div>
      )}
      
      <form onSubmit={handleSubmit} data-testid="seoSettings-form">
        {/* Meta Tags Section */}
        <fieldset className="mb-8 border p-4 rounded" disabled={isLoading}>
          <legend className="text-lg font-semibold px-2">Meta Tags</legend>
          
          <div className="space-y-4">
            <div>
              <label htmlFor="seoSettings-seoTitle" className="block text-sm font-medium mb-1">
                Title Tag <span className="text-xs text-gray-500">(60 chars max)</span>
              </label>
              <input
                type="text"
                id="seoSettings-seoTitle"
                name="seoTitle"
                value={seoTitle}
                onChange={handleChange}
                placeholder="Site Name | Page Title"
                className={`w-full p-2 border rounded ${errors.seoTitle ? 'border-red-500' : 'border-gray-300'}`}
                data-testid="seoSettings-seoTitle"
              />
              {errors.seoTitle && (
                <p className="mt-1 text-sm text-red-500" role="alert">
                  {errors.seoTitle}
                </p>
              )}
            </div>
            
            <div>
              <label htmlFor="seoSettings-seoDescription" className="block text-sm font-medium mb-1">
                Meta Description <span className="text-xs text-gray-500">(160 chars max)</span>
              </label>
              <textarea
                id="seoSettings-seoDescription"
                name="seoDescription"
                value={seoDescription}
                onChange={handleChange}
                rows={3}
                className={`w-full p-2 border rounded ${errors.seoDescription ? 'border-red-500' : 'border-gray-300'}`}
                data-testid="seoSettings-seoDescription"
              />
              {errors.seoDescription && (
                <p className="mt-1 text-sm text-red-500" role="alert">
                  {errors.seoDescription}
                </p>
              )}
            </div>
            
            <div>
              <label htmlFor="seoSettings-seoKeywords" className="block text-sm font-medium mb-1">
                Meta Keywords <span className="text-xs text-gray-500">(comma separated)</span>
              </label>
              <input
                type="text"
                id="seoSettings-seoKeywords"
                name="seoKeywords"
                value={seoKeywords}
                onChange={handleChange}
                placeholder="keyword1, keyword2, keyword3"
                className="w-full p-2 border border-gray-300 rounded"
                data-testid="seoSettings-seoKeywords"
              />
            </div>
          </div>
        </fieldset>
        
        {/* Social Media Section */}
        <fieldset className="mb-8 border p-4 rounded" disabled={isLoading}>
          <legend className="text-lg font-semibold px-2">Social Media</legend>
          
          <div className="space-y-4">
            <div>
              <label htmlFor="seoSettings-ogTitle" className="block text-sm font-medium mb-1">
                Open Graph Title
              </label>
              <input
                type="text"
                id="seoSettings-ogTitle"
                name="ogTitle"
                value={ogTitle}
                onChange={handleChange}
                placeholder="Title for social sharing"
                className="w-full p-2 border border-gray-300 rounded"
                data-testid="seoSettings-ogTitle"
              />
            </div>
            
            <div>
              <label htmlFor="seoSettings-ogDescription" className="block text-sm font-medium mb-1">
                Open Graph Description
              </label>
              <textarea
                id="seoSettings-ogDescription"
                name="ogDescription"
                value={ogDescription}
                onChange={handleChange}
                rows={3}
                className="w-full p-2 border border-gray-300 rounded"
                data-testid="seoSettings-ogDescription"
              />
            </div>
            
            <div>
              <label htmlFor="seoSettings-ogImage" className="block text-sm font-medium mb-1">
                Open Graph Image URL
              </label>
              <input
                type="url"
                id="seoSettings-ogImage"
                name="ogImage"
                value={ogImage}
                onChange={handleChange}
                placeholder="https://example.com/image.jpg"
                className="w-full p-2 border border-gray-300 rounded"
                data-testid="seoSettings-ogImage"
              />
            </div>
            
            <div>
              <label htmlFor="seoSettings-twitterCard" className="block text-sm font-medium mb-1">
                Twitter Card Type
              </label>
              <select
                id="seoSettings-twitterCard"
                name="twitterCard"
                value={twitterCard}
                onChange={handleChange}
                className="w-full p-2 border border-gray-300 rounded"
                data-testid="seoSettings-twitterCard"
              >
                {twitterCardOptions.map(option => (
                  <option key={option.id} value={option.id}>{option.name}</option>
                ))}
              </select>
            </div>
            
            <div>
              <label htmlFor="seoSettings-twitterSite" className="block text-sm font-medium mb-1">
                Twitter Site Handle
              </label>
              <input
                type="text"
                id="seoSettings-twitterSite"
                name="twitterSite"
                value={twitterSite}
                onChange={handleChange}
                placeholder="@yoursite"
                className={`w-full p-2 border rounded ${errors.twitterSite ? 'border-red-500' : 'border-gray-300'}`}
                data-testid="seoSettings-twitterSite"
              />
              {errors.twitterSite && (
                <p className="mt-1 text-sm text-red-500" role="alert">
                  {errors.twitterSite}
                </p>
              )}
            </div>
          </div>
        </fieldset>
        
        {/* Technical SEO Section */}
        <fieldset className="mb-8 border p-4 rounded" disabled={isLoading}>
          <legend className="text-lg font-semibold px-2">Technical SEO</legend>
          
          <div className="space-y-4">
            <div className="flex items-center">
              <input
                type="checkbox"
                id="seoSettings-enableCanonicalUrls"
                name="enableCanonicalUrls"
                checked={enableCanonicalUrls}
                onChange={handleChange}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                data-testid="seoSettings-enableCanonicalUrls"
              />
              <label htmlFor="seoSettings-enableCanonicalUrls" className="ml-2 block text-sm font-medium">
                Enable canonical URLs
              </label>
            </div>
            
            {/* Noindex Pages Management */}
            <div>
              <h3 className="text-md font-medium mb-2">Noindex Pages</h3>
              
              <div className="flex items-center mb-2">
                <input
                  type="text"
                  id="seoSettings-newNoindexPage"
                  name="newNoindexPage"
                  value={newNoindexPage}
                  onChange={handleChange}
                  placeholder="/path/to/exclude"
                  className={`flex-grow p-2 border rounded ${errors.newNoindexPage ? 'border-red-500' : 'border-gray-300'}`}
                  data-testid="seoSettings-newNoindexPage"
                />
                <button
                  type="button"
                  onClick={addNoindexPage}
                  className="ml-2 px-4 py-2 bg-blue-100 hover:bg-blue-200 rounded flex-shrink-0"
                  data-testid="seoSettings-addNoindexPage"
                >
                  Add
                </button>
              </div>
              
              {errors.newNoindexPage && (
                <p className="mt-1 text-sm text-red-500" role="alert">
                  {errors.newNoindexPage}
                </p>
              )}
              
              {noindexPages.length > 0 ? (
                <ul className="mt-2 border rounded divide-y">
                  {noindexPages.map((path, index) => (
                    <li key={path} className="flex justify-between items-center p-2 hover:bg-gray-50">
                      <span data-testid={`seoSettings-noindexPage-${index}`}>{path}</span>
                      <button
                        type="button"
                        onClick={() => removeNoindexPage(path)}
                        className="text-red-500 hover:text-red-700 p-1"
                        aria-label={`Remove path ${path}`}
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                        </svg>
                      </button>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-gray-500 italic">No pages excluded from indexing</p>
              )}
            </div>
            
            {/* Structured Data */}
            <div>
              <label htmlFor="seoSettings-structuredData" className="block text-sm font-medium mb-1">
                Structured Data (JSON-LD)
              </label>
              <textarea
                id="seoSettings-structuredData"
                name="structuredData"
                value={structuredData}
                onChange={handleChange}
                rows={5}
                placeholder='{"@context": "https://schema.org", "@type": "Organization", ...}'
                className={`w-full p-2 border rounded font-mono text-sm ${errors.structuredData ? 'border-red-500' : 'border-gray-300'}`}
                data-testid="seoSettings-structuredData"
              />
              {errors.structuredData && (
                <p className="mt-1 text-sm text-red-500" role="alert">
                  {errors.structuredData}
                </p>
              )}
              <p className="text-sm text-gray-600 mt-1">
                Enter JSON-LD structured data to be added to the site's head.
              </p>
            </div>
            
            {/* Robots.txt */}
            <div>
              <label htmlFor="seoSettings-robotsTxt" className="block text-sm font-medium mb-1">
                Custom robots.txt Content
              </label>
              <textarea
                id="seoSettings-robotsTxt"
                name="robotsTxt"
                value={robotsTxt}
                onChange={handleChange}
                rows={5}
                placeholder="User-agent: *&#10;Disallow: /admin/&#10;Allow: /"
                className="w-full p-2 border border-gray-300 rounded font-mono text-sm"
                data-testid="seoSettings-robotsTxt"
              />
              <p className="text-sm text-gray-600 mt-1">
                Leave blank to use default robots.txt.
              </p>
            </div>
          </div>
        </fieldset>
        
        {/* Form Actions */}
        <div className="flex justify-end space-x-3 mt-8">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded"
            data-testid="seoSettings-cancel"
            disabled={isLoading}
          >
            Cancel
          </button>
          <button
            type="submit"
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded disabled:opacity-50"
            data-testid="seoSettings-submit"
            disabled={isLoading}
          >
            {isLoading ? (
              <span data-testid="seoSettings-submit-loading">
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white inline" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Saving...
              </span>
            ) : (
              'Save Settings'
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default SEOSettings;
