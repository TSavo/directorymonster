"use client";

import { useState, useCallback, useEffect } from 'react';
import { useNotifications } from '@/components/notifications/hooks/useNotifications';
import {
  SiteData,
  SiteFilters,
  SiteErrors,
  UseSitesOptions,
  UseSitesReturn
} from './types';
import { validateSite } from './validation';
import {
  fetchSite as apiFetchSite,
  fetchSites as apiFetchSites,
  createSite as apiCreateSite,
  updateSite as apiUpdateSite,
  deleteSite as apiDeleteSite
} from './api';

/**
 * useSites - Hook for managing site data
 *
 * Provides functionality for creating, editing, and listing sites
 *
 * @param options - Configuration options
 * @returns Site management utilities
 */
export const useSites = (options: UseSitesOptions = {}): UseSitesReturn => {
  const {
    initialData = {
      name: '',
      slug: '',
      domains: [],
      theme: 'default'
    },
    apiEndpoint = '/api/sites',
    defaultFilters = {
      search: '',
      sortBy: 'name',
      sortOrder: 'asc',
      page: 1,
      limit: 10
    },
    useNotificationsSystem = true
  } = options;

  // Get notification functions if enabled
  const notificationSystem = useNotifications();

  // Single site state
  const [site, setSite] = useState<SiteData>(initialData);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [errors, setErrors] = useState<SiteErrors>({});

  // Multiple sites state
  const [sites, setSites] = useState<SiteData[]>([]);
  const [filteredSites, setFilteredSites] = useState<SiteData[]>([]);
  const [totalSites, setTotalSites] = useState<number>(0);
  const [filters, setFilters] = useState<SiteFilters>(defaultFilters);

  // Update site field
  const updateSite = useCallback((field: string, value: any) => {
    setSite(prev => ({ ...prev, [field]: value }));

    // Clear error for updated field
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  }, [errors]);

  // Validate site data
  const validateSiteCallback = useCallback((section?: string): boolean => {
    const { errors: validationErrors, isValid } = validateSite(site, section);
    setErrors(validationErrors);
    return isValid;
  }, [site]);

  // Reset errors
  const resetErrors = useCallback(() => {
    setErrors({});
    setError(null);
  }, []);

  // Fetch a single site by ID
  const fetchSite = useCallback(async (id: string): Promise<SiteData | null> => {
    setIsLoading(true);
    setError(null);

    try {
      const result = await apiFetchSite(apiEndpoint, id);

      if (result) {
        return result;
      } else {
        throw new Error('Failed to fetch site');
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred while fetching site');
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [apiEndpoint]);

  // Fetch all sites with filters
  const fetchSites = useCallback(async (): Promise<SiteData[]> => {
    setIsLoading(true);
    setError(null);

    try {
      const result = await apiFetchSites(apiEndpoint, filters);

      setSites(result.sites);
      setFilteredSites(result.sites);
      setTotalSites(result.total);
      return result.sites;
    } catch (err: any) {
      setError(err.message || 'An error occurred while fetching sites');
      return [];
    } finally {
      setIsLoading(false);
    }
  }, [apiEndpoint, filters]);

  // Note: refreshSites method has been removed - use fetchSites directly instead

  // Create a new site
  const createSite = useCallback(async () => {
    // Validate all sections
    if (!validateSiteCallback()) {
      return { success: false };
    }

    setIsLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const result = await apiCreateSite(apiEndpoint, site);

      if (result.success) {
        setSuccess('Site created successfully');

        // Show success notification if notification system is enabled
        if (useNotificationsSystem) {
          notificationSystem.showNotification({
            type: 'success',
            title: 'Site Created',
            message: 'Your site has been created successfully',
            duration: 5000
          });
        }
      } else {
        throw new Error(result.error?.message || 'Failed to create site');
      }

      return result;
    } catch (err: any) {
      const errorMessage = err.message || 'An error occurred while creating site';
      setError(errorMessage);

      // Show error notification if notification system is enabled
      if (useNotificationsSystem) {
        notificationSystem.showNotification({
          type: 'error',
          title: 'Site Creation Failed',
          message: errorMessage,
          duration: 5000
        });
      }

      return { success: false, error: err };
    } finally {
      setIsLoading(false);
    }
  }, [apiEndpoint, site, validateSiteCallback, useNotificationsSystem, notificationSystem]);

  // Save an existing site
  const saveSite = useCallback(async (id?: string) => {
    // Validate all sections
    if (!validateSiteCallback()) {
      return { success: false };
    }

    setIsLoading(true);
    setError(null);
    setSuccess(null);

    const siteId = id || site.id;

    if (!siteId) {
      const errorMessage = 'Site ID is required for saving';
      setError(errorMessage);
      setIsLoading(false);

      // Show error notification if notification system is enabled
      if (useNotificationsSystem) {
        notificationSystem.showNotification({
          type: 'error',
          title: 'Site Update Failed',
          message: errorMessage,
          duration: 5000
        });
      }

      return { success: false, error: new Error(errorMessage) };
    }

    try {
      const result = await apiUpdateSite(apiEndpoint, siteId, site);

      if (result.success) {
        setSuccess('Site updated successfully');

        // Show success notification if notification system is enabled
        if (useNotificationsSystem) {
          notificationSystem.showNotification({
            type: 'success',
            title: 'Site Updated',
            message: 'Your site has been updated successfully',
            duration: 5000
          });
        }
      } else {
        throw new Error(result.error?.message || 'Failed to update site');
      }

      return result;
    } catch (err: any) {
      const errorMessage = err.message || 'An error occurred while updating site';
      setError(errorMessage);

      // Show error notification if notification system is enabled
      if (useNotificationsSystem) {
        notificationSystem.showNotification({
          type: 'error',
          title: 'Site Update Failed',
          message: errorMessage,
          duration: 5000
        });
      }

      return { success: false, error: err };
    } finally {
      setIsLoading(false);
    }
  }, [apiEndpoint, site, validateSiteCallback, useNotificationsSystem, notificationSystem]);

  // Delete a site
  const deleteSite = useCallback(async (id: string) => {
    setIsLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const result = await apiDeleteSite(apiEndpoint, id);

      if (result.success) {
        setSuccess('Site deleted successfully');
        fetchSites(); // Refresh sites list after deletion

        // Show success notification if notification system is enabled
        if (useNotificationsSystem) {
          notificationSystem.showNotification({
            type: 'success',
            title: 'Site Deleted',
            message: 'Your site has been deleted successfully',
            duration: 5000
          });
        }
      } else {
        throw new Error(result.error?.message || 'Failed to delete site');
      }

      return result;
    } catch (err: any) {
      const errorMessage = err.message || 'An error occurred while deleting site';
      setError(errorMessage);

      // Show error notification if notification system is enabled
      if (useNotificationsSystem) {
        notificationSystem.showNotification({
          type: 'error',
          title: 'Site Deletion Failed',
          message: errorMessage,
          duration: 5000
        });
      }

      return { success: false, error: err };
    } finally {
      setIsLoading(false);
    }
  }, [apiEndpoint, fetchSites, useNotificationsSystem, notificationSystem]);

  return {
    // Single site state
    site,
    setSite,
    updateSite,
    isLoading,
    error,
    success,
    errors,

    // Site operations
    createSite,
    saveSite,
    deleteSite,

    // Form steps
    validateSite: validateSiteCallback,
    resetErrors,

    // Multiple sites state
    sites,
    filteredSites,
    totalSites,

    // Filtering and pagination
    filters,
    setFilters,

    // Loading and fetching
    fetchSite,
    fetchSites
  };
};

// Export types for convenience
export * from './types';

// Default export
export default useSites;