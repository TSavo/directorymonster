import React from 'react';
import { render, screen } from '@testing-library/react';
import { SiteTable } from '@/components/admin/sites/table/SiteTable';

// Mock the necessary hooks with loading state
jest.mock('@/components/admin/sites/hooks/useSites', () => ({
  useSites: jest.fn(() => ({
    sites: [],
    isLoading: true,
    error: null,
    totalSites: 0,
    totalPages: 0,
    currentPage: 1,
    deleteSite: jest.fn(),
    searchSites: jest.fn(),
    goToPage: jest.fn(),
    sortSites: jest.fn(),
    sortField: null,
    sortDirection: null
  }))
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
    expect(screen.getByTestId('site-table-skeleton')).toBeInTheDocument();
    
    // Verify that no site rows are rendered during loading
    expect(screen.queryByTestId(/site-row-/)).not.toBeInTheDocument();
  });

  it('displays the appropriate loading message', () => {
    render(<SiteTable />);
    
    // Check for loading message
    expect(screen.getByText(/loading sites/i)).toBeInTheDocument();
  });
  
  it('renders the table headers even during loading', () => {
    render(<SiteTable />);
    
    // Check if the table headers are still visible during loading
    expect(screen.getByTestId('site-table-header-name')).toBeInTheDocument();
    expect(screen.getByTestId('site-table-header-slug')).toBeInTheDocument();
    expect(screen.getByTestId('site-table-header-domains')).toBeInTheDocument();
    expect(screen.getByTestId('site-table-header-status')).toBeInTheDocument();
  });
});
