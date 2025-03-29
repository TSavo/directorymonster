# Next Steps for DirectoryMonster E2E Test Fixes

## Recent Fixes

### Component Import Path Issue (FIXED)
- Created missing `index.ts` file in `src/components/admin/sites` directory
- Added exports for `SiteForm`, `SiteSettings`, `SEOSettings`, and `DomainManager` components
- This resolves the module import errors that were preventing correct page rendering

## Remaining Issues to Fix

### 1. Fix Authentication Workflow
- **Priority: HIGH**
- Debug the ZKP (Zero-Knowledge Proof) authentication process
- The tests show that ZKP proof generation works but server returns 401 Unauthorized
- Actions:
  - Review authentication API in the server logs
  - Verify test credentials (admin/password123456) in the database
  - Test authentication manually in the UI to isolate the issue
  - Consider adding a direct authentication method for tests that bypasses ZKP

### 2. Fix E2E Test Timeouts
- **Priority: HIGH**
- Navigation timeouts (5000ms) are too short for the test environment
- Actions:
  - Increase the navigation timeout to at least 30000ms in login.test.js and categories.test.js
  - Add more detailed logging during navigation
  - Add page load checks before proceeding with tests

### 3. Fix Database Seeding
- **Priority: MEDIUM**
- The tests can't find the sites needed for testing (fishing-gear, hiking-gear)
- Actions:
  - Ensure seed script is running before tests
  - Modify tests to use sites that exist in the seed data
  - Add dynamic site creation in the tests if needed
  - Add verification that database has the correct data before tests run

### 4. Standardize Component Architecture
- **Priority: MEDIUM**
- Many component directories are missing their index.ts files
- Actions:
  - Check all component directories for missing index.ts files
  - Create missing index.ts files for correct exports
  - Document the pattern in the codebase
  - Consider adding linting rules to enforce this pattern

### 5. Add CI Pipeline Integration
- **Priority: LOW**
- Set up proper CI workflow for tests
- Actions:
  - Configure GitHub Actions workflow
  - Set up proper environment for test runs
  - Add test reporting for better visibility
  - Create separate workflows for unit and E2E tests

## How to Run Tests

### Login Tests
```bash
npm run test:e2e:login
```

### Category Management Tests
```bash
npm run test:e2e:categories
```

### Run All E2E Tests
```bash
npm run test:e2e
```

## Notes
- Run the seed script before tests: `npm run seed`
- Make sure the server is running before E2E tests: `npm run dev &`
- Check Redis connection if database issues persist
