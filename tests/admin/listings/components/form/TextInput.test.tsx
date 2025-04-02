import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { TextInput } from '@/components/admin/listings/components/form/TextInput';

describe('TextInput Component', () => {
  const defaultProps = {
    id: 'test-input',
    label: 'Test Label',
    value: 'Test Value',
    onChange: jest.fn(),
    'data-testid': 'test-input-field'
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders the input with label and value', () => {
    render(<TextInput {...defaultProps} />);

    // Check if label is rendered
    expect(screen.getByText('Test Label')).toBeInTheDocument();

    // Check if input is rendered with correct value
    const input = screen.getByTestId('test-input-field');
    expect(input).toBeInTheDocument();
    expect(input).toHaveValue('Test Value');
  });

  it('calls onChange when input value changes', () => {
    render(<TextInput {...defaultProps} />);

    // Change input value
    const input = screen.getByTestId('test-input-field');
    fireEvent.change(input, { target: { value: 'New Value' } });

    // Check if onChange was called with new value
    expect(defaultProps.onChange).toHaveBeenCalledWith('New Value');
  });

  it('displays error message when provided', () => {
    const propsWithError = {
      ...defaultProps,
      error: 'This field is required'
    };

    render(<TextInput {...propsWithError} />);

    // Check if error message is displayed
    expect(screen.getByText('This field is required')).toBeInTheDocument();
  });

  it('marks the field as required when specified', () => {
    const requiredProps = {
      ...defaultProps,
      required: true
    };

    render(<TextInput {...requiredProps} />);

    // Check if required indicator (*) is displayed
    expect(screen.getByText('*')).toBeInTheDocument();
  });

  it('disables the input when specified', () => {
    const disabledProps = {
      ...defaultProps,
      disabled: true
    };

    render(<TextInput {...disabledProps} />);

    // Check if input is disabled
    const input = screen.getByTestId('test-input-field');
    expect(input).toBeDisabled();
  });

  it('applies placeholder when provided', () => {
    const propsWithPlaceholder = {
      ...defaultProps,
      placeholder: 'Enter a value',
      value: '' // Empty value to show placeholder
    };

    render(<TextInput {...propsWithPlaceholder} />);

    // Check if placeholder is applied
    const input = screen.getByTestId('test-input-field');
    expect(input).toHaveAttribute('placeholder', 'Enter a value');
  });

  it('applies maxLength when provided', () => {
    const propsWithMaxLength = {
      ...defaultProps,
      maxLength: 50
    };

    render(<TextInput {...propsWithMaxLength} />);

    // Check if maxLength is applied
    const input = screen.getByTestId('test-input-field');
    expect(input).toHaveAttribute('maxLength', '50');
  });

  it('applies correct CSS classes based on error state', () => {
    // Render with error
    const propsWithError = {
      ...defaultProps,
      error: 'This field is required'
    };

    const { rerender } = render(<TextInput {...propsWithError} />);

    // Check if error class is applied to the input itself
    const inputWithError = screen.getByTestId('test-input-field');
    expect(inputWithError).toHaveClass('border-red-300');

    // Rerender without error
    rerender(<TextInput {...defaultProps} />);

    // Check if error class is not applied
    const inputWithoutError = screen.getByTestId('test-input-field');
    expect(inputWithoutError).not.toHaveClass('border-red-300');
  });

  it('displays error message with correct ID', () => {
    const propsWithError = {
      ...defaultProps,
      error: 'This field is required'
    };

    render(<TextInput {...propsWithError} />);

    // The error message should have the correct ID
    const errorId = `${defaultProps.id}-error`;
    const errorMessage = screen.getByText('This field is required');
    expect(errorMessage).toHaveAttribute('id', errorId);
  });
});
