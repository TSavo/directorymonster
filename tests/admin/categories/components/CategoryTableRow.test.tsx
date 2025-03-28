/**
 * @jest-environment jsdom
 */
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';

// Import the component
import { CategoryTableRow } from '../../../../src/components/admin/categories/components';
import { CategoryWithRelations } from '../../../../src/components/admin/categories/types';

// Mock next/link
jest.mock('next/link', () => {
  // eslint-disable-next-line react/display-name
  return ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href} data-testid="next-link">{children}</a>
  );
});

// Mock next/navigation
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
  }),
}));

// Helper function to render the component inside a table context
const renderWithTableContext = (ui: React.ReactElement) => {
  return render(
    <table>
      <tbody>
        {ui}
      </tbody>
    </table>
  );
};

describe('CategoryTableRow Component', () => {
  // Create a timestamp for consistent testing
  const now = Date.now();
  const oneDayAgo = now - 86400000; // 1 day ago
  const oneHourAgo = now - 3600000; // 1 hour ago
  const twelveHoursAgo = now - 43200000; // 12 hours ago
  const thirtyMinutesAgo = now - 1800000; // 30 minutes ago
  
  // Define mock test categories
  const mockCategory: CategoryWithRelations = {
    id: 'category_1',
    siteId: 'site_1',
    name: 'Test Category 1',
    slug: 'test-category-1',
    metaDescription: 'This is test category 1',
    order: 1,
    parentId: null,
    createdAt: oneDayAgo,
    updatedAt: oneHourAgo,
    childCount: 2,
    siteName: 'Test Site',
  };
  
  const mockCategoryWithSiteSlug: CategoryWithRelations = {
    ...mockCategory,
    siteSlug: 'test-site'
  };
  
  const mockChildCategory: CategoryWithRelations = {
    id: 'category_3',
    siteId: 'site_1',
    name: 'Child Category',
    slug: 'child-category',
    metaDescription: 'This is a child category',
    order: 1,
    parentId: 'category_1',
    createdAt: twelveHoursAgo,
    updatedAt: thirtyMinutesAgo,
    parentName: 'Test Category 1',
    childCount: 0,
    siteName: 'Test Site',
  };
  
  const mockDeepNestedCategory: CategoryWithRelations = {
    ...mockChildCategory,
    id: 'category_4',
    name: 'Deep Nested Category',
    slug: 'deep-nested-category',
    parentId: 'category_3',
    parentName: 'Child Category',
  };
  
  const mockDeleteClick = jest.fn();
  
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // Basic rendering tests
  describe('Basic Rendering', () => {
    it('renders the category name correctly', () => {
      renderWithTableContext(
        <CategoryTableRow 
          category={mockCategory} 
          showSiteColumn={false} 
          onDeleteClick={mockDeleteClick} 
        />
      );
      
      expect(screen.getByText('Test Category 1')).toBeInTheDocument();
      
      // Verify the row has proper ARIA label
      const row = screen.getByRole('row');
      expect(row).toHaveAttribute('aria-label', 'Category: Test Category 1');
    });
    
    it('renders the category order number correctly', () => {
      renderWithTableContext(
        <CategoryTableRow 
          category={mockCategory} 
          showSiteColumn={false} 
          onDeleteClick={mockDeleteClick} 
        />
      );
      
      // Check for order number in the first cell
      const cells = screen.getAllByRole('cell');
      expect(cells[0]).toHaveTextContent('1');
    });
    
    it('renders formatted date in the last updated column', () => {
      renderWithTableContext(
        <CategoryTableRow 
          category={mockCategory} 
          showSiteColumn={false} 
          onDeleteClick={mockDeleteClick} 
        />
      );
      
      // The date should be formatted in a readable way (verify date format)
      const cells = screen.getAllByRole('cell');
      const dateCell = cells[2]; // 3rd cell is the date cell when showSiteColumn is false
      expect(dateCell).toHaveTextContent(/\w{3} \d{1,2}, \d{4}/); // Format like "Mar 28, 2025"
    });
  });

  // Hierarchical display tests
  describe('Hierarchical Display', () => {
    it('renders child count indicator when category has children', () => {
      renderWithTableContext(
        <CategoryTableRow 
          category={mockCategory} 
          showSiteColumn={false} 
          onDeleteClick={mockDeleteClick} 
        />
      );
      
      // Check for child count badge
      const childCountBadge = screen.getByText('2');
      expect(childCountBadge).toBeInTheDocument();
      expect(childCountBadge).toHaveClass('bg-blue-100');
      expect(childCountBadge).toHaveClass('text-blue-800');
      
      // Verify row has proper ARIA attributes for expandable content
      const row = screen.getByRole('row');
      expect(row).toHaveAttribute('aria-expanded', 'true');
      expect(row).toHaveAttribute('aria-controls', 'category-children-category_1');
    });
    
    it('does not render child count badge when category has no children', () => {
      renderWithTableContext(
        <CategoryTableRow 
          category={mockChildCategory} 
          showSiteColumn={false} 
          onDeleteClick={mockDeleteClick} 
        />
      );
      
      // No child count badge should be present
      expect(screen.queryByText('0')).not.toBeInTheDocument();
      
      // Verify row doesn't have aria-expanded attribute
      const row = screen.getByRole('row');
      expect(row).not.toHaveAttribute('aria-expanded');
      expect(row).not.toHaveAttribute('aria-controls');
    });
    
    it('applies proper indentation for child categories', () => {
      renderWithTableContext(
        <CategoryTableRow 
          category={mockChildCategory} 
          showSiteColumn={false} 
          onDeleteClick={mockDeleteClick} 
          depth={1}
        />
      );
      
      // Check for indentation element or class
      const nameCell = screen.getByText('Child Category').closest('td');
      expect(nameCell).toHaveClass('pl-4'); // Using 1rem (4) indentation per level
      
      // Check for child indicator icon/element
      const childIndicator = screen.getByTestId('child-indicator');
      expect(childIndicator).toBeInTheDocument();
      expect(childIndicator).toHaveClass('mr-2');
      expect(childIndicator).toHaveClass('text-gray-400');
    });
    
    it('properly handles deep nesting levels with correct indentation', () => {
      renderWithTableContext(
        <CategoryTableRow 
          category={mockDeepNestedCategory}
          showSiteColumn={false}
          onDeleteClick={mockDeleteClick}
          depth={2}
        />
      );
      
      // Check for deeper indentation
      const nameCell = screen.getByText('Deep Nested Category').closest('td');
      expect(nameCell).toHaveClass('pl-8'); // 2rem (8) indentation for depth 2
    });
    
    it('handles hierarchical display with tree lines for child categories', () => {
      renderWithTableContext(
        <CategoryTableRow 
          category={mockChildCategory}
          showSiteColumn={false}
          onDeleteClick={mockDeleteClick}
          depth={1}
        />
      );
      
      // Check for tree line elements
      const treeLine = screen.getByTestId('tree-line-1');
      expect(treeLine).toBeInTheDocument();
      expect(treeLine).toHaveClass('border-l-2');
      expect(treeLine).toHaveClass('border-gray-200');
      expect(treeLine).toHaveClass('mr-2');
    });
    
    it('applies isLastChild class when specified', () => {
      renderWithTableContext(
        <CategoryTableRow 
          category={mockChildCategory}
          showSiteColumn={false}
          onDeleteClick={mockDeleteClick}
          depth={1}
          isLastChild={true}
        />
      );
      
      const row = screen.getByRole('row');
      expect(row).toHaveClass('last-child-category');
    });
    
    it('shows parent name for child categories', () => {
      renderWithTableContext(
        <CategoryTableRow 
          category={mockChildCategory} 
          showSiteColumn={false} 
          onDeleteClick={mockDeleteClick} 
        />
      );
      
      // Check for parent name reference
      const parentInfo = screen.getByText('Parent: Test Category 1');
      expect(parentInfo).toBeInTheDocument();
      expect(parentInfo).toHaveClass('text-xs');
      expect(parentInfo).toHaveClass('text-gray-500');
    });
    
    it('does not show parent name for top-level categories', () => {
      renderWithTableContext(
        <CategoryTableRow 
          category={mockCategory} 
          showSiteColumn={false} 
          onDeleteClick={mockDeleteClick} 
        />
      );
      
      // Check that no parent reference exists
      expect(screen.queryByText(/Parent:/)).not.toBeInTheDocument();
    });
  });

  // Site column tests
  describe('Site Column Display', () => {
    it('shows site column when showSiteColumn is true', () => {
      renderWithTableContext(
        <CategoryTableRow 
          category={mockCategory} 
          showSiteColumn={true} 
          onDeleteClick={mockDeleteClick} 
        />
      );
      
      expect(screen.getByText('Test Site')).toBeInTheDocument();
      
      // Verify cell position and styling
      const cells = screen.getAllByRole('cell');
      expect(cells[2]).toHaveTextContent('Test Site'); // Should be the 3rd cell
      expect(cells[2]).toHaveClass('text-gray-500');
    });
    
    it('hides site column when showSiteColumn is false', () => {
      renderWithTableContext(
        <CategoryTableRow 
          category={mockCategory} 
          showSiteColumn={false} 
          onDeleteClick={mockDeleteClick} 
        />
      );
      
      expect(screen.queryByText('Test Site')).not.toBeInTheDocument();
      
      // Verify number of cells
      const cells = screen.getAllByRole('cell');
      expect(cells.length).toBe(4); // One fewer cell than when site column is shown
    });
  });

  // Action buttons tests
  describe('Action Buttons', () => {
    it('renders action buttons with correct URLs when no siteSlug is provided', () => {
      renderWithTableContext(
        <CategoryTableRow 
          category={mockCategory} 
          showSiteColumn={false} 
          onDeleteClick={mockDeleteClick} 
        />
      );
      
      // Check View button/link
      const viewLink = screen.getByRole('link', { name: /View/i });
      expect(viewLink).toBeInTheDocument();
      expect(viewLink).toHaveAttribute('href', `/admin/categories/${mockCategory.id}`);
      expect(viewLink).toHaveClass('bg-blue-50');
      expect(viewLink).toHaveClass('text-blue-600');
      
      // Check Edit button/link
      const editLink = screen.getByRole('link', { name: /Edit/i });
      expect(editLink).toBeInTheDocument();
      expect(editLink).toHaveAttribute('href', `/admin/categories/${mockCategory.id}/edit`);
      expect(editLink).toHaveClass('bg-green-50');
      expect(editLink).toHaveClass('text-green-600');
      
      // Check Delete button
      const deleteButton = screen.getByRole('button', { name: /Delete/i });
      expect(deleteButton).toBeInTheDocument();
      expect(deleteButton).toHaveClass('bg-red-50');
      expect(deleteButton).toHaveClass('text-red-600');
    });
    
    it('renders action buttons with site-specific URLs when siteSlug is provided', () => {
      renderWithTableContext(
        <CategoryTableRow 
          category={mockCategoryWithSiteSlug} 
          showSiteColumn={false} 
          onDeleteClick={mockDeleteClick} 
        />
      );
      
      // Check View button/link
      const viewLink = screen.getByRole('link', { name: /View/i });
      expect(viewLink).toBeInTheDocument();
      expect(viewLink).toHaveAttribute('href', `/admin/sites/${mockCategoryWithSiteSlug.siteSlug}/categories/${mockCategoryWithSiteSlug.slug}`);
      
      // Check Edit button/link
      const editLink = screen.getByRole('link', { name: /Edit/i });
      expect(editLink).toBeInTheDocument();
      expect(editLink).toHaveAttribute('href', `/admin/sites/${mockCategoryWithSiteSlug.siteSlug}/categories/${mockCategoryWithSiteSlug.id}/edit`);
    });
    
    it('calls onDeleteClick with correct parameters when delete button is clicked', () => {
      renderWithTableContext(
        <CategoryTableRow 
          category={mockCategory} 
          showSiteColumn={false} 
          onDeleteClick={mockDeleteClick} 
        />
      );
      
      // Click delete button
      const deleteButton = screen.getByRole('button', { name: /Delete Test Category 1/i });
      fireEvent.click(deleteButton);
      
      // Check if onDeleteClick was called with correct parameters
      expect(mockDeleteClick).toHaveBeenCalledTimes(1);
      expect(mockDeleteClick).toHaveBeenCalledWith(mockCategory.id, mockCategory.name);
    });
  });

  // Sorting visual indicator tests
  describe('Sorting Indicators', () => {
    it('highlights name column when sorted by name ascending', () => {
      renderWithTableContext(
        <CategoryTableRow 
          category={mockCategory}
          showSiteColumn={false}
          onDeleteClick={mockDeleteClick}
          isSortedBy="name"
          sortDirection="asc"
        />
      );
      
      // Get the name cell and check it has sorting styles
      const nameCell = screen.getByText('Test Category 1').closest('td');
      expect(nameCell).toHaveClass('bg-blue-50');
      expect(nameCell).toHaveAttribute('aria-sort', 'ascending');
    });
    
    it('highlights order column when sorted by order descending', () => {
      renderWithTableContext(
        <CategoryTableRow 
          category={mockCategory}
          showSiteColumn={false}
          onDeleteClick={mockDeleteClick}
          isSortedBy="order"
          sortDirection="desc"
        />
      );
      
      // Get the order cell and check it has sorting styles
      const cells = screen.getAllByRole('cell');
      const orderCell = cells[0];
      expect(orderCell).toHaveClass('bg-blue-50');
      expect(orderCell).toHaveAttribute('aria-sort', 'descending');
    });
    
    it('highlights date column when sorted by updatedAt', () => {
      renderWithTableContext(
        <CategoryTableRow 
          category={mockCategory}
          showSiteColumn={false}
          onDeleteClick={mockDeleteClick}
          isSortedBy="updatedAt"
          sortDirection="asc"
        />
      );
      
      // Get the date cell and check it has sorting styles
      const cells = screen.getAllByRole('cell');
      const dateCell = cells[2]; // 3rd cell is the date cell when showSiteColumn is false
      expect(dateCell).toHaveClass('bg-blue-50');
      expect(dateCell).toHaveAttribute('aria-sort', 'ascending');
    });
  });

  // Drag handle for reordering
  describe('Drag Handle Functionality', () => {
    it('renders the drag handle for reordering when isDraggable is true', () => {
      renderWithTableContext(
        <CategoryTableRow 
          category={mockCategory}
          showSiteColumn={false}
          onDeleteClick={mockDeleteClick}
          isDraggable={true}
        />
      );
      
      // Check for drag handle element
      const dragHandle = screen.getByRole('button', { name: /Drag to reorder/i });
      expect(dragHandle).toBeInTheDocument();
      expect(dragHandle).toHaveClass('mr-2');
      expect(dragHandle).toHaveClass('text-gray-400');
    });
    
    it('does not render drag handle when isDraggable is false', () => {
      renderWithTableContext(
        <CategoryTableRow 
          category={mockCategory}
          showSiteColumn={false}
          onDeleteClick={mockDeleteClick}
          isDraggable={false}
        />
      );
      
      // Check that no drag handle is present
      expect(screen.queryByRole('button', { name: /Drag to reorder/i })).not.toBeInTheDocument();
    });
  });

  // Edge cases
  describe('Edge Cases', () => {
    it('handles categories with very long names', () => {
      const longNameCategory = {
        ...mockCategory,
        name: 'This is an extremely long category name that should still be displayed properly without breaking the layout of the table row'
      };
      
      renderWithTableContext(
        <CategoryTableRow 
          category={longNameCategory}
          showSiteColumn={false}
          onDeleteClick={mockDeleteClick}
        />
      );
      
      // Check that the long name is displayed
      expect(screen.getByText(longNameCategory.name)).toBeInTheDocument();
    });
    
    it('handles null childCount property', () => {
      const noChildCountCategory = {
        ...mockCategory,
        childCount: undefined
      };
      
      renderWithTableContext(
        <CategoryTableRow 
          category={noChildCountCategory}
          showSiteColumn={false}
          onDeleteClick={mockDeleteClick}
        />
      );
      
      // No child count badge should be present
      expect(screen.queryByText('2')).not.toBeInTheDocument();
    });
  });

  // Row styling tests
  describe('Row Styling', () => {
    it('applies proper hover styles to the row', () => {
      renderWithTableContext(
        <CategoryTableRow 
          category={mockCategory}
          showSiteColumn={false}
          onDeleteClick={mockDeleteClick}
        />
      );
      
      const row = screen.getByRole('row');
      expect(row).toHaveClass('hover:bg-gray-50');
      expect(row).toHaveClass('transition-colors');
      expect(row).toHaveClass('border-b');
      expect(row).toHaveClass('border-gray-200');
    });
  });
});
