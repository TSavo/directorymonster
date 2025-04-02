import React from 'react';
import { render, screen, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import CategoryTable from '../../../src/components/admin/categories/CategoryTable';
import * as hooks from '../../../src/components/admin/categories/hooks/useCategories';

// Mock the useCategories hook
jest.mock('../../../src/components/admin/categories/hooks/useCategories');

describe('CategoryTable Loading State', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should show loading state initially and then transition to loaded state', async () => {
    // Create a mock implementation that can be updated
    let mockState = {
      categories: [],
      isLoading: true,
      error: null,
      // Add other required properties but they won't be used in this test
      filteredCategories: [],
      currentCategories: [],
      currentPage: 1,
      totalPages: 0,
      itemsPerPage: 10,
      setItemsPerPage: jest.fn(),
      goToPage: jest.fn(),
      searchTerm: '',
      setSearchTerm: jest.fn(),
      parentFilter: '',
      setParentFilter: jest.fn(),
      siteFilter: '',
      setSiteFilter: jest.fn(),
      sites: [],
      isDeleteModalOpen: false,
      categoryToDelete: null,
      confirmDelete: jest.fn(),
      cancelDelete: jest.fn(),
      handleDelete: jest.fn(),
      viewMode: 'table',
      toggleViewMode: jest.fn(),
      showHierarchy: false,
      toggleHierarchy: jest.fn(),
    };

    // Create a mock implementation that returns the current state
    (hooks.useCategories as jest.Mock).mockImplementation(() => mockState);

    // Render the component
    const { rerender } = render(<CategoryTable />);

    // Verify loading state is shown
    expect(screen.getByTestId('category-table-skeleton')).toBeInTheDocument();
    expect(screen.getByTestId('loading-status')).toBeInTheDocument();

    // Now, update the mock state to simulate loading completion
    mockState = {
      ...mockState,
      isLoading: false,
      categories: [
        {
          id: 'category_1',
          name: 'Test Category 1',
          slug: 'test-category-1',
          description: 'Test description',
          parentId: null,
          siteId: 'site_1',
          siteName: 'Test Site',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }
      ],
      filteredCategories: [
        {
          id: 'category_1',
          name: 'Test Category 1',
          slug: 'test-category-1',
          description: 'Test description',
          parentId: null,
          siteId: 'site_1',
          siteName: 'Test Site',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }
      ],
      currentCategories: [
        {
          id: 'category_1',
          name: 'Test Category 1',
          slug: 'test-category-1',
          description: 'Test description',
          parentId: null,
          siteId: 'site_1',
          siteName: 'Test Site',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }
      ],
    };

    // Force a re-render with the new state
    rerender(<CategoryTable />);

    // Wait for the component to update and verify loading state is gone
    await waitFor(() => {
      // The skeleton loader should no longer be in the document
      expect(screen.queryByTestId('category-table-skeleton')).not.toBeInTheDocument();
    }, { timeout: 3000 });

    // FAILING TEST #1: The component should have a content container with a data-testid
    // This will fail because there's no element with data-testid='category-table-content'
    expect(screen.getByTestId('category-table-content')).toBeInTheDocument();

    // FAILING TEST #2: The component should properly update the category count
    const categoryCount = screen.getByTestId('category-count');
    expect(categoryCount).toHaveTextContent('Categories (1)');

    // FAILING TEST #3: The component should display the category data
    expect(screen.getByTestId('category-name-cell-category_1')).toHaveTextContent('Test Category 1');
  });

  it('should handle errors gracefully', async () => {
    // Create a mock implementation with an error state
    const errorMock = {
      categories: [],
      isLoading: false,
      error: 'Failed to load categories',
      filteredCategories: [],
      currentCategories: [],
      currentPage: 1,
      totalPages: 0,
      itemsPerPage: 10,
      setItemsPerPage: jest.fn(),
      goToPage: jest.fn(),
      searchTerm: '',
      setSearchTerm: jest.fn(),
      parentFilter: '',
      setParentFilter: jest.fn(),
      siteFilter: '',
      setSiteFilter: jest.fn(),
      sites: [],
      isDeleteModalOpen: false,
      categoryToDelete: null,
      confirmDelete: jest.fn(),
      cancelDelete: jest.fn(),
      handleDelete: jest.fn(),
      viewMode: 'table',
      toggleViewMode: jest.fn(),
      showHierarchy: false,
      toggleHierarchy: jest.fn(),
    };

    // Mock the hook implementation
    (hooks.useCategories as jest.Mock).mockReturnValue(errorMock);

    // Render the component
    render(<CategoryTable />);

    // FAILING TEST #4: The component should display an error message
    // This will fail because there's no element with data-testid='error-message'
    expect(screen.getByTestId('error-message')).toBeInTheDocument();
    expect(screen.getByTestId('error-message')).toHaveTextContent('Failed to load categories');
  });

  it('should display pagination controls when there are multiple pages', async () => {
    // Create a mock implementation with multiple pages of data
    const mockState = {
      categories: Array.from({ length: 25 }, (_, i) => ({
        id: `category_${i + 1}`,
        name: `Test Category ${i + 1}`,
        slug: `test-category-${i + 1}`,
        description: `Test description ${i + 1}`,
        parentId: null,
        siteId: 'site_1',
        siteName: 'Test Site',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      })),
      isLoading: false,
      error: null,
      filteredCategories: Array.from({ length: 25 }, (_, i) => ({
        id: `category_${i + 1}`,
        name: `Test Category ${i + 1}`,
        slug: `test-category-${i + 1}`,
        description: `Test description ${i + 1}`,
        parentId: null,
        siteId: 'site_1',
        siteName: 'Test Site',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      })),
      currentCategories: Array.from({ length: 10 }, (_, i) => ({
        id: `category_${i + 1}`,
        name: `Test Category ${i + 1}`,
        slug: `test-category-${i + 1}`,
        description: `Test description ${i + 1}`,
        parentId: null,
        siteId: 'site_1',
        siteName: 'Test Site',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      })),
      currentPage: 1,
      totalPages: 3,
      itemsPerPage: 10,
      setItemsPerPage: jest.fn(),
      goToPage: jest.fn(),
      searchTerm: '',
      setSearchTerm: jest.fn(),
      parentFilter: '',
      setParentFilter: jest.fn(),
      siteFilter: '',
      setSiteFilter: jest.fn(),
      sites: [],
      isDeleteModalOpen: false,
      categoryToDelete: null,
      confirmDelete: jest.fn(),
      cancelDelete: jest.fn(),
      handleDelete: jest.fn(),
      viewMode: 'table',
      toggleViewMode: jest.fn(),
      showHierarchy: false,
      toggleHierarchy: jest.fn(),
    };

    // Mock the hook implementation
    (hooks.useCategories as jest.Mock).mockReturnValue(mockState);

    // Render the component
    render(<CategoryTable />);

    // Wait for the component to finish loading
    await waitFor(() => {
      expect(screen.queryByTestId('category-table-skeleton')).not.toBeInTheDocument();
    });

    // FAILING TEST #1: The component should display pagination controls
    // This will fail because there's no element with data-testid='pagination-controls'
    expect(screen.getByTestId('pagination-controls')).toBeInTheDocument();

    // FAILING TEST #2: The pagination status should show the correct range
    expect(screen.getByTestId('pagination-status')).toHaveTextContent('Showing 1 to 10 of 25 categories');

    // FAILING TEST #3: The page indicator should show the correct page
    expect(screen.getByTestId('page-indicator')).toHaveTextContent('Page 1 of 3');
  });

  it('should handle category deletion', async () => {
    // Create a mock implementation with a category to delete
    const mockState = {
      categories: [
        {
          id: 'category_1',
          name: 'Test Category 1',
          slug: 'test-category-1',
          description: 'Test description',
          parentId: null,
          siteId: 'site_1',
          siteName: 'Test Site',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }
      ],
      isLoading: false,
      error: null,
      filteredCategories: [
        {
          id: 'category_1',
          name: 'Test Category 1',
          slug: 'test-category-1',
          description: 'Test description',
          parentId: null,
          siteId: 'site_1',
          siteName: 'Test Site',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }
      ],
      currentCategories: [
        {
          id: 'category_1',
          name: 'Test Category 1',
          slug: 'test-category-1',
          description: 'Test description',
          parentId: null,
          siteId: 'site_1',
          siteName: 'Test Site',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }
      ],
      currentPage: 1,
      totalPages: 1,
      itemsPerPage: 10,
      setItemsPerPage: jest.fn(),
      goToPage: jest.fn(),
      searchTerm: '',
      setSearchTerm: jest.fn(),
      parentFilter: '',
      setParentFilter: jest.fn(),
      siteFilter: '',
      setSiteFilter: jest.fn(),
      sites: [],
      isDeleteModalOpen: false,
      categoryToDelete: null,
      confirmDelete: jest.fn(),
      cancelDelete: jest.fn(),
      handleDelete: jest.fn(),
      viewMode: 'table',
      toggleViewMode: jest.fn(),
      showHierarchy: false,
      toggleHierarchy: jest.fn(),
    };

    // Mock the hook implementation
    (hooks.useCategories as jest.Mock).mockReturnValue(mockState);

    // Render the component
    const { rerender } = render(<CategoryTable />);

    // Wait for the component to finish loading
    await waitFor(() => {
      expect(screen.queryByTestId('category-table-skeleton')).not.toBeInTheDocument();
    });

    // FAILING TEST #1: The component should have a delete button for the category
    const deleteButtons = screen.getAllByTestId('delete-button-category_1');
    expect(deleteButtons.length).toBeGreaterThan(0);

    // Click the first delete button
    const deleteButton = deleteButtons[0];
    expect(deleteButton).toBeInTheDocument();

    // Update the mock state to simulate the delete modal being open
    const updatedMockState = {
      ...mockState,
      isDeleteModalOpen: true,
      categoryToDelete: {
        id: 'category_1',
        name: 'Test Category 1'
      }
    };

    // Mock the hook implementation with the updated state
    (hooks.useCategories as jest.Mock).mockReturnValue(updatedMockState);

    // Force a re-render with the new state
    rerender(<CategoryTable />);

    // FAILING TEST #2: The component should display a delete confirmation modal
    // This will fail because there's no element with data-testid='delete-confirmation-modal'
    expect(screen.getByTestId('delete-confirmation-modal')).toBeInTheDocument();

    // FAILING TEST #3: The modal should have the correct title and content
    expect(screen.getByTestId('modal-title')).toHaveTextContent('Delete Category');
    expect(screen.getByTestId('item-name')).toHaveTextContent('"Test Category 1"');
  });

  it('should handle empty state gracefully', async () => {
    // Create a mock implementation with no categories
    const mockState = {
      categories: [],
      isLoading: false,
      error: null,
      filteredCategories: [],
      currentCategories: [],
      currentPage: 1,
      totalPages: 0,
      itemsPerPage: 10,
      setItemsPerPage: jest.fn(),
      goToPage: jest.fn(),
      searchTerm: '',
      setSearchTerm: jest.fn(),
      parentFilter: '',
      setParentFilter: jest.fn(),
      siteFilter: '',
      setSiteFilter: jest.fn(),
      sites: [],
      isDeleteModalOpen: false,
      categoryToDelete: null,
      confirmDelete: jest.fn(),
      cancelDelete: jest.fn(),
      handleDelete: jest.fn(),
      viewMode: 'table',
      toggleViewMode: jest.fn(),
      showHierarchy: false,
      toggleHierarchy: jest.fn(),
    };

    // Mock the hook implementation
    (hooks.useCategories as jest.Mock).mockReturnValue(mockState);

    // Render the component
    render(<CategoryTable />);

    // Wait for the component to finish loading
    await waitFor(() => {
      expect(screen.queryByTestId('category-table-skeleton')).not.toBeInTheDocument();
    });

    // The component should display an empty state message
    expect(screen.getByTestId('empty-state-container')).toBeInTheDocument();
    expect(screen.getByTestId('empty-state-message')).toHaveTextContent('No categories found.');

    // FAILING TEST: The component should have a button to create a new category
    // This will fail because the button text is not correct
    expect(screen.getByTestId('create-category-button')).toHaveTextContent('Add New Category');
  });

  it('should filter categories when search term is entered', async () => {
    // Create a mock implementation with multiple categories
    const mockCategories = [
      {
        id: 'category_1',
        name: 'Apple Category',
        slug: 'apple-category',
        description: 'Apple products',
        parentId: null,
        siteId: 'site_1',
        siteName: 'Test Site',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        id: 'category_2',
        name: 'Banana Category',
        slug: 'banana-category',
        description: 'Banana products',
        parentId: null,
        siteId: 'site_1',
        siteName: 'Test Site',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        id: 'category_3',
        name: 'Orange Category',
        slug: 'orange-category',
        description: 'Orange products',
        parentId: null,
        siteId: 'site_1',
        siteName: 'Test Site',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
    ];

    const mockState = {
      categories: mockCategories,
      isLoading: false,
      error: null,
      filteredCategories: mockCategories,
      currentCategories: mockCategories,
      currentPage: 1,
      totalPages: 1,
      itemsPerPage: 10,
      setItemsPerPage: jest.fn(),
      goToPage: jest.fn(),
      searchTerm: '',
      setSearchTerm: jest.fn(),
      parentFilter: '',
      setParentFilter: jest.fn(),
      siteFilter: '',
      setSiteFilter: jest.fn(),
      sites: [],
      isDeleteModalOpen: false,
      categoryToDelete: null,
      confirmDelete: jest.fn(),
      cancelDelete: jest.fn(),
      handleDelete: jest.fn(),
      viewMode: 'table',
      toggleViewMode: jest.fn(),
      showHierarchy: false,
      toggleHierarchy: jest.fn(),
    };

    // Mock the hook implementation
    (hooks.useCategories as jest.Mock).mockReturnValue(mockState);

    // Render the component
    const { rerender } = render(<CategoryTable />);
    const user = userEvent.setup();

    // Wait for the component to finish loading
    await waitFor(() => {
      expect(screen.queryByTestId('category-table-skeleton')).not.toBeInTheDocument();
    });

    // Verify all categories are initially displayed
    expect(screen.getAllByText('Apple Category').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Banana Category').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Orange Category').length).toBeGreaterThan(0);

    // Find the search input
    const searchInput = screen.getByTestId('search-input');
    expect(searchInput).toBeInTheDocument();

    // Type 'apple' in the search input
    await user.type(searchInput, 'apple');

    // Verify setSearchTerm was called for each character
    expect(mockState.setSearchTerm).toHaveBeenCalled();
    expect(mockState.setSearchTerm.mock.calls.length).toBe(5); // Once for each character in 'apple'

    // Update the mock state to simulate filtered results
    const filteredMockState = {
      ...mockState,
      searchTerm: 'apple',
      filteredCategories: [mockCategories[0]],
      currentCategories: [mockCategories[0]]
    };

    // Mock the hook implementation with the updated state
    (hooks.useCategories as jest.Mock).mockReturnValue(filteredMockState);

    // Force a re-render with the new state
    rerender(<CategoryTable />);

    // FAILING TEST: The component should only display the filtered category
    // This will fail because the component doesn't update the displayed categories based on the search term
    await waitFor(() => {
      expect(screen.queryAllByText('Banana Category').length).toBe(0);
      expect(screen.queryAllByText('Orange Category').length).toBe(0);
    });

    expect(screen.getAllByText('Apple Category').length).toBeGreaterThan(0);
  });

  it('should toggle between table and card views', async () => {
    // Create a mock implementation with categories
    const mockCategories = [
      {
        id: 'category_1',
        name: 'Test Category 1',
        slug: 'test-category-1',
        description: 'Test description',
        parentId: null,
        siteId: 'site_1',
        siteName: 'Test Site',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
    ];

    const mockState = {
      categories: mockCategories,
      isLoading: false,
      error: null,
      filteredCategories: mockCategories,
      currentCategories: mockCategories,
      currentPage: 1,
      totalPages: 1,
      itemsPerPage: 10,
      setItemsPerPage: jest.fn(),
      goToPage: jest.fn(),
      searchTerm: '',
      setSearchTerm: jest.fn(),
      parentFilter: '',
      setParentFilter: jest.fn(),
      siteFilter: '',
      setSiteFilter: jest.fn(),
      sites: [],
      isDeleteModalOpen: false,
      categoryToDelete: null,
      confirmDelete: jest.fn(),
      cancelDelete: jest.fn(),
      handleDelete: jest.fn(),
      viewMode: 'table',
      toggleViewMode: jest.fn(),
      showHierarchy: false,
      toggleHierarchy: jest.fn(),
    };

    // Mock the hook implementation
    (hooks.useCategories as jest.Mock).mockReturnValue(mockState);

    // Render the component
    const { rerender } = render(<CategoryTable />);
    const user = userEvent.setup();

    // Wait for the component to finish loading
    await waitFor(() => {
      expect(screen.queryByTestId('category-table-skeleton')).not.toBeInTheDocument();
    });

    // Verify table view is initially displayed
    expect(screen.getAllByTestId('category-table-desktop').length).toBeGreaterThan(0);
    expect(screen.queryAllByTestId('category-table-mobile').length).toBe(0);

    // Find the view mode toggle button
    const viewModeToggle = screen.getByTestId('toggle-view-button');
    expect(viewModeToggle).toBeInTheDocument();

    // Click the view mode toggle button
    await user.click(viewModeToggle);

    // Verify toggleViewMode was called
    expect(mockState.toggleViewMode).toHaveBeenCalled();

    // Update the mock state to simulate card view
    const cardViewMockState = {
      ...mockState,
      viewMode: 'card'
    };

    // Mock the hook implementation with the updated state
    (hooks.useCategories as jest.Mock).mockReturnValue(cardViewMockState);

    // Force a re-render with the new state
    rerender(<CategoryTable />);

    // FAILING TEST: The component should display the card view
    // This will fail if the component doesn't properly handle the viewMode state
    await waitFor(() => {
      expect(screen.queryAllByTestId('category-table-desktop').length).toBe(0);
      expect(screen.getAllByTestId('category-table-mobile').length).toBeGreaterThan(0);
    });
  });
});