import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { AlertsFilter } from '../AlertsFilter';

describe('AlertsFilter', () => {
  const mockProps = {
    severityFilter: '',
    onSeverityFilterChange: jest.fn(),
    startDate: '',
    endDate: '',
    onStartDateChange: jest.fn(),
    onEndDateChange: jest.fn(),
    onApplyDateFilter: jest.fn()
  };

  it('renders correctly', () => {
    render(<AlertsFilter {...mockProps} />);

    // Check that the severity filter is rendered
    expect(screen.getByTestId('severity-filter')).toBeInTheDocument();

    // Check that the date inputs are rendered
    expect(screen.getByTestId('start-date-input')).toBeInTheDocument();
    expect(screen.getByTestId('end-date-input')).toBeInTheDocument();

    // Check that the apply button is rendered
    expect(screen.getByTestId('apply-date-filter')).toBeInTheDocument();
  });

  it('calls onStartDateChange when start date is changed', () => {
    render(<AlertsFilter {...mockProps} />);

    // Change the start date
    fireEvent.change(screen.getByTestId('start-date-input'), { target: { value: '2023-01-01' } });

    // Check that onStartDateChange was called with the new value
    expect(mockProps.onStartDateChange).toHaveBeenCalledWith('2023-01-01');
  });

  it('calls onEndDateChange when end date is changed', () => {
    render(<AlertsFilter {...mockProps} />);

    // Change the end date
    fireEvent.change(screen.getByTestId('end-date-input'), { target: { value: '2023-01-31' } });

    // Check that onEndDateChange was called with the new value
    expect(mockProps.onEndDateChange).toHaveBeenCalledWith('2023-01-31');
  });

  it('calls onApplyDateFilter when apply button is clicked', () => {
    render(<AlertsFilter {...mockProps} />);

    // Click the apply button
    fireEvent.click(screen.getByTestId('apply-date-filter'));

    // Check that onApplyDateFilter was called
    expect(mockProps.onApplyDateFilter).toHaveBeenCalled();
  });

  it('displays the selected severity filter', () => {
    const propsWithSeverity = {
      ...mockProps,
      severityFilter: 'high'
    };

    render(<AlertsFilter {...propsWithSeverity} />);

    // Check that the severity filter displays the selected value
    const severityFilter = screen.getByTestId('severity-filter') as HTMLSelectElement;
    expect(severityFilter.value).toBe('high');
  });
});
