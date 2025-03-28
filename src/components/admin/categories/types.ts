import { Category, SiteConfig } from '@/types';

export type SortField = 'name' | 'order' | 'createdAt' | 'updatedAt';
export type SortOrder = 'asc' | 'desc';

export interface CategoryWithRelations extends Category {
  parentName?: string;
  siteName?: string;
  childCount?: number;
}

export interface CategoryTableProps {
  siteSlug?: string;
  initialCategories?: CategoryWithRelations[];
}

export interface CategoryTableHeaderProps {
  totalCategories: number;
  siteSlug?: string;
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  parentFilter: string;
  setParentFilter: (id: string) => void;
  siteFilter: string;
  setSiteFilter: (id: string) => void;
  categories: CategoryWithRelations[];
  sites: SiteConfig[];
}

export interface CategoryTableSortHeaderProps {
  label: string;
  field: SortField;
  currentSortField: SortField;
  currentSortOrder: SortOrder;
  onSort: (field: SortField) => void;
}

export interface CategoryTableRowProps {
  category: CategoryWithRelations;
  siteSlug?: string;
  showSiteColumn: boolean;
  onDeleteClick: (id: string, name: string) => void;
  depth?: number;
  isLastChild?: boolean;
}

export interface CategoryTablePaginationProps {
  currentPage: number;
  totalPages: number;
  goToPage: (page: number) => void;
  itemsPerPage: number;
  setItemsPerPage: (count: number) => void;
  totalItems: number;
}

export interface DeleteConfirmationModalProps {
  isOpen: boolean;
  title: string;
  itemName: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export interface CategoryTableEmptyStateProps {
  siteSlug?: string;
}

export interface CategoryTableErrorProps {
  error: string;
  onRetry: () => void;
}

export interface CategoryTableActionsProps {
  id: string;
  name: string;
  siteSlug?: string;
  onEditClick: (id: string) => void;
  onDeleteClick: (id: string, name: string) => void;
  onViewClick: (id: string) => void;
}

export interface ListingsMobileViewProps {
  categories: CategoryWithRelations[];
  showSiteColumn: boolean;
  onDeleteClick: (id: string, name: string) => void;
  siteSlug?: string;
}
