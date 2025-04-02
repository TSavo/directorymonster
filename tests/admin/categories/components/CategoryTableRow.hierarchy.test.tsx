/**
 * @jest-environment jsdom
 */
import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';

// Import test helpers and category test data
import { renderWithTableContext } from '../../../utils/testHelpers';
import { mockCategory, mockChildCategory, mockDeepNestedCategory, mockDeleteClick } from '../../../fixtures/categoryFixtures';

// Import the component
import { CategoryTableRow } from '@/components/admin/categories/components';

// Mock next/link
jest.mock('next/link', () => {
  // eslint-disable-next-line react/display-name
  return ({ children, href, className }) => (
    <a href={href} data-testid="next-link" className={className}>{children}</a>
  );
});

// Mock next/navigation
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
  }),
}));

/**
 * Tests for CategoryTableRow hierarchical display
 * 
 * This file specifically tests the hierarchical representation,
 * including indentation, parent-child relationships, tree lines,
 * and visual hierarchy indicators.
 */
describe('CategoryTableRow Component - Hierarchical Display', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('displays child count badge for categories with children', () => {
    renderWithTableContext(
      <CategoryTableRow 
        category={mockCategory} 
        showSiteColumn={false} 
        onDeleteClick={mockDeleteClick} 
      />
    );
    
    // Find the child count badge by its content and verify its presence
    const childCountBadge = screen.getByText('2');
    expect(childCountBadge).toBeInTheDocument();
    
    // Verify it has styling that makes it visually distinct
    expect(childCountBadge).toHaveClass('rounded-full');
    
    // Verify the row has proper ARIA attributes for expandable content
    const row = screen.getByRole('row');
    expect(row).toHaveAttribute('aria-expanded', 'true');
    expect(row).toHaveAttribute('aria-controls', `category-children-${mockCategory.id}`);
  });
  
  it('does not display child count badge when category has no children', () => {
    renderWithTableContext(
      <CategoryTableRow 
        category={mockChildCategory} 
        showSiteColumn={false} 
        onDeleteClick={mockDeleteClick} 
      />
    );
    
    // Verify there's no child count badge element with a number
    const nameCell = screen.getByText('Child Category').closest('td');
    const badgeElements = nameCell.querySelectorAll('.rounded-full');
    expect(badgeElements.length).toBe(0);
    
    // Verify row doesn't have expandable content attributes
    const row = screen.getByRole('row');
    expect(row).not.toHaveAttribute('aria-expanded');
    expect(row).not.toHaveAttribute('aria-controls');
  });
  
  it('applies proper indentation based on category depth', () => {
    renderWithTableContext(
      <CategoryTableRow 
        category={mockChildCategory} 
        showSiteColumn={false} 
        onDeleteClick={mockDeleteClick} 
        depth={1}
      />
    );
    
    // For depth 1, should have pl-4 class (4 units of padding)
    const nameCell = screen.getByText('Child Category').closest('td');
    expect(nameCell).toHaveClass('pl-4');
    
    // Should have child indicator for non-root categories
    const childIndicator = screen.getByTestId('child-indicator');
    expect(childIndicator).toBeInTheDocument();
  });
  
  it('uses tree lines to visualize hierarchical relationships', () => {
    renderWithTableContext(
      <CategoryTableRow 
        category={mockChildCategory} 
        showSiteColumn={false}
        onDeleteClick={mockDeleteClick}
        depth={1}
      />
    );
    
    // Verify tree line is present for indicating hierarchy
    const treeLine = screen.getByTestId('tree-line-1');
    expect(treeLine).toBeInTheDocument();
    
    // Verify it has border styling to create the tree line appearance
    expect(treeLine).toHaveClass('border-l-2');
  });
  
  it('applies correct indentation for deeply nested categories', () => {
    renderWithTableContext(
      <CategoryTableRow 
        category={mockDeepNestedCategory}
        showSiteColumn={false}
        onDeleteClick={mockDeleteClick}
        depth={2}
      />
    );
    
    // For depth 2, should have pl-8 class (8 units of padding)
    const nameCell = screen.getByText('Deep Nested Category').closest('td');
    expect(nameCell).toHaveClass('pl-8');
    
    // Verify tree line indicator with depth 2
    const treeLine = screen.getByTestId('tree-line-2');
    expect(treeLine).toBeInTheDocument();
  });
  
  it('displays parent name for child categories', () => {
    renderWithTableContext(
      <CategoryTableRow 
        category={mockChildCategory} 
        showSiteColumn={false} 
        onDeleteClick={mockDeleteClick} 
      />
    );
    
    // Verify parent name is displayed under the category name
    const parentInfo = screen.getByTestId(`parent-name-${mockChildCategory.id}`);
    expect(parentInfo).toHaveTextContent('Test Category 1');
  });
  
  it('applies isLastChild class for styling the last child in a group', () => {
    renderWithTableContext(
      <CategoryTableRow 
        category={mockChildCategory}
        showSiteColumn={false}
        onDeleteClick={mockDeleteClick}
        depth={1}
        isLastChild={true}
      />
    );
    
    // Verify the special class for styling the last child is applied
    const row = screen.getByRole('row');
    expect(row).toHaveClass('last-child-category');
  });
  
  it('handles missing or undefined childCount gracefully', () => {
    const categoryWithoutChildCount = {
      ...mockCategory,
      childCount: undefined
    };
    
    renderWithTableContext(
      <CategoryTableRow 
        category={categoryWithoutChildCount}
        showSiteColumn={false}
        onDeleteClick={mockDeleteClick}
      />
    );
    
    // Verify no child count badge is displayed
    const nameCell = screen.getByText('Test Category 1').closest('td');
    const badgeElements = nameCell.querySelectorAll('.rounded-full');
    expect(badgeElements.length).toBe(0);
    
    // Verify the row doesn't have expandable content attributes
    const row = screen.getByRole('row');
    expect(row).not.toHaveAttribute('aria-expanded');
    expect(row).not.toHaveAttribute('aria-controls');
  });
});
