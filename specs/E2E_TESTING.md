# End-to-End Testing Pattern Guide

This document outlines the comprehensive End-to-End (E2E) testing strategy for the DirectoryMonster application, focusing on how to organize, write, and maintain E2E tests.

## Table of Contents

1. [Core Principles](#core-principles)
2. [Test Organization](#test-organization)
3. [Component Selection Strategy](#component-selection-strategy)
4. [Test Types](#test-types)
5. [Test File Structure](#test-file-structure)
6. [Mock Implementations](#mock-implementations)
7. [Examples](#examples)
8. [Troubleshooting](#troubleshooting)
9. [Developer Onboarding](#developer-onboarding)

## Core Principles

The E2E testing strategy for DirectoryMonster is founded on these key principles:

- **Organize by Page/Feature**: Each major page or feature has its own directory of tests
- **One Test = One File**: Each test case has a dedicated file, focusing on a specific behavior
- **Centralized Selectors**: All data-testid selectors live in a single file per feature
- **Stable Component Selection**: Use data-testid attributes as the primary means of selecting elements
- **Component-Centric**: Tests are organized around components rather than pages
- **Test Type Separation**: Different aspects of components are tested in separate files
- **Clear Test Purpose**: Each test file should have a single, clear responsibility

## Test Organization

### Directory Structure

Tests are organized in a directory structure that mirrors the application's component structure:

```
tests/
├── e2e/                    # End-to-End tests
│   ├── global/             # Global setup and teardown
│   │   ├── setup.js        # Global Puppeteer setup
│   │   └── teardown.js     # Global Puppeteer teardown
│   ├── utils/              # Test utilities
│   │   ├── test-utils.js   # Common test utilities
│   │   └── hydration-utils.js # Next.js hydration utilities
│   ├── homepage/           # Homepage tests
│   │   ├── homepage.selectors.js    # Centralized selectors
│   │   ├── homepage.setup.js        # Setup for homepage tests
│   │   ├── homepage.rendering.test.js # Basic rendering test
│   │   ├── homepage.navigation.test.js # Navigation test
│   │   └── ...
│   ├── admin-dashboard/    # Admin dashboard tests
│   └── ...
├── admin/                  # Component tests
│   ├── categories/         # Category management tests
│   ├── listings/           # Listing management tests
│   └── sites/              # Site management tests
│       ├── components/     # Site component tests
│       ├── hooks/          # Site hook tests
│       ├── table/          # Site table component tests
│       └── ...
```

### Test File Naming Conventions

Tests are split into multiple files based on the aspect being tested:

1. **Base Test File**: Tests basic rendering and structure
   - Format: `ComponentName.test.tsx`
   - Example: `SiteTable.test.tsx`

2. **Feature-Specific Files**: Tests specific features
   - Format: `ComponentName.feature.test.tsx`
   - Example: `SiteTable.sorting.test.tsx`

3. **Interaction Test Files**: Tests user interactions
   - Format: `ComponentName.interaction.test.tsx`
   - Example: `SiteTableRow.interaction.test.tsx`

4. **State Test Files**: Tests loading states, error states
   - Format: `ComponentName.state.test.tsx`
   - Example: `SiteTable.loading.test.tsx`

5. **Accessibility Test Files**: Tests accessibility features
   - Format: `ComponentName.accessibility.test.tsx`
   - Example: `StepNavigation.accessibility.test.tsx`

6. **Validation Test Files**: Tests form validation
   - Format: `ComponentName.validation.test.tsx`
   - Example: `BasicInfoStep.validation.test.tsx`

## Component Selection Strategy

Using consistent and reliable component selection is crucial for test stability. The DirectoryMonster application uses data-testid attributes as the primary means of selecting elements.

### Data-TestID Attributes

All components should include data-testid attributes for key elements:

```jsx
// Example component with data-testid attributes
const SiteTableRow = ({ site }) => {
  return (
    <tr data-testid="site-table-row">
      <td data-testid="site-name">{site.name}</td>
      <td data-testid="site-slug">{site.slug}</td>
      <td>
        <button data-testid="edit-button">Edit</button>
        <button data-testid="delete-button">Delete</button>
      </td>
    </tr>
  );
};
```

### Selector Files

Each feature or page has a dedicated selector file that centralizes all selectors:

```javascript
// Example: sites.selectors.js
const SiteSelectors = {
  // Table selectors
  table: {
    container: '[data-testid="site-table"]',
    row: '[data-testid="site-table-row"]',
    emptyState: '[data-testid="empty-state"]',
    header: '[data-testid="table-header"]'
  },

  // Row selectors
  row: {
    name: '[data-testid="site-name"]',
    slug: '[data-testid="site-slug"]',
    editButton: '[data-testid="edit-button"]',
    deleteButton: '[data-testid="delete-button"]'
  },

  // Form selectors
  form: {
    container: '[data-testid="site-form"]',
    nameInput: '[data-testid="name-input"]',
    slugInput: '[data-testid="slug-input"]',
    submitButton: '[data-testid="submit-button"]'
  },

  // Fallback selectors (when data-testid isn't available)
  fallback: {
    table: 'table, .site-table',
    row: 'tr, .site-row',
    nameCell: 'td:first-child',
    editButton: 'button:contains("Edit")'
  }
};
```

### Best Practices for Selectors

1. **Be Specific**: Use descriptive, specific data-testid values
   - Good: `data-testid="site-form-submit-button"`
   - Avoid: `data-testid="button-1"`

2. **Use Hierarchical Structure**: Organize selectors by component relationship
   - Example: `table.row.editButton` rather than flat `editButton`

3. **Include Fallbacks**: Always include fallback selectors for when data-testid isn't available

4. **Scope Selectors**: Use parent elements to scope selectors and avoid conflicts
   - Example: `within(row).getByTestId('edit-button')` rather than `getByTestId('edit-button')`

5. **Avoid Brittle Selectors**: Don't rely on CSS classes that might change or text content that might be translated
   - Avoid: `.btn-primary` or `'button:contains("Submit")'`

## Test Types

DirectoryMonster's E2E testing strategy includes various test types to ensure comprehensive coverage:

### 1. Rendering Tests

Tests that verify components render correctly without errors:

```javascript
// Example rendering test
it('renders the site table with correct columns', async () => {
  // Verify basic elements exist
  expect(screen.getByTestId('site-table')).toBeInTheDocument();
  expect(screen.getByText('Name')).toBeInTheDocument();
  expect(screen.getByText('Slug')).toBeInTheDocument();
  expect(screen.getByText('Actions')).toBeInTheDocument();
});
```

### 2. Interaction Tests

Tests that simulate user interactions and verify the correct behavior:

```javascript
// Example interaction test
it('opens delete confirmation modal when delete button is clicked', async () => {
  const user = userEvent.setup();

  // Click delete button
  await user.click(screen.getByTestId('delete-button'));

  // Verify modal is shown
  expect(screen.getByTestId('confirmation-modal')).toBeInTheDocument();
  expect(screen.getByText('Are you sure?')).toBeInTheDocument();
});
```

### 3. State Tests

Tests that verify components behave correctly in different states:

```javascript
// Example loading state test
it('displays loading state when data is being fetched', async () => {
  // Mock loading state
  useSites.mockReturnValue({
    ...mockUseSites,
    isLoading: true
  });

  render(<SiteTable />);

  // Verify loading indicators
  expect(screen.getByTestId('loading-spinner')).toBeInTheDocument();
  expect(screen.queryByTestId('site-table-row')).not.toBeInTheDocument();
});
```

### 4. Accessibility Tests

Tests that verify accessibility features:

```javascript
// Example accessibility test
it('manages focus correctly in modal dialog', async () => {
  const user = userEvent.setup();

  // Open the modal
  await user.click(screen.getByTestId('delete-button'));

  // First focusable element should be focused
  expect(document.activeElement).toBe(screen.getByTestId('cancel-button'));

  // Tab to next element
  await user.tab();
  expect(document.activeElement).toBe(screen.getByTestId('confirm-button'));

  // Tab again should wrap to first element (focus trap)
  await user.tab();
  expect(document.activeElement).toBe(screen.getByTestId('cancel-button'));
});
```

### 5. Form Validation Tests

Tests that verify form validation:

```javascript
// Example validation test
it('validates required fields', async () => {
  const user = userEvent.setup();

  // Try to submit empty form
  await user.click(screen.getByTestId('submit-button'));

  // Verify error messages
  expect(screen.getByText('Name is required')).toBeInTheDocument();
  expect(screen.getByText('Slug is required')).toBeInTheDocument();
});
```

### 6. Navigation Tests

Tests that verify navigation between pages or views:

```javascript
// Example navigation test
it('navigates to edit page when edit button is clicked', async () => {
  const user = userEvent.setup();
  const mockRouter = { push: jest.fn() };
  useRouter.mockReturnValue(mockRouter);

  // Click edit button
  await user.click(screen.getByTestId('edit-button'));

  // Verify navigation
  expect(mockRouter.push).toHaveBeenCalledWith('/admin/sites/edit/site-1');
});
```

## Test File Structure

Each test file should follow this structure:

```javascript
/**
 * @file Component name test description
 * @description Brief description of what this test file verifies
 */

// Import dependencies and test utilities
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ComponentName } from '@/components/path/to/ComponentName';
import { Selectors } from './selectors';

// Mock dependencies
jest.mock('@/components/path/to/Dependency', () => ({
  DependencyComponent: jest.fn(() => <div>Mocked Dependency</div>)
}));

describe('Component Name - Test Category', () => {
  // Set up common test user
  const user = userEvent.setup();

  // Common setup before each test
  beforeEach(() => {
    jest.clearAllMocks();
    // Additional setup
  });

  // Test cases
  it('describes specific behavior clearly', async () => {
    // Render component
    render(<ComponentName prop1="value" />);

    // Verify initial state
    expect(screen.getByTestId(Selectors.component.element)).toBeInTheDocument();

    // Perform interaction
    await user.click(screen.getByTestId(Selectors.component.button));

    // Verify result
    expect(screen.getByText('Expected Result')).toBeInTheDocument();
  });

  // More test cases...
});
```

## Mock Implementations

### Mocking Next.js Router

```javascript
// Mock Next.js router
jest.mock('next/navigation', () => ({
  useRouter: jest.fn()
}));

const mockRouter = {
  push: jest.fn(),
  back: jest.fn(),
  refresh: jest.fn()
};

// In test setup
beforeEach(() => {
  useRouter.mockReturnValue(mockRouter);
});
```

### Mocking Hooks

```javascript
// Mock a custom hook
jest.mock('@/components/admin/sites/hooks/useSites', () => ({
  useSites: jest.fn()
}));

// Mock implementation for tests
const mockUseSites = {
  site: { name: 'Test Site', slug: 'test-site' },
  updateSite: jest.fn(),
  createSite: jest.fn(),
  isLoading: false,
  error: null,
  validateSite: jest.fn().mockReturnValue(true)
};

// In test setup
beforeEach(() => {
  useSites.mockReturnValue(mockUseSites);
});
```

### Mocking API Calls

```javascript
// Mock fetch
global.fetch = jest.fn();

// In test setup
beforeEach(() => {
  global.fetch.mockReset();
  global.fetch.mockResolvedValue({
    ok: true,
    json: async () => ({ success: true, data: mockData })
  });
});
```

## Examples

### Example 1: Site Table Rendering Test

```javascript
/**
 * @file SiteTable rendering test
 * @description Tests that the site table renders correctly with data
 */

import { render, screen } from '@testing-library/react';
import { SiteTable } from '@/components/admin/sites/SiteTable';
import { useSites } from '@/components/admin/sites/hooks/useSites';
import { SiteSelectors } from './site.selectors';

// Mock hooks
jest.mock('@/components/admin/sites/hooks/useSites');

// Mock data
const mockSites = [
  { id: 'site-1', name: 'Site 1', slug: 'site-1', domains: ['site1.com'] },
  { id: 'site-2', name: 'Site 2', slug: 'site-2', domains: ['site2.com'] }
];

// Mock hook implementation
const mockUseSitesReturn = {
  sites: mockSites,
  filteredSites: mockSites,
  isLoading: false,
  error: null,
  filters: {},
  setFilters: jest.fn(),
  refreshSites: jest.fn()
};

describe('SiteTable - Rendering', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    useSites.mockReturnValue(mockUseSitesReturn);
  });

  it('renders the table with sites data', () => {
    render(<SiteTable />);

    // Verify table structure
    expect(screen.getByTestId(SiteSelectors.table.container)).toBeInTheDocument();
    expect(screen.getByTestId(SiteSelectors.table.header)).toBeInTheDocument();

    // Verify all sites are displayed
    const rows = screen.getAllByTestId(SiteSelectors.table.row);
    expect(rows).toHaveLength(2);

    // Verify site data is displayed correctly
    expect(screen.getByText('Site 1')).toBeInTheDocument();
    expect(screen.getByText('Site 2')).toBeInTheDocument();
    expect(screen.getByText('site-1')).toBeInTheDocument();
    expect(screen.getByText('site-2')).toBeInTheDocument();
  });

  it('renders empty state when no sites are available', () => {
    // Mock empty sites list
    useSites.mockReturnValue({
      ...mockUseSitesReturn,
      sites: [],
      filteredSites: []
    });

    render(<SiteTable />);

    // Verify empty state
    expect(screen.getByTestId(SiteSelectors.table.emptyState)).toBeInTheDocument();
    expect(screen.getByText(/no sites found/i)).toBeInTheDocument();
  });
});
```

### Example 2: Delete Confirmation Interaction Test

```javascript
/**
 * @file DeleteConfirmationModal interaction test
 * @description Tests user interactions with the delete confirmation modal
 */

import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { DeleteConfirmationModal } from '@/components/admin/sites/DeleteConfirmationModal';
import { ModalSelectors } from './modal.selectors';

describe('DeleteConfirmationModal - Interaction', () => {
  // Set up user event instance
  const user = userEvent.setup();

  // Mock callbacks
  const mockOnConfirm = jest.fn();
  const mockOnCancel = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('calls onConfirm when confirm button is clicked', async () => {
    render(
      <DeleteConfirmationModal
        isOpen={true}
        onConfirm={mockOnConfirm}
        onCancel={mockOnCancel}
        itemName="Test Site"
      />
    );

    // Verify modal is displayed
    expect(screen.getByTestId(ModalSelectors.modal.container)).toBeInTheDocument();
    expect(screen.getByText(/are you sure/i)).toBeInTheDocument();
    expect(screen.getByText(/test site/i)).toBeInTheDocument();

    // Click confirm button
    await user.click(screen.getByTestId(ModalSelectors.modal.confirmButton));

    // Verify onConfirm callback was called
    expect(mockOnConfirm).toHaveBeenCalledTimes(1);
    expect(mockOnCancel).not.toHaveBeenCalled();
  });

  it('calls onCancel when cancel button is clicked', async () => {
    render(
      <DeleteConfirmationModal
        isOpen={true}
        onConfirm={mockOnConfirm}
        onCancel={mockOnCancel}
        itemName="Test Site"
      />
    );

    // Click cancel button
    await user.click(screen.getByTestId(ModalSelectors.modal.cancelButton));

    // Verify onCancel callback was called
    expect(mockOnCancel).toHaveBeenCalledTimes(1);
    expect(mockOnConfirm).not.toHaveBeenCalled();
  });

  it('calls onCancel when Escape key is pressed', async () => {
    render(
      <DeleteConfirmationModal
        isOpen={true}
        onConfirm={mockOnConfirm}
        onCancel={mockOnCancel}
        itemName="Test Site"
      />
    );

    // Press Escape key
    await user.keyboard('{Escape}');

    // Verify onCancel callback was called
    expect(mockOnCancel).toHaveBeenCalledTimes(1);
    expect(mockOnConfirm).not.toHaveBeenCalled();
  });

  it('does not render when isOpen is false', () => {
    render(
      <DeleteConfirmationModal
        isOpen={false}
        onConfirm={mockOnConfirm}
        onCancel={mockOnCancel}
        itemName="Test Site"
      />
    );

    // Modal should not be in the document
    expect(screen.queryByTestId(ModalSelectors.modal.container)).not.toBeInTheDocument();
  });
});
```

### Example 3: Form Validation Test

```javascript
/**
 * @file BasicInfoStep validation test
 * @description Tests form validation in the BasicInfoStep component
 */

import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BasicInfoStep } from '@/components/admin/sites/BasicInfoStep';
import { FormSelectors } from './form.selectors';

describe('BasicInfoStep - Validation', () => {
  const user = userEvent.setup();

  // Mock props
  const mockValues = {
    name: '',
    slug: '',
    description: ''
  };

  const mockErrors = {};
  const mockOnChange = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('displays validation errors when form is submitted with empty fields', async () => {
    // Mock errors
    const errorsWithValidation = {
      name: 'Name is required',
      slug: 'Slug is required'
    };

    render(
      <BasicInfoStep
        values={mockValues}
        errors={errorsWithValidation}
        onChange={mockOnChange}
        isLoading={false}
      />
    );

    // Verify error messages are displayed
    expect(screen.getByText('Name is required')).toBeInTheDocument();
    expect(screen.getByText('Slug is required')).toBeInTheDocument();
  });

  it('updates values when inputs change', async () => {
    render(
      <BasicInfoStep
        values={mockValues}
        errors={mockErrors}
        onChange={mockOnChange}
        isLoading={false}
      />
    );

    // Type in name field
    await user.type(screen.getByTestId(FormSelectors.basicInfo.nameInput), 'Test Site');

    // Verify onChange was called with correct values
    expect(mockOnChange).toHaveBeenCalledWith(expect.objectContaining({
      target: expect.objectContaining({
        name: 'name',
        value: 'Test Site'
      })
    }));

    // Type in slug field
    await user.type(screen.getByTestId(FormSelectors.basicInfo.slugInput), 'test-site');

    // Verify onChange was called with correct values
    expect(mockOnChange).toHaveBeenCalledWith(expect.objectContaining({
      target: expect.objectContaining({
        name: 'slug',
        value: 'test-site'
      })
    }));
  });

  it('autogenerates slug from name when slug is empty', async () => {
    // Mock implementation to simulate auto slug generation
    mockOnChange.mockImplementation((event) => {
      if (event.target.name === 'name' && mockValues.slug === '') {
        // Simulate a second call for slug update
        setTimeout(() => {
          mockOnChange({
            target: {
              name: 'slug',
              value: event.target.value.toLowerCase().replace(/\s+/g, '-')
            }
          });
        }, 0);
      }
    });

    render(
      <BasicInfoStep
        values={mockValues}
        errors={mockErrors}
        onChange={mockOnChange}
        isLoading={false}
      />
    );

    // Type in name field
    await user.type(screen.getByTestId(FormSelectors.basicInfo.nameInput), 'Test Site');

    // Wait for mock implementation to run
    await new Promise(resolve => setTimeout(resolve, 10));

    // Verify onChange was called for slug
    expect(mockOnChange).toHaveBeenCalledWith(expect.objectContaining({
      target: expect.objectContaining({
        name: 'slug',
        value: 'test-site'
      })
    }));
  });
});
```

## Troubleshooting

Common issues and solutions for E2E tests:

### Selector Not Found

If a selector isn't found, consider these steps:

1. Check that the component is using the correct data-testid attribute
2. Check if the component is conditionally rendered
3. Use the fallback selectors
4. Add more detailed error handling

```javascript
// Example with better error handling
try {
  const element = screen.getByTestId(Selectors.component.element);
  expect(element).toBeInTheDocument();
} catch (error) {
  console.error('Element not found. Available elements:');
  console.error(screen.debug());
  throw error;
}
```

### Asynchronous Operations

For tests with asynchronous operations:

1. Use `await` with user interactions: `await user.click(...)`
2. Use `waitFor` for operations with unknown completion time
3. Increase timeout for slow operations: `{ timeout: 5000 }`

```javascript
// Example with waitFor
await waitFor(() => {
  expect(screen.getByText('Success')).toBeInTheDocument();
}, { timeout: 5000 });
```

### Test Isolation

Ensure tests are isolated and don't affect each other:

1. Reset mocks in `beforeEach`
2. Clean up after tests in `afterEach`
3. Avoid shared mutable state

```javascript
// Example cleanup
afterEach(() => {
  // Restore all mocks
  jest.restoreAllMocks();

  // Clean up any mounted components
  cleanup();
});
```

## Developer Onboarding

When onboarding new developers to the E2E testing framework:

1. **Start with examples**: Review existing test files to understand patterns
2. **Follow naming conventions**: Use consistent file names
3. **Use selector files**: Create or update selector files for new components
4. **Group related tests**: Keep tests organized by feature
5. **Descriptive test names**: Write clear test descriptions
6. **Document edge cases**: Include tests for error states and edge cases

### Quick Start Guide

1. **Clone and setup**: Make sure you have the repository cloned and dependencies installed
2. **Run existing tests**: Run `npm run test:e2e:all` to see existing tests pass
3. **Study test structure**: Review the test files in `tests/e2e/` directory
4. **Create a selector file**: Create a selector file for your component
5. **Write rendering tests**: Start with basic rendering tests
6. **Add interaction tests**: Add tests for user interactions
7. **Test validation and states**: Add tests for validation and different states

### Running Tests

```bash
# Run all E2E tests
npm run test:e2e:all

# Run tests for a specific page/feature
npm run test:e2e

# Run a specific test file
npm run test:e2e -- -t "DeleteConfirmationModal"

# Run tests with debugging
DEBUG=true npm run test:e2e
```

By following this guide, you'll be able to create comprehensive, maintainable E2E tests that ensure the DirectoryMonster application functions correctly for users.
