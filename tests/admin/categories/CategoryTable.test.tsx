/**
 * @jest-environment jsdom
 */
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';

import CategoryTable from '../../../src/components/admin/categories/CategoryTable';
import * as hooks from '../../../src/components/admin/categories/hooks';

// Mock the useCategories hook
jest.mock('../../../src/components/admin/categories/hooks', () => ({
  useCategories: jest.fn(),
}));

// Mock next/link
jest.mock('next/link', () => {
  // eslint-disable-next-line react/display-name
  return ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  );
});

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
  }
];

describe('CategoryTable Component', () => {
  // Default mock implementation for useCategories
  const mockCategoriesHook = {
    categories: mockCategories,
    filteredCategories: mockCategories,
    currentCategories: mockCategories,
    allCategories: mockCategories,
    sites: mockSites,
    isLoading: false,
    error: null,
    searchTerm: '',
    setSearchTerm: jest.fn(),
    parentFilter: '',
    setParentFilter: jest.fn(),
    siteFilter: '',
    setSiteFilter: jest.fn(),
    sortField: 'order' as const,
    sortOrder: 'asc' as const,
    handleSort: jest.fn(),
    currentPage: 1,
    totalPages: 1,
    itemsPerPage: 10,
    setItemsPerPage: jest.fn(),
    goToPage: jest.fn(),
    isDeleteModalOpen: false,
    categoryToDelete: null,
    confirmDelete: jest.fn(),
    handleDelete: jest.fn(),
    cancelDelete: jest.fn(),
    fetchCategories: jest.fn()
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (hooks.useCategories as jest.Mock).mockReturnValue(mockCategoriesHook);
  });

  it('renders the loading state when isLoading is true', () => {
    (hooks.useCategories as jest.Mock).mockReturnValue({
      ...mockCategoriesHook,
      isLoading: true
    });

    render(<CategoryTable />);
    
    // Should show loading skeleton
    expect(screen.getByTestId('loading-status')).toHaveTextContent('Loading categories data, please wait...');
  });

  it('renders the error state when error is present', () => {
    (hooks.useCategories as jest.Mock).mockReturnValue({
      ...mockCategoriesHook,
      error: 'Failed to fetch categories'
    });

    render(<CategoryTable />);
    
    // Should show error message
    expect(screen.getByTestId('error-title')).toHaveTextContent('Error Loading Categories');
    expect(screen.getByTestId('error-message')).toHaveTextContent('Failed to fetch categories');
  });

  it('renders the empty state when categories is empty', () => {
    (hooks.useCategories as jest.Mock).mockReturnValue({
      ...mockCategoriesHook,
      categories: [],
      filteredCategories: [],
      currentCategories: []
    });

    render(<CategoryTable />);
    
    // Should show empty state
    expect(screen.getByText('No categories found.')).toBeInTheDocument();
    expect(screen.getByText('Create your first category')).toBeInTheDocument();
  });

  it('renders the table with correct columns', () => {
    render(<CategoryTable />);
    
    // Should have correct column headers
    expect(screen.getByText('Order')).toBeInTheDocument();
    expect(screen.getByText('Name')).toBeInTheDocument();
    expect(screen.getByText('Last Updated')).toBeInTheDocument();
    expect(screen.getByText('Actions')).toBeInTheDocument();
  });

  it('shows site column in multi-site mode', () => {
    render(<CategoryTable />);
    
    // Should show site column
    expect(screen.getByText('Site')).toBeInTheDocument();
  });

  it('hides site column in single-site mode', () => {
    (hooks.useCategories as jest.Mock).mockReturnValue({
      ...mockCategoriesHook,
      sites: []
    });

    render(<CategoryTable siteSlug="test-site" />);
    
    // Should not show site column
    expect(screen.queryByText('Site')).not.toBeInTheDocument();
  });

  it('renders the correct number of category rows', () => {
    render(<CategoryTable />);
    
    // Should show all category names by test IDs - using getAllByTestId since we might have duplicate IDs for desktop/mobile views
    const category1Elements = screen.getAllByTestId('category-name-category_1');
    expect(category1Elements[0]).toHaveTextContent('Test Category 1');
    
    const category2Elements = screen.getAllByTestId('category-name-category_2');
    expect(category2Elements[0]).toHaveTextContent('Test Category 2');
    
    const category3Elements = screen.getAllByTestId('category-name-category_3');
    expect(category3Elements[0]).toHaveTextContent('Child Category');
  });

  it('renders mobile view for small screens', () => {
    render(<CategoryTable />);
    
    // Should render mobile view (hidden on desktop)
    const mobileView = screen.getAllByRole('article')[0].closest('div');
    expect(mobileView).toHaveClass('md:hidden');
  });

  it('renders pagination with correct info', () => {
    render(<CategoryTable />);
    
    // Should show pagination with testids
    const paginationStatus = screen.getByTestId('pagination-status');
    expect(paginationStatus).toHaveTextContent('Showing 1 to 3 of 3 categories');
    
    const pageIndicator = screen.getByTestId('page-indicator');
    expect(pageIndicator).toHaveTextContent('Page 1 of 1');
  });

  it('calls confirmDelete when delete button is clicked', () => {
    render(<CategoryTable />);
    
    // Find and click delete button with testid - using getAllByTestId to handle duplicates
    const deleteButtons = screen.getAllByTestId('delete-button-category_1');
    // Use the first delete button found
    fireEvent.click(deleteButtons[0]);
    
    // Should call confirmDelete
    expect(mockCategoriesHook.confirmDelete).toHaveBeenCalledTimes(1);
  });

  it('renders delete confirmation modal when isDeleteModalOpen is true', () => {
    (hooks.useCategories as jest.Mock).mockReturnValue({
      ...mockCategoriesHook,
      isDeleteModalOpen: true,
      categoryToDelete: { id: 'category_1', name: 'Test Category 1' }
    });

    render(<CategoryTable />);
    
    // Should show delete confirmation modal
    expect(screen.getByText('Delete Category')).toBeInTheDocument();
    expect(screen.getByText(/Are you sure you want to delete/)).toBeInTheDocument();
    expect(screen.getByText('"Test Category 1"')).toBeInTheDocument();
  });

  it('calls handleDelete when delete is confirmed', () => {
    (hooks.useCategories as jest.Mock).mockReturnValue({
      ...mockCategoriesHook,
      isDeleteModalOpen: true,
      categoryToDelete: { id: 'category_1', name: 'Test Category 1' }
    });

    render(<CategoryTable />);
    
    // Find and click confirm button in the modal using data-testid
    const confirmButton = screen.getByTestId('confirm-delete-button');
    expect(confirmButton).toBeInTheDocument();
    expect(confirmButton).toHaveTextContent('Delete');
    fireEvent.click(confirmButton);
    
    // Should call handleDelete
    expect(mockCategoriesHook.handleDelete).toHaveBeenCalledTimes(1);
    expect(mockCategoriesHook.handleDelete).toHaveBeenCalledWith('category_1');
  });

  it('calls cancelDelete when delete is cancelled', () => {
    (hooks.useCategories as jest.Mock).mockReturnValue({
      ...mockCategoriesHook,
      isDeleteModalOpen: true,
      categoryToDelete: { id: 'category_1', name: 'Test Category 1' }
    });

    render(<CategoryTable />);
    
    // Find and click cancel button
    const cancelButton = screen.getByText('Cancel');
    fireEvent.click(cancelButton);
    
    // Should call cancelDelete
    expect(mockCategoriesHook.cancelDelete).toHaveBeenCalledTimes(1);
  });

  it('calls fetchCategories when retry button is clicked in error state', () => {
    (hooks.useCategories as jest.Mock).mockReturnValue({
      ...mockCategoriesHook,
      error: 'Failed to fetch categories'
    });

    render(<CategoryTable />);
    
    // Find and click retry button
    const retryButton = screen.getByTestId('retry-button');
    fireEvent.click(retryButton);
    
    // Should call fetchCategories
    expect(mockCategoriesHook.fetchCategories).toHaveBeenCalledTimes(1);
  });
});
