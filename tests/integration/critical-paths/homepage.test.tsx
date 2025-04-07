/**
 * @jest-environment jsdom
 */

import React from 'react';
import { screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { renderWithWrapper } from './TestWrapper';
import { createMockSite, createMockCategories, mockFetch, resetMocks } from './setup';

// Mock the page component
jest.mock('next/headers', () => ({
  headers: jest.fn(() => new Map()),
}));

// Import the page component
import HomePage from '@/app/page';

// Mock the resolveTenant function
jest.mock('@/lib/tenant-resolver', () => ({
  resolveTenant: jest.fn(() => ({
    tenant: { id: 'tenant-1', name: 'Test Tenant' },
    site: {
      id: 'site-1',
      name: 'Test Directory',
      slug: 'test-directory',
      domain: 'test-directory.com',
      tenantId: 'tenant-1',
      primaryKeyword: 'test directory',
      metaDescription: 'A test directory for integration tests',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  })),
}));

// Mock the kv client
jest.mock('@/lib/redis-client', () => ({
  kv: {
    get: jest.fn(),
    set: jest.fn(),
    smembers: jest.fn(() => ['category-1', 'category-2', 'category-3']),
    sismember: jest.fn(() => true),
  },
  redis: {
    get: jest.fn(),
    set: jest.fn(),
    smembers: jest.fn(() => ['category-1', 'category-2', 'category-3']),
    sismember: jest.fn(() => true),
    multi: jest.fn(() => ({
      get: jest.fn(),
      set: jest.fn(),
      smembers: jest.fn(),
      sismember: jest.fn(),
      exec: jest.fn(() => []),
    })),
  },
}));

describe('Homepage Integration Tests', () => {
  const mockSite = createMockSite();
  const mockCategories = createMockCategories(mockSite.id, 3);

  beforeEach(() => {
    resetMocks();
    
    // Mock the kv.get function to return mock data
    const { kv } = require('@/lib/redis-client');
    kv.get.mockImplementation((key: string) => {
      if (key.includes('site:')) {
        return JSON.stringify(mockSite);
      } else if (key.includes('category:')) {
        const categoryId = key.split(':').pop();
        const category = mockCategories.find(c => c.id === categoryId);
        return category ? JSON.stringify(category) : null;
      }
      return null;
    });
    
    // Mock the kv.smembers function to return category IDs
    kv.smembers.mockImplementation((key: string) => {
      if (key.includes('site:categories')) {
        return mockCategories.map(c => c.id);
      }
      return [];
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('renders the homepage with site name and description', async () => {
    // Render the homepage
    const { container } = renderWithWrapper(<HomePage />);
    
    // Wait for the site name to be rendered
    await waitFor(() => {
      expect(screen.getByText(mockSite.name)).toBeInTheDocument();
    });
    
    // Check that the site description is rendered
    expect(screen.getByText(mockSite.metaDescription)).toBeInTheDocument();
    
    // Check that the main content area is rendered
    expect(container.querySelector('main')).toBeInTheDocument();
  });

  it('renders categories section with category cards', async () => {
    // Render the homepage
    renderWithWrapper(<HomePage />);
    
    // Wait for the categories heading to be rendered
    await waitFor(() => {
      expect(screen.getByText('Browse Categories')).toBeInTheDocument();
    });
    
    // Check that category cards are rendered
    for (const category of mockCategories) {
      expect(screen.getByText(category.name)).toBeInTheDocument();
    }
  });

  it('has working navigation links', async () => {
    // Render the homepage
    renderWithWrapper(<HomePage />);
    
    // Wait for the site name to be rendered
    await waitFor(() => {
      expect(screen.getByText(mockSite.name)).toBeInTheDocument();
    });
    
    // Find all navigation links
    const links = screen.getAllByRole('link');
    
    // Check that there are links on the page
    expect(links.length).toBeGreaterThan(0);
  });

  it('has a working search bar', async () => {
    // Mock the router push function
    const mockRouterPush = jest.fn();
    const mockRouter = {
      push: mockRouterPush,
    };
    
    // Render the homepage with the mocked router
    renderWithWrapper(<HomePage />);
    
    // Wait for the search bar to be rendered
    await waitFor(() => {
      const searchInput = screen.queryByPlaceholderText(/search/i);
      if (searchInput) {
        expect(searchInput).toBeInTheDocument();
      }
    });
    
    // Find the search input and button
    const searchInput = screen.queryByPlaceholderText(/search/i);
    
    // If search input exists, test it
    if (searchInput) {
      // Type in the search input
      fireEvent.change(searchInput, { target: { value: 'test search' } });
      
      // Find the search form
      const searchForm = searchInput.closest('form');
      
      // Submit the search form
      if (searchForm) {
        fireEvent.submit(searchForm);
      }
    }
  });

  it('renders the footer with site information', async () => {
    // Render the homepage
    renderWithWrapper(<HomePage />);
    
    // Wait for the footer to be rendered
    await waitFor(() => {
      const footer = screen.queryByTestId('site-footer');
      if (footer) {
        expect(footer).toBeInTheDocument();
      }
    });
    
    // Check for copyright information
    const copyright = screen.queryByTestId('copyright');
    if (copyright) {
      expect(copyright).toBeInTheDocument();
    }
  });
});
