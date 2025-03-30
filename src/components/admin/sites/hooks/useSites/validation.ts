"use client";

import { SiteData, SiteErrors } from './types';

/**
 * Validates site data based on the specified section
 * 
 * @param site - Site data to validate
 * @param section - Optional section to validate (basic, domains, theme, seo, settings)
 * @returns Object with errors and isValid flag
 */
export const validateSite = (site: SiteData, section?: string): { errors: SiteErrors; isValid: boolean } => {
  const errors: SiteErrors = {};
  let isValid = true;
  
  // Basic Info validation
  if (!section || section === 'basic') {
    if (!site.name?.trim()) {
      errors.name = 'Name is required';
      isValid = false;
    } else if (site.name.length > 50) {
      errors.name = 'Name cannot exceed 50 characters';
      isValid = false;
    }
    
    if (!site.slug?.trim()) {
      errors.slug = 'Slug is required';
      isValid = false;
    } else if (!/^[a-z0-9-]+$/.test(site.slug)) {
      errors.slug = 'Slug can only contain lowercase letters, numbers, and hyphens';
      isValid = false;
    } else if (site.slug.length > 50) {
      errors.slug = 'Slug cannot exceed 50 characters';
      isValid = false;
    }
    
    if (site.description && site.description.length > 500) {
      errors.description = 'Description cannot exceed 500 characters';
      isValid = false;
    }
  }
  
  // Domain validation
  if (!section || section === 'domains') {
    if (!site.domains || site.domains.length === 0) {
      errors.domains = 'At least one domain is required';
      isValid = false;
    }
  }
  
  // Theme validation
  if (!section || section === 'theme') {
    if (site.customStyles) {
      try {
        // Simple check for balanced braces
        const openBraces = (site.customStyles.match(/{/g) || []).length;
        const closeBraces = (site.customStyles.match(/}/g) || []).length;
        
        if (openBraces !== closeBraces) {
          errors.customStyles = 'CSS syntax error: unbalanced braces';
          isValid = false;
        }
      } catch (err) {
        errors.customStyles = 'Invalid CSS syntax';
        isValid = false;
      }
    }
  }
  
  // SEO validation
  if (!section || section === 'seo') {
    if (site.seoTitle && site.seoTitle.length > 60) {
      errors.seoTitle = 'SEO title should be 60 characters or less';
      isValid = false;
    }
    
    if (site.seoDescription && site.seoDescription.length > 160) {
      errors.seoDescription = 'SEO description should be 160 characters or less';
      isValid = false;
    }
  }
  
  // Settings validation
  if (!section || section === 'settings') {
    if (site.listingsPerPage && (site.listingsPerPage <= 0 || site.listingsPerPage > 100)) {
      errors.listingsPerPage = 'Listings per page must be between 1 and 100';
      isValid = false;
    }
    
    if (site.contactEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(site.contactEmail)) {
      errors.contactEmail = 'Please enter a valid email address';
      isValid = false;
    }
  }
  
  return { errors, isValid };
};