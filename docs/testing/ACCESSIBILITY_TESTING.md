# Accessibility Testing Guide

This guide focuses on best practices for testing accessibility in DirectoryMonster components, based on our successful implementation in the Category Management components.

## Why Accessibility Testing Matters

Accessibility testing ensures that our application is usable by everyone, including people with disabilities. It's not just about compliance - it's about creating a better user experience for all users.

Benefits include:
- **Wider audience reach** - approximately 15-20% of users have some form of disability
- **Legal compliance** - many jurisdictions require accessible web applications
- **Improved usability** for all users
- **Better SEO** - many accessibility practices also improve search engine ranking

## Accessibility Testing Approach

We integrate accessibility testing directly into our component tests, rather than treating it as a separate concern. This approach ensures that accessibility is considered from the beginning and maintained throughout development.

### Key Areas to Test

1. **Semantic HTML Structure**
2. **ARIA Attributes and Roles**
3. **Keyboard Navigation**
4. **Focus Management**
5. **Color Contrast and Visual Indicators**
6. **Screen Reader Compatibility**

## Testing Semantic HTML Structure

Proper HTML semantics provide built-in accessibility benefits. Test that components use appropriate elements:

```typescript
it('uses proper semantic table structure', () => {
  render(<CategoryTable />);
  
  // Table should use proper semantic elements
  expect(screen.getByRole('table')).toBeInTheDocument();
  expect(screen.getAllByRole('columnheader').length).toBeGreaterThan(0);
  expect(screen.getAllByRole('row').length).toBeGreaterThan(0);
  expect(screen.getAllByRole('cell').length).toBeGreaterThan(0);
});

it('uses semantic article elements for mobile cards', () => {
  render(<CategoriesMobileView categories={mockCategories} />);
  
  // Mobile cards should use article elements
  const articles = screen.getAllByRole('article');
  expect(articles.length).toBe(mockCategories.length);
  
  // Each article should have a heading
  articles.forEach(article => {
    expect(within(article).getByRole('heading')).toBeInTheDocument();
  });
});
```

## Testing ARIA Attributes and Roles

ARIA (Accessible Rich Internet Applications) attributes provide additional information to assistive technologies. Test that components use appropriate ARIA attributes:

```typescript
it('includes appropriate ARIA roles for interactive elements', () => {
  render(<CategoryTable />);
  
  // Search input should have proper role and label
  const searchInput = screen.getByTestId('search-input');
  expect(searchInput).toHaveAttribute('aria-label', 'Search categories');
  
  // Modal should have dialog role
  const modal = screen.getByTestId('delete-modal');
  expect(modal).toHaveAttribute('role', 'dialog');
  expect(modal).toHaveAttribute('aria-modal', 'true');
  
  // Check for aria-labelledby reference
  const labelId = modal.getAttribute('aria-labelledby');
  expect(document.getElementById(labelId!)).toHaveTextContent('Delete Category');
});

it('uses proper aria-sort for sortable columns', () => {
  setupCategoryTableTest({
    sortField: 'name',
    sortOrder: 'asc'
  });
  
  render(<CategoryTable />);
  
  // Active sort column should have aria-sort="ascending"
  const nameColumn = screen.getByTestId('sort-header-name');
  expect(nameColumn).toHaveAttribute('aria-sort', 'ascending');
  
  // Inactive sort columns should not have aria-sort
  const orderColumn = screen.getByTestId('sort-header-order');
  expect(orderColumn).not.toHaveAttribute('aria-sort');
});
```

## Testing Keyboard Navigation

Keyboard accessibility is essential for users who can't use a mouse. Test that all interactive elements can be accessed and activated via keyboard:

```typescript
it('supports keyboard navigation through all interactive elements', async () => {
  const user = userEvent.setup();
  render(<CategoryTable />);
  
  // Tab through all interactive elements and track focus order
  const expectedFocusOrder = [
    'search-input',
    'clear-search-button',
    'parent-filter-select',
    'site-filter-select',
    'reset-filters-button',
    'toggle-hierarchy-button',
    // ... more elements
  ];
  
  for (const testId of expectedFocusOrder) {
    await user.tab();
    expect(document.activeElement).toBe(screen.getByTestId(testId));
  }
});

it('allows keyboard activation of interactive elements', async () => {
  const user = userEvent.setup();
  const mockHandleSort = jest.fn();
  
  setupCategoryTableTest({ handleSort: mockHandleSort });
  render(<CategoryTable />);
  
  // Tab to a sort header
  const sortHeader = screen.getByTestId('sort-header-name');
  sortHeader.focus();
  
  // Activate with Enter key
  await user.keyboard('{Enter}');
  expect(mockHandleSort).toHaveBeenCalledWith('name');
  
  // Activate with Space key
  mockHandleSort.mockClear();
  await user.keyboard(' ');
  expect(mockHandleSort).toHaveBeenCalledWith('name');
});
```

## Testing Focus Management

Proper focus management is critical for keyboard users, especially for modals and dynamic content:

```typescript
it('traps focus within the delete confirmation modal', async () => {
  const user = userEvent.setup();
  
  setupCategoryTableTest({
    isDeleteModalOpen: true,
    categoryToDelete: { id: 'category_1', name: 'Test Category 1' }
  });
  
  render(<CategoryTable />);
  
  // Modal should be open
  const modal = screen.getByTestId('delete-modal');
  expect(modal).toBeInTheDocument();
  
  // Cancel button should be focused initially
  const cancelButton = screen.getByTestId('cancel-delete-button');
  expect(document.activeElement).toBe(cancelButton);
  
  // Tab to the next element (confirm button)
  await user.tab();
  const confirmButton = screen.getByTestId('confirm-delete-button');
  expect(document.activeElement).toBe(confirmButton);
  
  // Tab again should loop back to the first focusable element
  await user.tab();
  expect(document.activeElement).toBe(cancelButton);
  
  // Shift+Tab should cycle to the last element
  await user.keyboard('{Shift>}{Tab}{/Shift}');
  expect(document.activeElement).toBe(confirmButton);
});

it('restores focus when a modal is closed', async () => {
  const user = userEvent.setup();
  const mockCancelDelete = jest.fn();
  
  // Start with a normal table
  setupCategoryTableTest();
  render(<CategoryTable />);
  
  // Find and focus the delete button
  const deleteButton = screen.getByTestId('delete-button-category_1');
  deleteButton.focus();
  
  // Now open the modal
  setupCategoryTableTest({
    isDeleteModalOpen: true,
    categoryToDelete: { id: 'category_1', name: 'Test Category 1' },
    cancelDelete: mockCancelDelete
  });
  
  render(<CategoryTable />);
  
  // Cancel the deletion (close the modal)
  const cancelButton = screen.getByTestId('cancel-delete-button');
  await user.click(cancelButton);
  
  // Focus should return to the delete button
  expect(document.activeElement).toBe(deleteButton);
});
```

## Testing Status and Live Regions

Dynamic content updates need to be announced to screen reader users:

```typescript
it('provides appropriate live regions for status updates', () => {
  // Test loading state
  setupCategoryTableTest({ isLoading: true });
  render(<CategoryTable />);
  
  const loadingStatus = screen.getByTestId('loading-status');
  expect(loadingStatus).toHaveAttribute('role', 'status');
  expect(loadingStatus).toHaveAttribute('aria-live', 'polite');
  
  // Test error state
  setupCategoryTableTest({ error: 'Error message' });
  render(<CategoryTable />);
  
  const errorContainer = screen.getByTestId('error-container');
  expect(errorContainer).toHaveAttribute('role', 'alert');
  
  // Test pagination status
  setupCategoryTableTest();
  render(<CategoryTable />);
  
  const paginationStatus = screen.getByTestId('pagination-status');
  expect(paginationStatus).toHaveAttribute('role', 'status');
});
```

## Testing Form Controls

Form controls need proper labeling and association:

```typescript
it('ensures form controls have proper labels and associations', () => {
  render(<CategoryTable />);
  
  // Search input should have a label
  const searchInput = screen.getByTestId('search-input');
  expect(searchInput).toHaveAttribute('aria-label', 'Search categories');
  
  // Select elements should have labels
  const parentFilter = screen.getByTestId('parent-filter-select');
  expect(parentFilter).toHaveAttribute('aria-label', 'Filter by parent category');
  
  // Test explicit label associations if using <label> elements
  const labelElements = screen.getAllByRole('combobox');
  labelElements.forEach(select => {
    const labelId = select.getAttribute('aria-labelledby');
    if (labelId) {
      expect(document.getElementById(labelId)).toBeInTheDocument();
    }
  });
});
```

## Testing Responsive Components

Components that change based on screen size need special accessibility considerations:

```typescript
it('provides equivalent functionality in both desktop and mobile views', () => {
  render(<CategoryTable />);
  
  // Desktop table view
  const table = screen.getByRole('table');
  expect(table).toBeInTheDocument();
  
  // Mobile card view
  const mobileView = screen.getByTestId('categories-mobile-view');
  expect(mobileView).toBeInTheDocument();
  
  // Both views should have the same number of items
  const tableRows = within(table).getAllByRole('row').length - 1; // Subtract header row
  const mobileCards = within(mobileView).getAllByRole('article').length;
  expect(tableRows).toBe(mobileCards);
  
  // Both views should provide the same actions
  const tableActions = within(table).getAllByTestId(/delete-button/);
  const mobileActions = within(mobileView).getAllByTestId(/delete-button/);
  expect(tableActions.length).toBe(mobileActions.length);
});
```

## Best Practices for Writing Accessibility Tests

1. **Create dedicated accessibility test files**
   - Keep accessibility tests organized and focused
   - Example: `ComponentName.accessibility.test.tsx`

2. **Test keyboard interaction thoroughly**
   - Tab order
   - Enter/Space activation
   - Escape key for closing dialogs
   - Arrow keys for navigation where appropriate

3. **Verify ARIA attributes are dynamic and accurate**
   - Test that `aria-expanded`, `aria-selected`, etc. change with state
   - Verify that `aria-live` regions update properly

4. **Test focus management for modals and dialogs**
   - Focus should be trapped within modals
   - Focus should be restored when closing modals
   - Initial focus should be on the most logical element

5. **Test for hidden but accessible content**
   - Skip links
   - Screen reader only text
   - Off-screen content

## Implementing Accessible Components

Guidelines for making components accessible from the start:

### Tables
- Use proper `<table>`, `<th>`, `<td>` elements
- Add scope attributes to headers (`scope="col"` or `scope="row"`)
- Use `<caption>` or `aria-labelledby` to describe the table
- For sortable columns, use `aria-sort="ascending"` or `aria-sort="descending"`

### Forms
- Label all form controls with either:
  - `<label>` elements
  - `aria-label` attributes
  - `aria-labelledby` references
- Group related controls with `<fieldset>` and `<legend>`
- Provide error messages with `aria-invalid` and `aria-describedby`

### Modals and Dialogs
- Use `role="dialog"` and `aria-modal="true"`
- Set `aria-labelledby` to reference the modal title
- Trap focus within the modal
- Return focus to the triggering element when closed

### Dynamic Content
- Use `role="status"` for non-critical updates
- Use `role="alert"` for important or error messages
- Use `aria-live="polite"` for content that should be announced when the user is idle
- Use `aria-live="assertive"` for urgent information

### Interactive Elements
- Ensure all interactive elements can be operated by keyboard
- Use appropriate roles (`role="button"`, `role="tab"`, etc.)
- Provide proper state attributes (`aria-pressed`, `aria-selected`, etc.)
- Ensure sufficient color contrast (4.5:1 for normal text, 3:1 for large text)

## Resources

- [Web Content Accessibility Guidelines (WCAG) 2.1](https://www.w3.org/TR/WCAG21/)
- [MDN Web Docs - Accessibility](https://developer.mozilla.org/en-US/docs/Web/Accessibility)
- [Testing Library Accessibility](https://testing-library.com/docs/dom-testing-library/api-accessibility/)
- [Axe Core - Automated Accessibility Testing](https://github.com/dequelabs/axe-core)
- [WAI-ARIA Authoring Practices](https://www.w3.org/TR/wai-aria-practices-1.1/)
