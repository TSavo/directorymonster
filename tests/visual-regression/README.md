# Visual Regression Tests with Percy

This directory contains visual regression tests for DirectoryMonster using Percy and Playwright.

## Overview

Visual regression tests capture screenshots of the application and compare them against baseline images to detect visual changes. This helps ensure that UI components maintain their appearance as the codebase evolves.

## Test Coverage

The visual regression tests cover the following areas:

1. **Admin Dashboard**
   - Default view
   - Mobile view
   - Dark mode

2. **User Management**
   - User list
   - Add user modal
   - Edit user modal
   - User roles
   - Mobile view

3. **Role Management**
   - Role list
   - Create role form
   - Edit role form
   - Role permissions
   - Mobile view
   - Filtered views

## Running the Tests

To run the visual regression tests:

```bash
# Set your Percy token (first time only)
export PERCY_TOKEN=your_percy_token

# Run the tests
npm run test:visual
```

## Adding New Tests

To add a new visual regression test:

1. Create a new test file in this directory
2. Import the required dependencies:
   ```javascript
   const { test, expect } = require('@playwright/test');
   const percySnapshot = require('@percy/playwright');
   ```
3. Mock any API responses needed for the test
4. Navigate to the page you want to test
5. Take a Percy snapshot:
   ```javascript
   await percySnapshot(page, 'Snapshot Name');
   ```

## Best Practices

- **Mock API Responses**: Always mock API responses to ensure consistent test results
- **Test Multiple Viewports**: Test desktop, tablet, and mobile views
- **Test Different States**: Test different UI states (loading, error, empty, etc.)
- **Use Descriptive Names**: Use descriptive names for snapshots
- **Avoid Flakiness**: Hide elements that may cause flakiness (timestamps, animations, etc.)

## Configuration

The Percy configuration is defined in `.percy.yml` and includes:

- **Widths**: 375px (mobile), 768px (tablet), 1280px (desktop)
- **Min Height**: 1024px
- **Percy CSS**: Hides elements that may cause flakiness

The Playwright configuration for Percy is defined in `percy.config.js` and includes:

- **Test Directory**: `./tests/visual-regression`
- **Timeout**: 30 seconds
- **Base URL**: `http://localhost:3000`
- **Browser**: Chromium
- **Web Server**: Starts the development server before running tests
