/**
 * @jest-environment jsdom
 */
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';

// Import the component
import { CategoryTableRow } from '../../../../src/components/admin/categories/components';

// Mock next/link
jest.mock('next/link', () => {
  // eslint-disable-next-line react/display-name
  return ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  );
});

// Mock next/navigation
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
  }),
}));

describe('CategoryTableRow Component', () => {
  const mockCategory = {
    id: 'category_1',
    siteId: 'site_1',
    name: 'Test Category 1',
    slug: 'test-category-1',
    metaDescription: 'This is test category 1',
    order: 1,
    parentId: null,
    createdAt: Date.now() - 86400000, // 1 day ago
    updatedAt: Date.now() - 3600000,  // 1 hour ago
    childCount: 2,
    siteName: 'Test Site',
  };
  
  const mockChildCategory = {
    id: 'category_3',
    siteId: 'site_1',
    name: 'Child Category',
    slug: 'child-category',
    metaDescription: 'This is a child category',
    order: 1,
    parentId: 'category_1',
    createdAt: Date.now() - 43200000, // 12 hours ago
    updatedAt: Date.now() - 1800000,  // 30 minutes ago
    parentName: 'Test Category 1',
    childCount: 0,
    siteName: 'Test Site',
  };
  
  const mockDeleteClick = jest.fn();
  
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
  
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders the category name correctly', () => {
    renderWithTableContext(
      <CategoryTableRow 
        category={mockCategory} 
        showSiteColumn={false} 
        onDeleteClick={mockDeleteClick} 
      />
    );
    
    expect(screen.getByText('Test Category 1')).toBeInTheDocument();
  });
  
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
  });
  
  it('shows site column when showSiteColumn is true', () => {
    renderWithTableContext(
      <CategoryTableRow 
        category={mockCategory} 
        showSiteColumn={true} 
        onDeleteClick={mockDeleteClick} 
      />
    );
    
    expect(screen.getByText('Test Site')).toBeInTheDocument();
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
    expect(screen.getByText('Parent: Test Category 1')).toBeInTheDocument();
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
  
  it('renders action buttons with correct URLs', () => {
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
    
    // Check Edit button/link
    const editLink = screen.getByRole('link', { name: /Edit/i });
    expect(editLink).toBeInTheDocument();
    expect(editLink).toHaveAttribute('href', `/admin/categories/${mockCategory.id}/edit`);
    
    // Check Delete button
    const deleteButton = screen.getByRole('button', { name: /Delete/i });
    expect(deleteButton).toBeInTheDocument();
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
  
  it('renders the category order number correctly', () => {
    renderWithTableContext(
      <CategoryTableRow 
        category={mockCategory} 
        showSiteColumn={false} 
        onDeleteClick={mockDeleteClick} 
      />
    );
    
    // Check for order number
    expect(screen.getByText('1')).toBeInTheDocument();
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
  });
  
  it('properly handles deep nesting levels with correct indentation', () => {
    const deepNestedCategory = {
      ...mockChildCategory,
      id: 'category_4',
      name: 'Deep Nested Category',
      slug: 'deep-nested-category',
      parentId: 'category_3',
      parentName: 'Child Category',
    };
    
    renderWithTableContext(
      <CategoryTableRow 
        category={deepNestedCategory}
        showSiteColumn={false}
        onDeleteClick={mockDeleteClick}
        depth={2}
      />
    );
    
    // Check for deeper indentation
    const nameCell = screen.getByText('Deep Nested Category').closest('td');
    expect(nameCell).toHaveClass('pl-8'); // 2rem (8) indentation for depth 2
  });
  
  it('renders the drag handle for reordering when provided', () => {
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
  
  it('supports visually displaying sorting when column is sorted', () => {
    renderWithTableContext(
      <CategoryTableRow 
        category={mockCategory}
        showSiteColumn={false}
        onDeleteClick={mockDeleteClick}
        isSortedBy="name"
        sortDirection="asc"
      />
    );
    
    // Check that the name cell has a visual indicator for sorting
    const nameCell = screen.getByText('Test Category 1').closest('td');
    expect(nameCell).toHaveClass('bg-blue-50');
    expect(nameCell).toHaveAttribute('aria-sort', 'ascending');
  });
});
