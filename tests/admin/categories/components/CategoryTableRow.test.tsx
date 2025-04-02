/**
 * @jest-environment jsdom
 */
import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';

// Import test helpers and category test data
import { renderWithTableContext } from '../../../utils/testHelpers';
import { mockCategory, mockCategoryWithSiteSlug, mockChildCategory, mockDeepNestedCategory, mockDeleteClick } from '../../../fixtures/categoryFixtures';

// Import the component
import { CategoryTableRow } from '@/components/admin/categories/components';

// Mock next/link
jest.mock('next/link', () => {
  // eslint-disable-next-line react/display-name
  return ({ children, href, className, 'aria-label': ariaLabel }) => (
    <a href={href} data-testid="next-link" className={className} aria-label={ariaLabel}>{children}</a>
  );
});

// Mock next/navigation
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
  }),
}));

/**
 * Main test suite for CategoryTableRow component
 * 
 * This file includes the basic structure and rendering tests.
 * More specific tests are in separate files:
 * - CategoryTableRow.hierarchy.test.tsx - Tests for hierarchical display
 * - CategoryTableRow.actions.test.tsx - Tests for action buttons and interaction
 * - CategoryTableRow.accessibility.test.tsx - Tests for accessibility features
 * - CategoryTableRow.sorting.test.tsx - Tests for sorting indicators
 */
describe('CategoryTableRow Component - Basic Rendering', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Reset any lingering focus from previous tests
    if (document.activeElement instanceof HTMLElement) {
      document.activeElement.blur();
    }
  });

  it('renders the category information correctly', () => {
    renderWithTableContext(
      <CategoryTableRow 
        category={mockCategory} 
        showSiteColumn={false} 
        onDeleteClick={mockDeleteClick} 
      />
    );
    
    // Test specific data-testid attributes for more reliable selection
    expect(screen.getByTestId(`category-name-${mockCategory.id}`)).toHaveTextContent('Test Category 1');
    expect(screen.getByTestId(`delete-button-${mockCategory.id}`)).toBeInTheDocument();
    
    // Verify proper row structure with correct number of cells
    const cells = screen.getAllByRole('cell');
    expect(cells.length).toBe(4); // Order, Name, Date, Actions
    
    // Verify the row has proper ARIA label for accessibility
    const row = screen.getByRole('row');
    expect(row).toHaveAttribute('aria-label', 'Category: Test Category 1');
  });
  
  it('renders with correct semantic HTML structure', () => {
    renderWithTableContext(
      <CategoryTableRow 
        category={mockCategory} 
        showSiteColumn={false} 
        onDeleteClick={mockDeleteClick} 
      />
    );
    
    // Verify the row contains proper td elements
    const cells = screen.getAllByRole('cell');
    expect(cells.length).toBe(4);
    
    // Verify name cell contains an h3 element for proper heading hierarchy
    const heading = screen.getByRole('heading', { level: 3 });
    expect(heading).toHaveTextContent('Test Category 1');
    
    // Verify the actions cell contains proper interactive elements
    expect(screen.getAllByRole('link').length).toBe(2); // View and Edit links
    expect(screen.getByRole('button')).toBeInTheDocument(); // Delete button
  });
  
  it('formats dates in a human-readable format', () => {
    renderWithTableContext(
      <CategoryTableRow 
        category={mockCategory} 
        showSiteColumn={false} 
        onDeleteClick={mockDeleteClick} 
      />
    );
    
    // The date should be formatted in a consistent way
    const cells = screen.getAllByRole('cell');
    const dateCell = cells[2]; // 3rd cell is the date cell when showSiteColumn is false
    
    // Check for date format without relying on exact match
    expect(dateCell.textContent).toMatch(/\w{3} \d{1,2}, \d{4}(?:,| at)? \d{1,2}:\d{2} (AM|PM)/);
  });
  
  it('displays site name when showSiteColumn is true', () => {
    renderWithTableContext(
      <CategoryTableRow 
        category={mockCategory} 
        showSiteColumn={true} 
        onDeleteClick={mockDeleteClick} 
      />
    );
    
    // Verify site name is displayed
    expect(screen.getByText('Test Site')).toBeInTheDocument();
    
    // Verify cell count increased (now includes site column)
    const cells = screen.getAllByRole('cell');
    expect(cells.length).toBe(5); // Order, Name, Site, Date, Actions
  });
  
  it('does not display site column when showSiteColumn is false', () => {
    renderWithTableContext(
      <CategoryTableRow 
        category={mockCategory} 
        showSiteColumn={false} 
        onDeleteClick={mockDeleteClick} 
      />
    );
    
    // Site name should not be visible
    expect(screen.queryByText('Test Site')).not.toBeInTheDocument();
    
    // Verify correct cell count (no site column)
    const cells = screen.getAllByRole('cell');
    expect(cells.length).toBe(4); // Order, Name, Date, Actions
  });
  
  it('handles categories with extremely long names', () => {
    const longNameCategory = {
      ...mockCategory,
      name: 'This is an extremely long category name that should still be displayed properly without breaking the layout of the table row and should maintain proper alignment with other elements'
    };
    
    renderWithTableContext(
      <CategoryTableRow 
        category={longNameCategory}
        showSiteColumn={false}
        onDeleteClick={mockDeleteClick}
      />
    );
    
    // Verify the long name is displayed correctly
    expect(screen.getByTestId(`category-name-${longNameCategory.id}`)).toHaveTextContent(longNameCategory.name);
    
    // Verify the overall row structure is maintained
    const cells = screen.getAllByRole('cell');
    expect(cells.length).toBe(4);
  });
  
  it('applies proper visual styling to the row', () => {
    renderWithTableContext(
      <CategoryTableRow 
        category={mockCategory}
        showSiteColumn={false}
        onDeleteClick={mockDeleteClick}
      />
    );
    
    // Verify row has styling classes
    const row = screen.getByRole('row');
    expect(row).toHaveClass('border-b');
    expect(row).toHaveClass('hover:bg-gray-50');
  });
});
