import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { SecurityDashboard } from '../__mocks__/MockSecurityDashboard';

describe('SecurityDashboard', () => {

  test('renders the security dashboard with all sections', () => {
    render(<SecurityDashboard />);

    // Check for main sections
    expect(screen.getByText('Security Overview')).toBeInTheDocument();
    expect(screen.getByText('Login Attempts')).toBeInTheDocument();
    expect(screen.getByText('Geographic Distribution')).toBeInTheDocument();
    expect(screen.getByText('Report Suspicious Activity')).toBeInTheDocument();

    // Check for components
    expect(screen.getByTestId('security-metrics')).toBeInTheDocument();
    expect(screen.getByTestId('login-attempts-table')).toBeInTheDocument();
    expect(screen.getByTestId('login-attempts-map')).toBeInTheDocument();
    expect(screen.getByTestId('report-suspicious-activity')).toBeInTheDocument();
  });

  test('allows filtering by date range', async () => {
    render(<SecurityDashboard />);

    // Find date inputs
    const startDateInput = screen.getByLabelText('Start Date');
    const endDateInput = screen.getByLabelText('End Date');

    // Change date range
    fireEvent.change(startDateInput, { target: { value: '2023-01-01' } });
    fireEvent.change(endDateInput, { target: { value: '2023-01-31' } });

    // Verify metrics component received updated date range
    expect(screen.getByTestId('security-metrics').textContent).toBe('2023-01-01 - 2023-01-31');

    // Verify login attempts table received updated filter
    const tableFilter = JSON.parse(screen.getByTestId('login-attempts-table').textContent);
    expect(tableFilter.startDate).toBe('2023-01-01');
    expect(tableFilter.endDate).toBe('2023-01-31');
  });

  test('allows filtering by status and risk level', async () => {
    render(<SecurityDashboard />);

    // Open filter dropdown
    fireEvent.click(screen.getByText('Filter'));

    // Select status filters
    fireEvent.click(screen.getByLabelText('Success'));
    fireEvent.click(screen.getByLabelText('Failure'));

    // Select risk level filters
    fireEvent.click(screen.getByLabelText('High'));

    // Apply filters
    fireEvent.click(screen.getByText('Apply'));

    // Verify login attempts table received updated filter
    const tableFilter = JSON.parse(screen.getByTestId('login-attempts-table').textContent);
    expect(tableFilter.status).toContain('success');
    expect(tableFilter.status).toContain('failure');
    expect(tableFilter.ipRiskLevel).toContain('high');
  });

  test('allows clearing filters', async () => {
    render(<SecurityDashboard />);

    // Open filter dropdown
    fireEvent.click(screen.getByText('Filter'));

    // Select some filters
    fireEvent.click(screen.getByLabelText('Success'));
    fireEvent.click(screen.getByLabelText('High'));

    // Apply filters
    fireEvent.click(screen.getByText('Apply'));

    // Verify filters were applied
    let tableFilter = JSON.parse(screen.getByTestId('login-attempts-table').textContent);
    expect(tableFilter.status).toContain('success');
    expect(tableFilter.ipRiskLevel).toContain('high');

    // Open filter dropdown again
    fireEvent.click(screen.getByText('Filter'));

    // Clear filters
    fireEvent.click(screen.getByText('Clear Filters'));

    // Apply changes
    fireEvent.click(screen.getByText('Apply'));

    // Verify filters were cleared
    tableFilter = JSON.parse(screen.getByTestId('login-attempts-table').textContent);
    expect(tableFilter.status).toBeUndefined();
    expect(tableFilter.ipRiskLevel).toBeUndefined();
  });
});
