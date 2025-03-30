"use client";

// Export all named exports from each component
export * from './SiteTable';
export * from './SiteTableHeader';
export * from './SiteTableSortHeader';
export * from './SiteTableRow';
export * from './SiteTablePagination';
export * from './SiteMobileCard';
export * from './DeleteConfirmationModal';

// Re-export default exports as named exports
export { default as SiteTable } from './SiteTable';
export { default as SiteTableHeader } from './SiteTableHeader';
export { default as SiteTableSortHeader } from './SiteTableSortHeader';
export { default as SiteTableRow } from './SiteTableRow';
export { default as SiteTablePagination } from './SiteTablePagination';
export { default as SiteMobileCard } from './SiteMobileCard';
export { default as DeleteConfirmationModal } from './DeleteConfirmationModal';

// Default export for backward compatibility
export default {
  SiteTable,
  SiteTableHeader,
  SiteTableSortHeader,
  SiteTableRow,
  SiteTablePagination,
  SiteMobileCard,
  DeleteConfirmationModal,
};