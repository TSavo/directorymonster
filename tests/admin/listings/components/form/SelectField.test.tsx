import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { SelectField } from '@/components/admin/listings/components/form/SelectField';

describe('SelectField Component', () => {
  const mockOptions = [
    { value: 'option1', label: 'Option 1' },
    { value: 'option2', label: 'Option 2' },
    { value: 'option3', label: 'Option 3' }
  ];
  
  const defaultProps = {
    id: 'test-select',
    label: 'Test Label',
    value: 'option1',
    options: mockOptions,
    onChange: jest.fn(),
    'data-testid': 'test-select-field'
  };
  
  beforeEach(() => {
    jest.clearAllMocks();
  });
  
  it('renders the select with label and options', () => {
    render(<SelectField {...defaultProps} />);
    
    // Check if label is rendered
    expect(screen.getByText('Test Label')).toBeInTheDocument();
    
    // Check if select is rendered with correct value
    const select = screen.getByTestId('test-select-field');
    expect(select).toBeInTheDocument();
    expect(select).toHaveValue('option1');
    
    // Check if all options are rendered
    expect(screen.getByText('Option 1')).toBeInTheDocument();
    expect(screen.getByText('Option 2')).toBeInTheDocument();
    expect(screen.getByText('Option 3')).toBeInTheDocument();
    
    // Check if default "Select" option is rendered
    expect(screen.getByText('Select Test Label')).toBeInTheDocument();
  });
  
  it('calls onChange when select value changes', () => {
    render(<SelectField {...defaultProps} />);
    
    // Change select value
    const select = screen.getByTestId('test-select-field');
    fireEvent.change(select, { target: { value: 'option2' } });
    
    // Check if onChange was called with new value
    expect(defaultProps.onChange).toHaveBeenCalledWith('option2');
  });
  
  it('displays error message when provided', () => {
    const propsWithError = {
      ...defaultProps,
      error: 'This field is required'
    };
    
    render(<SelectField {...propsWithError} />);
    
    // Check if error message is displayed
    expect(screen.getByText('This field is required')).toBeInTheDocument();
  });
  
  it('marks the field as required when specified', () => {
    const requiredProps = {
      ...defaultProps,
      required: true
    };
    
    render(<SelectField {...requiredProps} />);
    
    // Check if required indicator (*) is displayed
    expect(screen.getByText('*')).toBeInTheDocument();
  });
  
  it('disables the select when specified', () => {
    const disabledProps = {
      ...defaultProps,
      disabled: true
    };
    
    render(<SelectField {...disabledProps} />);
    
    // Check if select is disabled
    const select = screen.getByTestId('test-select-field');
    expect(select).toBeDisabled();
  });
  
  it('renders with empty value when value is not provided', () => {
    const propsWithoutValue = {
      ...defaultProps,
      value: ''
    };
    
    render(<SelectField {...propsWithoutValue} />);
    
    // Check if select has empty value
    const select = screen.getByTestId('test-select-field');
    expect(select).toHaveValue('');
    
    // "Select" option should be selected
    expect(screen.getByText('Select Test Label')).toBeInTheDocument();
  });
  
  it('applies correct CSS classes based on error state', () => {
    // Render with error
    const propsWithError = {
      ...defaultProps,
      error: 'This field is required'
    };
    
    const { rerender } = render(<SelectField {...propsWithError} />);
    
    // Check if error class is applied to the select itself
    const selectWithError = screen.getByTestId('test-select-field');
    expect(selectWithError).toHaveClass('border-red-300');
    
    // Rerender without error
    rerender(<SelectField {...defaultProps} />);
    
    // Check if error class is not applied
    const selectWithoutError = screen.getByTestId('test-select-field');
    expect(selectWithoutError).not.toHaveClass('border-red-300');
  });
  
  it('displays error message with correct ID', () => {
    const propsWithError = {
      ...defaultProps,
      error: 'This field is required'
    };
    
    render(<SelectField {...propsWithError} />);
    
    // The error message should have the correct ID
    const errorId = `${defaultProps.id}-error`;
    const errorMessage = screen.getByText('This field is required');
    expect(errorMessage).toHaveAttribute('id', errorId);
  });
  
  it('renders with no options when empty array is provided', () => {
    const propsWithNoOptions = {
      ...defaultProps,
      options: []
    };
    
    render(<SelectField {...propsWithNoOptions} />);
    
    // Only the default "Select" option should be rendered
    const options = screen.getAllByRole('option');
    expect(options).toHaveLength(1);
    expect(options[0]).toHaveTextContent('Select Test Label');
  });
});
