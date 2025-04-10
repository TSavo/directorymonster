import React from 'react';
import { render, screen, setup } from '@/tests/utils/render';
import { UserActivityPresentation } from '../UserActivityPresentation';

// Mock the child components
jest.mock('../activity/ActivitySearch', () => ({
  __esModule: true,
  default: ({ searchTerm, onSearchChange, onSearch }) => (
    <div data-testid="mock-activity-search">
      <input
        data-testid="search-input"
        value={searchTerm}
        onChange={(e) => onSearchChange(e.target.value)}
      />
      <button data-testid="search-button" onClick={onSearch}>
        Search
      </button>
    </div>
  ),
}));

jest.mock('../activity/ActivityFilters', () => ({
  __esModule: true,
  default: ({
    startDate,
    endDate,
    actionType,
    onStartDateChange,
    onEndDateChange,
    onActionTypeChange,
    onApplyFilters,
    onResetFilters,
  }) => (
    <div data-testid="mock-activity-filters">
      <input
        data-testid="start-date-input"
        value={startDate ? startDate.toISOString() : ''}
        onChange={(e) => onStartDateChange(e.target.value ? new Date(e.target.value) : null)}
      />
      <input
        data-testid="end-date-input"
        value={endDate ? endDate.toISOString() : ''}
        onChange={(e) => onEndDateChange(e.target.value ? new Date(e.target.value) : null)}
      />
      <select
        data-testid="action-type-select"
        value={actionType}
        onChange={(e) => onActionTypeChange(e.target.value)}
      >
        <option value="">All</option>
        <option value="login">Login</option>
        <option value="logout">Logout</option>
      </select>
      <button data-testid="apply-filters-button" onClick={onApplyFilters}>
        Apply Filters
      </button>
      <button data-testid="reset-filters-button" onClick={onResetFilters}>
        Reset Filters
      </button>
    </div>
  ),
}));

jest.mock('../activity/ActivityTable', () => ({
  __esModule: true,
  default: ({ activities, isLoading, error, hasMore, onLoadMore }) => (
    <div data-testid="mock-activity-table">
      {isLoading && <div data-testid="loading-indicator">Loading...</div>}
      {error && <div data-testid="error-message">{error}</div>}
      <ul>
        {activities.map((activity) => (
          <li key={activity.id} data-testid={`activity-${activity.id}`}>
            {activity.action}
          </li>
        ))}
      </ul>
      {hasMore && (
        <button data-testid="load-more-button" onClick={onLoadMore}>
          Load More
        </button>
      )}
    </div>
  ),
}));

describe('UserActivityPresentation', () => {
  // Default props for testing
  const defaultProps = {
    activities: [
      { id: '1', userId: 'user-1', action: 'login', timestamp: new Date().toISOString() },
      { id: '2', userId: 'user-1', action: 'view', timestamp: new Date().toISOString() },
    ],
    isLoading: false,
    error: null,
    hasMore: false,
    searchTerm: '',
    startDate: null,
    endDate: null,
    actionType: '',
    onSearchChange: jest.fn(),
    onSearch: jest.fn(),
    onStartDateChange: jest.fn(),
    onEndDateChange: jest.fn(),
    onActionTypeChange: jest.fn(),
    onApplyFilters: jest.fn(),
    onLoadMore: jest.fn(),
    onResetFilters: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders the component with title', () => {
    render(<UserActivityPresentation {...defaultProps} />);
    
    // Check that the component is rendered with the default title
    expect(screen.getByText('User Activity Tracker')).toBeInTheDocument();
  });

  it('renders with custom title', () => {
    render(<UserActivityPresentation {...defaultProps} title="Custom Title" />);
    
    // Check that the component is rendered with the custom title
    expect(screen.getByText('Custom Title')).toBeInTheDocument();
  });

  it('renders the search component', () => {
    render(<UserActivityPresentation {...defaultProps} />);
    
    // Check that the search component is rendered
    expect(screen.getByTestId('mock-activity-search')).toBeInTheDocument();
  });

  it('renders the filters component', () => {
    render(<UserActivityPresentation {...defaultProps} />);
    
    // Check that the filters component is rendered
    expect(screen.getByTestId('mock-activity-filters')).toBeInTheDocument();
  });

  it('renders the table component', () => {
    render(<UserActivityPresentation {...defaultProps} />);
    
    // Check that the table component is rendered
    expect(screen.getByTestId('mock-activity-table')).toBeInTheDocument();
  });

  it('renders activities in the table', () => {
    render(<UserActivityPresentation {...defaultProps} />);
    
    // Check that activities are rendered
    expect(screen.getByTestId('activity-1')).toBeInTheDocument();
    expect(screen.getByTestId('activity-2')).toBeInTheDocument();
  });

  it('shows loading indicator when isLoading is true', () => {
    render(<UserActivityPresentation {...defaultProps} isLoading={true} />);
    
    // Check that loading indicator is rendered
    expect(screen.getByTestId('loading-indicator')).toBeInTheDocument();
  });

  it('shows error message when error is present', () => {
    render(<UserActivityPresentation {...defaultProps} error="Failed to fetch activities" />);
    
    // Check that error message is rendered
    expect(screen.getByTestId('error-message')).toBeInTheDocument();
    expect(screen.getByText('Failed to fetch activities')).toBeInTheDocument();
  });

  it('shows load more button when hasMore is true', () => {
    render(<UserActivityPresentation {...defaultProps} hasMore={true} />);
    
    // Check that load more button is rendered
    expect(screen.getByTestId('load-more-button')).toBeInTheDocument();
  });

  it('calls onSearch when search button is clicked', async () => {
    const onSearch = jest.fn();
    const { user } = setup(<UserActivityPresentation {...defaultProps} onSearch={onSearch} />);
    
    // Click the search button
    await user.click(screen.getByTestId('search-button'));
    
    // Check that onSearch was called
    expect(onSearch).toHaveBeenCalledTimes(1);
  });

  it('calls onApplyFilters when apply filters button is clicked', async () => {
    const onApplyFilters = jest.fn();
    const { user } = setup(<UserActivityPresentation {...defaultProps} onApplyFilters={onApplyFilters} />);
    
    // Click the apply filters button
    await user.click(screen.getByTestId('apply-filters-button'));
    
    // Check that onApplyFilters was called
    expect(onApplyFilters).toHaveBeenCalledTimes(1);
  });

  it('calls onResetFilters when reset filters button is clicked', async () => {
    const onResetFilters = jest.fn();
    const { user } = setup(<UserActivityPresentation {...defaultProps} onResetFilters={onResetFilters} />);
    
    // Click the reset filters button
    await user.click(screen.getByTestId('reset-filters-button'));
    
    // Check that onResetFilters was called
    expect(onResetFilters).toHaveBeenCalledTimes(1);
  });

  it('calls onLoadMore when load more button is clicked', async () => {
    const onLoadMore = jest.fn();
    const { user } = setup(<UserActivityPresentation {...defaultProps} hasMore={true} onLoadMore={onLoadMore} />);
    
    // Click the load more button
    await user.click(screen.getByTestId('load-more-button'));
    
    // Check that onLoadMore was called
    expect(onLoadMore).toHaveBeenCalledTimes(1);
  });

  it('applies custom className when provided', () => {
    render(<UserActivityPresentation {...defaultProps} className="custom-class" />);
    
    // Check that the component has the custom class
    const component = screen.getByTestId('user-activity-tracker');
    expect(component).toHaveClass('custom-class');
  });
});
