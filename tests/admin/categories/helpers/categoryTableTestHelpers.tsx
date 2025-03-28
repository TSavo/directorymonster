/**
 * Helper functions and mock data for CategoryTable tests
 */
import React from 'react';
import { render, RenderOptions } from '@testing-library/react';
import '@testing-library/jest-dom';
import * as hooks from '../../../../src/components/admin/categories/hooks';
import { CategoryWithRelations } from '../../../../src/components/admin/categories/types';
import { SiteConfig } from '../../../../src/types';

// Mock the useCategories hook
jest.mock('../../../../src/components/admin/categories/hooks', () => ({
  useCategories: jest.fn(),
}));

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
 * Default mock implementation for useCategories hook
 */
export const createMockCategoriesHook = (overrides = {}) => ({
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
  fetchCategories: jest.fn(),
  ...overrides
});

/**
 * Setup function for CategoryTable tests with configurable hook mocks
 */
export const setupCategoryTableTest = (overrides = {}) => {
  const mockHook = createMockCategoriesHook(overrides);
  (hooks.useCategories as jest.Mock).mockReturnValue(mockHook);
  return mockHook;
};

/**
 * Reset all mocks before each test
 */
export const resetMocks = () => {
  jest.clearAllMocks();
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
