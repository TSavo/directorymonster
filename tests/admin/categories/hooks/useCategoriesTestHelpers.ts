/**
 * Helper functions and mock data for useCategories hook tests
 */
import { Category, SiteConfig } from '../../../../src/types';
import { CategoryWithRelations } from '../../../../src/components/admin/categories/types';

// Mock data for basic tests
export const mockCategories: CategoryWithRelations[] = [
  {
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
    siteName: 'Test Site'
  },
  {
    id: 'category_2',
    siteId: 'site_1',
    name: 'Test Category 2',
    slug: 'test-category-2',
    metaDescription: 'This is test category 2',
    order: 2,
    parentId: null,
    createdAt: Date.now() - 172800000, // 2 days ago
    updatedAt: Date.now() - 7200000,   // 2 hours ago
    childCount: 0,
    siteName: 'Test Site'
  },
  {
    id: 'category_3',
    siteId: 'site_1',
    name: 'Subcategory 1',
    slug: 'subcategory-1',
    metaDescription: 'This is a subcategory',
    order: 1,
    parentId: 'category_1',
    createdAt: Date.now() - 43200000, // 12 hours ago
    updatedAt: Date.now() - 1800000,  // 30 minutes ago
    parentName: 'Test Category 1',
    childCount: 0,
    siteName: 'Test Site'
  }
];

// Mock data with deeper hierarchy
export const mockHierarchicalCategories: CategoryWithRelations[] = [
  ...mockCategories,
  {
    id: 'category_4',
    siteId: 'site_1',
    name: 'Subcategory 2',
    slug: 'subcategory-2',
    metaDescription: 'Another subcategory',
    order: 2,
    parentId: 'category_1',
    createdAt: Date.now() - 21600000, // 6 hours ago
    updatedAt: Date.now() - 900000,   // 15 minutes ago
    parentName: 'Test Category 1',
    childCount: 1,
    siteName: 'Test Site'
  },
  {
    id: 'category_5',
    siteId: 'site_1',
    name: 'Deep Nested Category',
    slug: 'deep-nested',
    metaDescription: 'A deeply nested category',
    order: 1,
    parentId: 'category_4',
    createdAt: Date.now() - 10800000, // 3 hours ago
    updatedAt: Date.now() - 600000,   // 10 minutes ago
    parentName: 'Subcategory 2',
    childCount: 0,
    siteName: 'Test Site'
  }
];

// Mock sites for multi-site testing
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
  },
  {
    id: 'site_2',
    name: 'Second Site',
    slug: 'second-site',
    primaryKeyword: 'second',
    metaDescription: 'Second site description',
    headerText: 'Second Site',
    defaultLinkAttributes: 'dofollow' as const,
    createdAt: Date.now() - 900000000,
    updatedAt: Date.now() - 400000000
  }
];

// Categories with multiple sites
export const mockMultiSiteCategories: CategoryWithRelations[] = [
  ...mockCategories,
  {
    id: 'category_6',
    siteId: 'site_2',
    name: 'Second Site Category',
    slug: 'second-site-category',
    metaDescription: 'Category from second site',
    order: 1,
    parentId: null,
    createdAt: Date.now() - 43200000,
    updatedAt: Date.now() - 1800000,
    childCount: 0,
    siteName: 'Second Site'
  },
  {
    id: 'category_7',
    siteId: 'site_2',
    name: 'Another Second Site Category',
    slug: 'another-second-site-category',
    metaDescription: 'Another category from second site',
    order: 2,
    parentId: null,
    createdAt: Date.now() - 21600000,
    updatedAt: Date.now() - 900000,
    childCount: 0,
    siteName: 'Second Site'
  }
];

// Create a large dataset for pagination testing
export const createPaginatedCategories = (count: number): CategoryWithRelations[] => {
  return Array.from({ length: count }, (_, i) => ({
    id: `category_${i + 1}`,
    siteId: 'site_1',
    name: `Test Category ${i + 1}`,
    slug: `test-category-${i + 1}`,
    metaDescription: `This is test category ${i + 1}`,
    order: i + 1,
    parentId: null,
    createdAt: Date.now() - (i * 3600000),
    updatedAt: Date.now() - (i * 1800000),
    childCount: 0,
    siteName: 'Test Site'
  }));
};

// Mock fetch API helpers
export const mockFetchSuccess = (responseData: any) => {
  return jest.fn().mockImplementation(() =>
    Promise.resolve({
      ok: true,
      json: () => Promise.resolve(responseData),
    })
  );
};

export const mockFetchError = (errorMessage: string) => {
  return jest.fn().mockImplementation(() =>
    Promise.resolve({
      ok: false,
      statusText: errorMessage,
      json: () => Promise.reject(new Error(errorMessage)),
    })
  );
};

export const mockFetchWithDelete = (responseData: any, deleteResponse: any = {}) => {
  return jest.fn().mockImplementation((url: string, options?: any) => {
    // Handle delete request
    if (options?.method === 'DELETE') {
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve(deleteResponse)
      });
    }
    
    // Default case for GET requests
    return Promise.resolve({
      ok: true,
      json: () => Promise.resolve(responseData)
    });
  });
};

// Helper to reset mocks
export const resetMocks = () => {
  jest.clearAllMocks();
};
