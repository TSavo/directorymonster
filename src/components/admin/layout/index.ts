// Standardized barrel file - Updated on 2025-03-29

// Export all named exports from component files
export * from './AdminHeader';
export * from './AdminLayout';
export * from './AdminSidebar';
export * from './Breadcrumbs';
export * from './WithAuth';

// Re-export default as named exports
export { default as AdminHeader } from './AdminHeader';
export { default as AdminLayout } from './AdminLayout';
export { default as AdminSidebar } from './AdminSidebar';
export { default as Breadcrumbs } from './Breadcrumbs';
export { default as WithAuth } from './WithAuth';

// Default export object for backward compatibility
export default {
  AdminHeader,
  AdminLayout,
  AdminSidebar,
  Breadcrumbs,
  WithAuth,
};
