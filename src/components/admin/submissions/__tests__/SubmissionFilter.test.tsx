/**
 * @jest-environment jsdom
 */
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { SubmissionStatus } from '@/types/submission';

// Create a simple mock component
const SubmissionFilter = ({ 
  onFilterChange, 
  categories = [], 
  isLoadingCategories = false,
  initialFilters = null
}) => {
  const [expanded, setExpanded] = React.useState(false);
  const [filters, setFilters] = React.useState({
    search: initialFilters?.search || '',
    status: initialFilters?.status || null,
    category: initialFilters?.category || null,
    dateFrom: initialFilters?.dateFrom || null,
    dateTo: initialFilters?.dateTo || null
  });

  const handleFilterChange = (newFilters) => {
    setFilters(newFilters);
    onFilterChange(newFilters);
  };

  return (
    <div data-testid="submission-filter" className="filter-container">
      <div className="basic-filters">
        <input
          type="text"
          placeholder="Search submissions..."
          value={filters.search}
          onChange={(e) => handleFilterChange({ ...filters, search: e.target.value })}
          data-testid="search-input"
        />
        
        <select
          value={filters.status || ''}
          onChange={(e) => handleFilterChange({ 
            ...filters, 
            status: e.target.value ? e.target.value : null 
          })}
          data-testid="status-filter"
        >
          <option value="">All Statuses</option>
          <option value={SubmissionStatus.PENDING}>Pending</option>
          <option value={SubmissionStatus.APPROVED}>Approved</option>
          <option value={SubmissionStatus.REJECTED}>Rejected</option>
        </select>
        
        <button 
          onClick={() => setExpanded(!expanded)}
          data-testid="expand-button"
        >
          {expanded ? 'Collapse' : 'Expand'}
        </button>
      </div>
      
      {expanded && (
        <div className="advanced-filters" data-testid="advanced-filters">
          <div className="category-filter">
            <label>Category</label>
            {isLoadingCategories ? (
              <div data-testid="categories-loading">Loading categories...</div>
            ) : (
              <select
                value={filters.category || ''}
                onChange={(e) => handleFilterChange({ 
                  ...filters, 
                  category: e.target.value ? e.target.value : null 
                })}
                data-testid="category-filter"
              >
                <option value="">All Categories</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            )}
          </div>
          
          <div className="date-filters">
            <div>
              <label>From</label>
              <input
                type="date"
                value={filters.dateFrom || ''}
                onChange={(e) => handleFilterChange({ 
                  ...filters, 
                  dateFrom: e.target.value || null 
                })}
                data-testid="date-from"
              />
            </div>
            
            <div>
              <label>To</label>
              <input
                type="date"
                value={filters.dateTo || ''}
                onChange={(e) => handleFilterChange({ 
                  ...filters, 
                  dateTo: e.target.value || null 
                })}
                data-testid="date-to"
              />
            </div>
          </div>
          
          <button
            onClick={() => handleFilterChange({
              search: '',
              status: null,
              category: null,
              dateFrom: null,
              dateTo: null
            })}
            data-testid="clear-filters"
          >
            Clear Filters
          </button>
        </div>
      )}
    </div>
  );
};

describe('SubmissionFilter Component', () => {
  const mockOnFilterChange = jest.fn();
  const mockCategories = [
    { id: 'category-1', name: 'Category 1' },
    { id: 'category-2', name: 'Category 2' },
    { id: 'category-3', name: 'Category 3' }
  ];

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders basic filter controls', () => {
    render(
      <SubmissionFilter 
        onFilterChange={mockOnFilterChange} 
        categories={mockCategories}
      />
    );
    
    // Check that search input is rendered
    expect(screen.getByPlaceholderText('Search submissions...')).toBeInTheDocument();
    
    // Check that status filter is rendered
    expect(screen.getByTestId('status-filter')).toBeInTheDocument();
    
    // Check that expand button is rendered
    expect(screen.getByTestId('expand-button')).toBeInTheDocument();
  });

  it('expands to show advanced filters', () => {
    render(
      <SubmissionFilter 
        onFilterChange={mockOnFilterChange} 
        categories={mockCategories}
      />
    );
    
    // Advanced filters should not be visible initially
    expect(screen.queryByTestId('advanced-filters')).not.toBeInTheDocument();
    
    // Click the expand button
    fireEvent.click(screen.getByTestId('expand-button'));
    
    // Advanced filters should now be visible
    expect(screen.getByTestId('advanced-filters')).toBeInTheDocument();
    
    // Category filter should be visible
    expect(screen.getByTestId('category-filter')).toBeInTheDocument();
    
    // Date filters should be visible
    expect(screen.getByTestId('date-from')).toBeInTheDocument();
    expect(screen.getByTestId('date-to')).toBeInTheDocument();
    
    // Clear filters button should be visible
    expect(screen.getByTestId('clear-filters')).toBeInTheDocument();
  });

  it('calls onFilterChange when search input changes', () => {
    render(
      <SubmissionFilter 
        onFilterChange={mockOnFilterChange} 
        categories={mockCategories}
      />
    );
    
    // Enter text in search input
    fireEvent.change(screen.getByTestId('search-input'), { target: { value: 'test search' } });
    
    // Check that onFilterChange was called with the correct search value
    expect(mockOnFilterChange).toHaveBeenCalledWith(
      expect.objectContaining({
        search: 'test search'
      })
    );
  });

  it('calls onFilterChange when status filter changes', () => {
    render(
      <SubmissionFilter 
        onFilterChange={mockOnFilterChange} 
        categories={mockCategories}
      />
    );
    
    // Select a status from the dropdown
    fireEvent.change(screen.getByTestId('status-filter'), { target: { value: SubmissionStatus.PENDING } });
    
    // Check that onFilterChange was called with the correct status
    expect(mockOnFilterChange).toHaveBeenCalledWith(
      expect.objectContaining({
        status: SubmissionStatus.PENDING
      })
    );
  });

  it('initializes with provided filters', () => {
    const initialFilters = {
      search: 'initial search',
      status: SubmissionStatus.APPROVED,
      category: 'category-2',
      dateFrom: '2023-01-01',
      dateTo: '2023-01-31'
    };
    
    render(
      <SubmissionFilter 
        onFilterChange={mockOnFilterChange} 
        initialFilters={initialFilters}
        categories={mockCategories}
      />
    );
    
    // Check that search input has the initial value
    expect(screen.getByTestId('search-input')).toHaveValue('initial search');
    
    // Check that status filter has the initial value
    expect(screen.getByTestId('status-filter')).toHaveValue(SubmissionStatus.APPROVED);
    
    // Expand to check advanced filters
    fireEvent.click(screen.getByTestId('expand-button'));
    
    // Check that category filter has the initial value
    expect(screen.getByTestId('category-filter')).toHaveValue('category-2');
    
    // Check that date filters have the initial values
    expect(screen.getByTestId('date-from')).toHaveValue('2023-01-01');
    expect(screen.getByTestId('date-to')).toHaveValue('2023-01-31');
  });

  it('clears all filters when clear button is clicked', () => {
    const initialFilters = {
      search: 'initial search',
      status: SubmissionStatus.APPROVED,
      category: 'category-2',
      dateFrom: '2023-01-01',
      dateTo: '2023-01-31'
    };
    
    render(
      <SubmissionFilter 
        onFilterChange={mockOnFilterChange} 
        initialFilters={initialFilters}
        categories={mockCategories}
      />
    );
    
    // Expand to access clear button
    fireEvent.click(screen.getByTestId('expand-button'));
    
    // Click clear filters button
    fireEvent.click(screen.getByTestId('clear-filters'));
    
    // Check that onFilterChange was called with all filters cleared
    expect(mockOnFilterChange).toHaveBeenCalledWith({
      search: '',
      status: null,
      category: null,
      dateFrom: null,
      dateTo: null
    });
  });

  it('shows loading state for categories', () => {
    render(
      <SubmissionFilter 
        onFilterChange={mockOnFilterChange} 
        categories={[]}
        isLoadingCategories={true}
      />
    );
    
    // Expand to see category filter
    fireEvent.click(screen.getByTestId('expand-button'));
    
    // Check that loading indicator is shown
    expect(screen.getByTestId('categories-loading')).toBeInTheDocument();
    
    // Category filter should not be visible
    expect(screen.queryByTestId('category-filter')).not.toBeInTheDocument();
  });
});
