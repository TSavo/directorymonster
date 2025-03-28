# Admin Layout Components

This directory contains the core layout components for the DirectoryMonster admin interface.

## Components

### `AdminLayout`
The main layout wrapper that provides the structure for all admin pages, including:
- Responsive sidebar
- Admin header with notifications and user controls
- Breadcrumb navigation
- Main content area

### `AdminSidebar`
Navigation sidebar with:
- Responsive design (collapsible on mobile)
- Active state highlighting
- SVG icons for each section

### `AdminHeader`
Header component with:
- Mobile menu toggle
- Notifications dropdown
- User profile dropdown
- Admin title

### `Breadcrumbs`
Dynamic breadcrumb component that:
- Automatically generates navigation based on current path
- Properly formats path segments (e.g., converts dashes to spaces)
- Highlights the current page

### `WithAuth`
Authentication protection wrapper that:
- Shows a loading state while checking authentication
- Redirects unauthenticated users to login
- Displays protected content only to authenticated users

## Usage

Import these components to create admin pages with a consistent layout:

```tsx
import { AdminLayout, WithAuth } from '@/components/admin';

export default function AdminPage() {
  return (
    <WithAuth>
      <AdminLayout>
        <h1>Your Admin Page Content</h1>
        {/* More content here */}
      </AdminLayout>
    </WithAuth>
  );
}
```

## Testing

Comprehensive tests for all components are available in the `tests/admin/layout` directory.
