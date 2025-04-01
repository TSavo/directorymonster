import { Category } from '../categories/types';

/**
 * Listing status enum
 */
export enum ListingStatus {
  DRAFT = 'draft',
  PUBLISHED = 'published',
  ARCHIVED = 'archived',
  PENDING_REVIEW = 'pending_review',
  REJECTED = 'rejected',
}

/**
 * Media type enum
 */
export enum MediaType {
  IMAGE = 'image',
  VIDEO = 'video',
  DOCUMENT = 'document',
}

/**
 * Price type enum
 */
export enum PriceType {
  FREE = 'free',
  FIXED = 'fixed',
  STARTING_AT = 'starting_at',
  VARIABLE = 'variable',
  CONTACT = 'contact',
}

/**
 * Listing Media interface
 */
export interface ListingMedia {
  id: string;
  url: string;
  type: MediaType;
  alt?: string;
  width?: number;
  height?: number;
  isPrimary?: boolean;
  sortOrder?: number;
  createdAt: string;
  updatedAt: string;
}

/**
 * Listing Price interface
 */
export interface ListingPrice {
  priceType: PriceType;
  amount?: number;
  currency?: string;
  description?: string;
  oldPrice?: number;
  salePrice?: number;
  onSale?: boolean;
}

/**
 * Contact information interface
 */
export interface ContactInfo {
  email?: string;
  phone?: string;
  website?: string;
  address?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  country?: string;
}

/**
 * SEO Data interface
 */
export interface SEOData {
  title?: string;
  description?: string;
  keywords?: string[];
  ogImage?: string;
  canonical?: string;
  noIndex?: boolean;
}

/**
 * Backlink information interface
 */
export interface BacklinkInfo {
  url: string;
  anchorText?: string;
  targetPage?: string;
  verified?: boolean;
  verifiedAt?: string;
  status?: 'pending' | 'verified' | 'failed';
}

/**
 * Custom field interface
 */
export interface CustomField {
  key: string;
  value: string | number | boolean | string[];
  label: string;
  type: 'text' | 'number' | 'boolean' | 'select' | 'multiselect';
  options?: string[];
}

/**
 * Main Listing interface
 */
export interface Listing {
  id: string;
  siteId: string;
  title: string;
  slug: string;
  description: string;
  status: ListingStatus;
  categoryIds: string[];
  categories?: Category[];
  media: ListingMedia[];
  price?: ListingPrice;
  contactInfo?: ContactInfo;
  seoData?: SEOData;
  backlinkInfo?: BacklinkInfo;
  customFields?: CustomField[];
  featured?: boolean;
  featuredUntil?: string;
  viewCount?: number;
  clickCount?: number;
  createdAt: string;
  updatedAt: string;
  publishedAt?: string;
  expiresAt?: string;
  userId: string;
  userDisplayName?: string;
}

/**
 * Form data for creating/updating a listing
 */
export interface ListingFormData {
  title: string;
  description: string;
  status: ListingStatus;
  categoryIds: string[];
  media: ListingMedia[];
  price?: ListingPrice;
  contactInfo?: ContactInfo;
  seoData?: SEOData;
  backlinkInfo?: BacklinkInfo;
  customFields?: CustomField[];
  featured?: boolean;
  featuredUntil?: string;
}

/**
 * Listing sort options
 */
export type ListingSortField = 
  | 'title' 
  | 'createdAt' 
  | 'updatedAt' 
  | 'publishedAt' 
  | 'viewCount' 
  | 'clickCount' 
  | 'status';

/**
 * Sort direction
 */
export type SortDirection = 'asc' | 'desc';

/**
 * Listing filters interface
 */
export interface ListingFilters {
  search?: string;
  status?: ListingStatus[];
  categoryIds?: string[];
  featured?: boolean;
  fromDate?: string;
  toDate?: string;
  userId?: string;
}

/**
 * Listing pagination interface
 */
export interface ListingPagination {
  page: number;
  perPage: number;
  total: number;
  totalPages: number;
}

/**
 * Table state interface
 */
export interface ListingTableState {
  items: Listing[];
  loading: boolean;
  error: string | null;
  filters: ListingFilters;
  pagination: ListingPagination;
  sort: {
    field: ListingSortField;
    direction: SortDirection;
  };
  selected: string[];
}

/**
 * Listing API response
 */
export interface ListingApiResponse {
  data: Listing[];
  pagination: ListingPagination;
}

/**
 * Form validation errors interface
 */
export interface ListingFormErrors {
  title?: string;
  description?: string;
  status?: string;
  categoryIds?: string;
  media?: string;
  price?: {
    priceType?: string;
    amount?: string;
    currency?: string;
  };
  contactInfo?: {
    email?: string;
    phone?: string;
    website?: string;
  };
  backlinkInfo?: {
    url?: string;
  };
  [key: string]: any;
}

/**
 * Multi-step form state interface
 */
export interface ListingFormState {
  formData: ListingFormData;
  currentStep: number;
  totalSteps: number;
  errors: ListingFormErrors;
  touched: Record<string, boolean>;
  isSubmitting: boolean;
  isValid: boolean;
  isDirty: boolean;
}

/**
 * Props for the ListingTable component
 */
export interface ListingTableProps {
  /**
   * Site slug - used for API requests and building URLs
   */
  siteSlug?: string;
  
  /**
   * Initial listings data to display - typically used in tests
   * or when the parent component already has the data
   */
  initialListings?: Listing[];
}

/**
 * Props for the ListingTableHeader component
 */
export interface ListingTableHeaderProps {
  /**
   * Total number of listings to display in the header
   */
  totalListings: number;
  
  /**
   * Site slug for building URLs
   */
  siteSlug?: string;
  
  /**
   * Current search term
   */
  searchTerm: string;
  
  /**
   * Handler for search term changes
   */
  setSearchTerm: (term: string) => void;
  
  /**
   * Current category filter value
   */
  categoryFilter: string;
  
  /**
   * Handler for category filter changes
   */
  setCategoryFilter: (categoryId: string) => void;
  
  /**
   * Current site filter value
   */
  siteFilter: string;
  
  /**
   * Handler for site filter changes
   */
  setSiteFilter: (siteId: string) => void;
  
  /**
   * Available categories for filtering
   */
  categories: Category[];
  
  /**
   * Available sites for filtering
   */
  sites: any[]; // Should be Site[] type
}

/**
 * Props for the ListingTableEmptyState component
 */
export interface ListingTableEmptyStateProps {
  /**
   * Site slug for building the "Create new" URL
   */
  siteSlug?: string;
}

/**
 * Props for the ListingTableError component
 */
export interface ListingTableErrorProps {
  /**
   * Error message to display
   */
  error: string;
  
  /**
   * Handler for retry button click
   */
  onRetry: () => void;
}

/**
 * Props for the ListingTableSkeleton component
 */
export interface ListingTableSkeletonProps {
  /**
   * Number of rows to display in the skeleton
   */
  rows?: number;
}
