/**
 * @jest-environment jsdom
 */
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';

// Import the component
import { CategoryTableHeader } from '@/components/admin/categories/components';

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

const mockSites = [
  {
    id: 'site_1',
    name: 'Test Site',
    slug: 'test-site',
    primaryKeyword: 'test',
    metaDescription: 'Test site description',
    headerText: 'Test Site',
    defaultLinkAttributes: 'dofollow' as const,
    createdAt: Date.now() - 1000000000,
    updatedAt: Date.now() - 500000000
  },
  {
    id: 'site_2',
    name: 'Another Site',
    slug: 'another-site',
    primaryKeyword: 'another',
    metaDescription: 'Another site description',
    headerText: 'Another Site',
    defaultLinkAttributes: 'dofollow' as const,
    createdAt: Date.now() - 900000000,
    updatedAt: Date.now() - 400000000
  }
];

// Mock next/link
jest.mock('next/link', () => {
  // eslint-disable-next-line react/display-name
  return ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  );
});

describe('CategoryTableHeader Component', () => {
  const defaultProps = {
    totalCategories: mockCategories.length,
    searchTerm: '',
    setSearchTerm: jest.fn(),
    parentFilter: '',
    setParentFilter: jest.fn(),
    siteFilter: '',
    setSiteFilter: jest.fn(),
    categories: mockCategories,
    sites: mockSites
  };

  it('renders the header with correct category count', () => {
    render(<CategoryTableHeader {...defaultProps} />);

    expect(screen.getByTestId('category-count')).toHaveTextContent('Categories (3)');
  });

  it('renders the add new category button with correct href', () => {
    render(<CategoryTableHeader {...defaultProps} />);

    // Using getByText instead of getByTestId since the Link component doesn't pass data-testid to the rendered anchor
    const addButton = screen.getByText('Add Category');
    expect(addButton).toBeInTheDocument();
    expect(addButton.closest('a')).toHaveAttribute('href', '/admin/categories/new');
  });

  it('uses site-specific URL when siteSlug is provided', () => {
    render(<CategoryTableHeader {...defaultProps} siteSlug="test-site" />);

    const addButton = screen.getByText('Add Category');
    expect(addButton.closest('a')).toHaveAttribute('href', '/admin/sites/test-site/categories/new');
  });

  it('calls setSearchTerm when search input changes', () => {
    render(<CategoryTableHeader {...defaultProps} />);

    const searchInput = screen.getByTestId('search-input');
    fireEvent.change(searchInput, { target: { value: 'test search' } });

    expect(defaultProps.setSearchTerm).toHaveBeenCalledWith('test search');
  });

  it('renders the clear search button when searchTerm has a value', () => {
    const props = { ...defaultProps, searchTerm: 'test search' };
    render(<CategoryTableHeader {...props} />);

    const clearButton = screen.getByTestId('clear-search-button');
    expect(clearButton).toBeInTheDocument();

    fireEvent.click(clearButton);
    expect(props.setSearchTerm).toHaveBeenCalledWith('');
  });

  it('renders parent category filter dropdown with correct options', () => {
    render(<CategoryTableHeader {...defaultProps} />);

    const parentSelect = screen.getByTestId('parent-filter-select');
    expect(parentSelect).toBeInTheDocument();

    const options = Array.from(parentSelect.querySelectorAll('option'));
    expect(options.length).toBe(3); // "All Categories" + 2 parent categories (category_1 and category_2)
    expect(options[0].textContent).toBe('All Categories');
    expect(options[1].textContent).toBe('Test Category 1');
    expect(options[2].textContent).toBe('Test Category 2');
  });

  it('calls setParentFilter when parent selection changes', () => {
    render(<CategoryTableHeader {...defaultProps} />);

    const parentSelect = screen.getByTestId('parent-filter-select');
    fireEvent.change(parentSelect, { target: { value: 'category_1' } });

    expect(defaultProps.setParentFilter).toHaveBeenCalledWith('category_1');
  });

  it('renders site filter dropdown only in multi-site mode', () => {
    // Without siteSlug (multi-site mode) - should show filter
    const { unmount } = render(<CategoryTableHeader {...defaultProps} />);

    const siteSelect = screen.getByTestId('site-filter-select');
    expect(siteSelect).toBeInTheDocument();

    // Cleanup before rendering again
    unmount();

    // With siteSlug (single-site mode) - should hide filter
    render(<CategoryTableHeader {...defaultProps} siteSlug="test-site" />);

    // Try to find the select element
    const hiddenSelect = screen.queryByTestId('site-filter-select');
    expect(hiddenSelect).toBeNull();
  });

  it('excludes child categories from parent filter options', () => {
    render(<CategoryTableHeader {...defaultProps} />);

    const parentSelect = screen.getByTestId('parent-filter-select');
    const options = Array.from(parentSelect.querySelectorAll('option'));

    // Should not include the child category as an option
    const childOption = options.find(option => option.textContent === 'Child Category');
    expect(childOption).toBeUndefined();
  });

  it('shows "Reset Filters" button when filters are applied', () => {
    // With filters applied
    const propsWithFilters = {
      ...defaultProps,
      searchTerm: 'test',
      parentFilter: 'category_1'
    };

    const { unmount } = render(<CategoryTableHeader {...propsWithFilters} />);

    const resetButton = screen.getByTestId('reset-filters-button');
    expect(resetButton).toBeInTheDocument();

    // Click reset button
    fireEvent.click(resetButton);
    expect(propsWithFilters.setSearchTerm).toHaveBeenCalledWith('');
    expect(propsWithFilters.setParentFilter).toHaveBeenCalledWith('');
    expect(propsWithFilters.setSiteFilter).toHaveBeenCalledWith('');

    // Clean up
    unmount();

    // Without filters - create a clean instance of defaultProps to ensure no filters
    const cleanProps = {
      totalCategories: mockCategories.length,
      searchTerm: '',
      setSearchTerm: jest.fn(),
      parentFilter: '',
      setParentFilter: jest.fn(),
      siteFilter: '',
      setSiteFilter: jest.fn(),
      categories: mockCategories,
      sites: mockSites
    };

    render(<CategoryTableHeader {...cleanProps} />);
    const hiddenButton = screen.queryByTestId('reset-filters-button');
    expect(hiddenButton).toBeNull();
  });

  it('uses responsive layout for filter controls', () => {
    render(<CategoryTableHeader {...defaultProps} />);

    const filterControls = screen.getByTestId('filter-controls');
    expect(filterControls).toHaveClass('flex-col sm:flex-row');
  });

  it('displays "View Hierarchy" toggle button for tree view', () => {
    render(<CategoryTableHeader {...defaultProps} />);

    const viewToggle = screen.getByTestId('toggle-hierarchy-button');
    expect(viewToggle).toBeInTheDocument();
  });
});
