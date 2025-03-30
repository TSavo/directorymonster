"use client";

import { SiteData, SiteFilters } from './types';

/**
 * Fetches a single site by ID
 * 
 * @param apiEndpoint - API endpoint base URL
 * @param id - Site ID to fetch
 * @returns Promise resolving to site data or null on error
 */
export const fetchSite = async (
  apiEndpoint: string,
  id: string
): Promise<SiteData | null> => {
  try {
    const response = await fetch(`${apiEndpoint}/${id}`);
    const data = await response.json();
    
    if (response.ok) {
      return data;
    } else {
      throw new Error(data.error || 'Failed to fetch site');
    }
  } catch (err: any) {
    console.error('Error fetching site:', err);
    return null;
  }
};

/**
 * Fetches all sites with optional filtering
 * 
 * @param apiEndpoint - API endpoint base URL
 * @param filters - Filter criteria
 * @returns Promise resolving to array of sites
 */
export const fetchSites = async (
  apiEndpoint: string,
  filters: SiteFilters
): Promise<{ sites: SiteData[]; total: number }> => {
  try {
    // Build query string from filters
    const queryParams = new URLSearchParams();
    if (filters.search) queryParams.append('search', filters.search);
    if (filters.sortBy) queryParams.append('sortBy', filters.sortBy);
    if (filters.sortOrder) queryParams.append('sortOrder', filters.sortOrder);
    if (filters.page) queryParams.append('page', filters.page.toString());
    if (filters.limit) queryParams.append('limit', filters.limit.toString());
    
    const query = queryParams.toString() ? `?${queryParams.toString()}` : '';
    const response = await fetch(`${apiEndpoint}${query}`);
    const data = await response.json();
    
    if (response.ok) {
      return {
        sites: data.sites || [],
        total: data.total || data.sites?.length || 0
      };
    } else {
      throw new Error(data.error || 'Failed to fetch sites');
    }
  } catch (err: any) {
    console.error('Error fetching sites:', err);
    return { sites: [], total: 0 };
  }
};

/**
 * Creates a new site
 * 
 * @param apiEndpoint - API endpoint base URL
 * @param site - Site data to create
 * @returns Promise resolving to API response
 */
export const createSite = async (
  apiEndpoint: string,
  site: SiteData
): Promise<{ success: boolean; data?: any; error?: any }> => {
  try {
    const response = await fetch(apiEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(site)
    });
    
    const data = await response.json();
    
    if (response.ok) {
      return { success: true, data };
    } else {
      throw new Error(data.error || 'Failed to create site');
    }
  } catch (err: any) {
    console.error('Error creating site:', err);
    return { success: false, error: err };
  }
};

/**
 * Updates an existing site
 * 
 * @param apiEndpoint - API endpoint base URL
 * @param id - Site ID to update
 * @param site - Updated site data
 * @returns Promise resolving to API response
 */
export const updateSite = async (
  apiEndpoint: string,
  id: string,
  site: SiteData
): Promise<{ success: boolean; data?: any; error?: any }> => {
  try {
    const response = await fetch(`${apiEndpoint}/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(site)
    });
    
    const data = await response.json();
    
    if (response.ok) {
      return { success: true, data };
    } else {
      throw new Error(data.error || 'Failed to update site');
    }
  } catch (err: any) {
    console.error('Error updating site:', err);
    return { success: false, error: err };
  }
};

/**
 * Deletes a site
 * 
 * @param apiEndpoint - API endpoint base URL
 * @param id - Site ID to delete
 * @returns Promise resolving to API response
 */
export const deleteSite = async (
  apiEndpoint: string,
  id: string
): Promise<{ success: boolean; error?: any }> => {
  try {
    const response = await fetch(`${apiEndpoint}/${id}`, {
      method: 'DELETE'
    });
    
    if (response.ok) {
      return { success: true };
    } else {
      const data = await response.json();
      throw new Error(data.error || 'Failed to delete site');
    }
  } catch (err: any) {
    console.error('Error deleting site:', err);
    return { success: false, error: err };
  }
};