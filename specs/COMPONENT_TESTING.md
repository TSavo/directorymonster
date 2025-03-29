# Component Testing Patterns

This document provides specific patterns and examples for testing components in the DirectoryMonster application.

## Table of Contents

1. [Component Test Structure](#component-test-structure)
2. [Common Testing Patterns](#common-testing-patterns)
3. [Mock Implementations](#mock-implementations)
4. [Accessibility Testing](#accessibility-testing)
5. [Form Testing](#form-testing)
6. [Data Display Testing](#data-display-testing)
7. [Examples](#examples)

## Component Test Structure

Each component test file should follow this basic structure:

```tsx
import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ComponentName } from '@/components/path/to/ComponentName';

// Mock dependencies as needed
jest.mock('dependency', () => ({
  useSomething: () => ({ data: [], loading: false, error: null }),
}));

// Setup mock data
const mockData = {
  // Component props or state here
};

describe('ComponentName', () => {
  // Setup test user for interactions
  const user = userEvent.setup();
  
  // Reset mocks before each test
  beforeEach(() => {
    jest.clearAllMocks();
  });
  
  it('renders correctly', () => {
    render(<ComponentName />);
    
    // Assertions about initial rendering
    expect(screen.getByTestId('component-testid')).toBeInTheDocument();
  });
  
  it('handles user interactions', async () => {
    render(<ComponentName />);
    
    // Trigger user action
    await user.click(screen.getByRole('button', { name: /submit/i }));
    
    // Assert expected outcome
    expect(screen.getByText('Success')).toBeInTheDocument();
  });
  
  // Additional test cases...
});
```

## Common Testing Patterns

### 1. Testing Component Rendering

```tsx
it('renders in the default state', () => {
  render(<MyComponent />);
  
  expect(screen.getByTestId('component-header')).toHaveTextContent('My Component');
  expect(screen.getByTestId('component-description')).toBeInTheDocument();
});

it('renders with custom props', () => {
  render(<MyComponent title="Custom Title" showDescription={false} />);
  
  expect(screen.getByTestId('component-header')).toHaveTextContent('Custom Title');
  expect(screen.queryByTestId('component-description')).not.toBeInTheDocument();
});
```

### 2. Testing User Interactions

```tsx
it('toggles content when button is clicked', async () => {
  const user = userEvent.setup();
  render(<Accordion title="Test Section" content="Hidden content" />);
  
  // Content should be hidden initially
  expect(screen.queryByTestId('accordion-content')).not.toBeInTheDocument();
  
  // Click to expand
  await user.click(screen.getByTestId('accordion-header'));
  
  // Content should be visible
  expect(screen.getByTestId('accordion-content')).toBeInTheDocument();
  expect(screen.getByTestId('accordion-content')).toHaveTextContent('Hidden content');
  
  // Click to collapse
  await user.click(screen.getByTestId('accordion-header'));
  
  // Content should be hidden again
  expect(screen.queryByTestId('accordion-content')).not.toBeInTheDocument();
});
```

### 3. Testing Asynchronous Operations

```tsx
it('loads and displays data', async () => {
  // Mock API response
  (global.fetch as jest.Mock).mockResolvedValueOnce({
    ok: true,
    json: async () => ({ items: [{ id: 1, name: 'Item 1' }] }),
  });
  
  render(<DataList />);
  
  // Should show loading state initially
  expect(screen.getByTestId('loading-indicator')).toBeInTheDocument();
  
  // Wait for data to load
  await waitFor(() => {
    expect(screen.queryByTestId('loading-indicator')).not.toBeInTheDocument();
  });
  
  // Should display the data
  expect(screen.getByTestId('item-1')).toHaveTextContent('Item 1');
});
```

## Mock Implementations

### 1. Mocking Next.js Router

Create a custom mock implementation:

```tsx
// __mocks__/nextNavigation.tsx
export const mockRouter = {
  push: jest.fn(),
  back: jest.fn(),
  refresh: jest.fn(),
  pathname: '/test-path',
};

export const useRouter = jest.fn(() => mockRouter);

export const resetMocks = () => {
  mockRouter.push.mockReset();
  mockRouter.back.mockReset();
  // Reset other mock functions...
  useRouter.mockImplementation(() => mockRouter);
};
```

Use the mock in your tests:

```tsx
// Import the mock
import { useRouter, resetMocks } from './__mocks__/nextNavigation';

// Mock the module
jest.mock('next/navigation', () => ({
  useRouter: () => useRouter(),
}));

describe('NavigationComponent', () => {
  beforeEach(() => {
    resetMocks();
  });
  
  it('navigates when button is clicked', async () => {
    const user = userEvent.setup();
    render(<NavigationComponent />);
    
    await user.click(screen.getByText('Go to Dashboard'));
    
    expect(useRouter().push).toHaveBeenCalledWith('/dashboard');
  });
});
```

### 2. Mocking API Calls

```tsx
// Global fetch mock
global.fetch = jest.fn();

beforeEach(() => {
  (global.fetch as jest.Mock).mockReset();
});

it('fetches and displays data', async () => {
  // Mock successful response
  (global.fetch as jest.Mock).mockResolvedValueOnce({
    ok: true,
    json: async () => ({ data: ['Item 1', 'Item 2'] }),
  });
  
  render(<DataComponent />);
  
  // Click button that triggers fetch
  await user.click(screen.getByText('Load Data'));
  
  // Verify fetch was called with correct parameters
  expect(global.fetch).toHaveBeenCalledWith(
    '/api/data',
    expect.objectContaining({ method: 'GET' })
  );
  
  // Verify data is displayed
  await waitFor(() => {
    expect(screen.getByText('Item 1')).toBeInTheDocument();
    expect(screen.getByText('Item 2')).toBeInTheDocument();
  });
});

it('handles API errors', async () => {
  // Mock error response
  (global.fetch as jest.Mock).mockResolvedValueOnce({
    ok: false,
    json: async () => ({ error: 'Failed to load data' }),
  });
  
  render(<DataComponent />);
  
  await user.click(screen.getByText('Load Data'));
  
  // Verify error is displayed
  await waitFor(() => {
    expect(screen.getByText('Error: Failed to load data')).toBeInTheDocument();
  });
});
```

## Accessibility Testing

### 1. Focus Management

```tsx
it('properly manages focus in modal dialog', async () => {
  const user = userEvent.setup();
  render(<ModalDialog isOpen={true} />);
  
  // Initial focus should be on the first focusable element
  expect(document.activeElement).toBe(screen.getByTestId('modal-close-button'));
  
  // Tab to next element
  await user.tab();
  expect(document.activeElement).toBe(screen.getByTestId('modal-confirm-button'));
  
  // Tab again should cycle back to first element (focus trap)
  await user.tab();
  expect(document.activeElement).toBe(screen.getByTestId('modal-close-button'));
  
  // Test escape key closes modal
  await user.keyboard('{Escape}');
  expect(screen.queryByTestId('modal-dialog')).not.toBeInTheDocument();
});
```

### 2. ARIA Attributes

```tsx
it('has proper ARIA attributes', () => {
  render(<Tabs tabs={[{ label: 'Tab 1', content: 'Content 1' }]} />);
  
  // Test tab list
  const tabList = screen.getByRole('tablist');
  expect(tabList).toHaveAttribute('aria-label', 'Tabs');
  
  // Test tab
  const tab = screen.getByRole('tab');
  expect(tab).toHaveAttribute('aria-selected', 'true');
  expect(tab).toHaveAttribute('aria-controls', 'tab-panel-0');
  
  // Test tab panel
  const tabPanel = screen.getByRole('tabpanel');
  expect(tabPanel).toHaveAttribute('aria-labelledby', tab.id);
});
```

## Form Testing

### 1. Input Validation

```tsx
it('validates form input', async () => {
  const user = userEvent.setup();
  render(<LoginForm />);
  
  // Try to submit without filling required fields
  await user.click(screen.getByTestId('submit-button'));
  
  // Check for validation errors
  expect(screen.getByTestId('email-error')).toHaveTextContent('Email is required');
  expect(screen.getByTestId('password-error')).toHaveTextContent('Password is required');
  
  // Fill in email with invalid format
  await user.type(screen.getByTestId('email-input'), 'invalid-email');
  await user.click(screen.getByTestId('submit-button'));
  
  // Check for format validation
  expect(screen.getByTestId('email-error')).toHaveTextContent('Invalid email format');
});
```

### 2. Form Submission

```tsx
it('submits form data correctly', async () => {
  const mockSubmit = jest.fn();
  const user = userEvent.setup();
  
  render(<ContactForm onSubmit={mockSubmit} />);
  
  // Fill out form
  await user.type(screen.getByTestId('name-input'), 'John Doe');
  await user.type(screen.getByTestId('email-input'), 'john@example.com');
  await user.type(screen.getByTestId('message-input'), 'Test message');
  
  // Submit form
  await user.click(screen.getByTestId('submit-button'));
  
  // Verify submission
  expect(mockSubmit).toHaveBeenCalledWith({
    name: 'John Doe',
    email: 'john@example.com',
    message: 'Test message'
  });
});
```

## Data Display Testing

### 1. Table Components

```tsx
it('renders table with correct data', () => {
  const data = [
    { id: 1, name: 'Item 1', category: 'A' },
    { id: 2, name: 'Item 2', category: 'B' }
  ];
  
  render(<DataTable data={data} />);
  
  // Check headers
  expect(screen.getByText('ID')).toBeInTheDocument();
  expect(screen.getByText('Name')).toBeInTheDocument();
  expect(screen.getByText('Category')).toBeInTheDocument();
  
  // Check data rows
  expect(screen.getByTestId('row-1')).toBeInTheDocument();
  expect(screen.getByTestId('row-1-name')).toHaveTextContent('Item 1');
  expect(screen.getByTestId('row-2-category')).toHaveTextContent('B');
});
```

### 2. Pagination

```tsx
it('handles pagination correctly', async () => {
  const user = userEvent.setup();
  const data = Array.from({ length: 25 }, (_, i) => ({ id: i + 1, name: `Item ${i + 1}` }));
  
  render(<PaginatedList data={data} itemsPerPage={10} />);
  
  // First page should show items 1-10
  expect(screen.getByText('Item 1')).toBeInTheDocument();
  expect(screen.getByText('Item 10')).toBeInTheDocument();
  expect(screen.queryByText('Item 11')).not.toBeInTheDocument();
  
  // Navigate to second page
  await user.click(screen.getByTestId('next-page-button'));
  
  // Should now show items 11-20
  expect(screen.queryByText('Item 10')).not.toBeInTheDocument();
  expect(screen.getByText('Item 11')).toBeInTheDocument();
  expect(screen.getByText('Item 20')).toBeInTheDocument();
});
```

## Examples

### Example 1: Testing the SiteForm Component

```tsx
describe('SiteForm Component', () => {
  const user = userEvent.setup();
  
  beforeEach(() => {
    jest.clearAllMocks();
    resetMocks();
    (global.fetch as jest.Mock).mockReset();
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({ id: 'site-1', name: 'Test Site', slug: 'test-site' })
    });
  });
  
  it('renders in create mode correctly', () => {
    render(<SiteForm />);
    
    expect(screen.getByTestId('siteForm-header')).toHaveTextContent('Create Site');
    expect(screen.getByTestId('siteForm-submit')).toHaveTextContent('Create Site');
  });
  
  it('allows adding a valid domain', async () => {
    render(<SiteForm />);
    
    // Enter a valid domain
    await user.type(screen.getByTestId('siteForm-new-domain'), 'example.com');
    
    // Click add button
    await user.click(screen.getByTestId('siteForm-add-domain'));
    
    // Verify domain was added
    expect(screen.getByTestId('siteForm-domain-0')).toHaveTextContent('example.com');
    
    // Verify input was cleared
    expect(screen.getByTestId('siteForm-new-domain')).toHaveValue('');
  });
  
  it('successfully submits the form', async () => {
    render(<SiteForm />);
    
    // Fill out the form
    await user.type(screen.getByTestId('siteForm-name'), 'New Test Site');
    await user.type(screen.getByTestId('siteForm-slug'), 'new-test-site');
    await user.type(screen.getByTestId('siteForm-description'), 'This is a test site description');
    
    // Add a domain
    await user.type(screen.getByTestId('siteForm-new-domain'), 'testsite.com');
    await user.click(screen.getByTestId('siteForm-add-domain'));
    
    // Submit the form
    await user.click(screen.getByTestId('siteForm-submit'));
    
    // Verify API was called with correct data
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        '/api/sites',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({
            name: 'New Test Site',
            slug: 'new-test-site',
            description: 'This is a test site description',
            domains: ['testsite.com']
          })
        })
      );
    });
    
    // Verify success message
    await waitFor(() => {
      expect(screen.getByTestId('siteForm-success')).toBeInTheDocument();
    });
  });
});
```

### Example 2: Testing Custom Hooks

```tsx
import { renderHook, act } from '@testing-library/react';
import { usePagination } from '@/hooks/usePagination';

describe('usePagination Hook', () => {
  it('initializes with correct default values', () => {
    const { result } = renderHook(() => usePagination({
      totalItems: 100,
      initialPage: 1,
      itemsPerPage: 10
    }));
    
    expect(result.current.currentPage).toBe(1);
    expect(result.current.totalPages).toBe(10);
    expect(result.current.pageItems).toEqual([]);
  });
  
  it('navigates between pages', () => {
    const { result } = renderHook(() => usePagination({
      totalItems: 100,
      initialPage: 1,
      itemsPerPage: 10
    }));
    
    // Go to next page
    act(() => {
      result.current.nextPage();
    });
    expect(result.current.currentPage).toBe(2);
    
    // Go to previous page
    act(() => {
      result.current.prevPage();
    });
    expect(result.current.currentPage).toBe(1);
    
    // Go to specific page
    act(() => {
      result.current.goToPage(5);
    });
    expect(result.current.currentPage).toBe(5);
  });
  
  it('handles edge cases correctly', () => {
    const { result } = renderHook(() => usePagination({
      totalItems: 100,
      initialPage: 1,
      itemsPerPage: 10
    }));
    
    // Try to go below first page
    act(() => {
      result.current.prevPage();
    });
    expect(result.current.currentPage).toBe(1); // Should remain at first page
    
    // Try to go beyond last page
    act(() => {
      result.current.goToPage(15);
    });
    expect(result.current.currentPage).toBe(10); // Should stop at last page
  });
});
```
