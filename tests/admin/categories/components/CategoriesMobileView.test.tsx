/**
 * @jest-environment jsdom
 */
import React from 'react';
import { render, screen, fireEvent, within } from '@testing-library/react';
import '@testing-library/jest-dom';

// Import the component
import { CategoriesMobileView } from '../../../../src/components/admin/categories/components';

// Mock data
const mockCategories = [
  { 
    id: 'category_1', 
    name: 'Test Category 1', 
    slug: 'test-category-1', 
    metaDescription: 'This is test category 1',
    order: 1, 
    parentId: null,
    siteId: 'site_1', 
    createdAt: Date.now() - 86400000, 
    updatedAt: Date.now() - 3600000,
    childCount: 2,
    siteName: 'Test Site'
  },
  { 
    id: 'category_2', 
    name: 'Test Category 2', 
    slug: 'test-category-2', 
    metaDescription: 'This is test category 2',
    order: 2, 
    parentId: null,
    siteId: 'site_1', 
    createdAt: Date.now() - 172800000, 
    updatedAt: Date.now() - 7200000,
    childCount: 0,
    siteName: 'Test Site'
  },
  { 
    id: 'category_3', 
    name: 'Child Category', 
    slug: 'child-category', 
    metaDescription: 'This is a child category',
    order: 1, 
    parentId: 'category_1',
    siteId: 'site_1', 
    createdAt: Date.now() - 43200000, 
    updatedAt: Date.now() - 1800000,
    parentName: 'Test Category 1',
    childCount: 0,
    siteName: 'Test Site'
  }
];

// Mock next/link
jest.mock('next/link', () => {
  // eslint-disable-next-line react/display-name
  return ({ children, href, className, 'data-testid': dataTestId }: { 
    children: React.ReactNode; 
    href: string;
    className?: string;
    'data-testid'?: string;
  }) => (
    <a href={href} className={className} data-testid={dataTestId}>{children}</a>
  );
});

describe('CategoriesMobileView Component', () => {
  const mockOnDeleteClick = jest.fn();
  const defaultProps = {
    categories: mockCategories,
    showSiteColumn: false,
    onDeleteClick: mockOnDeleteClick
  };
  
  beforeEach(() => {
    jest.clearAllMocks();
  });
  
  it('renders category cards for all provided categories', () => {
    render(<CategoriesMobileView {...defaultProps} />);
    
    // Check main container exists
    const container = screen.getByTestId('categories-mobile-view');
    expect(container).toBeInTheDocument();
    
    // Should render 3 category cards with appropriate testids
    expect(screen.getByTestId('category-card-category_1')).toBeInTheDocument();
    expect(screen.getByTestId('category-card-category_2')).toBeInTheDocument();
    expect(screen.getByTestId('category-card-category_3')).toBeInTheDocument();
    
    // Verify category names using testids
    expect(screen.getByTestId('category-name-category_1')).toHaveTextContent('Test Category 1');
    expect(screen.getByTestId('category-name-category_2')).toHaveTextContent('Test Category 2');
    expect(screen.getByTestId('category-name-category_3')).toHaveTextContent('Child Category');
  });
  
  it('shows child category indicator with parent name for child categories', () => {
    render(<CategoriesMobileView {...defaultProps} />);
    
    // Find the child category by its test ID
    const childCategory = screen.getByTestId('category-card-category_3');
    
    // Use within to scope queries to just this card
    const parentLabel = within(childCategory).getByTestId('parent-label');
    expect(parentLabel).toHaveTextContent('Parent:');
    
    // Check parent name using testid
    const parentName = within(childCategory).getByTestId('parent-name-category_3');
    expect(parentName).toHaveTextContent('Test Category 1');
  });
  
  it('shows child count for categories with children', () => {
    render(<CategoriesMobileView {...defaultProps} />);
    
    // Check child count badge using test ID
    const childCountBadge = screen.getByTestId('child-count-category_1');
    expect(childCountBadge).toHaveTextContent('2');
    
    // Only verify essential styling, not implementation details
    expect(childCountBadge).toHaveClass('bg-blue-100');
    expect(childCountBadge).toHaveClass('text-blue-800');
  });
  
  it('shows site information when showSiteColumn is true', () => {
    render(<CategoriesMobileView {...defaultProps} showSiteColumn={true} />);
    
    // Check site labels are present
    const siteLabels = screen.getAllByTestId('site-label');
    expect(siteLabels).toHaveLength(3);
    expect(siteLabels[0]).toHaveTextContent('Site:');
    
    // Check site names using test IDs
    expect(screen.getByTestId('site-name-category_1')).toHaveTextContent('Test Site');
    expect(screen.getByTestId('site-name-category_2')).toHaveTextContent('Test Site');
    expect(screen.getByTestId('site-name-category_3')).toHaveTextContent('Test Site');
  });
  
  it('does not show site information when showSiteColumn is false', () => {
    render(<CategoriesMobileView {...defaultProps} showSiteColumn={false} />);
    
    // Should not show site labels
    expect(screen.queryByTestId('site-label')).not.toBeInTheDocument();
    expect(screen.queryByTestId('site-name-category_1')).not.toBeInTheDocument();
  });
  
  it('calls onDeleteClick with correct parameters when delete button is clicked', () => {
    render(<CategoriesMobileView {...defaultProps} />);
    
    // Find delete button by test ID
    const deleteButton = screen.getByTestId('delete-button-category_1');
    fireEvent.click(deleteButton);
    
    // Verify handler was called with correct parameters
    expect(mockOnDeleteClick).toHaveBeenCalledTimes(1);
    expect(mockOnDeleteClick).toHaveBeenCalledWith('category_1', 'Test Category 1');
  });
  
  it('uses site-specific URLs when siteSlug is provided', () => {
    render(<CategoriesMobileView {...defaultProps} siteSlug="test-site" />);
    
    // Check view link URL using test ID
    const viewLink = screen.getByTestId('view-link-category_1');
    expect(viewLink).toHaveAttribute('href', '/admin/sites/test-site/categories/test-category-1');
    
    // Check edit link URL using test ID
    const editLink = screen.getByTestId('edit-link-category_1');
    expect(editLink).toHaveAttribute('href', '/admin/sites/test-site/categories/category_1/edit');
  });
  
  it('uses default URLs when siteSlug is not provided', () => {
    render(<CategoriesMobileView {...defaultProps} />);
    
    // Check view link URL using test ID
    const viewLink = screen.getByTestId('view-link-category_1');
    expect(viewLink).toHaveAttribute('href', '/admin/categories/category_1');
    
    // Check edit link URL using test ID
    const editLink = screen.getByTestId('edit-link-category_1');
    expect(editLink).toHaveAttribute('href', '/admin/categories/category_1/edit');
  });
  
  it('displays formatted last updated date', () => {
    render(<CategoriesMobileView {...defaultProps} />);
    
    // Check formatted date using test ID
    const dateElement = screen.getByTestId('updated-date-category_1');
    
    // Only check if it contains a date pattern, not exact format which could change
    expect(dateElement.textContent).toMatch(/\w+\s\d+,\s\d{4}/); // e.g., "March 28, 2025"
  });
  
  it('hides on larger screens (md and up)', () => {
    render(<CategoriesMobileView {...defaultProps} />);
    
    // Check the container has the right responsive class
    const container = screen.getByTestId('categories-mobile-view');
    expect(container).toHaveClass('md:hidden');
  });
});
