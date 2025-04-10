import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { ActivityFilters } from '../ActivityFilters';

describe('ActivityFilters', () => {
  const mockProps = {
    startDate: '',
    endDate: '',
    actionType: '',
    onStartDateChange: jest.fn(),
    onEndDateChange: jest.fn(),
    onActionTypeChange: jest.fn(),
    onApplyFilters: jest.fn()
  };

  it('renders date inputs and action type selector', () => {
    render(<ActivityFilters {...mockProps} />);
    
    expect(screen.getByTestId('start-date-input')).toBeInTheDocument();
    expect(screen.getByTestId('end-date-input')).toBeInTheDocument();
    expect(screen.getByTestId('action-type-select')).toBeInTheDocument();
    expect(screen.getByTestId('apply-filters-button')).toBeInTheDocument();
  });

  it('calls onStartDateChange when start date is changed', () => {
    render(<ActivityFilters {...mockProps} />);
    
    const startDateInput = screen.getByTestId('start-date-input');
    fireEvent.change(startDateInput, { target: { value: '2023-01-01' } });
    
    expect(mockProps.onStartDateChange).toHaveBeenCalledWith('2023-01-01');
  });

  it('calls onEndDateChange when end date is changed', () => {
    render(<ActivityFilters {...mockProps} />);
    
    const endDateInput = screen.getByTestId('end-date-input');
    fireEvent.change(endDateInput, { target: { value: '2023-01-31' } });
    
    expect(mockProps.onEndDateChange).toHaveBeenCalledWith('2023-01-31');
  });

  it('calls onActionTypeChange when action type is changed', () => {
    render(<ActivityFilters {...mockProps} />);
    
    const actionTypeSelect = screen.getByTestId('action-type-select');
    fireEvent.change(actionTypeSelect, { target: { value: 'login' } });
    
    expect(mockProps.onActionTypeChange).toHaveBeenCalledWith('login');
  });

  it('calls onApplyFilters when apply button is clicked', () => {
    render(<ActivityFilters {...mockProps} />);
    
    const applyButton = screen.getByTestId('apply-filters-button');
    fireEvent.click(applyButton);
    
    expect(mockProps.onApplyFilters).toHaveBeenCalled();
  });

  it('displays the current filter values', () => {
    const propsWithValues = {
      ...mockProps,
      startDate: '2023-01-01',
      endDate: '2023-01-31',
      actionType: 'login'
    };
    
    render(<ActivityFilters {...propsWithValues} />);
    
    const startDateInput = screen.getByTestId('start-date-input') as HTMLInputElement;
    const endDateInput = screen.getByTestId('end-date-input') as HTMLInputElement;
    const actionTypeSelect = screen.getByTestId('action-type-select') as HTMLSelectElement;
    
    expect(startDateInput.value).toBe('2023-01-01');
    expect(endDateInput.value).toBe('2023-01-31');
    expect(actionTypeSelect.value).toBe('login');
  });
});
