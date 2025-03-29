// Standardized barrel file for category components
// Last updated: 2025-03-29

// Export all named exports from each component
export * from './CategoriesMobileView';
export * from './CategoryErrorBoundary';
export * from './CategoryTableEmptyState';
export * from './CategoryTableError';
export * from './CategoryTableHeader';
export * from './CategoryTablePagination';
export * from './CategoryTableRow';
export * from './CategoryTableSkeleton';
export * from './CategoryTableSortHeader';
export * from './DeleteConfirmationModal';

// Export defaults as named exports
export { default as CategoriesMobileView } from './CategoriesMobileView';
export { default as CategoryErrorBoundary } from './CategoryErrorBoundary';
export { default as CategoryTableEmptyState } from './CategoryTableEmptyState';
export { default as CategoryTableError } from './CategoryTableError';
export { default as CategoryTableHeader } from './CategoryTableHeader';
export { default as CategoryTablePagination } from './CategoryTablePagination';
export { default as CategoryTableRow } from './CategoryTableRow';
export { default as CategoryTableSkeleton } from './CategoryTableSkeleton';
export { default as CategoryTableSortHeader } from './CategoryTableSortHeader';
export { default as DeleteConfirmationModal } from './DeleteConfirmationModal';

// Default export as an object of all components
export default {
  CategoriesMobileView,
  CategoryErrorBoundary,
  CategoryTableEmptyState,
  CategoryTableError,
  CategoryTableHeader,
  CategoryTablePagination,
  CategoryTableRow,
  CategoryTableSkeleton,
  CategoryTableSortHeader,
  DeleteConfirmationModal,
};
