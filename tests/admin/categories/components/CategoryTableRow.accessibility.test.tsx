/**
 * @jest-environment jsdom
 */
import React from 'react';
import { screen, within } from '@testing-library/react';
import '@testing-library/jest-dom';
import userEvent from '@testing-library/user-event';

// Import test helpers and category test data
import { renderWithTableContext } from '../../../utils/testHelpers';
import { mockCategory, mockChildCategory, mockDeleteClick } from '../../../fixtures/categoryFixtures';

// Import the component
import { CategoryTableRow } from '../../../../src/components/admin/categories/components';

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
 * Tests for CategoryTableRow accessibility features
 * 
 * This file focuses on testing ARIA attributes, keyboard navigation,
 * focus management, and other accessibility-related features.
 */
describe('CategoryTableRow Component - Accessibility', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Reset any lingering focus from previous tests
    if (document.activeElement instanceof HTMLElement) {
      document.activeElement.blur();
    }
  });

  it('provides proper ARIA attributes for rows', () => {
    renderWithTableContext(
      <CategoryTableRow 
        category={mockCategory} 
        showSiteColumn={false} 
        onDeleteClick={mockDeleteClick} 
      />
    );
    
    // Verify row has proper ARIA label
    const row = screen.getByRole('row');
    expect(row).toHaveAttribute('aria-label', `Category: ${mockCategory.name}`);
  });
  
  it('includes ARIA expanded attributes for categories with children', () => {
    renderWithTableContext(
      <CategoryTableRow 
        category={mockCategory} 
        showSiteColumn={false} 
        onDeleteClick={mockDeleteClick} 
      />
    );
    
    // Categories with children should have proper ARIA attributes
    const row = screen.getByRole('row');
    expect(row).toHaveAttribute('aria-expanded', 'true');
    expect(row).toHaveAttribute('aria-controls', `category-children-${mockCategory.id}`);
  });
  
  it('has proper ARIA label for the delete button', () => {
    renderWithTableContext(
      <CategoryTableRow 
        category={mockCategory} 
        showSiteColumn={false} 
        onDeleteClick={mockDeleteClick} 
      />
    );
    
    // Verify delete button has descriptive ARIA label
    const deleteButton = screen.getByTestId(`delete-button-${mockCategory.id}`);
    expect(deleteButton).toHaveAttribute('aria-label', `Delete ${mockCategory.name}`);
  });
  
  it('includes proper ARIA label for drag handle button', () => {
    renderWithTableContext(
      <CategoryTableRow 
        category={mockCategory} 
        showSiteColumn={false} 
        onDeleteClick={mockDeleteClick} 
        isDraggable={true}
      />
    );
    
    // Find drag handle button by aria-label
    const dragHandle = screen.getByRole('button', { name: /Drag to reorder/i });
    expect(dragHandle).toBeInTheDocument();
    expect(dragHandle).toHaveAttribute('aria-label', 'Drag to reorder');
  });
  
  it('includes aria-sort attribute on sorted columns', () => {
    renderWithTableContext(
      <CategoryTableRow 
        category={mockCategory} 
        showSiteColumn={false} 
        onDeleteClick={mockDeleteClick} 
        isSortedBy="name"
        sortDirection="asc"
      />
    );
    
    // Get the name cell (second cell)
    const cells = screen.getAllByRole('cell');
    const nameCell = cells[1];
    
    // Verify aria-sort attribute
    expect(nameCell).toHaveAttribute('aria-sort', 'ascending');
  });
  
  it('supports keyboard navigation through all interactive elements', async () => {
    const user = userEvent.setup();
    
    renderWithTableContext(
      <CategoryTableRow 
        category={mockCategory} 
        showSiteColumn={false} 
        onDeleteClick={mockDeleteClick} 
        isDraggable={true}
      />
    );
    
    // Find all interactive elements in the row
    const dragHandle = screen.getByRole('button', { name: /Drag to reorder/i });
    const viewLink = screen.getByText('View').closest('a');
    const editLink = screen.getByText('Edit').closest('a');
    const deleteButton = screen.getByTestId(`delete-button-${mockCategory.id}`);
    
    // Verify tab order starts with drag handle
    dragHandle.focus();
    expect(document.activeElement).toBe(dragHandle);
    
    // Tab to view link
    await user.tab();
    expect(document.activeElement).toBe(viewLink);
    
    // Tab to edit link
    await user.tab();
    expect(document.activeElement).toBe(editLink);
    
    // Tab to delete button
    await user.tab();
    expect(document.activeElement).toBe(deleteButton);
  });
  
  it('ensures focus indicator is visible on interactive elements', () => {
    renderWithTableContext(
      <CategoryTableRow 
        category={mockCategory} 
        showSiteColumn={false} 
        onDeleteClick={mockDeleteClick} 
      />
    );
    
    // Check view, edit, and delete buttons for focus styles
    const viewLink = screen.getByText('View').closest('a');
    const editLink = screen.getByText('Edit').closest('a');
    const deleteButton = screen.getByTestId(`delete-button-${mockCategory.id}`);
    
    // All interactive elements should have focus indicators
    [viewLink, editLink, deleteButton].forEach(element => {
      // Check for focus ring or outline classes
      expect(element.className).toMatch(/focus:(ring|outline)/);
    });
  });
  
  it('maintains semantic structure with proper heading levels', () => {
    renderWithTableContext(
      <CategoryTableRow 
        category={mockCategory} 
        showSiteColumn={false} 
        onDeleteClick={mockDeleteClick} 
      />
    );
    
    // Category name should be an h3 element for proper heading hierarchy
    const heading = screen.getByRole('heading', { level: 3 });
    expect(heading).toHaveTextContent(mockCategory.name);
  });
  
  it('provides visual distinction for parent-child relationships', () => {
    renderWithTableContext(
      <CategoryTableRow 
        category={mockChildCategory} 
        showSiteColumn={false} 
        onDeleteClick={mockDeleteClick} 
        depth={1}
      />
    );
    
    // Should display parent name in a smaller size for visual hierarchy
    const parentName = screen.getByTestId(`parent-name-${mockChildCategory.id}`);
    expect(parentName).toHaveClass('text-xs');
    
    // Should have a child indicator for hierarchical display
    const childIndicator = screen.getByTestId('child-indicator');
    expect(childIndicator).toBeInTheDocument();
  });
  
  it('has proper text contrast for readability', () => {
    renderWithTableContext(
      <CategoryTableRow 
        category={mockCategory} 
        showSiteColumn={false} 
        onDeleteClick={mockDeleteClick} 
      />
    );
    
    // Main category name should have higher contrast than secondary info
    const categoryName = screen.getByTestId(`category-name-${mockCategory.id}`);
    expect(categoryName).toHaveClass('text-gray-900'); // Higher contrast
    
    // Secondary data (like dates) should still be readable but lower contrast
    const cells = screen.getAllByRole('cell');
    const dateCell = cells[2];
    expect(dateCell).toHaveClass('text-gray-500'); // Lower but still readable contrast
  });
  
  it('supports keyboard control for action buttons', async () => {
    const user = userEvent.setup();
    
    renderWithTableContext(
      <CategoryTableRow 
        category={mockCategory} 
        showSiteColumn={false} 
        onDeleteClick={mockDeleteClick} 
      />
    );
    
    // Get delete button and focus it
    const deleteButton = screen.getByTestId(`delete-button-${mockCategory.id}`);
    deleteButton.focus();
    
    // Should be able to activate with both Enter and Space
    await user.keyboard('{Enter}');
    expect(mockDeleteClick).toHaveBeenCalledTimes(1);
    
    mockDeleteClick.mockClear();
    
    await user.keyboard(' ');
    expect(mockDeleteClick).toHaveBeenCalledTimes(1);
  });
  
  it('provides proper indentation for screen readers via semantics', () => {
    renderWithTableContext(
      <CategoryTableRow 
        category={mockChildCategory} 
        showSiteColumn={false} 
        onDeleteClick={mockDeleteClick} 
        depth={1}
      />
    );
    
    // Visual indentation is supplemented with parent name for screen readers
    const parentInfo = screen.getByTestId(`parent-name-${mockChildCategory.id}`);
    expect(parentInfo).toHaveTextContent('Test Category 1');
    
    // The row has proper ARIA attributes to indicate relationship
    const row = screen.getByRole('row');
    expect(row).toHaveAttribute('aria-label', `Category: ${mockChildCategory.name}`);
  });
  
  it('preserves accessibility when using drag handle for reordering', () => {
    renderWithTableContext(
      <CategoryTableRow 
        category={mockCategory} 
        showSiteColumn={false} 
        onDeleteClick={mockDeleteClick} 
        isDraggable={true}
      />
    );
    
    // Drag handle should have proper ARIA label
    const dragHandle = screen.getByRole('button', { name: /Drag to reorder/i });
    expect(dragHandle).toHaveAttribute('aria-label', 'Drag to reorder');
    
    // Should have proper focus states for keyboard users
    expect(dragHandle.className).toMatch(/hover:/); // Visual feedback on hover
  });
});
