import { Category } from '@/types';

/**
 * Mock categories for testing
 */
export const mockCategories = (tenantId: string = 'tenant1'): Category[] => [
  {
    id: 'cat1',
    siteId: 'site1',
    tenantId,
    name: 'Category 1',
    slug: 'category-1',
    metaDescription: 'Description for category 1',
    order: 1,
    createdAt: 1615482366000,
    updatedAt: 1615482366000,
  },
  {
    id: 'cat2',
    siteId: 'site1',
    tenantId,
    name: 'Category 2',
    slug: 'category-2',
    metaDescription: 'Description for category 2',
    parentId: 'cat1',
    order: 2,
    createdAt: 1615482366000,
    updatedAt: 1615482366000,
  },
];

/**
 * Generate a large set of mock categories for pagination testing
 */
export const generateMockCategories = (count: number, tenantId: string = 'tenant1'): Category[] => {
  return Array.from({ length: count }, (_, i) => ({
    id: `cat${i + 1}`,
    siteId: 'site1',
    tenantId,
    name: `Category ${i + 1}`,
    slug: `category-${i + 1}`,
    metaDescription: `Description for category ${i + 1}`,
    order: i + 1,
    createdAt: 1615482366000,
    updatedAt: 1615482366000,
  }));
};
