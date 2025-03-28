/**
 * @jest-environment jsdom
 */
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { ListingTableHeader } from '../../../src/components/admin/listings/components';
import '@testing-library/jest-dom';

// Mock data
const mockCategories = [
  { id: 'category_1', name: 'Category 1', slug: 'category-1', siteId: 'site_1', metaDescription: '', order: 1, createdAt: 0, updatedAt: 0 },
  { id: 'category_2', name: 'Category 2', slug: 'category-2', siteId: 'site_1', metaDescription: '', order: 2, createdAt: 0, updatedAt: 0 }
];

const mockSites = [
  { id: 'site_1', name: 'Site 1', slug: 'site-1', primaryKeyword: '', metaDescription: '', headerText: '', defaultLinkAttributes: 'dofollow' as const, createdAt: 0, updatedAt: 0 },
  { id: 'site_2', name: 'Site 2', slug: 'site-2', primaryKeyword: '', metaDescription: '', headerText: '', defaultLinkAttributes: 'dofollow' as const, createdAt: 0, updatedAt: 0 }
];

// Mock next/link
jest.mock('next/link', () => {
  // eslint-disable-next-line react/display-name
  return ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  );
});

describe('ListingTableHeader Component', () => {
  const defaultProps = {
    totalListings: 5,
    searchTerm: '',
    setSearchTerm: jest.fn(),
    categoryFilter: '',
    setCategoryFilter: jest.fn(),
    siteFilter: '',
    setSiteFilter: jest.fn(),
    categories: mockCategories,
    sites: mockSites
  };
  
  it('renders the header with correct listing count', () => {
    render(<ListingTableHeader {...defaultProps} />);
    
    expect(screen.getByText('Listings (5)')).toBeInTheDocument();
  });
  
  it('renders the add new listing button with correct href', () => {
    render(<ListingTableHeader {...defaultProps} />);
    
    const addButton = screen.getByText('Add New Listing');
    expect(addButton).toBeInTheDocument();
    expect(addButton.closest('a')).toHaveAttribute('href', '/admin/listings/new');
  });
  
  it('uses site-specific URL when siteSlug is provided', () => {
    render(<ListingTableHeader {...defaultProps} siteSlug="test-site" />);
    
    const addButton = screen.getByText('Add New Listing');
    expect(addButton.closest('a')).toHaveAttribute('href', '/admin/test-site/listings/new');
  });
  
  it('calls setSearchTerm when search input changes', () => {
    render(<ListingTableHeader {...defaultProps} />);
    
    const searchInput = screen.getByPlaceholderText('Search listings...');
    fireEvent.change(searchInput, { target: { value: 'test search' } });
    
    expect(defaultProps.setSearchTerm).toHaveBeenCalledWith('test search');
  });
  
  it('renders the clear search button when searchTerm has a value', () => {
    const props = { ...defaultProps, searchTerm: 'test search' };
    render(<ListingTableHeader {...props} />);
    
    const clearButton = screen.getByRole('button', { name: 'Clear search' });
    expect(clearButton).toBeInTheDocument();
    
    fireEvent.click(clearButton);
    expect(props.setSearchTerm).toHaveBeenCalledWith('');
  });
  
  it('renders category filter dropdown with correct options', () => {
    render(<ListingTableHeader {...defaultProps} />);
    
    const categorySelect = screen.getByRole('combobox', { name: 'Filter by category' });
    expect(categorySelect).toBeInTheDocument();
    
    const options = screen.getAllByRole('option');
    expect(options.length).toBe(mockCategories.length + 1); // +1 for the "All Categories" option
    expect(options[0]).toHaveTextContent('All Categories');
    expect(options[1]).toHaveTextContent('Category 1');
    expect(options[2]).toHaveTextContent('Category 2');
  });
  
  it('calls setCategoryFilter when category selection changes', () => {
    render(<ListingTableHeader {...defaultProps} />);
    
    const categorySelect = screen.getByRole('combobox', { name: 'Filter by category' });
    fireEvent.change(categorySelect, { target: { value: 'category_1' } });
    
    expect(defaultProps.setCategoryFilter).toHaveBeenCalledWith('category_1');
  });
  
  it('renders site filter dropdown only in multi-site mode', () => {
    // Without siteSlug (multi-site mode)
    render(<ListingTableHeader {...defaultProps} />);
    
    const siteSelect = screen.getByRole('combobox', { name: 'Filter by site' });
    expect(siteSelect).toBeInTheDocument();
    
    // With siteSlug (single-site mode)
    render(<ListingTableHeader {...defaultProps} siteSlug="test-site" />);
    
    expect(screen.queryByRole('combobox', { name: 'Filter by site' })).not.toBeInTheDocument();
  });
  
  it('uses responsive layout for filter controls', () => {
    render(<ListingTableHeader {...defaultProps} />);
    
    const filterContainer = screen.getByPlaceholderText('Search listings...').closest('div');
    expect(filterContainer?.parentElement).toHaveClass('flex-col sm:flex-row');
  });
});
