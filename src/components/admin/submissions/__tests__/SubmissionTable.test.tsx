/**
 * @jest-environment jsdom
 */
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { SubmissionTable } from '../SubmissionTable';
import { useSubmissions } from '../hooks/useSubmissions';
import { SubmissionStatus } from '@/types/submission';

// Mock the useRouter hook
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn()
  })
}));

// Mock the useSubmissions hook
jest.mock('../hooks/useSubmissions');

describe('SubmissionTable Component', () => {
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
      categoryIds: ['category-2', 'category-3'],
      status: SubmissionStatus.APPROVED,
      userId: 'user-2',
      createdAt: '2023-01-02T00:00:00.000Z',
      updatedAt: '2023-01-02T00:00:00.000Z'
    }
  ];

  const mockPagination = {
    page: 1,
    perPage: 10,
    total: 2,
    totalPages: 1
  };

  const mockFetchSubmissions = jest.fn();
  const mockSetPage = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Default mock implementation
    (useSubmissions as jest.Mock).mockReturnValue({
      submissions: mockSubmissions,
      isLoading: false,
      error: null,
      pagination: mockPagination,
      fetchSubmissions: mockFetchSubmissions,
      setPage: mockSetPage,
      setFilter: jest.fn()
    });
  });

  it('renders submissions table correctly', () => {
    render(<SubmissionTable />);
    
    // Check that the table headers are rendered
    expect(screen.getByText('Title')).toBeInTheDocument();
    expect(screen.getByText('Submitted By')).toBeInTheDocument();
    expect(screen.getByText('Date')).toBeInTheDocument();
    expect(screen.getByText('Status')).toBeInTheDocument();
    expect(screen.getByText('Categories')).toBeInTheDocument();
    expect(screen.getByText('Actions')).toBeInTheDocument();
    
    // Check that the submissions are rendered
    expect(screen.getByText('Test Submission 1')).toBeInTheDocument();
    expect(screen.getByText('Test Submission 2')).toBeInTheDocument();
    
    // Check that the status badges are rendered
    expect(screen.getByText('Pending')).toBeInTheDocument();
    expect(screen.getByText('Approved')).toBeInTheDocument();
    
    // Check that the category counts are rendered
    expect(screen.getByText('1 category')).toBeInTheDocument();
    expect(screen.getByText('2 categories')).toBeInTheDocument();
  });

  it('renders loading state', () => {
    (useSubmissions as jest.Mock).mockReturnValue({
      submissions: [],
      isLoading: true,
      error: null,
      pagination: null,
      fetchSubmissions: mockFetchSubmissions,
      setPage: mockSetPage,
      setFilter: jest.fn()
    });
    
    render(<SubmissionTable />);
    
    expect(screen.getByTestId('submissions-loading')).toBeInTheDocument();
  });

  it('renders error state', () => {
    const errorMessage = 'Failed to fetch submissions';
    (useSubmissions as jest.Mock).mockReturnValue({
      submissions: [],
      isLoading: false,
      error: errorMessage,
      pagination: null,
      fetchSubmissions: mockFetchSubmissions,
      setPage: mockSetPage,
      setFilter: jest.fn()
    });
    
    render(<SubmissionTable />);
    
    expect(screen.getByTestId('submissions-error')).toBeInTheDocument();
    expect(screen.getByText(errorMessage)).toBeInTheDocument();
    
    // Check that retry button is rendered
    const retryButton = screen.getByTestId('retry-button');
    expect(retryButton).toBeInTheDocument();
    
    // Click retry button
    fireEvent.click(retryButton);
    expect(mockFetchSubmissions).toHaveBeenCalled();
  });

  it('renders empty state', () => {
    (useSubmissions as jest.Mock).mockReturnValue({
      submissions: [],
      isLoading: false,
      error: null,
      pagination: { page: 1, perPage: 10, total: 0, totalPages: 0 },
      fetchSubmissions: mockFetchSubmissions,
      setPage: mockSetPage,
      setFilter: jest.fn()
    });
    
    render(<SubmissionTable />);
    
    expect(screen.getByTestId('submissions-empty')).toBeInTheDocument();
    expect(screen.getByText('No submissions found')).toBeInTheDocument();
  });

  it('handles pagination correctly', () => {
    (useSubmissions as jest.Mock).mockReturnValue({
      submissions: mockSubmissions,
      isLoading: false,
      error: null,
      pagination: {
        page: 1,
        perPage: 10,
        total: 25,
        totalPages: 3
      },
      fetchSubmissions: mockFetchSubmissions,
      setPage: mockSetPage,
      setFilter: jest.fn()
    });
    
    render(<SubmissionTable />);
    
    // Check that pagination is rendered
    expect(screen.getByText('Showing 1 to 10 of 25 submissions')).toBeInTheDocument();
    
    // Click next page button
    const nextButton = screen.getByText('Next');
    fireEvent.click(nextButton);
    expect(mockSetPage).toHaveBeenCalledWith(2);
    
    // Previous button should be disabled on first page
    const prevButton = screen.getByText('Previous');
    expect(prevButton).toBeDisabled();
  });

  it('passes filter to useSubmissions', () => {
    const filter = {
      search: 'test',
      status: [SubmissionStatus.PENDING]
    };
    
    render(<SubmissionTable filter={filter} />);
    
    // Check that useSubmissions was called with the filter
    expect(useSubmissions).toHaveBeenCalledWith(
      expect.objectContaining({
        initialFilter: filter
      })
    );
  });

  it('passes siteSlug to useSubmissions', () => {
    const siteSlug = 'test-site';
    
    render(<SubmissionTable siteSlug={siteSlug} />);
    
    // Check that useSubmissions was called with the siteSlug
    expect(useSubmissions).toHaveBeenCalledWith(
      expect.objectContaining({
        siteSlug
      })
    );
  });
});
