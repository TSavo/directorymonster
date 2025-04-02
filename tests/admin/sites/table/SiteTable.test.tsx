import React from 'react';
import { render, screen } from '@testing-library/react';
import { SiteTable } from '@/components/admin/sites/table/SiteTable';

// Mock the necessary hooks and components
jest.mock('@/components/admin/sites/hooks', () => ({
  useSites: () => ({
    sites: [
      {
        id: 'site-1',
        name: 'Test Site 1',
        slug: 'test-site-1',
        domains: ['example1.com'],
        lastModified: '2025-03-29T12:00:00Z',
        status: 'active'
      },
      {
        id: 'site-2',
        name: 'Test Site 2',
        slug: 'test-site-2',
        domains: ['example2.com'],
        lastModified: '2025-03-28T14:30:00Z',
        status: 'inactive'
      }
    ],
    isLoading: false,
    error: null,
    totalSites: 2,
    filters: {
      search: '',
      sortBy: 'name',
      sortOrder: 'asc',
      page: 1,
      limit: 10
    },
    setFilters: jest.fn(),
    fetchSites: jest.fn(),
    deleteSite: jest.fn()
  })
}));

// Mock Next.js navigation
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
  }),
}));

describe('SiteTable Component - Basic Rendering', () => {
  it('renders the table with correct columns', () => {
    render(<SiteTable />);

    // Check if the table header columns are rendered
    expect(screen.getByTestId('site-column-name')).toBeInTheDocument();
    expect(screen.getByTestId('site-column-slug')).toBeInTheDocument();
    expect(screen.getByTestId('site-column-domains')).toBeInTheDocument();
    expect(screen.getByTestId('site-column-created')).toBeInTheDocument();
    expect(screen.getByTestId('site-column-actions')).toBeInTheDocument();
  });

  it('renders site rows with correct data', () => {
    render(<SiteTable />);

    // Check if both site rows are rendered
    expect(screen.getByTestId('site-row-site-1')).toBeInTheDocument();
    expect(screen.getByTestId('site-row-site-2')).toBeInTheDocument();

    // Check data in first row
    expect(screen.getByTestId('site-name-site-1')).toHaveTextContent('Test Site 1');
    expect(screen.getByTestId('site-slug-site-1')).toHaveTextContent('test-site-1');

    // Check if domains are displayed
    const siteRow = screen.getByTestId('site-row-site-1');
    expect(siteRow).toHaveTextContent('example1.com');

    // Check data in second row
    expect(screen.getByTestId('site-name-site-2')).toHaveTextContent('Test Site 2');
    expect(screen.getByTestId('site-slug-site-2')).toHaveTextContent('test-site-2');

    // Check if domains are displayed
    const siteRow2 = screen.getByTestId('site-row-site-2');
    expect(siteRow2).toHaveTextContent('example2.com');
  });

  it('renders action buttons for each row', () => {
    render(<SiteTable />);

    // Check if action buttons are rendered
    const siteRow1 = screen.getByTestId('site-row-site-1');
    const siteRow2 = screen.getByTestId('site-row-site-2');

    // Check for edit links
    expect(siteRow1.querySelector('a[href="/admin/sites/site-1/edit"]')).toBeInTheDocument();
    expect(siteRow2.querySelector('a[href="/admin/sites/site-2/edit"]')).toBeInTheDocument();

    // Check for delete buttons
    expect(siteRow1.querySelector('button')).toBeInTheDocument();
    expect(siteRow2.querySelector('button')).toBeInTheDocument();
  });
});
