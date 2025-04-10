import React from 'react';
import { render } from '@/tests/utils/render';
import { UserActivityContainer } from '../UserActivityContainer';
import { UserActivityPresentation } from '../UserActivityPresentation';

// Mock the useUserActivity hook
jest.mock('../hooks/useUserActivity', () => ({
  useUserActivity: jest.fn(() => ({
    activities: [
      { id: '1', userId: 'user-1', action: 'login', timestamp: new Date().toISOString() },
      { id: '2', userId: 'user-1', action: 'view', timestamp: new Date().toISOString() }
    ],
    isLoading: false,
    error: null,
    hasMore: false,
    searchTerm: '',
    startDate: null,
    endDate: null,
    actionType: '',
    setSearchTerm: jest.fn(),
    setStartDate: jest.fn(),
    setEndDate: jest.fn(),
    setActionType: jest.fn(),
    handleSearch: jest.fn(),
    handleApplyFilters: jest.fn(),
    handleLoadMore: jest.fn(),
    resetFilters: jest.fn()
  }))
}));

// Mock the UserActivityPresentation component
jest.mock('../UserActivityPresentation', () => ({
  UserActivityPresentation: jest.fn(() => <div data-testid="mock-presentation" />)
}));

describe('UserActivityContainer', () => {
  // Reset mocks before each test
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders the presentation component with correct props', () => {
    // Render the container
    render(<UserActivityContainer userId="user-1" />);
    
    // Check that the presentation component was rendered with correct props
    expect(UserActivityPresentation).toHaveBeenCalledWith(
      expect.objectContaining({
        activities: expect.any(Array),
        isLoading: expect.any(Boolean),
        error: null,
        hasMore: expect.any(Boolean),
        searchTerm: expect.any(String),
        startDate: null,
        endDate: null,
        actionType: expect.any(String),
        onSearchChange: expect.any(Function),
        onSearch: expect.any(Function),
        onStartDateChange: expect.any(Function),
        onEndDateChange: expect.any(Function),
        onActionTypeChange: expect.any(Function),
        onApplyFilters: expect.any(Function),
        onLoadMore: expect.any(Function),
        onResetFilters: expect.any(Function)
      }),
      expect.anything()
    );
  });

  it('passes userId to the useUserActivity hook', () => {
    // Import the actual hook to access the mock
    const { useUserActivity } = require('../hooks/useUserActivity');
    
    // Render the container with userId
    render(<UserActivityContainer userId="user-1" />);
    
    // Check that useUserActivity was called with correct props
    expect(useUserActivity).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: 'user-1'
      })
    );
  });

  it('passes initialPageSize to the useUserActivity hook', () => {
    // Import the actual hook to access the mock
    const { useUserActivity } = require('../hooks/useUserActivity');
    
    // Render the container with initialPageSize
    render(<UserActivityContainer initialPageSize={20} />);
    
    // Check that useUserActivity was called with correct props
    expect(useUserActivity).toHaveBeenCalledWith(
      expect.objectContaining({
        initialPageSize: 20
      })
    );
  });

  it('passes autoFetch to the useUserActivity hook', () => {
    // Import the actual hook to access the mock
    const { useUserActivity } = require('../hooks/useUserActivity');
    
    // Render the container with autoFetch
    render(<UserActivityContainer autoFetch={false} />);
    
    // Check that useUserActivity was called with correct props
    expect(useUserActivity).toHaveBeenCalledWith(
      expect.objectContaining({
        autoFetch: false
      })
    );
  });

  it('passes fetchService to the useUserActivity hook', () => {
    // Import the actual hook to access the mock
    const { useUserActivity } = require('../hooks/useUserActivity');
    
    // Create a mock fetch service
    const mockFetchService = jest.fn();
    
    // Render the container with fetchService
    render(<UserActivityContainer fetchService={mockFetchService} />);
    
    // Check that useUserActivity was called with correct props
    expect(useUserActivity).toHaveBeenCalledWith(
      expect.objectContaining({
        fetchService: mockFetchService
      })
    );
  });

  it('passes className to the presentation component', () => {
    // Render the container with className
    render(<UserActivityContainer className="custom-class" />);
    
    // Check that the presentation component was rendered with correct props
    expect(UserActivityPresentation).toHaveBeenCalledWith(
      expect.objectContaining({
        className: 'custom-class'
      }),
      expect.anything()
    );
  });

  it('passes title to the presentation component', () => {
    // Render the container with title
    render(<UserActivityContainer title="Custom Title" />);
    
    // Check that the presentation component was rendered with correct props
    expect(UserActivityPresentation).toHaveBeenCalledWith(
      expect.objectContaining({
        title: 'Custom Title'
      }),
      expect.anything()
    );
  });
});
