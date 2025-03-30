// Standardized barrel file - Updated on 2025-03-30

// Import components explicitly 
import AdminHeaderComponent from './AdminHeader';
import AdminLayoutComponent from './AdminLayout';
import AdminSidebarComponent from './AdminSidebar';
import BreadcrumbsComponent from './Breadcrumbs';

// Export all named exports from component files
export * from './AdminHeader';
export * from './AdminLayout';
export * from './AdminSidebar';
export * from './Breadcrumbs';

// Re-export default as named exports
export { default as AdminHeader } from './AdminHeader';
export { default as AdminLayout } from './AdminLayout';
export { default as AdminSidebar } from './AdminSidebar';
export { default as Breadcrumbs } from './Breadcrumbs';

// Default export object for backward compatibility using imported variables
const layout = {
  AdminHeader: AdminHeaderComponent,
  AdminLayout: AdminLayoutComponent,
  AdminSidebar: AdminSidebarComponent,
  Breadcrumbs: BreadcrumbsComponent,
};

export default layout;
