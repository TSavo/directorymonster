/**
 * Integration Test Setup for Critical Paths
 *
 * This file provides common utilities and setup procedures for testing critical user paths.
 */

import { render, screen, waitFor } from '@testing-library/react';
import { NextRouter } from 'next/router';
import { SiteConfig, Category, Listing } from '@/types';

// Mock Next.js router
export const mockRouter: Partial<NextRouter> = {
  push: jest.fn(),
  replace: jest.fn(),
  prefetch: jest.fn(),
  back: jest.fn(),
  pathname: '/',
  query: {},
  asPath: '/',
  basePath: '',
  isReady: true,
  isFallback: false,
  isLocaleDomain: false,
  isPreview: false,
  events: {
    on: jest.fn(),
    off: jest.fn(),
    emit: jest.fn(),
  },
};

// Create mock site data
export const createMockSite = (overrides = {}): SiteConfig => ({
  id: 'site-1',
  name: 'Test Directory',
  slug: 'test-directory',
  domain: 'test-directory.com',
  tenantId: 'tenant-1',
  primaryKeyword: 'test directory',
  metaDescription: 'A test directory for integration tests',
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  ...overrides,
});

// Create mock category data
export const createMockCategory = (siteId: string, overrides = {}): Category => ({
  id: `category-${Math.floor(Math.random() * 1000)}`,
  name: 'Test Category',
  slug: 'test-category',
  siteId,
  parentId: null,
  metaDescription: 'A test category for integration tests',
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  ...overrides,
});

// Create mock listing data
export const createMockListing = (siteId: string, categoryId: string, overrides = {}): Listing => ({
  id: `listing-${Math.floor(Math.random() * 1000)}`,
  title: 'Test Listing',
  slug: 'test-listing',
  siteId,
  categoryId,
  description: 'A test listing for integration tests',
  metaDescription: 'Meta description for test listing',
  featured: false,
  verified: true,
  rating: 4.5,
  reviewCount: 10,
  price: 99.99,
  priceRange: '$',
  address: '123 Test St',
  city: 'Test City',
  state: 'TS',
  zipCode: '12345',
  country: 'Test Country',
  phone: '123-456-7890',
  email: 'contact@testlisting.com',
  website: 'https://testlisting.com',
  socialMedia: {
    facebook: 'https://facebook.com/testlisting',
    twitter: 'https://twitter.com/testlisting',
    instagram: 'https://instagram.com/testlisting',
  },
  images: ['/test-image.jpg'],
  tags: ['test', 'integration'],
  customFields: {},
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  ...overrides,
});

// Create multiple mock listings
export const createMockListings = (
  siteId: string,
  categoryId: string,
  count = 5
): Listing[] => {
  return Array.from({ length: count }, (_, i) =>
    createMockListing(siteId, categoryId, {
      id: `listing-${i + 1}`,
      title: `Test Listing ${i + 1}`,
      slug: `test-listing-${i + 1}`,
    })
  );
};

// Create multiple mock categories
export const createMockCategories = (
  siteId: string,
  count = 3
): Category[] => {
  return Array.from({ length: count }, (_, i) =>
    createMockCategory(siteId, {
      id: `category-${i + 1}`,
      name: `Test Category ${i + 1}`,
      slug: `test-category-${i + 1}`,
    })
  );
};

// Wait for elements to be loaded
export const waitForElementToBeLoaded = async (testId: string) => {
  await waitFor(() => {
    expect(screen.getByTestId(testId)).toBeInTheDocument();
  });
};

// Wait for navigation to complete
export const waitForNavigation = async (path: string) => {
  await waitFor(() => {
    expect(mockRouter.push).toHaveBeenCalledWith(
      expect.objectContaining({ pathname: path }),
      expect.anything(),
      expect.anything()
    );
  });
};

// Mock fetch for API calls
export const mockFetch = (data: any) => {
  global.fetch = jest.fn().mockImplementation(() =>
    Promise.resolve({
      ok: true,
      json: () => Promise.resolve(data),
    })
  );
};

// Reset mocks between tests
export const resetMocks = () => {
  jest.clearAllMocks();
  mockRouter.push = jest.fn();
  mockRouter.replace = jest.fn();
  mockRouter.prefetch = jest.fn();
  mockRouter.back = jest.fn();
  mockRouter.pathname = '/';
  mockRouter.query = {};
  mockRouter.asPath = '/';
  global.fetch = jest.fn();
};
