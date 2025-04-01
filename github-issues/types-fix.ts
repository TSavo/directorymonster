import { Category } from '../categories/types';

// Add this to the existing types.ts file

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
