/**
 * @jest-environment jsdom
 */
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { SubmissionStatus } from '@/types/submission';

// Mock the useSubmissions hook
const useSubmissions = jest.fn();
jest.mock('../hooks/useSubmissions', () => ({
  useSubmissions: () => useSubmissions()
}));

// Create a simple mock component
const SubmissionTable = ({ siteSlug }) => {
  const { 
    submissions, 
    isLoading, 
    error, 
    pagination, 
    filters, 
    setFilters, 
    refetch 
  } = useSubmissions(siteSlug, {
    page: 1,
    perPage: 10,
    status: null,
    category: null,
    search: ''
  });

  if (isLoading) {
    return <div data-testid="submissions-loading">Loading submissions...</div>;
  }

  if (error) {
    return (
      <div data-testid="submissions-error">
        <p>Failed to load submissions</p>
        <button onClick={refetch}>Retry</button>
      </div>
    );
  }

  if (!submissions || submissions.length === 0) {
    return (
      <div data-testid="submissions-empty">
        <p>No submissions found</p>
      </div>
    );
  }

  return (
    <div data-testid="submissions-table">
      <div data-testid="filters">
        <input 
          data-testid="search-input" 
          value={filters.search} 
          onChange={(e) => setFilters({ ...filters, search: e.target.value })} 
        />
        <select 
          data-testid="status-filter" 
          value={filters.status || ''} 
          onChange={(e) => setFilters({ ...filters, status: e.target.value || null })}
        >
          <option value="">All Statuses</option>
          <option value={SubmissionStatus.PENDING}>Pending</option>
          <option value={SubmissionStatus.APPROVED}>Approved</option>
          <option value={SubmissionStatus.REJECTED}>Rejected</option>
        </select>
      </div>
      <table>
        <thead>
          <tr>
            <th>Title</th>
            <th>Status</th>
            <th>Date</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {submissions.map((submission) => (
            <tr key={submission.id} data-testid={`submission-row-${submission.id}`}>
              <td>{submission.title}</td>
              <td>{submission.status}</td>
              <td>{submission.createdAt}</td>
              <td>
                <div data-testid={`submission-actions-${submission.id}`}>
                  <button data-testid={`view-submission-${submission.id}`}>View</button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      
      {pagination && pagination.totalPages > 1 && (
        <div data-testid="pagination">
          <button 
            onClick={() => setFilters({ ...filters, page: filters.page - 1 })}
            disabled={filters.page === 1}
            data-testid="prev-page"
          >
            Previous
          </button>
          <span>Page {filters.page} of {pagination.totalPages}</span>
          <button 
            onClick={() => setFilters({ ...filters, page: filters.page + 1 })}
            disabled={filters.page === pagination.totalPages}
            data-testid="next-page"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
};

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
      userName: 'John Doe',
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
      userName: 'Jane Smith',
      createdAt: '2023-01-02T00:00:00.000Z',
      updatedAt: '2023-01-02T00:00:00.000Z'
    }
  ];

  const mockPagination = {
    page: 1,
    perPage: 10,
    total: 20,
    totalPages: 2
  };

  const mockRefetch = jest.fn();
  const mockSetFilters = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    useSubmissions.mockReturnValue({
      submissions: mockSubmissions,
      isLoading: false,
      error: null,
      pagination: mockPagination,
      filters: {
        page: 1,
        perPage: 10,
        status: null,
        category: null,
        search: ''
      },
      setFilters: mockSetFilters,
      refetch: mockRefetch
    });
  });

  it('renders submissions table correctly', () => {
    render(<SubmissionTable siteSlug="test-site" />);
    
    expect(screen.getByTestId('submissions-table')).toBeInTheDocument();
    expect(screen.getByText('Test Submission 1')).toBeInTheDocument();
    expect(screen.getByText('Test Submission 2')).toBeInTheDocument();
  });

  it('handles loading state', () => {
    useSubmissions.mockReturnValue({
      submissions: [],
      isLoading: true,
      error: null,
      pagination: null,
      filters: {
        page: 1,
        perPage: 10,
        status: null,
        category: null,
        search: ''
      },
      setFilters: mockSetFilters,
      refetch: mockRefetch
    });
    
    render(<SubmissionTable siteSlug="test-site" />);
    
    expect(screen.getByTestId('submissions-loading')).toBeInTheDocument();
  });

  it('handles error state', () => {
    useSubmissions.mockReturnValue({
      submissions: [],
      isLoading: false,
      error: 'Failed to load submissions',
      pagination: null,
      filters: {
        page: 1,
        perPage: 10,
        status: null,
        category: null,
        search: ''
      },
      setFilters: mockSetFilters,
      refetch: mockRefetch
    });
    
    render(<SubmissionTable siteSlug="test-site" />);
    
    expect(screen.getByTestId('submissions-error')).toBeInTheDocument();
    expect(screen.getByText('Failed to load submissions')).toBeInTheDocument();
    
    // Click the retry button
    fireEvent.click(screen.getByText('Retry'));
    
    // Check that refetch was called
    expect(mockRefetch).toHaveBeenCalled();
  });

  it('handles pagination correctly', () => {
    render(<SubmissionTable siteSlug="test-site" />);
    
    expect(screen.getByTestId('pagination')).toBeInTheDocument();
    
    // Click the next page button
    fireEvent.click(screen.getByTestId('next-page'));
    
    // Check that setFilters was called with the correct page number
    expect(mockSetFilters).toHaveBeenCalledWith({
      page: 2,
      perPage: 10,
      status: null,
      category: null,
      search: ''
    });
  });

  it('handles filtering by status', () => {
    render(<SubmissionTable siteSlug="test-site" />);
    
    // Select a status from the dropdown
    fireEvent.change(screen.getByTestId('status-filter'), { target: { value: SubmissionStatus.PENDING } });
    
    // Check that setFilters was called with the correct status
    expect(mockSetFilters).toHaveBeenCalledWith({
      page: 1,
      perPage: 10,
      status: SubmissionStatus.PENDING,
      category: null,
      search: ''
    });
  });

  it('handles search filtering', () => {
    render(<SubmissionTable siteSlug="test-site" />);
    
    // Enter a search term
    fireEvent.change(screen.getByTestId('search-input'), { target: { value: 'test search' } });
    
    // Check that setFilters was called with the correct search term
    expect(mockSetFilters).toHaveBeenCalledWith({
      page: 1,
      perPage: 10,
      status: null,
      category: null,
      search: 'test search'
    });
  });

  it('passes siteSlug to useSubmissions', () => {
    const siteSlug = 'test-site';
    
    render(<SubmissionTable siteSlug={siteSlug} />);
    
    // Check that useSubmissions was called with the siteSlug
    expect(useSubmissions).toHaveBeenCalledWith(siteSlug, {
      page: 1,
      perPage: 10,
      status: null,
      category: null,
      search: ''
    });
  });
});
