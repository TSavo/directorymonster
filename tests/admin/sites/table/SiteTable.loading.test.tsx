import React from 'react';
import { render, screen } from '@testing-library/react';
import { SiteTable } from '@/components/admin/sites/table/SiteTable';

// Mock the necessary hooks with loading state
jest.mock('@/components/admin/sites/hooks', () => ({
  useSites: () => ({
    sites: [],
    isLoading: true,
    error: null,
    totalSites: 0,
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

describe('SiteTable Component - Loading State', () => {
  it('renders a skeleton loader when loading', () => {
    render(<SiteTable />);

    // Check if skeleton loader is rendered
    expect(screen.getByTestId('site-table-loading')).toBeInTheDocument();

    // Verify that no site rows are rendered during loading
    expect(screen.queryByTestId(/site-row-/)).not.toBeInTheDocument();
  });

  it('displays a loading skeleton', () => {
    render(<SiteTable />);

    // Check for loading skeleton
    const loadingElement = screen.getByTestId('site-table-loading');
    expect(loadingElement.querySelector('.animate-pulse')).toBeInTheDocument();
  });

  it('renders the site table header during loading', () => {
    render(<SiteTable />);

    // Check if the table header is visible during loading
    expect(screen.getByTestId('site-table-header')).toBeInTheDocument();
    expect(screen.getByText('Sites')).toBeInTheDocument();
    expect(screen.getByTestId('site-search-input')).toBeInTheDocument();
    expect(screen.getByTestId('create-site-button')).toBeInTheDocument();
  });
});
