/**
 * @jest-environment jsdom
 */
import React from 'react';
import { screen } from '@testing-library/react';
import '@testing-library/jest-dom';

// Import test helpers and category test data
import { renderWithTableContext } from '../../../utils/testHelpers';
import { mockCategory, mockDeleteClick } from '../../../fixtures/categoryFixtures';

// Import the component
import { CategoryTableRow } from '../../../../src/components/admin/categories/components';

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
 * Tests for CategoryTableRow sorting indicators
 * 
 * This file specifically tests the visual indicators and ARIA attributes
 * that show which column is being sorted and in which direction.
 */
describe('CategoryTableRow Component - Sorting Indicators', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('applies visual indication when row is sorted by name ascending', () => {
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
    
    // Verify visual indication of sorting
    expect(nameCell).toHaveClass('bg-blue-50');
    
    // Verify correct ARIA attribute for accessibility
    expect(nameCell).toHaveAttribute('aria-sort', 'ascending');
  });
  
  it('applies visual indication when row is sorted by name descending', () => {
    renderWithTableContext(
      <CategoryTableRow 
        category={mockCategory}
        showSiteColumn={false}
        onDeleteClick={mockDeleteClick}
        isSortedBy="name"
        sortDirection="desc"
      />
    );
    
    // Get the name cell (second cell)
    const cells = screen.getAllByRole('cell');
    const nameCell = cells[1];
    
    // Verify visual indication of sorting
    expect(nameCell).toHaveClass('bg-blue-50');
    
    // Verify correct ARIA attribute for accessibility
    expect(nameCell).toHaveAttribute('aria-sort', 'descending');
  });
  
  it('applies visual indication when row is sorted by order', () => {
    renderWithTableContext(
      <CategoryTableRow 
        category={mockCategory}
        showSiteColumn={false}
        onDeleteClick={mockDeleteClick}
        isSortedBy="order"
        sortDirection="desc"
      />
    );
    
    // Get the order cell (first cell)
    const cells = screen.getAllByRole('cell');
    const orderCell = cells[0];
    
    // Verify visual indication of sorting
    expect(orderCell).toHaveClass('bg-blue-50');
    
    // Verify correct ARIA attribute for accessibility
    expect(orderCell).toHaveAttribute('aria-sort', 'descending');
  });
  
  it('applies visual indication when row is sorted by updatedAt', () => {
    renderWithTableContext(
      <CategoryTableRow 
        category={mockCategory}
        showSiteColumn={false}
        onDeleteClick={mockDeleteClick}
        isSortedBy="updatedAt"
        sortDirection="asc"
      />
    );
    
    // Get the date cell (third cell when showSiteColumn is false)
    const cells = screen.getAllByRole('cell');
    const dateCell = cells[2];
    
    // Verify visual indication of sorting
    expect(dateCell).toHaveClass('bg-blue-50');
    
    // Verify correct ARIA attribute for accessibility
    expect(dateCell).toHaveAttribute('aria-sort', 'ascending');
  });
  
  it('applies no sorting indication when not sorted', () => {
    renderWithTableContext(
      <CategoryTableRow 
        category={mockCategory}
        showSiteColumn={false}
        onDeleteClick={mockDeleteClick}
        // No isSortedBy or sortDirection props
      />
    );
    
    // Get all cells
    const cells = screen.getAllByRole('cell');
    
    // Verify no sorting indication is applied to any cell
    cells.forEach(cell => {
      expect(cell).not.toHaveClass('bg-blue-50');
      expect(cell).not.toHaveAttribute('aria-sort');
    });
  });
  
  it('applies sorting indicators correctly when site column is shown', () => {
    renderWithTableContext(
      <CategoryTableRow 
        category={mockCategory}
        showSiteColumn={true}
        onDeleteClick={mockDeleteClick}
        isSortedBy="updatedAt"
        sortDirection="asc"
      />
    );
    
    // With site column shown, the date cell is the fourth cell
    const cells = screen.getAllByRole('cell');
    const dateCell = cells[3]; // 4th cell with site column shown
    
    // Verify correct cell has sorting indication
    expect(dateCell).toHaveClass('bg-blue-50');
    expect(dateCell).toHaveAttribute('aria-sort', 'ascending');
    
    // Verify other cells don't have sorting indication
    expect(cells[0]).not.toHaveClass('bg-blue-50'); // Order
    expect(cells[1]).not.toHaveClass('bg-blue-50'); // Name
    expect(cells[2]).not.toHaveClass('bg-blue-50'); // Site
    expect(cells[4]).not.toHaveClass('bg-blue-50'); // Actions
  });
});
