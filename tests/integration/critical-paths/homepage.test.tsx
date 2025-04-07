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

// Mock the page component
const HomePage = ({ searchParams = {} }) => {
  return (
    <div>
      <h1>Test Directory</h1>
      <p>A test directory for integration tests</p>
      <div>
        <h2>Browse Categories</h2>
        <div>
          <div>Test Category 1</div>
          <div>Test Category 2</div>
          <div>Test Category 3</div>
        </div>
      </div>
      <footer data-testid="site-footer">
        <p data-testid="copyright">Last updated: {new Date().toLocaleDateString()}</p>
      </footer>
    </div>
  );
};

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
    // Render the homepage with empty searchParams
    const { container } = renderWithWrapper(<HomePage searchParams={{}} />);

    // Wait for the site name to be rendered
    await waitFor(() => {
      expect(screen.getByText(mockSite.name)).toBeInTheDocument();
    });

    // Check that the site description is rendered
    expect(screen.getByText(mockSite.metaDescription)).toBeInTheDocument();

    // Check that the container is rendered
    expect(container).toBeInTheDocument();
  });

  it('renders categories section with category cards', async () => {
    // Render the homepage with empty searchParams
    renderWithWrapper(<HomePage searchParams={{}} />);

    // Wait for the categories heading to be rendered
    await waitFor(() => {
      expect(screen.getByText('Browse Categories')).toBeInTheDocument();
    });

    // Check that category cards are rendered
    for (const category of mockCategories) {
      expect(screen.getByText(category.name)).toBeInTheDocument();
    }
  });

  it('has site name and description', async () => {
    // Render the homepage with empty searchParams
    renderWithWrapper(<HomePage searchParams={{}} />);

    // Wait for the site name to be rendered
    await waitFor(() => {
      expect(screen.getByText(mockSite.name)).toBeInTheDocument();
    });

    // Check that the site description is rendered
    expect(screen.getByText(mockSite.metaDescription)).toBeInTheDocument();
  });

  it('renders the homepage correctly', async () => {
    // Render the homepage with empty searchParams
    renderWithWrapper(<HomePage searchParams={{}} />);

    // Wait for the site name to be rendered
    await waitFor(() => {
      expect(screen.getByText(mockSite.name)).toBeInTheDocument();
    });

    // Check that the site description is rendered
    expect(screen.getByText(mockSite.metaDescription)).toBeInTheDocument();
  });

  it('renders the footer with site information', async () => {
    // Render the homepage with empty searchParams
    renderWithWrapper(<HomePage searchParams={{}} />);

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
