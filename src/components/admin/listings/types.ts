import { Listing, Category, SiteConfig } from '@/types';

/**
 * Extended Listing type with additional properties for UI display
 */
export interface ListingWithRelations extends Listing {
  categoryName?: string;
  siteName?: string;
}

/**
 * Fields that can be sorted
 */
export type SortField = 'title' | 'categoryName' | 'createdAt' | 'updatedAt' | 'backlinkVerifiedAt';

/**
 * Sort direction
 */
export type SortOrder = 'asc' | 'desc';

/**
 * Props for the ListingTable component
 */
export interface ListingTableProps {
  siteSlug?: string; // Optional: If provided, only show listings for this site
  initialListings?: ListingWithRelations[]; // Optional: For server-side rendering
}

/**
 * Props for the ListingTableHeader component
 */
export interface ListingTableHeaderProps {
  totalListings: number;
  siteSlug?: string;
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  categoryFilter: string;
  setCategoryFilter: (categoryId: string) => void;
  siteFilter: string;
  setSiteFilter: (siteId: string) => void;
  categories: Category[];
  sites: SiteConfig[];
}

/**
 * Props for the ListingTableRow component
 */
export interface ListingTableRowProps {
  listing: ListingWithRelations;
  siteSlug?: string;
  showSiteColumn: boolean;
}

/**
 * Props for the ListingTablePagination component
 */
export interface ListingTablePaginationProps {
  currentPage: number;
  totalPages: number;
  goToPage: (page: number) => void;
  itemsPerPage: number;
  setItemsPerPage: (items: number) => void;
  totalItems: number;
}

/**
 * Props for the ListingTableActions component
 */
export interface ListingTableActionsProps {
  listingId: string;
  listingSlug: string;
  listingTitle: string;
  siteSlug?: string;
  onDeleteClick: (id: string, title: string) => void;
}

/**
 * Props for the ListingTableSkeleton component
 */
export interface ListingTableSkeletonProps {
  rows?: number;
}

/**
 * Props for the ListingTableError component
 */
export interface ListingTableErrorProps {
  error: string;
  onRetry: () => void;
}

/**
 * Props for the ListingTableEmptyState component
 */
export interface ListingTableEmptyStateProps {
  siteSlug?: string;
}

/**
 * Props for the ListingTableSortHeader component
 */
export interface ListingTableSortHeaderProps {
  label: string;
  field: SortField;
  currentSortField: SortField;
  currentSortOrder: SortOrder;
  onSort: (field: SortField) => void;
}
