import React from 'react';
import { render, screen, waitFor, fireEvent, act } from '@testing-library/react';
import { LoginAttemptsMap } from '../__mocks__/MockLoginAttemptsMap';
import { useLoginAttemptsMap } from '../hooks/useLoginAttemptsMap';

// Mock the hook
jest.mock('../hooks/useLoginAttemptsMap');

// No need to mock react-map-gl since we're using a mock component

describe('LoginAttemptsMap', () => {
  const mockMapData = [
    {
      id: '1',
      latitude: 40.7128,
      longitude: -74.0060,
      count: 5,
      successCount: 3,
      failedCount: 2,
      ipRiskLevel: 'low',
      location: 'New York, United States'
    },
    {
      id: '2',
      latitude: 43.6532,
      longitude: -79.3832,
      count: 10,
      successCount: 2,
      failedCount: 8,
      ipRiskLevel: 'high',
      location: 'Toronto, Canada'
    }
  ];

  beforeEach(() => {
    (useLoginAttemptsMap as jest.Mock).mockReturnValue({
      mapData: mockMapData,
      isLoading: false,
      error: null,
      refresh: jest.fn(),
    });
  });

  test('renders the map component', () => {
    render(<LoginAttemptsMap filter={{}} />);

    expect(screen.getByTestId('mock-map')).toBeInTheDocument();
  });

  test('renders markers for each location', () => {
    render(<LoginAttemptsMap filter={{}} />);

    const markers = screen.getAllByTestId('mock-marker');
    expect(markers.length).toBe(mockMapData.length);
  });

  test('shows loading state when data is loading', () => {
    (useLoginAttemptsMap as jest.Mock).mockReturnValue({
      mapData: [],
      isLoading: true,
      error: null,
      refresh: jest.fn(),
    });

    render(<LoginAttemptsMap filter={{}} />);

    expect(screen.getByTestId('map-loading')).toBeInTheDocument();
  });

  test('shows error state when there is an error', () => {
    (useLoginAttemptsMap as jest.Mock).mockReturnValue({
      mapData: [],
      isLoading: false,
      error: new Error('Failed to load map data'),
      refresh: jest.fn(),
    });

    render(<LoginAttemptsMap filter={{}} />);

    expect(screen.getByText('Failed to load map data')).toBeInTheDocument();
    expect(screen.getByText('Retry')).toBeInTheDocument();
  });

  test('applies filters correctly', () => {
    const mockFilter = {
      status: ['success'],
      ipRiskLevel: ['high'],
      startDate: '2023-01-01',
      endDate: '2023-01-31'
    };

    render(<LoginAttemptsMap filter={mockFilter} />);

    expect(useLoginAttemptsMap).toHaveBeenCalledWith(
      expect.objectContaining({
        filter: mockFilter
      })
    );
  });

  test('displays map legend with correct risk levels', () => {
    render(<LoginAttemptsMap filter={{}} />);

    expect(screen.getByText('Risk Level')).toBeInTheDocument();
    expect(screen.getByText('Low')).toBeInTheDocument();
    expect(screen.getByText('Medium')).toBeInTheDocument();
    expect(screen.getByText('High')).toBeInTheDocument();
    expect(screen.getByText('Critical')).toBeInTheDocument();
  });

  test('displays location details in popup when marker is clicked', async () => {
    render(<LoginAttemptsMap filter={{}} />);

    // Find the first marker and click it
    const markers = screen.getAllByTestId('mock-marker');

    // Use act to wrap the state update
    await act(async () => {
      markers[0].click();
    });

    // Check that popup appears with location details
    expect(screen.getByTestId('mock-popup')).toBeInTheDocument();
    expect(screen.getByText('New York, United States')).toBeInTheDocument();
  });
});
