/**
 * @jest-environment jsdom
 */
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
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
  return ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href}>{children}</a>
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
    
    // Should render 3 category cards
    const categoryCards = screen.getAllByRole('article');
    expect(categoryCards).toHaveLength(3);
    
    // Should display all category names
    expect(screen.getByText('Test Category 1')).toBeInTheDocument();
    expect(screen.getByText('Test Category 2')).toBeInTheDocument();
    expect(screen.getByText('Child Category')).toBeInTheDocument();
  });
  
  it('shows child category indicator with parent name for child categories', () => {
    render(<CategoriesMobileView {...defaultProps} />);
    
    // Should show parent name for child category
    expect(screen.getByText('Parent:')).toBeInTheDocument();
    expect(screen.getByText('Test Category 1')).toBeInTheDocument();
  });
  
  it('shows child count for categories with children', () => {
    render(<CategoriesMobileView {...defaultProps} />);
    
    // Should show child count for first category
    const childCountBadge = screen.getByText('2');
    expect(childCountBadge).toBeInTheDocument();
    expect(childCountBadge).toHaveClass('bg-blue-100');
  });
  
  it('shows site information when showSiteColumn is true', () => {
    render(<CategoriesMobileView {...defaultProps} showSiteColumn={true} />);
    
    // Should show site information
    expect(screen.getAllByText('Site:')).toHaveLength(3);
    expect(screen.getAllByText('Test Site')).toHaveLength(3);
  });
  
  it('does not show site information when showSiteColumn is false', () => {
    render(<CategoriesMobileView {...defaultProps} showSiteColumn={false} />);
    
    // Should not show site information
    expect(screen.queryByText('Site:')).not.toBeInTheDocument();
  });
  
  it('calls onDeleteClick with correct parameters when delete button is clicked', () => {
    render(<CategoriesMobileView {...defaultProps} />);
    
    // Get all delete buttons
    const deleteButtons = screen.getAllByText('Delete');
    
    // Click the first delete button
    fireEvent.click(deleteButtons[0]);
    
    // Should call onDeleteClick with correct parameters
    expect(mockOnDeleteClick).toHaveBeenCalledTimes(1);
    expect(mockOnDeleteClick).toHaveBeenCalledWith('category_1', 'Test Category 1');
  });
  
  it('uses site-specific URLs when siteSlug is provided', () => {
    render(<CategoriesMobileView {...defaultProps} siteSlug="test-site" />);
    
    // Get the first view button
    const viewButtons = screen.getAllByText('View');
    const firstViewButton = viewButtons[0];
    
    // Should have site-specific URL
    expect(firstViewButton.closest('a')).toHaveAttribute('href', '/admin/sites/test-site/categories/test-category-1');
  });
  
  it('uses default URLs when siteSlug is not provided', () => {
    render(<CategoriesMobileView {...defaultProps} />);
    
    // Get the first view button
    const viewButtons = screen.getAllByText('View');
    const firstViewButton = viewButtons[0];
    
    // Should have default URL
    expect(firstViewButton.closest('a')).toHaveAttribute('href', '/admin/categories/category_1');
  });
  
  it('displays formatted last updated date', () => {
    render(<CategoriesMobileView {...defaultProps} />);
    
    // Should display formatted date
    // This will depend on your date formatting implementation, but check for a date string
    const dateRegex = /\w+\s\d+,\s\d{4}/; // e.g., "March 28, 2025"
    const dateElements = screen.getAllByText(dateRegex);
    expect(dateElements.length).toBeGreaterThan(0);
  });
  
  it('hides on larger screens (md and up)', () => {
    render(<CategoriesMobileView {...defaultProps} />);
    
    // Container should have md:hidden class
    const container = screen.getAllByRole('article')[0].parentElement;
    expect(container).toHaveClass('md:hidden');
  });
});
