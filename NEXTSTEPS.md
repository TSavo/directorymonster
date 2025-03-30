# DirectoryMonster Implementation Next Steps

## Recently Completed
- ✅ Standardized export patterns in dashboard and layout modules
- ✅ Created export verification script (scripts/verify-exports.js)
- ✅ Fixed dual-export pattern in primary components
- ✅ Updated barrel files with consistent standardized exports
- ✅ Reduced warnings in Docker logs related to export issues
- ✅ Updated auth module components with standardized dual-export pattern
- ✅ Updated category module components with standardized dual-export pattern
- ✅ Updated dashboard subcomponents with standardized dual-export pattern
- ✅ Fixed client component issues by adding "use client" directives
- ✅ Fixed admin/layout.tsx imports to use direct component imports
- ✅ Fixed dashboard module barrel file for proper component imports

## Priority Tasks (Based on Verification Script)

### ✅ COMPLETED: Auth Module Export Standardization 
- Updated 7 auth components to add missing default exports:
  - AuthContainer.tsx, FirstUserSetup.tsx, LogoutButton.tsx
  - PasswordResetForm.tsx, RoleGuard.tsx, SessionManager.tsx, ZKPLogin.tsx
- Fixed auth/index.ts barrel file to follow standardized pattern

### ✅ COMPLETED: Category Components Export Standardization
- Updated 5 category components to add missing named exports:
  - CategoryTableEmptyState.tsx, CategoryTableError.tsx
  - CategoryTablePagination.tsx, CategoryTableRow.tsx
  - CategoryTableSortHeader.tsx
- Standardized categories/components/index.ts barrel file

### ✅ COMPLETED: Dashboard Subcomponents Export Standardization
- Added named exports to 2 dashboard subcomponents:
  - ActivityFeedItem.tsx, StatisticCard.tsx
- Updated dashboard/components/index.ts barrel file

### ✅ COMPLETED: Barrel File Standardization
- Standardized 5 barrel files to follow the standardized export pattern:
  - admin/index.ts - Added export defaults for subdirectories
  - layout/icons/index.ts - Fixed circular reference and added proper exports
  - sites/index.ts - Replaced auto-generated export pattern with standardized pattern
  - sites/hooks/index.ts - Added standardized export pattern
  - dashboard/hooks/index.ts - Added missing named exports
- Verification script confirms all files now follow the standardized pattern

## New Priority Tasks

### Next.js App Router Compatibility
- [ ] Add "use client" directive to all interactive components
- [ ] Update component organization to better align with Next.js app router
- [x] Fix login page E2E test failure by improving test detection
- [ ] Fix remaining E2E test failures:
  - [x] Fix CSS selector issues (`:contains()` syntax not supported by Puppeteer)
  - [x] Add consistent data-testid attributes to components
  - [ ] Improve form element detection in tests
  - [ ] Fix detection of UI elements after component hydration
- [ ] Add documentation on proper component organization with app router
- [ ] Create documentation for E2E test best practices

### E2E Testing Improvements
- [x] Fix first-user.test.js by updating text detection and implementing data-testid attributes
- [x] Remove `:contains()` syntax from tests, replacing with JavaScript-based text detection
- [x] Add consistent data-testid attributes to login and admin components
- [ ] Add more data-testid attributes to homepage components
- [ ] Implement waiting for component hydration in tests
- [ ] Create test utilities for form element detection with retry mechanisms
- [ ] Fix title and content detection for homepage tests
- [ ] Create documentation for E2E testing best practices and component standards

## Future Work

### Export Standardization Improvements
- Add export verification to CI pipeline via GitHub Actions
- Create tooling to automatically generate standardized component files
- Update project documentation with export pattern guidelines
- Add eslint rules to enforce proper export patterns

### Upcoming DirectoryMonster Features
- Enhance data handling and state management
- Improve error handling for API requests
- Optimize loading states and UI feedback
- Implement caching for performance gains
- Add data validation on client and server
- Expand test coverage for recently standardized components