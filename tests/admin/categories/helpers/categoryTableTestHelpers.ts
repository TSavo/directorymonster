import { CategoryWithRelations } from '../../../../src/components/admin/categories/types';

// Mock categories for testing
export const mockCategories: CategoryWithRelations[] = [
  {
    id: 'category_1',
    name: 'Test Category 1',
    slug: 'test-category-1',
    metaDescription: 'This is test category 1',
    order: 1,
    parentId: null,
    siteId: 'site_1',
    createdAt: Date.now() - 3600000,
    updatedAt: Date.now() - 1800000,
    childCount: 0,
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
    createdAt: Date.now() - 7200000,
    updatedAt: Date.now() - 3600000,
    childCount: 0,
    siteName: 'Test Site'
  },
  {
    id: 'category_3',
    name: 'Test Category 3',
    slug: 'test-category-3',
    metaDescription: 'This is test category 3',
    order: 3,
    parentId: null,
    siteId: 'site_1',
    createdAt: Date.now() - 10800000,
    updatedAt: Date.now() - 5400000,
    childCount: 0,
    siteName: 'Test Site'
  }
];

// Mock sites for testing
export const mockSites = [
  { id: 'site_1', name: 'Test Site', slug: 'test-site' },
  { id: 'site_2', name: 'Another Site', slug: 'another-site' }
];

// Setup function to mock fetch and other dependencies
export const setupCategoryTableTest = (overrides = {}) => {
  // Mock fetch for categories
  global.fetch = jest.fn().mockImplementation((url) => {
    if (url.includes('/api/categories')) {
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve(mockCategories)
      });
    }
    if (url.includes('/api/sites')) {
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve(mockSites)
      });
    }
    return Promise.reject(new Error('Not found'));
  });

  // Mock useRouter
  jest.mock('next/router', () => ({
    useRouter: () => ({
      query: { siteSlug: 'test-site' },
      push: jest.fn(),
      pathname: '/admin/categories'
    })
  }));

  // Mock next/navigation as well for components that use it
  jest.mock('next/navigation', () => ({
    useRouter: () => ({
      push: jest.fn(),
      replace: jest.fn(),
      back: jest.fn()
    }),
    usePathname: () => '/admin/categories',
    useSearchParams: () => new URLSearchParams()
  }));

  // Mock the useCategories hook
  jest.mock('../../../../src/components/admin/categories/hooks/useCategories', () => ({
    useCategories: jest.fn().mockImplementation(() => mockUseCategories(overrides))
  }));

  // Mock the useCategoryTable hook
  jest.mock('../../../../src/components/admin/categories/hooks/useCategoryTable', () => ({
    useCategoryTable: jest.fn().mockImplementation(() => ({
      ...mockUseCategories(overrides),
      showHierarchy: false,
      formModalOpen: false,
      selectedCategoryId: undefined,
      showSiteColumn: !overrides.siteSlug,
      toggleHierarchy: jest.fn(),
      handleEditCategory: jest.fn(),
      handleCreateCategory: jest.fn(),
      handleCloseFormModal: jest.fn(),
      handleCategorySaved: jest.fn(),
      handleViewCategory: jest.fn(),
      viewMode: 'table',
      toggleViewMode: jest.fn()
    }))
  }));
};

// Reset mocks after tests
export const resetMocks = () => {
  jest.resetAllMocks();
};

// Mock the useCategories hook
export const mockUseCategories = (overrides = {}) => {
  // Create mock functions with proper implementations
  const mockSetItemsPerPage = jest.fn().mockImplementation((value) => {
    console.log(`Setting items per page to ${value}`);
    return value;
  });

  const mockGoToPage = jest.fn().mockImplementation((page) => {
    console.log(`Going to page ${page}`);
    return page;
  });

  const mockConfirmDelete = jest.fn().mockImplementation((category) => {
    console.log(`Confirming delete for category: ${category?.name || 'unknown'}`);
    return category;
  });

  const mockCancelDelete = jest.fn().mockImplementation(() => {
    console.log('Cancelling delete');
    return true;
  });

  const mockHandleDelete = jest.fn().mockImplementation((id) => {
    console.log(`Handling delete for category ID: ${id}`);
    return id;
  });

  return {
    categories: mockCategories,
    filteredCategories: mockCategories,
    currentCategories: mockCategories,
    isLoading: false,
    error: null,
    searchTerm: '',
    setSearchTerm: jest.fn(),
    parentFilter: '',
    setParentFilter: jest.fn(),
    siteFilter: '',
    setSiteFilter: jest.fn(),
    sites: mockSites,
    currentPage: 1,
    totalPages: 1,
    itemsPerPage: 10,
    setItemsPerPage: mockSetItemsPerPage,
    goToPage: mockGoToPage,
    isDeleteModalOpen: false,
    categoryToDelete: null,
    confirmDelete: mockConfirmDelete,
    cancelDelete: mockCancelDelete,
    handleDelete: mockHandleDelete,
    showHierarchy: false,
    toggleHierarchy: jest.fn(),
    viewMode: 'table',
    toggleViewMode: jest.fn(),
    fetchCategories: jest.fn(),
    ...overrides
  };
};
