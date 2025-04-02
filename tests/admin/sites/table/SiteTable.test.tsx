import React from 'react';
import { render, screen } from '@testing-library/react';
import { SiteTable } from '@/components/admin/sites/table/SiteTable';

// Mock the necessary hooks and components
jest.mock('@/components/admin/sites/hooks', () => ({
  useSites: jest.fn(() => ({
    sites: [
      {
        id: 'site-1',
        name: 'Test Site 1',
        slug: 'test-site-1',
        domains: ['example1.com'],
        createdAt: '2025-03-29T12:00:00Z',
        status: 'active'
      },
      {
        id: 'site-2',
        name: 'Test Site 2',
        slug: 'test-site-2',
        domains: ['example2.com'],
        createdAt: '2025-03-28T14:30:00Z',
        status: 'inactive'
      }
    ],
    isLoading: false,
    error: null,
    totalSites: 2,
    totalPages: 1,
    currentPage: 1,
    deleteSite: jest.fn(),
    fetchSites: jest.fn(),
    filters: {
      search: '',
      sortBy: 'name',
      sortOrder: 'asc',
      page: 1,
      limit: 10
    },
    setFilters: jest.fn()
  }))
}));

// Mock Next.js navigation
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
  }),
}));

describe('SiteTable Component - Basic Rendering', () => {
  it('renders the table container', () => {
    render(<SiteTable />);

    // Check if the main table container is rendered
    expect(screen.getByTestId('site-table')).toBeInTheDocument();
    expect(screen.getByTestId('sites-desktop-table')).toBeInTheDocument();
  });

  it('renders site rows with correct data', () => {
    render(<SiteTable />);

    // Check if both site rows are rendered
    expect(screen.getByTestId('site-row-site-1')).toBeInTheDocument();
    expect(screen.getByTestId('site-row-site-2')).toBeInTheDocument();

    // Check data in first row
    expect(screen.getByTestId('site-name-site-1')).toHaveTextContent('Test Site 1');
    expect(screen.getByTestId('site-slug-site-1')).toHaveTextContent('test-site-1');

    // Check data in second row
    expect(screen.getByTestId('site-name-site-2')).toHaveTextContent('Test Site 2');
    expect(screen.getByTestId('site-slug-site-2')).toHaveTextContent('test-site-2');
  });

  it('renders domain information correctly', () => {
    render(<SiteTable />);

    // Check if domains are displayed with correct testids
    expect(screen.getByTestId('site-domain-0-site-1')).toHaveTextContent('example1.com');
    expect(screen.getByTestId('site-domain-0-site-2')).toHaveTextContent('example2.com');
  });

  it('renders action buttons for each row', () => {
    render(<SiteTable />);

    // Check if view, edit and delete buttons are rendered for each row with correct testids
    expect(screen.getByTestId('view-site-site-1')).toBeInTheDocument();
    expect(screen.getByTestId('edit-site-site-1')).toBeInTheDocument();
    expect(screen.getByTestId('delete-site-site-1')).toBeInTheDocument();

    expect(screen.getByTestId('view-site-site-2')).toBeInTheDocument();
    expect(screen.getByTestId('edit-site-site-2')).toBeInTheDocument();
    expect(screen.getByTestId('delete-site-site-2')).toBeInTheDocument();
  });
});
