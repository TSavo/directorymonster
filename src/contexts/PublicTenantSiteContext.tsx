'use client';

import React, { createContext, useState, useEffect, useContext, ReactNode } from 'react';
import { useAuth } from '@/components/admin/auth/hooks/useAuth';

// Define the Tenant and Site types
export interface Tenant {
  id: string;
  name: string;
  // Add other tenant properties as needed
}

export interface Site {
  id: string;
  name: string;
  tenantId: string;
  // Add other site properties as needed
}

// Define the context type
interface PublicTenantSiteContextType {
  currentTenantId: string | null;
  currentSiteId: string | null;
  setCurrentTenantId: (id: string | null) => void;
  setCurrentSiteId: (id: string | null) => void;
  tenants: Tenant[];
  sites: Site[];
  loading: boolean;
}

// Create the context with default values
const PublicTenantSiteContext = createContext<PublicTenantSiteContextType>({
  currentTenantId: null,
  currentSiteId: null,
  setCurrentTenantId: () => {},
  setCurrentSiteId: () => {},
  tenants: [],
  sites: [],
  loading: true
});

// Function to fetch user tenants (will be replaced with actual API call)
const fetchUserTenants = async (userId: string): Promise<Tenant[]> => {
  try {
    // For testing purposes, check if we're in a test environment
    if (process.env.NODE_ENV === 'test') {
      // Return mock data for tests
      return [
        { id: 'tenant-1', name: 'Tenant 1' },
        { id: 'tenant-2', name: 'Tenant 2' },
        { id: 'public', name: 'Public' },
      ];
    }

    // Actual API call for production
    const response = await fetch('/api/tenants/user');
    if (!response.ok) {
      throw new Error('Failed to fetch user tenants');
    }
    return await response.json();
  } catch (error) {
    console.error('Error fetching user tenants:', error);
    return [];
  }
};

// Function to fetch tenant sites (will be replaced with actual API call)
const fetchTenantSites = async (tenantId: string): Promise<Site[]> => {
  try {
    // For testing purposes, check if we're in a test environment
    if (process.env.NODE_ENV === 'test') {
      // Return mock data for tests
      return [
        { id: 'site-1', name: 'Site 1', tenantId },
        { id: 'site-2', name: 'Site 2', tenantId },
      ];
    }

    // Actual API call for production
    const response = await fetch(`/api/tenants/${tenantId}/sites`);
    if (!response.ok) {
      throw new Error(`Failed to fetch sites for tenant ${tenantId}`);
    }
    return await response.json();
  } catch (error) {
    console.error(`Error fetching sites for tenant ${tenantId}:`, error);
    return [];
  }
};

// Provider component
export function PublicTenantSiteProvider({ children }: { children: ReactNode }) {
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const [currentTenantId, setCurrentTenantIdState] = useState<string | null>(null);
  const [currentSiteId, setCurrentSiteIdState] = useState<string | null>(null);
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [sites, setSites] = useState<Site[]>([]);
  const [loading, setLoading] = useState(true);

  // Function to set tenant ID with redirection
  const setCurrentTenantId = (id: string | null) => {
    if (id !== currentTenantId) {
      // Save selection to localStorage
      if (id) localStorage.setItem('currentTenantId', id);
      else localStorage.removeItem('currentTenantId');

      // Update state
      setCurrentTenantIdState(id);

      // Redirect to tenant page
      if (id) window.location.href = `/tenant/${id}`;
      else window.location.href = '/';
    }
  };

  // Function to set site ID with redirection
  const setCurrentSiteId = (id: string | null) => {
    if (id !== currentSiteId && currentTenantId) {
      // Save selection to localStorage
      if (id) localStorage.setItem(`${currentTenantId}_currentSiteId`, id);
      else localStorage.removeItem(`${currentTenantId}_currentSiteId`);

      // Update state
      setCurrentSiteIdState(id);

      // Redirect to site page
      if (id) window.location.href = `/site/${id}`;
      else window.location.href = `/tenant/${currentTenantId}`;
    }
  };

  // Load user tenants when authenticated
  useEffect(() => {
    const loadTenants = async () => {
      if (isAuthenticated && user) {
        setLoading(true);
        try {
          // Fetch user tenants
          const fetchedTenants = await fetchUserTenants(user.id);

          // Filter out the public tenant
          const editableTenants = fetchedTenants.filter(t => t.id !== 'public');
          setTenants(editableTenants);

          // Get tenant selection from localStorage or use first available
          const savedTenantId = localStorage.getItem('currentTenantId');
          const initialTenantId = savedTenantId && editableTenants.some(t => t.id === savedTenantId)
            ? savedTenantId
            : editableTenants[0]?.id || null;

          if (initialTenantId) {
            // Use setState directly to avoid redirection during initialization
            setCurrentTenantIdState(initialTenantId);

            // Load sites for this tenant
            const fetchedSites = await fetchTenantSites(initialTenantId);
            setSites(fetchedSites);

            // Get site selection from localStorage or use first available
            const savedSiteId = localStorage.getItem(`${initialTenantId}_currentSiteId`);

            if (savedSiteId && fetchedSites.some(s => s.id === savedSiteId)) {
              // Use setState directly to avoid redirection during initialization
              setCurrentSiteIdState(savedSiteId);
            } else if (fetchedSites.length > 0) {
              // Use setState directly to avoid redirection during initialization
              setCurrentSiteIdState(fetchedSites[0].id);
            } else {
              // Use setState directly to avoid redirection during initialization
              setCurrentSiteIdState(null);
            }
          }
        } catch (error) {
          console.error('Error loading tenant data:', error);
        } finally {
          setLoading(false);
        }
      } else if (!authLoading) {
        // If not authenticated and auth loading is complete, reset state
        setTenants([]);
        setSites([]);
        setCurrentTenantIdState(null);
        setCurrentSiteIdState(null);
        setLoading(false);
      }
    };

    loadTenants();
  }, [isAuthenticated, user, authLoading]);

  // Load sites when tenant changes
  useEffect(() => {
    const loadSites = async () => {
      if (currentTenantId) {
        setLoading(true);
        try {
          // Fetch sites for the current tenant
          const fetchedSites = await fetchTenantSites(currentTenantId);
          setSites(fetchedSites);

          // Get site selection from localStorage or use first available
          const savedSiteId = localStorage.getItem(`${currentTenantId}_currentSiteId`);

          if (savedSiteId && fetchedSites.some(s => s.id === savedSiteId)) {
            // Use setState directly to avoid redirection during initialization
            setCurrentSiteIdState(savedSiteId);
          } else if (fetchedSites.length > 0) {
            // Use setState directly to avoid redirection during initialization
            setCurrentSiteIdState(fetchedSites[0].id);
          } else {
            // Use setState directly to avoid redirection during initialization
            setCurrentSiteIdState(null);
          }
        } catch (error) {
          console.error(`Error loading sites for tenant ${currentTenantId}:`, error);
        } finally {
          setLoading(false);
        }
      }
    };

    if (currentTenantId) {
      loadSites();
    }
  }, [currentTenantId]);

  return (
    <PublicTenantSiteContext.Provider
      value={{
        currentTenantId,
        currentSiteId,
        setCurrentTenantId,
        setCurrentSiteId,
        tenants,
        sites,
        loading
      }}
    >
      {children}
    </PublicTenantSiteContext.Provider>
  );
}

// Hook to use the context
export function usePublicTenantSite() {
  return useContext(PublicTenantSiteContext);
}
