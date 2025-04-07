import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { SecurityMetrics } from '../SecurityMetrics';
import { useSecurityMetrics } from '../hooks/useSecurityMetrics';

// Mock the hook
jest.mock('../hooks/useSecurityMetrics');

describe('SecurityMetrics', () => {
  const mockMetrics = {
    totalAttempts: 100,
    successfulAttempts: 70,
    failedAttempts: 30,
    blockedAttempts: 10,
    captchaRequiredCount: 15,
    highRiskIPs: 5,
    successRate: 70,
    failureRate: 30,
  };

  beforeEach(() => {
    (useSecurityMetrics as jest.Mock).mockReturnValue({
      metrics: mockMetrics,
      isLoading: false,
      error: null,
      fetchMetrics: jest.fn(),
    });
  });

  test('renders all security metric cards', () => {
    render(<SecurityMetrics startDate="2023-01-01" endDate="2023-01-31" />);

    // Check for all metric cards
    expect(screen.getByText('Total Login Attempts')).toBeInTheDocument();
    expect(screen.getByText('Successful Logins')).toBeInTheDocument();
    expect(screen.getByText('Failed Logins')).toBeInTheDocument();
    expect(screen.getByText('Blocked Attempts')).toBeInTheDocument();
    expect(screen.getByText('CAPTCHA Challenges')).toBeInTheDocument();
    expect(screen.getByText('High Risk IPs')).toBeInTheDocument();
  });

  test('displays correct metric values', () => {
    render(<SecurityMetrics startDate="2023-01-01" endDate="2023-01-31" />);

    // Check for metric values
    expect(screen.getByText('100')).toBeInTheDocument(); // Total attempts
    expect(screen.getByText('70')).toBeInTheDocument(); // Successful logins
    expect(screen.getByText('30')).toBeInTheDocument(); // Failed logins
    expect(screen.getByText('10')).toBeInTheDocument(); // Blocked attempts
    expect(screen.getByText('15')).toBeInTheDocument(); // CAPTCHA challenges
    expect(screen.getByText('5')).toBeInTheDocument(); // High risk IPs
  });

  test('shows loading state when data is loading', () => {
    (useSecurityMetrics as jest.Mock).mockReturnValue({
      metrics: null,
      isLoading: true,
      error: null,
      fetchMetrics: jest.fn(),
    });

    render(<SecurityMetrics startDate="2023-01-01" endDate="2023-01-31" />);

    // Check for loading skeletons
    expect(screen.getAllByTestId('metric-skeleton')).toHaveLength(6);
  });

  test('shows error state when there is an error', () => {
    (useSecurityMetrics as jest.Mock).mockReturnValue({
      metrics: null,
      isLoading: false,
      error: new Error('Failed to load security metrics'),
      fetchMetrics: jest.fn(),
    });

    render(<SecurityMetrics startDate="2023-01-01" endDate="2023-01-31" />);

    expect(screen.getByText('Failed to load security metrics')).toBeInTheDocument();
    expect(screen.getByText('Retry')).toBeInTheDocument();
  });

  test('refreshes data when refresh button is clicked', () => {
    const mockFetchMetrics = jest.fn();
    (useSecurityMetrics as jest.Mock).mockReturnValue({
      metrics: mockMetrics,
      isLoading: false,
      error: null,
      fetchMetrics: mockFetchMetrics,
    });

    render(<SecurityMetrics startDate="2023-01-01" endDate="2023-01-31" />);

    // Find and click refresh button
    const refreshButtons = screen.getAllByLabelText('Refresh');
    fireEvent.click(refreshButtons[0]);

    expect(mockFetchMetrics).toHaveBeenCalled();
  });

  test('applies date range correctly', () => {
    const startDate = '2023-01-01';
    const endDate = '2023-01-31';

    render(<SecurityMetrics startDate={startDate} endDate={endDate} />);

    expect(useSecurityMetrics).toHaveBeenCalledWith(
      expect.objectContaining({
        startDate,
        endDate
      })
    );
  });

  test('displays success rate percentage correctly', () => {
    render(<SecurityMetrics startDate="2023-01-01" endDate="2023-01-31" />);

    expect(screen.getByText('70%')).toBeInTheDocument(); // Success rate
  });
});
