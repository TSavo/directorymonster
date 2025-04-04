'use client';

import { SiteFormErrors } from '@/components/admin/sites/components/common/SiteFormValidator';

export interface SiteFormData {
  name: string;
  slug: string;
  description?: string;
  [key: string]: any;
}

/**
 * Validates the basic info step of the site form
 * 
 * @param formData - The form data to validate
 * @returns An object with validation errors
 */
export const validateBasicInfo = (formData: SiteFormData): SiteFormErrors => {
  const errors: SiteFormErrors = {};
  
  // Validate name
  if (!formData.name?.trim()) {
    errors.name = 'Site name is required';
  } else if (formData.name.length > 50) {
    errors.name = 'Site name cannot exceed 50 characters';
  }
  
  // Validate slug
  if (!formData.slug?.trim()) {
    errors.slug = 'Slug is required';
  } else if (!/^[a-z0-9-]+$/.test(formData.slug)) {
    errors.slug = 'Slug can only contain lowercase letters, numbers, and hyphens';
  } else if (formData.slug.length > 50) {
    errors.slug = 'Slug cannot exceed 50 characters';
  }
  
  // Validate description (optional)
  if (formData.description && formData.description.length > 500) {
    errors.description = 'Description cannot exceed 500 characters';
  }
  
  return errors;
};

/**
 * Validates the domains step of the site form
 * 
 * @param formData - The form data to validate
 * @returns An object with validation errors
 */
export const validateDomains = (formData: SiteFormData): SiteFormErrors => {
  const errors: SiteFormErrors = {};
  
  // Validate domains
  if (!formData.domains || !Array.isArray(formData.domains) || formData.domains.length === 0) {
    errors.domains = 'At least one domain is required';
  } else {
    // Validate each domain
    const invalidDomains = formData.domains.filter(domain => {
      return !domain || !/^[a-z0-9]+([\-\.]{1}[a-z0-9]+)*\.[a-z]{2,}$/i.test(domain);
    });
    
    if (invalidDomains.length > 0) {
      errors.domains = 'One or more domains are invalid';
    }
  }
  
  return errors;
};

/**
 * Validates the settings step of the site form
 * 
 * @param formData - The form data to validate
 * @returns An object with validation errors
 */
export const validateSettings = (formData: SiteFormData): SiteFormErrors => {
  const errors: SiteFormErrors = {};
  
  // Validate contact email
  if (formData.contactEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.contactEmail)) {
    errors.contactEmail = 'Please enter a valid email address';
  }
  
  // Validate listings per page
  if (formData.listingsPerPage !== undefined) {
    const listingsPerPage = Number(formData.listingsPerPage);
    if (isNaN(listingsPerPage) || listingsPerPage <= 0 || listingsPerPage > 100) {
      errors.listingsPerPage = 'Listings per page must be between 1 and 100';
    }
  }
  
  return errors;
};

/**
 * Validates the entire site form
 * 
 * @param formData - The form data to validate
 * @returns An object with validation errors
 */
export const validateSiteForm = (formData: SiteFormData): SiteFormErrors => {
  return {
    ...validateBasicInfo(formData),
    ...validateDomains(formData),
    ...validateSettings(formData)
  };
};
