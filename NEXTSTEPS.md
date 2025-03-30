# DirectoryMonster Implementation Next Steps - [2025-03-30]

## Recently Completed
- ✅ Fixed E2E tests to handle site hostname properly
- ✅ Fixed Puppeteer cookie error by using URL query parameters
- ✅ Created smoketest for verifying basic site functionality
- ✅ Updated run-e2e-tests.bat to run smoketest first
- ✅ Added proper error handling and reporting for tests
- ✅ Standardized export patterns in dashboard and layout modules

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

### E2E Testing Standardization
- [ ] Convert all E2E tests to follow the new testing pattern:
  - [x] Homepage tests converted to new structure
  - [ ] Login tests conversion to new structure
  - [ ] Admin dashboard tests conversion to new structure
  - [ ] First-user test conversion to new structure
  - [ ] Create shared test setup and teardown
- [ ] Create a selectors file for each major component area:
  - [x] homepage.selectors.js (completed)
  - [ ] login.selectors.js
  - [ ] admin.selectors.js
  - [ ] firstuser.selectors.js
- [ ] Document the new E2E testing pattern
- [ ] Create script to automate test file generation

### Next.js App Router Compatibility
- [ ] Add "use client" directive to all interactive components
- [ ] Update component organization to better align with Next.js app router
- [x] Fix login page E2E test failure by improving test detection
- [x] Fix remaining E2E test failures:
  - [x] Fix CSS selector issues (`:contains()` syntax not supported by Puppeteer)
  - [x] Add consistent data-testid attributes to components
  - [x] Improve form element detection in tests
  - [x] Fix detection of UI elements after component hydration
- [ ] Add documentation on proper component organization with app router

### Unit Test Fixes
- [ ] Install missing @testing-library/dom dependency
- [ ] Fix React Testing Library configuration in Jest setup
- [ ] Fix syntax errors in test files
- [ ] Update SiteForm.validation.test.tsx and other template-based files
- [ ] Resolve the punycode module deprecation warning

### E2E Testing Improvements
- ✅ Add data-testid attributes to homepage components
- ✅ Implement waiting for component hydration in tests
- ✅ Create test utilities for form element detection with retry mechanisms
- ✅ Fix title and content detection for homepage tests
- ✅ Implement new E2E testing structure for homepage tests
- [ ] Update login.test.js to use new testing structure pattern
- [ ] Create login.selectors.js with centralized selectors
- [ ] Add data-testid attributes to admin components
- [ ] Create admin.selectors.js file
- [ ] Refactor admin dashboard tests into specialized test files
- [ ] Create documentation for E2E testing best practices

## Future Work

### Export Standardization Improvements
- Add export verification to CI pipeline via GitHub Actions
- Create tooling to automatically generate standardized component files
- Update project documentation with export pattern guidelines
- Add eslint rules to enforce proper export patterns

### Test Infrastructure Improvements
- Set up proper CI workflow for running both unit and E2E tests
- Create a dedicated test environment with seeded test data
- Add visual regression testing with screenshots comparison
- Implement test coverage reporting and monitoring
- Set up test fixtures and factory functions for test data creation

### Upcoming DirectoryMonster Features
- Enhance data handling and state management
- Improve error handling for API requests
- Optimize loading states and UI feedback
- Implement caching for performance gains
- Add data validation on client and server
- Expand test coverage for recently standardized components