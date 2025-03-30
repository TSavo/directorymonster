import React from 'react';
import { render, screen } from '@testing-library/react';
import { SiteTable } from '@/components/admin/sites/table/SiteTable';

// Mock the necessary hooks with error state
jest.mock('@/components/admin/sites/hooks/useSites', () => ({
  useSites: jest.fn(() => ({
    sites: [],
    isLoading: false,
    error: 'Failed to fetch sites. Please try again.',
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

describe('SiteTable Component - Error State', () => {
  it('displays an error message when there is an error', () => {
    render(<SiteTable />);
    
    // Check if error message is displayed
    expect(screen.getByTestId('site-table-error')).toBeInTheDocument();
    expect(screen.getByText('Failed to fetch sites. Please try again.')).toBeInTheDocument();
  });

  it('provides a retry button when error occurs', () => {
    render(<SiteTable />);
    
    // Check for retry button
    const retryButton = screen.getByTestId('site-table-error-retry');
    expect(retryButton).toBeInTheDocument();
    expect(retryButton).toHaveTextContent(/retry|try again/i);
  });
  
  it('does not render any site rows when there is an error', () => {
    render(<SiteTable />);
    
    // Verify that no site rows are rendered during error state
    expect(screen.queryByTestId(/site-row-/)).not.toBeInTheDocument();
  });
  
  it('still renders the table header component during error', () => {
    render(<SiteTable />);
    
    // The search functionality should still be available
    expect(screen.getByTestId('site-table-search')).toBeInTheDocument();
  });
});
