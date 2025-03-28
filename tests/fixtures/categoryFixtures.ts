/**
 * Category fixtures for testing
 * 
 * This file contains mock category data for use across category-related tests.
 * Using consistent test data helps ensure tests are reliable and maintainable.
 */
import { CategoryWithRelations } from '../../src/components/admin/categories/types';

// Create consistent timestamps for testing
const now = Date.now();
const oneDayAgo = now - 86400000; // 1 day ago
const oneHourAgo = now - 3600000; // 1 hour ago
const twelveHoursAgo = now - 43200000; // 12 hours ago
const thirtyMinutesAgo = now - 1800000; // 30 minutes ago

/**
 * Base category for testing
 * 
 * A top-level category with children
 */
export const mockCategory: CategoryWithRelations = {
  id: 'category_1',
  siteId: 'site_1',
  name: 'Test Category 1',
  slug: 'test-category-1',
  metaDescription: 'This is test category 1',
  order: 1,
  parentId: null,
  createdAt: oneDayAgo,
  updatedAt: oneHourAgo,
  childCount: 2,
  siteName: 'Test Site',
};

/**
 * Category with site slug
 * 
 * Same as base category but with site slug for site-specific URL testing
 */
export const mockCategoryWithSiteSlug: CategoryWithRelations = {
  ...mockCategory,
  siteSlug: 'test-site'
};

/**
 * Child category for testing
 * 
 * A category that has a parent (mockCategory)
 */
export const mockChildCategory: CategoryWithRelations = {
  id: 'category_3',
  siteId: 'site_1',
  name: 'Child Category',
  slug: 'child-category',
  metaDescription: 'This is a child category',
  order: 1,
  parentId: 'category_1',
  createdAt: twelveHoursAgo,
  updatedAt: thirtyMinutesAgo,
  parentName: 'Test Category 1',
  childCount: 0,
  siteName: 'Test Site',
};

/**
 * Deeply nested category for testing
 * 
 * A category that is nested multiple levels deep (grandchild of mockCategory)
 */
export const mockDeepNestedCategory: CategoryWithRelations = {
  ...mockChildCategory,
  id: 'category_4',
  name: 'Deep Nested Category',
  slug: 'deep-nested-category',
  parentId: 'category_3',
  parentName: 'Child Category',
};

/**
 * Mock delete click handler
 * 
 * Jest mock function for testing delete button interactions
 */
export const mockDeleteClick = jest.fn();

/**
 * Category with no children
 * 
 * Useful for testing non-parent categories
 */
export const mockCategoryNoChildren: CategoryWithRelations = {
  ...mockCategory,
  childCount: 0,
};

/**
 * Category with many children
 * 
 * Useful for testing the display of larger child counts
 */
export const mockCategoryManyChildren: CategoryWithRelations = {
  ...mockCategory,
  childCount: 25,
};

/**
 * Category with very long name
 * 
 * Useful for testing layout with extra-long content
 */
export const mockCategoryLongName: CategoryWithRelations = {
  ...mockCategory,
  name: 'This is an extremely long category name that should still be displayed properly without breaking the layout of the table row',
};
