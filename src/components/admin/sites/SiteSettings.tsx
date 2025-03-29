'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

/**
 * SiteSettings - Component for configuring site-specific settings
 * 
 * Features:
 * - Site visibility controls
 * - Theme and appearance settings
 * - Listing display options
 * - Access and permission settings
 * - API integration for saving settings
 * - Loading states and error handling
 */
export interface SiteSettingsProps {
  /**
   * Initial data for the site
   */
  initialData?: {
    id: string;
    name?: string;
    slug?: string;
    isPublic?: boolean;
    theme?: string;
    listingsPerPage?: number;
    enableCategories?: boolean;
    enableSearch?: boolean;
    enableUserRegistration?: boolean;
    maintenanceMode?: boolean;
    contactEmail?: string;
    customStyles?: string;
  };
  /**
   * Callback when settings are canceled
   */
  onCancel?: () => void;
  /**
   * Callback when settings are saved successfully
   */
  onSuccess?: (data: any) => void;
  /**
   * API endpoint for settings submission
   */
  apiEndpoint?: string;
}

export const SiteSettings: React.FC<SiteSettingsProps> = ({
  initialData = {
    id: '',
    isPublic: true,
    theme: 'default',
    listingsPerPage: 20,
    enableCategories: true,
    enableSearch: true,
    enableUserRegistration: false,
    maintenanceMode: false,
    customStyles: ''
  },
  onCancel,
  onSuccess,
  apiEndpoint = '/api/sites'
}) => {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  // Form state
  const [isPublic, setIsPublic] = useState<boolean>(initialData.isPublic !== undefined ? initialData.isPublic : true);
  const [theme, setTheme] = useState<string>(initialData.theme || 'default');
  const [listingsPerPage, setListingsPerPage] = useState<number>(initialData.listingsPerPage || 20);
  const [enableCategories, setEnableCategories] = useState<boolean>(initialData.enableCategories !== undefined ? initialData.enableCategories : true);
  const [enableSearch, setEnableSearch] = useState<boolean>(initialData.enableSearch !== undefined ? initialData.enableSearch : true);
  const [enableUserRegistration, setEnableUserRegistration] = useState<boolean>(initialData.enableUserRegistration || false);
  const [maintenanceMode, setMaintenanceMode] = useState<boolean>(initialData.maintenanceMode || false);
  const [contactEmail, setContactEmail] = useState<string>(initialData.contactEmail || '');
  const [customStyles, setCustomStyles] = useState<string>(initialData.customStyles || '');
  
  // Validation state
  const [errors, setErrors] = useState<{
    listingsPerPage?: string;
    contactEmail?: string;
    customStyles?: string;
  }>({});
  
  // Available themes
  const availableThemes = [
    { id: 'default', name: 'Default' },
    { id: 'light', name: 'Light' },
    { id: 'dark', name: 'Dark' },
    { id: 'blue', name: 'Blue' },
    { id: 'green', name: 'Green' }
  ];
  
  // Handle input changes
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      
      if (name === 'isPublic') setIsPublic(checked);
      if (name === 'enableCategories') setEnableCategories(checked);
      if (name === 'enableSearch') setEnableSearch(checked);
      if (name === 'enableUserRegistration') setEnableUserRegistration(checked);
      if (name === 'maintenanceMode') setMaintenanceMode(checked);
    } else {
      if (name === 'theme') setTheme(value);
      if (name === 'listingsPerPage') setListingsPerPage(parseInt(value, 10) || 0);
      if (name === 'contactEmail') setContactEmail(value);
      if (name === 'customStyles') setCustomStyles(value);
    }
    
    // Clear error when field is changed
    if (errors[name as keyof typeof errors]) {
      setErrors(prev => ({
        ...prev,
        [name]: undefined
      }));
    }
  };
  
  // Validation function
  const validateForm = (): boolean => {
    const newErrors: typeof errors = {};
    let isValid = true;
    
    // Validate listings per page
    if (listingsPerPage <= 0 || listingsPerPage > 100) {
      newErrors.listingsPerPage = 'Listings per page must be between 1 and 100';
      isValid = false;
    }
    
    // Validate contact email (if provided)
    if (contactEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contactEmail)) {
      newErrors.contactEmail = 'Please enter a valid email address';
      isValid = false;
    }
    
    // Validate custom styles (basic check for valid CSS)
    if (customStyles) {
      try {
        // Simple check for balanced braces
        const openBraces = (customStyles.match(/{/g) || []).length;
        const closeBraces = (customStyles.match(/}/g) || []).length;
        
        if (openBraces !== closeBraces) {
          newErrors.customStyles = 'CSS syntax error: unbalanced braces';
          isValid = false;
        }
      } catch (err) {
        newErrors.customStyles = 'Invalid CSS syntax';
        isValid = false;
      }
    }
    
    setErrors(newErrors);
    return isValid;
  };
  
  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate form before submission
    if (!validateForm()) {
      return;
    }
    
    setIsLoading(true);
    setError(null);
    setSuccess(null);
    
    try {
      // Prepare settings data
      const settingsData = {
        id: initialData.id,
        name: initialData.name,
        slug: initialData.slug,
        isPublic,
        theme,
        listingsPerPage,
        enableCategories,
        enableSearch,
        enableUserRegistration,
        maintenanceMode,
        contactEmail,
        customStyles
      };
      
      // Submit settings data
      const response = await fetch(`${apiEndpoint}/${initialData.id}/settings`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(settingsData)
      });
      
      const result = await response.json();
      
      if (response.ok) {
        setSuccess('Site settings updated successfully');
        
        // Call success callback if provided
        if (onSuccess) {
          onSuccess(result);
        }
      } else {
        throw new Error(result.error || 'An error occurred');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to save settings');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-3xl mx-auto p-6 bg-white rounded shadow">
      <h1 
        id="siteSettings-header" 
        className="text-xl font-bold mb-6"
        data-testid="siteSettings-header"
      >
        Site Settings
      </h1>
      
      {/* Site name and ID info */}
      {initialData.name && (
        <div className="mb-6">
          <h2 className="text-lg font-semibold">{initialData.name}</h2>
          <p className="text-gray-600 text-sm">ID: {initialData.id}</p>
          {initialData.slug && <p className="text-gray-600 text-sm">Slug: {initialData.slug}</p>}
        </div>
      )}
      
      {/* Error message */}
      {error && (
        <div 
          className="mb-4 p-3 bg-red-100 text-red-700 rounded" 
          role="alert"
          data-testid="siteSettings-error"
        >
          {error}
        </div>
      )}
      
      {/* Success message */}
      {success && (
        <div 
          className="mb-4 p-3 bg-green-100 text-green-700 rounded" 
          role="alert"
          data-testid="siteSettings-success"
        >
          {success}
        </div>
      )}
      
      <form 
        onSubmit={handleSubmit} 
        role="form" 
        aria-labelledby="siteSettings-header"
        data-testid="siteSettings-form"
      >
        {/* Site Visibility Settings */}
        <fieldset 
          className="mb-8 border p-4 rounded" 
          disabled={isLoading}
          data-testid="siteSettings-visibility-fieldset"
        >
          <legend className="text-lg font-semibold px-2">Site Visibility</legend>
          
          <div className="space-y-4">
            {/* Public/Private toggle */}
            <div className="flex items-center">
              <input
                type="checkbox"
                id="siteSettings-isPublic"
                name="isPublic"
                checked={isPublic}
                onChange={handleChange}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                data-testid="siteSettings-isPublic"
              />
              <label 
                htmlFor="siteSettings-isPublic" 
                className="ml-2 block text-sm font-medium"
              >
                Site is publicly visible
              </label>
            </div>
            
            {/* Maintenance mode toggle */}
            <div className="flex items-center">
              <input
                type="checkbox"
                id="siteSettings-maintenanceMode"
                name="maintenanceMode"
                checked={maintenanceMode}
                onChange={handleChange}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                data-testid="siteSettings-maintenanceMode"
              />
              <label 
                htmlFor="siteSettings-maintenanceMode" 
                className="ml-2 block text-sm font-medium"
              >
                Enable maintenance mode
              </label>
            </div>
            
            <p className="text-sm text-gray-600">
              Maintenance mode shows a maintenance page to visitors while allowing administrators to access the site.
            </p>
          </div>
        </fieldset>
        
        {/* Appearance Settings */}
        <fieldset 
          className="mb-8 border p-4 rounded" 
          disabled={isLoading}
          data-testid="siteSettings-appearance-fieldset"
        >
          <legend className="text-lg font-semibold px-2">Appearance</legend>
          
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
                value={theme}
                onChange={handleChange}
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
                value={customStyles}
                onChange={handleChange}
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
        
        {/* Content Settings */}
        <fieldset 
          className="mb-8 border p-4 rounded" 
          disabled={isLoading}
          data-testid="siteSettings-content-fieldset"
        >
          <legend className="text-lg font-semibold px-2">Content Display</legend>
          
          <div className="space-y-4">
            {/* Listings per page */}
            <div>
              <label 
                htmlFor="siteSettings-listingsPerPage" 
                className="block text-sm font-medium mb-1"
              >
                Listings per page
              </label>
              <input
                type="number"
                id="siteSettings-listingsPerPage"
                name="listingsPerPage"
                value={listingsPerPage}
                onChange={handleChange}
                min="1"
                max="100"
                className={`w-full sm:w-40 p-2 border rounded focus:ring-2 focus:border-blue-500 ${errors.listingsPerPage ? 'border-red-500' : 'border-gray-300'}`}
                aria-invalid={errors.listingsPerPage ? "true" : "false"}
                aria-describedby={errors.listingsPerPage ? "siteSettings-listingsPerPage-error" : undefined}
                data-testid="siteSettings-listingsPerPage"
              />
              {errors.listingsPerPage && (
                <p 
                  className="mt-1 text-sm text-red-500" 
                  role="alert" 
                  id="siteSettings-listingsPerPage-error"
                  data-testid="siteSettings-listingsPerPage-error"
                >
                  {errors.listingsPerPage}
                </p>
              )}
            </div>
            
            {/* Enable categories */}
            <div className="flex items-center">
              <input
                type="checkbox"
                id="siteSettings-enableCategories"
                name="enableCategories"
                checked={enableCategories}
                onChange={handleChange}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                data-testid="siteSettings-enableCategories"
              />
              <label 
                htmlFor="siteSettings-enableCategories" 
                className="ml-2 block text-sm font-medium"
              >
                Enable categories
              </label>
            </div>
            
            {/* Enable search */}
            <div className="flex items-center">
              <input
                type="checkbox"
                id="siteSettings-enableSearch"
                name="enableSearch"
                checked={enableSearch}
                onChange={handleChange}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                data-testid="siteSettings-enableSearch"
              />
              <label 
                htmlFor="siteSettings-enableSearch" 
                className="ml-2 block text-sm font-medium"
              >
                Enable search functionality
              </label>
            </div>
          </div>
        </fieldset>
        
        {/* User Access Settings */}
        <fieldset 
          className="mb-8 border p-4 rounded" 
          disabled={isLoading}
          data-testid="siteSettings-access-fieldset"
        >
          <legend className="text-lg font-semibold px-2">User Access</legend>
          
          <div className="space-y-4">
            {/* User registration */}
            <div className="flex items-center">
              <input
                type="checkbox"
                id="siteSettings-enableUserRegistration"
                name="enableUserRegistration"
                checked={enableUserRegistration}
                onChange={handleChange}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                data-testid="siteSettings-enableUserRegistration"
              />
              <label 
                htmlFor="siteSettings-enableUserRegistration" 
                className="ml-2 block text-sm font-medium"
              >
                Allow user registration
              </label>
            </div>
            
            <p className="text-sm text-gray-600">
              When enabled, visitors can create accounts and log in to your site.
            </p>
            
            {/* Contact email */}
            <div>
              <label 
                htmlFor="siteSettings-contactEmail" 
                className="block text-sm font-medium mb-1"
              >
                Contact Email
              </label>
              <input
                type="email"
                id="siteSettings-contactEmail"
                name="contactEmail"
                value={contactEmail}
                onChange={handleChange}
                placeholder="admin@example.com"
                className={`w-full p-2 border rounded focus:ring-2 focus:border-blue-500 ${errors.contactEmail ? 'border-red-500' : 'border-gray-300'}`}
                aria-invalid={errors.contactEmail ? "true" : "false"}
                aria-describedby={errors.contactEmail ? "siteSettings-contactEmail-error" : undefined}
                data-testid="siteSettings-contactEmail"
              />
              {errors.contactEmail && (
                <p 
                  className="mt-1 text-sm text-red-500" 
                  role="alert" 
                  id="siteSettings-contactEmail-error"
                  data-testid="siteSettings-contactEmail-error"
                >
                  {errors.contactEmail}
                </p>
              )}
              <p className="text-sm text-gray-600 mt-1">
                This email will be displayed on the contact page and used for system notifications.
              </p>
            </div>
          </div>
        </fieldset>
        
        <div className="flex justify-end space-x-3 mt-8">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded focus:outline-none focus:ring-2"
            data-testid="siteSettings-cancel"
            disabled={isLoading}
          >
            Cancel
          </button>
          <button
            type="submit"
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded focus:outline-none focus:ring-2 disabled:opacity-50"
            data-testid="siteSettings-submit"
            disabled={isLoading}
          >
            {isLoading ? (
              <span data-testid="siteSettings-submit-loading">
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

export default SiteSettings;
