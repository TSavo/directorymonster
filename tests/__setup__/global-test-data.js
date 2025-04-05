/**
 * Global Test Data Setup
 * 
 * This file sets up the global.__TEST_DATA__ object that is used by various tests.
 * It provides consistent test data across all tests.
 */

// Create a timestamp for consistent test data
const now = new Date().getTime();
const oneDayAgo = now - 86400000;
const oneWeekAgo = now - 604800000;

// Mock sites for testing
const mockSites = [
  {
    id: 'site_1',
    name: 'Test Site 1',
    slug: 'test-site-1',
    domains: ['test-site-1.com', 'www.test-site-1.com'],
    theme: 'default',
    createdAt: oneWeekAgo,
    updatedAt: oneDayAgo
  },
  {
    id: 'site_2',
    name: 'Test Site 2',
    slug: 'test-site-2',
    domains: ['test-site-2.com'],
    theme: 'modern',
    createdAt: oneWeekAgo,
    updatedAt: now
  }
];

// Mock users for testing
const mockUsers = [
  {
    id: 'user_1',
    name: 'Admin User',
    email: 'admin@example.com',
    role: 'admin',
    siteIds: ['site_1', 'site_2'],
    createdAt: oneWeekAgo,
    updatedAt: oneDayAgo
  },
  {
    id: 'user_2',
    name: 'Site Editor',
    email: 'editor@example.com',
    role: 'editor',
    siteIds: ['site_1'],
    createdAt: oneWeekAgo,
    updatedAt: oneDayAgo
  }
];

// Mock categories for testing
const mockCategories = [
  {
    id: 'category_1',
    siteId: 'site_1',
    name: 'Main Category',
    slug: 'main-category',
    metaDescription: 'This is the main category',
    order: 1,
    parentId: null,
    createdAt: oneWeekAgo,
    updatedAt: oneDayAgo
  },
  {
    id: 'category_2',
    siteId: 'site_1',
    name: 'Sub Category',
    slug: 'sub-category',
    metaDescription: 'This is a sub category',
    order: 1,
    parentId: 'category_1',
    createdAt: oneWeekAgo,
    updatedAt: oneDayAgo
  }
];

// Mock listings for testing
const mockListings = [
  {
    id: 'listing_1',
    siteId: 'site_1',
    categoryId: 'category_1',
    title: 'Test Listing 1',
    slug: 'test-listing-1',
    description: 'This is test listing 1',
    address: '123 Test St',
    city: 'Test City',
    state: 'TS',
    zip: '12345',
    phone: '555-123-4567',
    email: 'contact@listing1.com',
    website: 'https://listing1.com',
    status: 'published',
    createdAt: oneWeekAgo,
    updatedAt: oneDayAgo
  },
  {
    id: 'listing_2',
    siteId: 'site_1',
    categoryId: 'category_2',
    title: 'Test Listing 2',
    slug: 'test-listing-2',
    description: 'This is test listing 2',
    address: '456 Test Ave',
    city: 'Test Town',
    state: 'TS',
    zip: '12346',
    phone: '555-765-4321',
    email: 'contact@listing2.com',
    website: 'https://listing2.com',
    status: 'published',
    createdAt: oneWeekAgo,
    updatedAt: now
  }
];

// Set up global test data
global.__TEST_DATA__ = {
  sites: mockSites,
  users: mockUsers,
  categories: mockCategories,
  listings: mockListings,
  timestamps: {
    now,
    oneDayAgo,
    oneWeekAgo
  }
};

// Additional helper for checking if TEST_DATA is available
global.__HAS_TEST_DATA__ = true;
