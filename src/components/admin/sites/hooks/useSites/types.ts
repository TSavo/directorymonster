"use client";

export interface SiteData {
  id?: string;
  name: string;
  slug: string;
  description?: string;
  domains: string[];
  isPublic?: boolean;
  theme?: string;
  customStyles?: string;
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
  listingsPerPage?: number;
  enableCategories?: boolean;
  enableSearch?: boolean;
  enableUserRegistration?: boolean;
  maintenanceMode?: boolean;
  contactEmail?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface SiteFilters {
  search?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  page?: number;
  limit?: number;
}

export interface SiteErrors {
  name?: string;
  slug?: string;
  description?: string;
  domains?: string;
  theme?: string;
  customStyles?: string;
  seoTitle?: string;
  seoDescription?: string;
  contactEmail?: string;
  listingsPerPage?: string;
  [key: string]: string | undefined;
}

export interface UseSitesOptions {
  initialData?: SiteData;
  apiEndpoint?: string;
  defaultFilters?: SiteFilters;
  /**
   * Whether to use the notification system for success/error messages
   * @default true
   */
  useNotificationsSystem?: boolean;
}

export interface UseSitesReturn {
  // Single site state
  site: SiteData;
  setSite: (site: SiteData) => void;
  updateSite: (field: string, value: any) => void;
  isLoading: boolean;
  error: string | null;
  success: string | null;
  errors: SiteErrors;

  // Site operations
  createSite: () => Promise<{ success: boolean; data?: any; error?: any }>;
  saveSite: (id?: string) => Promise<{ success: boolean; data?: any; error?: any }>;
  deleteSite: (id: string) => Promise<{ success: boolean; error?: any }>;

  // Form steps
  validateSite: (section?: string) => boolean;
  resetErrors: () => void;

  // Multiple sites state
  sites: SiteData[];
  filteredSites: SiteData[];
  totalSites: number;

  // Filtering and pagination
  filters: SiteFilters;
  setFilters: (filters: SiteFilters) => void;

  // Loading and fetching
  fetchSite: (id: string) => Promise<SiteData | null>;
  fetchSites: () => Promise<SiteData[]>;
  refreshSites: () => Promise<void>;
}