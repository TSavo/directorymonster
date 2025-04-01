# Enhanced UI Permission System Specification

## 1. Overview

This specification provides a comprehensive implementation plan for the DirectoryMonster permission system UI components. It builds upon the existing access control infrastructure to deliver a complete role-based access control (RBAC) user interface that maintains proper multi-tenant isolation.

## 2. Current Implementation Status

The codebase already has several well-designed permission-related components that serve as a foundation:

### 2.1 Existing Guard Components
- **PermissionGuard.tsx** - Controls UI element visibility based on user permissions
- **TenantGuard.tsx** - Validates tenant membership and restricts access
- **RoleGuard.tsx** - Controls access based on user role assignments

### 2.2 Existing Permission Hooks
- **usePermission.ts** - For checking permissions programmatically
- **useTenantPermission.ts** - For tenant-specific permission checks

### 2.3 Existing Basic UI Components
- **UserPermissions.tsx** - For managing individual user permissions

## 3. Required Components

Based on issue #67 "[TASK] Implement ACL Role Management UI" and analysis of the codebase, the following components are required to complete the permission management system:

### 3.1 Role Management Components

#### 3.1.1 RoleTable Component
```tsx
// src/components/admin/roles/RoleTable.tsx
interface RoleTableProps {
  roles: Role[];
  onEdit: (roleId: string) => void;
  onDelete: (roleId: string) => void;
  onClone: (roleId: string) => void;
  onViewUsers: (roleId: string) => void;
  onViewPermissions: (roleId: string) => void;
}

export function RoleTable({
  roles,
  onEdit,
  onDelete,
  onClone,
  onViewUsers,
  onViewPermissions
}: RoleTableProps) {
  // Implementation of a table showing roles with actions
  // Should include:
  // - Role name
  // - Description
  // - Tenant scope
  // - Created/updated dates
  // - Actions (Edit, Delete, Clone, View Users, Manage Permissions)
  // - Pagination support for large role lists
}
```

#### 3.1.2 RoleForm Component
```tsx
// src/components/admin/roles/RoleForm.tsx
interface RoleFormProps {
  role?: Role; // If provided, we're editing; otherwise creating
  tenantId: string;
  siteOptions: { id: string, name: string }[]; // Available sites for scope selection
  onSubmit: (role: Role) => Promise<void>;
  onCancel: () => void;
}

export function RoleForm({
  role,
  tenantId,
  siteOptions,
  onSubmit,
  onCancel
}: RoleFormProps) {
  // Form with the following fields:
  // - Role name (required)
  // - Description (optional)
  // - Scope selection (tenant-wide or site-specific)
  // - Site selection (when site-specific scope is selected)
  // - Role type (custom, predefined)
}
```

#### 3.1.3 RolePermissions Component
```tsx
// src/components/admin/roles/RolePermissions.tsx
interface RolePermissionsProps {
  roleId: string;
  roleName: string;
  tenantId: string;
  permissions: {
    resourceType: ResourceType;
    permission: Permission;
    siteId?: string;
    resourceId?: string;
  }[];
  availableResourceTypes: ResourceType[];
  availablePermissions: Permission[];
  onChange: (permissions: {
    resourceType: ResourceType;
    permission: Permission;
    siteId?: string;
    resourceId?: string;
  }[]) => Promise<void>;
}

export function RolePermissions({
  roleId,
  roleName,
  tenantId,
  permissions,
  availableResourceTypes,
  availablePermissions,
  onChange
}: RolePermissionsProps) {
  // Component should include:
  // - Matrix/grid layout for resource types vs. permissions
  // - Ability to check/uncheck individual permissions
  // - Group selection options (all permissions for a resource)
  // - Resource-specific permission settings
  // - Site context selector for site-scoped permissions
  // - Search and filter capability for larger permission sets
}
```

#### 3.1.4 RoleCloneDialog Component
```tsx
// src/components/admin/roles/RoleCloneDialog.tsx
interface RoleCloneDialogProps {
  sourceRoleId: string;
  sourceRoleName: string;
  tenantId: string;
  onClone: (newRoleName: string, includeSiteSpecificPermissions: boolean) => Promise<void>;
  onCancel: () => void;
}

export function RoleCloneDialog({
  sourceRoleId,
  sourceRoleName,
  tenantId,
  onClone,
  onCancel
}: RoleCloneDialogProps) {
  // Dialog with:
  // - New role name field (pre-filled with "Copy of [Original Name]")
  // - Option to include/exclude site-specific permissions
  // - Clone button
  // - Cancel button
}
```

### 3.2 User-Role Assignment Components

#### 3.2.1 UserRoles Component
```tsx
// src/components/admin/users/UserRoles.tsx
interface UserRolesProps {
  userId: string;
  userName: string;
  tenantId: string;
  roles: Role[];
  assignedRoleIds: string[];
  onAssignRole: (roleId: string) => Promise<void>;
  onRemoveRole: (roleId: string) => Promise<void>;
}

export function UserRoles({
  userId,
  userName,
  tenantId,
  roles,
  assignedRoleIds,
  onAssignRole,
  onRemoveRole
}: UserRolesProps) {
  // Component should include:
  // - List of currently assigned roles with remove option
  // - Dropdown/searchable selector for adding new roles
  // - Role details on hover/click
  // - Effective permissions summary
  // - Filter options for role list
}
```

#### 3.2.2 RoleUsers Component
```tsx
// src/components/admin/roles/RoleUsers.tsx
interface RoleUsersProps {
  roleId: string;
  roleName: string;
  tenantId: string;
  users: User[];
  assignedUserIds: string[];
  onAssignUser: (userId: string) => Promise<void>;
  onRemoveUser: (userId: string) => Promise<void>;
  onBulkAssign: (userIds: string[]) => Promise<void>;
  onBulkRemove: (userIds: string[]) => Promise<void>;
}

export function RoleUsers({
  roleId,
  roleName,
  tenantId,
  users,
  assignedUserIds,
  onAssignUser,
  onRemoveUser,
  onBulkAssign,
  onBulkRemove
}: RoleUsersProps) {
  // Component should include:
  // - Table of users assigned to the role
  // - Search/filter capability for user list
  // - User selector for adding new users to the role
  // - Bulk selection and actions
  // - Pagination for large user lists
  // - User details display
}
```

#### 3.2.3 EffectivePermissions Component
```tsx
// src/components/admin/users/EffectivePermissions.tsx
interface EffectivePermissionsProps {
  userId: string;
  userName: string;
  tenantId: string;
}

export function EffectivePermissions({
  userId,
  userName,
  tenantId
}: EffectivePermissionsProps) {
  // Component should display:
  // - Calculated effective permissions from all assigned roles
  // - Source of each permission (which role granted it)
  // - Grouping by resource type
  // - Search and filter functionality
  // - Export option for audit purposes
}
```

### 3.3 Tenant Context UI Components

#### 3.3.1 TenantSelector Component
```tsx
// src/components/admin/tenant/TenantSelector.tsx
interface TenantSelectorProps {
  tenants: Tenant[];
  currentTenantId: string;
  onSelectTenant: (tenantId: string) => void;
}

export function TenantSelector({
  tenants,
  currentTenantId,
  onSelectTenant
}: TenantSelectorProps) {
  // Dropdown component with:
  // - List of accessible tenants
  // - Current tenant highlighted
  // - Search functionality for many tenants
  // - Tenant details on hover
  // - Visual indicators for tenant status
}
```

#### 3.3.2 TenantContextIndicator Component
```tsx
// src/components/admin/tenant/TenantContextIndicator.tsx
interface TenantContextIndicatorProps {
  tenant: Tenant;
}

export function TenantContextIndicator({
  tenant
}: TenantContextIndicatorProps) {
  // Persistent visual indicator showing:
  // - Current tenant name/logo
  // - Color-coded border or background based on tenant
  // - Hover details with additional tenant information
}
```

#### 3.3.3 SiteScopeSelector Component
```tsx
// src/components/admin/tenant/SiteScopeSelector.tsx
interface SiteScopeSelectorProps {
  tenantId: string;
  sites: Site[];
  currentSiteId?: string; // undefined means tenant-wide scope
  onSelectScope: (siteId?: string) => void;
  allowTenantWide: boolean;
}

export function SiteScopeSelector({
  tenantId,
  sites,
  currentSiteId,
  onSelectScope,
  allowTenantWide
}: SiteScopeSelectorProps) {
  // Selector component with:
  // - Option for tenant-wide scope (if allowed)
  // - List of available sites
  // - Current selection highlighted
  // - Search for many sites
}
```

### 3.4 Enhanced Permission Hooks

#### 3.4.1 useBulkPermission Hook
```tsx
// src/hooks/useBulkPermission.ts
export function useBulkPermission(
  resourceType: ResourceType,
  permissions: Permission[],
  checkType: 'any' | 'all' = 'any',
  resourceId?: string
): boolean {
  // Implementation should:
  // - Check multiple permissions in a single call
  // - Support 'any' mode (OR logic) or 'all' mode (AND logic)
  // - Include caching/memoization for performance
  // - Handle resource-specific checks
}
```

#### 3.4.2 usePermissionMutation Hook
```tsx
// src/hooks/usePermissionMutation.ts
export function usePermissionMutation(
  tenantId: string
): {
  grantPermission: (userId: string, resourceType: ResourceType, permission: Permission, resourceId?: string) => Promise<void>;
  revokePermission: (userId: string, resourceType: ResourceType, permission: Permission, resourceId?: string) => Promise<void>;
  grantRolePermission: (roleId: string, resourceType: ResourceType, permission: Permission, resourceId?: string) => Promise<void>;
  revokeRolePermission: (roleId: string, resourceType: ResourceType, permission: Permission, resourceId?: string) => Promise<void>;
  isLoading: boolean;
  error: Error | null;
} {
  // Implementation should:
  // - Provide methods for granting/revoking permissions
  // - Handle API communication
  // - Include loading and error states
  // - Invalidate relevant caches on success
}
```

## 4. Page Components

### 4.1 Role Management Pages

#### 4.1.1 RolesPage Component
```tsx
// src/app/admin/roles/page.tsx
export default function RolesPage() {
  // Implementation should:
  // - List all roles in current tenant context
  // - Include create/edit/delete actions
  // - Show role details on demand
  // - Include proper permission guards
  // - Support pagination, search, and filtering
}
```

#### 4.1.2 RoleDetailPage Component
```tsx
// src/app/admin/roles/[id]/page.tsx
export default function RoleDetailPage({ params }: { params: { id: string } }) {
  // Implementation should:
  // - Display comprehensive role details
  // - Include edit capabilities (name, description)
  // - Show assigned permissions
  // - List users with this role
  // - Include proper permission guards
  // - Provide navigation to permissions and users management
}
```

#### 4.1.3 RolePermissionsPage Component
```tsx
// src/app/admin/roles/[id]/permissions/page.tsx
export default function RolePermissionsPage({ params }: { params: { id: string } }) {
  // Implementation should:
  // - Display and allow editing role permissions
  // - Include matrix UI for resource types vs. permissions
  // - Support resource-specific permission configuration
  // - Include proper permission guards
  // - Provide batch operations for efficient management
}
```

#### 4.1.4 RoleUsersPage Component
```tsx
// src/app/admin/roles/[id]/users/page.tsx
export default function RoleUsersPage({ params }: { params: { id: string } }) {
  // Implementation should:
  // - List users assigned to this role
  // - Allow adding/removing users
  // - Support bulk operations
  // - Include proper permission guards
  // - Provide search and filtering
}
```

### 4.2 User-Role Management Pages

#### 4.2.1 UserRolesPage Component
```tsx
// src/app/admin/users/[id]/roles/page.tsx
export default function UserRolesPage({ params }: { params: { id: string } }) {
  // Implementation should:
  // - Display roles assigned to this user
  // - Allow adding/removing roles
  // - Show effective permissions
  // - Include proper permission guards
  // - Provide role details on demand
}
```

#### 4.2.2 UserEffectivePermissionsPage Component
```tsx
// src/app/admin/users/[id]/permissions/page.tsx
export default function UserEffectivePermissionsPage({ params }: { params: { id: string } }) {
  // Implementation should:
  // - Show calculated effective permissions for user
  // - Display permission source (role)
  // - Include search and filtering
  // - Support export for audit purposes
  // - Include proper permission guards
}
```

## 5. API Routes

### 5.1 Role Management API Routes

```tsx
// src/app/api/admin/roles/route.ts
// GET - List roles
// POST - Create new role

// src/app/api/admin/roles/[id]/route.ts
// GET - Get role details
// PUT - Update role
// DELETE - Delete role

// src/app/api/admin/roles/[id]/permissions/route.ts
// GET - Get role permissions
// PUT - Update role permissions

// src/app/api/admin/roles/[id]/users/route.ts
// GET - Get users assigned to role
// POST - Assign user to role
// DELETE - Remove user from role

// src/app/api/admin/roles/[id]/clone/route.ts
// POST - Clone existing role
```

### 5.2 User-Role Management API Routes

```tsx
// src/app/api/admin/users/[id]/roles/route.ts
// GET - Get user's roles
// POST - Assign role to user
// DELETE - Remove role from user

// src/app/api/admin/users/[id]/permissions/route.ts
// GET - Get user's effective permissions
```

## 6. Implementation Approach

### 6.1 Prioritized Implementation Plan

1. **Phase 1: Core Role Management Components**
   - Implement RoleTable and RoleForm components
   - Create basic role listing and creation UI
   - Implement role CRUD API endpoints

2. **Phase 2: Permission Assignment**
   - Implement RolePermissions component
   - Create permission assignment matrix UI
   - Implement role permissions API endpoints

3. **Phase 3: User-Role Relationships**
   - Implement UserRoles and RoleUsers components
   - Create user-role assignment interfaces
   - Implement user-role assignment API endpoints

4. **Phase 4: Tenant Context UI**
   - Implement TenantSelector and TenantContextIndicator
   - Create tenant context UI components
   - Integrate tenant context throughout the permission UI

### 6.2 Integration with Existing Security Components

- Use `withPermission` middleware to secure all API routes
- Apply PermissionGuard components to restrict UI access
- Utilize permission hooks for programmatic permission checks
- Apply TenantGuard to enforce tenant boundaries
- Ensure all components respect tenant isolation

### 6.3 Performance Considerations

- Implement efficient permission caching to reduce database hits
- Use batch operations for permission assignments where appropriate
- Implement pagination for large data sets (roles, users)
- Consider using React Query for efficient data fetching and caching
- Optimize permission calculation for complex role hierarchies

## 7. Testing Strategy

### 7.1 Component Testing

- Create unit tests for all permission components
- Test guard components with various permission scenarios
- Validate permission hooks with different inputs
- Ensure tenant isolation in all components

### 7.2 Integration Testing

- Test role management workflow end-to-end
- Validate user-role assignment process
- Test permission inheritance and calculation
- Verify tenant boundary enforcement

### 7.3 Security Testing

- Verify proper permission guards on all routes
- Test cross-tenant access prevention
- Validate permission calculation accuracy
- Test permission cache invalidation

## 8. Documentation Requirements

- Update developer onboarding guide with permission system details
- Create usage examples for permission components
- Document best practices for permission implementation
- Add security considerations to developer documentation

## 9. Accessibility Considerations

- Ensure all permission interfaces are keyboard navigable
- Add appropriate ARIA labels to permission controls
- Provide clear error states for permission operations
- Use sufficient color contrast for permission indicators
- Include screen reader-friendly permission feedback
