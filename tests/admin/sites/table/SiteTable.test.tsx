import React from 'react';
import { render, screen } from '@testing-library/react';
import { SiteTable } from '@/components/admin/sites/table/SiteTable';

// Mock the necessary hooks and components
jest.mock('@/components/admin/sites/hooks/useSites', () => ({
  useSites: jest.fn(() => ({
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
    totalPages: 1,
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

describe('SiteTable Component - Basic Rendering', () => {
  it('renders the table with correct columns', () => {
    render(<SiteTable />);
    
    // Check if the table header columns are rendered
    expect(screen.getByTestId('site-table-header-name')).toBeInTheDocument();
    expect(screen.getByTestId('site-table-header-slug')).toBeInTheDocument();
    expect(screen.getByTestId('site-table-header-domains')).toBeInTheDocument();
    expect(screen.getByTestId('site-table-header-last-modified')).toBeInTheDocument();
    expect(screen.getByTestId('site-table-header-status')).toBeInTheDocument();
    expect(screen.getByTestId('site-table-header-actions')).toBeInTheDocument();
  });

  it('renders site rows with correct data', () => {
    render(<SiteTable />);
    
    // Check if both site rows are rendered
    expect(screen.getByTestId('site-row-site-1')).toBeInTheDocument();
    expect(screen.getByTestId('site-row-site-2')).toBeInTheDocument();
    
    // Check data in first row
    expect(screen.getByTestId('site-name-site-1')).toHaveTextContent('Test Site 1');
    expect(screen.getByTestId('site-slug-site-1')).toHaveTextContent('test-site-1');
    expect(screen.getByTestId('site-domains-site-1')).toHaveTextContent('example1.com');
    expect(screen.getByTestId('site-status-site-1')).toHaveTextContent('active');
    
    // Check data in second row
    expect(screen.getByTestId('site-name-site-2')).toHaveTextContent('Test Site 2');
    expect(screen.getByTestId('site-slug-site-2')).toHaveTextContent('test-site-2');
    expect(screen.getByTestId('site-domains-site-2')).toHaveTextContent('example2.com');
    expect(screen.getByTestId('site-status-site-2')).toHaveTextContent('inactive');
  });

  it('renders action buttons for each row', () => {
    render(<SiteTable />);
    
    // Check if edit and delete buttons are rendered for each row
    expect(screen.getByTestId('site-edit-button-site-1')).toBeInTheDocument();
    expect(screen.getByTestId('site-delete-button-site-1')).toBeInTheDocument();
    expect(screen.getByTestId('site-edit-button-site-2')).toBeInTheDocument();
    expect(screen.getByTestId('site-delete-button-site-2')).toBeInTheDocument();
  });
});
