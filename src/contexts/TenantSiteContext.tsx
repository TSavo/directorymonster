import React, { createContext, useState, useEffect, useContext, ReactNode } from 'react';

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
interface TenantSiteContextType {
  currentTenantId: string | null;
  currentSiteId: string | null;
  setCurrentTenantId: (id: string | null) => void;
  setCurrentSiteId: (id: string | null) => void;
  hasMultipleTenants: boolean;
  hasMultipleSites: boolean;
  tenants: Tenant[];
  sites: Site[];
  loading: boolean;
}

// Create the context with default values
const TenantSiteContext = createContext<TenantSiteContextType>({
  currentTenantId: null,
  currentSiteId: null,
  setCurrentTenantId: () => {},
  setCurrentSiteId: () => {},
  hasMultipleTenants: false,
  hasMultipleSites: false,
  tenants: [],
  sites: [],
  loading: true
});

// Function to fetch user tenants (will be replaced with actual API call)
const fetchUserTenants = async (userId: string): Promise<Tenant[]> => {
  // This is a placeholder - in a real implementation, this would call an API
  // For testing purposes, we'll return some mock data
  return [
    { id: 'tenant-1', name: 'Tenant 1' },
    { id: 'tenant-2', name: 'Tenant 2' },
    { id: 'public', name: 'Public Tenant' }
  ];
};

// Function to fetch tenant sites (will be replaced with actual API call)
const fetchTenantSites = async (tenantId: string): Promise<Site[]> => {
  // This is a placeholder - in a real implementation, this would call an API
  // For testing purposes, we'll return some mock data based on the tenant ID
  if (tenantId === 'tenant-1') {
    return [
      { id: 'site-1', name: 'Site 1', tenantId: 'tenant-1' },
      { id: 'site-2', name: 'Site 2', tenantId: 'tenant-1' }
    ];
  } else if (tenantId === 'tenant-2') {
    return [
      { id: 'site-3', name: 'Site 3', tenantId: 'tenant-2' },
      { id: 'site-4', name: 'Site 4', tenantId: 'tenant-2' },
      { id: 'site-5', name: 'Site 5', tenantId: 'tenant-2' }
    ];
  }
  return [];
};

// Provider component
export function TenantSiteProvider({ children }: { children: ReactNode }) {
  const [currentTenantId, setCurrentTenantId] = useState<string | null>(null);
  const [currentSiteId, setCurrentSiteId] = useState<string | null>(null);
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [sites, setSites] = useState<Site[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasMultipleTenants, setHasMultipleTenants] = useState(false);
  const [hasMultipleSites, setHasMultipleSites] = useState(false);

  // Load user's tenants on initial render
  useEffect(() => {
    const loadTenants = async () => {
      setLoading(true);
      try {
        // In a real implementation, we would get the user ID from auth context
        const userId = 'current-user';
        const fetchedTenants = await fetchUserTenants(userId);

        // Filter out the public tenant for editing purposes
        const editableTenants = fetchedTenants.filter(t => t.id !== 'public');
        setTenants(editableTenants);

        // Determine if user has access to multiple tenants
        setHasMultipleTenants(editableTenants.length > 1);

        // Set current tenant from storage or use first available
        const savedTenantId = localStorage.getItem('currentTenantId');
        const initialTenantId = savedTenantId && editableTenants.some(t => t.id === savedTenantId)
          ? savedTenantId
          : editableTenants[0]?.id || null;

        if (initialTenantId) {
          setCurrentTenantId(initialTenantId);
          // Load sites for the selected tenant
          const fetchedSites = await fetchTenantSites(initialTenantId);
          setSites(fetchedSites);
          setHasMultipleSites(fetchedSites.length > 1);

          // Set current site from storage or default to first site
          const savedSiteId = localStorage.getItem(`${initialTenantId}_currentSiteId`);
          if (savedSiteId && fetchedSites.some(s => s.id === savedSiteId)) {
            setCurrentSiteId(savedSiteId);
          } else if (fetchedSites.length > 0) {
            setCurrentSiteId(fetchedSites[0].id);
          }
        }
      } catch (error) {
        console.error('Error loading tenants:', error);
      } finally {
        setLoading(false);
      }
    };

    loadTenants();
  }, []);

  // Update sites when tenant changes
  useEffect(() => {
    if (currentTenantId) {
      const loadSites = async () => {
        setLoading(true);
        try {
          const fetchedSites = await fetchTenantSites(currentTenantId);
          setSites(fetchedSites);
          setHasMultipleSites(fetchedSites.length > 1);

          // Check if current site selection is valid for new tenant
          const savedSiteId = localStorage.getItem(`${currentTenantId}_currentSiteId`);
          if (savedSiteId && fetchedSites.some(s => s.id === savedSiteId)) {
            setCurrentSiteId(savedSiteId);
          } else if (fetchedSites.length > 0) {
            setCurrentSiteId(fetchedSites[0].id);
          } else {
            setCurrentSiteId(null);
          }
        } catch (error) {
          console.error('Error loading sites:', error);
        } finally {
          setLoading(false);
        }
      };

      loadSites();

      // Save tenant selection
      localStorage.setItem('currentTenantId', currentTenantId);
    }
  }, [currentTenantId]);

  // Save site selection when it changes
  useEffect(() => {
    if (currentTenantId && currentSiteId) {
      localStorage.setItem(`${currentTenantId}_currentSiteId`, currentSiteId);
    }
  }, [currentTenantId, currentSiteId]);

  return (
    <TenantSiteContext.Provider
      value={{
        currentTenantId,
        currentSiteId,
        setCurrentTenantId,
        setCurrentSiteId,
        hasMultipleTenants,
        hasMultipleSites,
        tenants,
        sites,
        loading
      }}
    >
      {children}
    </TenantSiteContext.Provider>
  );
}

// Hook to use the context
export function useTenantSite() {
  return useContext(TenantSiteContext);
}
