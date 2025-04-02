/**
 * Helper functions and mock data for CategoryTable tests
 */
import React from 'react';
import { render, RenderOptions } from '@testing-library/react';
import '@testing-library/jest-dom';
import * as hooks from '../../../../src/components/admin/categories/hooks';
import { CategoryWithRelations } from '../../../../src/components/admin/categories/types';
import { SiteConfig } from '../../../../src/types';

// Mock the global fetch API
const originalFetch = global.fetch;
global.fetch = jest.fn().mockImplementation((url) => {
  if (url.includes('/categories')) {
    return Promise.resolve({
      ok: true,
      json: () => Promise.resolve(mockCategories)
    });
  }
  if (url.includes('/sites')) {
    return Promise.resolve({
      ok: true,
      json: () => Promise.resolve(mockSites)
    });
  }
  return Promise.reject(new Error(`Unhandled fetch url: ${url}`));
});

// Mock the useCategories hook
jest.mock('../../../../src/components/admin/categories/hooks', () => {
  // Store the mock implementations to reference later
  const mockImplementations = {
    setSearchTerm: jest.fn(),
    setParentFilter: jest.fn(),
    setSiteFilter: jest.fn()
  };

  return {
    mockImplementations,
    useCategories: jest.fn(),
    useCategoryTable: jest.fn().mockImplementation((siteSlug, initialCategories) => {
      // Use the mocked useCategories hook to get its return value
      const categoriesState = require('../../../../src/components/admin/categories/hooks').useCategories();

      // Add additional UI state values that useCategoryTable would provide
      return {
        ...categoriesState,
        showHierarchy: false,
        formModalOpen: false,
        selectedCategoryId: undefined,
        showSiteColumn: !siteSlug && (categoriesState.sites || []).length > 0,
        toggleHierarchy: jest.fn(),
        handleEditCategory: jest.fn(),
        handleCreateCategory: jest.fn(),
        handleCloseFormModal: jest.fn(),
        handleCategorySaved: jest.fn(),
        handleViewCategory: jest.fn()
      };
    }),
  };
});

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

/**
 * Mock category data for testing
 */
export const mockCategories: CategoryWithRelations[] = [
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

/**
 * Mock site data for testing
 */
export const mockSites: SiteConfig[] = [
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

/**
 * Extended mock categories with additional hierarchical relationships
 */
export const mockHierarchicalCategories: CategoryWithRelations[] = [
  ...mockCategories,
  {
    id: 'category_4',
    name: 'Test Category 3',
    slug: 'test-category-3',
    metaDescription: 'This is test category 3',
    order: 3,
    parentId: null,
    siteId: 'site_1',
    createdAt: Date.now() - 86400000,
    updatedAt: Date.now() - 3600000,
    childCount: 1,
    siteName: 'Test Site'
  },
  {
    id: 'category_5',
    name: 'Deep Child Category',
    slug: 'deep-child-category',
    metaDescription: 'This is a deeply nested child category',
    order: 1,
    parentId: 'category_3',
    siteId: 'site_1',
    createdAt: Date.now() - 21600000,
    updatedAt: Date.now() - 1800000,
    parentName: 'Child Category',
    childCount: 0,
    siteName: 'Test Site'
  },
  {
    id: 'category_6',
    name: 'Another Child Category',
    slug: 'another-child-category',
    metaDescription: 'This is another child category',
    order: 2,
    parentId: 'category_4',
    siteId: 'site_1',
    createdAt: Date.now() - 32400000,
    updatedAt: Date.now() - 1800000,
    parentName: 'Test Category 3',
    childCount: 0,
    siteName: 'Test Site'
  }
];

/**
 * Enhanced mock implementation for useCategories hook
 */
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

  const mockConfirmDelete = jest.fn().mockImplementation((id, name) => {
    console.log(`Confirming delete for ${id}, ${name}`);
    return { id, name };
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

/**
 * Default mock implementation for useCategories hook
 */
export const createMockCategoriesHook = (overrides = {}) => {
  // Get the mock implementation references
  const { mockImplementations } = require('../../../../src/components/admin/categories/hooks');

  // Create mock functions that both track calls and update state
  const mockSetSearchTerm = jest.fn((term) => {
    mockImplementations.setSearchTerm(term);
  });

  const mockSetParentFilter = jest.fn((filter) => {
    mockImplementations.setParentFilter(filter);
  });

  const mockSetSiteFilter = jest.fn((filter) => {
    mockImplementations.setSiteFilter(filter);
  });

  // Create base mock with connected handlers
  return {
    categories: mockCategories,
    filteredCategories: mockCategories,
    currentCategories: mockCategories,
    allCategories: mockCategories,
    sites: mockSites,
    isLoading: false,  // Ensure loading is off by default
    error: null,
    searchTerm: '',
    setSearchTerm: mockSetSearchTerm,
    parentFilter: '',
    setParentFilter: mockSetParentFilter,
    siteFilter: '',
    setSiteFilter: mockSetSiteFilter,
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
    fetchCategories: jest.fn(),
    ...overrides
  };
};

/**
 * Setup function for CategoryTable tests with configurable hook mocks
 */
export const setupCategoryTableTest = (overrides = {}) => {
  // Make sure loading is explicitly set to false unless overridden
  const mockHook = createMockCategoriesHook({
    isLoading: false,
    ...overrides
  });

  // Mock both hooks to ensure consistent behavior
  (hooks.useCategories as jest.Mock).mockReturnValue(mockHook);
  (hooks.useCategoryTable as jest.Mock).mockReturnValue({
    ...mockHook,
    showHierarchy: false,
    formModalOpen: false,
    selectedCategoryId: undefined,
    showSiteColumn: true,
    toggleHierarchy: jest.fn(),
    handleEditCategory: jest.fn(),
    handleCreateCategory: jest.fn(),
    handleCloseFormModal: jest.fn(),
    handleCategorySaved: jest.fn(),
    handleViewCategory: jest.fn()
  });

  return mockHook;
};

/**
 * Reset all mocks before each test
 */
export const resetMocks = () => {
  jest.clearAllMocks();

  // Reset the fetch mock to ensure clean state between tests
  (global.fetch as jest.Mock).mockClear();

  // Reset the hook implementation mocks
  const { mockImplementations } = require('../../../../src/components/admin/categories/hooks');
  Object.values(mockImplementations).forEach((mock: jest.Mock) => mock.mockClear());
};

/**
 * Helper function to create a mock event
 */
export const createMockEvent = (type: string) => {
  return {
    preventDefault: jest.fn(),
    stopPropagation: jest.fn(),
    type
  };
};
