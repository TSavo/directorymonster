/**
 * @jest-environment jsdom
 */
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { SubmissionDashboard } from '../SubmissionDashboard';
import { useSubmissions } from '../hooks/useSubmissions';
import { useCategories } from '@/components/admin/categories/hooks/useCategories';
import { SubmissionStatus } from '@/types/submission';

// Mock the hooks
jest.mock('../hooks/useSubmissions');
jest.mock('@/components/admin/categories/hooks/useCategories');

describe('SubmissionDashboard Component', () => {
  const mockSubmissions = [
    {
      id: 'submission-1',
      siteId: 'site-1',
      tenantId: 'tenant-1',
      title: 'Test Submission 1',
      description: 'Test description 1',
      categoryIds: ['category-1'],
      status: SubmissionStatus.PENDING,
      userId: 'user-1',
      createdAt: '2023-01-01T00:00:00.000Z',
      updatedAt: '2023-01-01T00:00:00.000Z'
    },
    {
      id: 'submission-2',
      siteId: 'site-1',
      tenantId: 'tenant-1',
      title: 'Test Submission 2',
      description: 'Test description 2',
      categoryIds: ['category-2'],
      status: SubmissionStatus.APPROVED,
      userId: 'user-2',
      createdAt: '2023-01-02T00:00:00.000Z',
      updatedAt: '2023-01-02T00:00:00.000Z'
    }
  ];

  const mockCategories = [
    { id: 'category-1', name: 'Category 1', slug: 'category-1' },
    { id: 'category-2', name: 'Category 2', slug: 'category-2' }
  ];

  const mockPagination = {
    page: 1,
    perPage: 10,
    total: 2,
    totalPages: 1
  };

  const mockSetFilter = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock useSubmissions hook
    (useSubmissions as jest.Mock).mockReturnValue({
      submissions: mockSubmissions,
      isLoading: false,
      error: null,
      pagination: mockPagination,
      fetchSubmissions: jest.fn(),
      setPage: jest.fn(),
      setFilter: mockSetFilter
    });
    
    // Mock useCategories hook
    (useCategories as jest.Mock).mockReturnValue({
      categories: mockCategories,
      isLoading: false,
      error: null,
      fetchCategories: jest.fn()
    });
  });

  it('renders the dashboard with filter and table', () => {
    render(<SubmissionDashboard />);
    
    // Check that the title is rendered
    expect(screen.getByText('Submissions')).toBeInTheDocument();
    
    // Check that the filter is rendered
    expect(screen.getByPlaceholderText('Search submissions...')).toBeInTheDocument();
    
    // Check that the table is rendered
    expect(screen.getByText('Test Submission 1')).toBeInTheDocument();
    expect(screen.getByText('Test Submission 2')).toBeInTheDocument();
  });

  it('passes filter changes to the table', () => {
    render(<SubmissionDashboard />);
    
    // Enter search text
    const searchInput = screen.getByPlaceholderText('Search submissions...');
    fireEvent.change(searchInput, { target: { value: 'test search' } });
    
    // Click apply button
    fireEvent.click(screen.getByText('Apply Filters'));
    
    // Check that setFilter was called with the correct filter
    expect(mockSetFilter).toHaveBeenCalledWith(
      expect.objectContaining({
        search: 'test search'
      })
    );
  });

  it('passes categories to the filter', () => {
    render(<SubmissionDashboard />);
    
    // Expand to show categories
    fireEvent.click(screen.getByText('Expand'));
    
    // Check that categories are rendered
    expect(screen.getByText('Category 1')).toBeInTheDocument();
    expect(screen.getByText('Category 2')).toBeInTheDocument();
  });

  it('passes siteSlug to hooks', () => {
    const siteSlug = 'test-site';
    
    render(<SubmissionDashboard siteSlug={siteSlug} />);
    
    // Check that useSubmissions was called with the siteSlug
    expect(useSubmissions).toHaveBeenCalledWith(
      expect.objectContaining({
        siteSlug
      })
    );
    
    // Check that useCategories was called with the siteSlug
    expect(useCategories).toHaveBeenCalledWith(
      expect.objectContaining({
        siteSlug
      })
    );
  });

  it('handles loading state for categories', () => {
    // Mock categories loading
    (useCategories as jest.Mock).mockReturnValue({
      categories: [],
      isLoading: true,
      error: null,
      fetchCategories: jest.fn()
    });
    
    render(<SubmissionDashboard />);
    
    // Expand to show categories
    fireEvent.click(screen.getByText('Expand'));
    
    // Categories should not be rendered
    expect(screen.queryByText('Category 1')).not.toBeInTheDocument();
    expect(screen.queryByText('Category 2')).not.toBeInTheDocument();
  });
});
