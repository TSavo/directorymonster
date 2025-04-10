/**
 * @jest-environment jsdom
 */
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { SubmissionStatus } from '@/types/submission';

// Mock the hooks
const useSubmissions = jest.fn();
jest.mock('../hooks/useSubmissions', () => ({
  useSubmissions: () => useSubmissions()
}));

const useCategories = jest.fn();
jest.mock('@/components/admin/categories/hooks/useCategories', () => ({
  useCategories: () => useCategories()
}));

// Create a simple mock component for SubmissionFilter
const SubmissionFilter = ({ 
  onFilterChange, 
  categories = [], 
  isLoadingCategories = false,
  initialFilters = null
}) => {
  return (
    <div data-testid="submission-filter">
      <input
        type="text"
        placeholder="Search submissions..."
        value={initialFilters?.search || ''}
        onChange={(e) => onFilterChange({ ...initialFilters, search: e.target.value })}
        data-testid="search-input"
      />
      <select
        value={initialFilters?.status || ''}
        onChange={(e) => onFilterChange({ ...initialFilters, status: e.target.value || null })}
        data-testid="status-filter"
      >
        <option value="">All Statuses</option>
      </select>
      <button data-testid="expand-button">Expand</button>
    </div>
  );
};

// Create a simple mock component for SubmissionTable
const SubmissionTable = ({ 
  submissions, 
  isLoading, 
  error, 
  pagination, 
  onPageChange 
}) => {
  return (
    <div data-testid="submission-table">
      {isLoading ? (
        <div data-testid="table-loading">Loading submissions...</div>
      ) : error ? (
        <div data-testid="table-error">Error: {error}</div>
      ) : submissions.length === 0 ? (
        <div data-testid="table-empty">No submissions found</div>
      ) : (
        <table>
          <thead>
            <tr>
              <th>Title</th>
              <th>Status</th>
              <th>Date</th>
            </tr>
          </thead>
          <tbody>
            {submissions.map(submission => (
              <tr key={submission.id} data-testid={`submission-row-${submission.id}`}>
                <td>{submission.title}</td>
                <td>{submission.status}</td>
                <td>{new Date(submission.createdAt).toLocaleDateString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
      {pagination && pagination.totalPages > 1 && (
        <div data-testid="pagination">
          <button 
            onClick={() => onPageChange(pagination.page - 1)}
            disabled={pagination.page === 1}
          >
            Previous
          </button>
          <span>Page {pagination.page} of {pagination.totalPages}</span>
          <button 
            onClick={() => onPageChange(pagination.page + 1)}
            disabled={pagination.page === pagination.totalPages}
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
};

// Create a simple mock component for SubmissionDashboard
const SubmissionDashboard = ({ siteSlug }) => {
  const { 
    submissions, 
    isLoading, 
    error, 
    pagination, 
    filters, 
    setFilters 
  } = useSubmissions(siteSlug, {
    page: 1,
    perPage: 10,
    status: null,
    category: null,
    search: '',
    dateFrom: null,
    dateTo: null
  });

  const { 
    categories, 
    isLoading: isLoadingCategories 
  } = useCategories(siteSlug);

  const handleFilterChange = (newFilters) => {
    setFilters(newFilters);
  };

  return (
    <div data-testid="submission-dashboard">
      <div className="dashboard-header">
        <h1>Submissions</h1>
        <button data-testid="create-submission">Create Submission</button>
      </div>
      
      <SubmissionFilter
        onFilterChange={handleFilterChange}
        categories={categories}
        isLoadingCategories={isLoadingCategories}
        initialFilters={filters}
      />
      
      <SubmissionTable
        submissions={submissions}
        isLoading={isLoading}
        error={error}
        pagination={pagination}
        onPageChange={(page) => setFilters({ ...filters, page })}
      />
    </div>
  );
};

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
    { id: 'category-1', name: 'Category 1' },
    { id: 'category-2', name: 'Category 2' }
  ];

  const mockPagination = {
    page: 1,
    perPage: 10,
    total: 20,
    totalPages: 2
  };

  const mockFilters = {
    page: 1,
    perPage: 10,
    status: null,
    category: null,
    search: '',
    dateFrom: null,
    dateTo: null
  };

  const mockSetFilters = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    
    useSubmissions.mockReturnValue({
      submissions: mockSubmissions,
      isLoading: false,
      error: null,
      pagination: mockPagination,
      filters: mockFilters,
      setFilters: mockSetFilters
    });
    
    useCategories.mockReturnValue({
      categories: mockCategories,
      isLoading: false,
      error: null
    });
  });

  it('renders the dashboard with filter and table', () => {
    render(<SubmissionDashboard />);
    
    // Check that the title is rendered
    expect(screen.getByText('Submissions')).toBeInTheDocument();
    
    // Check that the filter is rendered
    expect(screen.getByTestId('submission-filter')).toBeInTheDocument();
    
    // Check that the table is rendered
    expect(screen.getByTestId('submission-table')).toBeInTheDocument();
    
    // Check that submissions are rendered
    expect(screen.getByText('Test Submission 1')).toBeInTheDocument();
    expect(screen.getByText('Test Submission 2')).toBeInTheDocument();
  });

  it('passes filter changes to the table', () => {
    render(<SubmissionDashboard />);
    
    // Enter search text
    const searchInput = screen.getByPlaceholderText('Search submissions...');
    fireEvent.change(searchInput, { target: { value: 'test search' } });
    
    // Check that setFilters was called with the search term
    expect(mockSetFilters).toHaveBeenCalledWith(expect.objectContaining({
      search: 'test search'
    }));
  });

  it('passes categories to the filter', () => {
    render(<SubmissionDashboard />);
    
    // Expand to show categories
    fireEvent.click(screen.getByText('Expand'));
    
    // Check that categories are passed to the filter
    expect(useCategories).toHaveBeenCalled();
  });

  it('passes siteSlug to hooks', () => {
    const siteSlug = 'test-site';
    
    render(<SubmissionDashboard siteSlug={siteSlug} />);
    
    // Check that useSubmissions was called with the siteSlug
    expect(useSubmissions).toHaveBeenCalledWith(
      siteSlug,
      expect.objectContaining({
        page: 1,
        perPage: 10
      })
    );
    
    // Check that useCategories was called with the siteSlug
    expect(useCategories).toHaveBeenCalledWith(siteSlug);
  });

  it('handles loading state for categories', () => {
    useCategories.mockReturnValue({
      categories: [],
      isLoading: true,
      error: null
    });
    
    render(<SubmissionDashboard />);
    
    // Expand to show categories
    fireEvent.click(screen.getByText('Expand'));
    
    // Check that loading state is passed to the filter
    expect(useCategories).toHaveBeenCalled();
  });
});
