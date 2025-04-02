import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { TextArea } from '@/components/admin/listings/components/form/TextArea';

describe('TextArea Component', () => {
  const defaultProps = {
    id: 'test-textarea',
    label: 'Test Label',
    value: 'Test Value',
    onChange: jest.fn(),
    'data-testid': 'test-textarea-field'
  };
  
  beforeEach(() => {
    jest.clearAllMocks();
  });
  
  it('renders the textarea with label and value', () => {
    render(<TextArea {...defaultProps} />);
    
    // Check if label is rendered
    expect(screen.getByText('Test Label')).toBeInTheDocument();
    
    // Check if textarea is rendered with correct value
    const textarea = screen.getByTestId('test-textarea-field');
    expect(textarea).toBeInTheDocument();
    expect(textarea).toHaveValue('Test Value');
  });
  
  it('calls onChange when textarea value changes', () => {
    render(<TextArea {...defaultProps} />);
    
    // Change textarea value
    const textarea = screen.getByTestId('test-textarea-field');
    fireEvent.change(textarea, { target: { value: 'New Value' } });
    
    // Check if onChange was called with new value
    expect(defaultProps.onChange).toHaveBeenCalledWith('New Value');
  });
  
  it('displays error message when provided', () => {
    const propsWithError = {
      ...defaultProps,
      error: 'This field is required'
    };
    
    render(<TextArea {...propsWithError} />);
    
    // Check if error message is displayed
    expect(screen.getByText('This field is required')).toBeInTheDocument();
  });
  
  it('marks the field as required when specified', () => {
    const requiredProps = {
      ...defaultProps,
      required: true
    };
    
    render(<TextArea {...requiredProps} />);
    
    // Check if required indicator (*) is displayed
    expect(screen.getByText('*')).toBeInTheDocument();
  });
  
  it('disables the textarea when specified', () => {
    const disabledProps = {
      ...defaultProps,
      disabled: true
    };
    
    render(<TextArea {...disabledProps} />);
    
    // Check if textarea is disabled
    const textarea = screen.getByTestId('test-textarea-field');
    expect(textarea).toBeDisabled();
  });
  
  it('applies placeholder when provided', () => {
    const propsWithPlaceholder = {
      ...defaultProps,
      placeholder: 'Enter a value',
      value: '' // Empty value to show placeholder
    };
    
    render(<TextArea {...propsWithPlaceholder} />);
    
    // Check if placeholder is applied
    const textarea = screen.getByTestId('test-textarea-field');
    expect(textarea).toHaveAttribute('placeholder', 'Enter a value');
  });
  
  it('applies maxLength when provided', () => {
    const propsWithMaxLength = {
      ...defaultProps,
      maxLength: 500
    };
    
    render(<TextArea {...propsWithMaxLength} />);
    
    // Check if maxLength is applied
    const textarea = screen.getByTestId('test-textarea-field');
    expect(textarea).toHaveAttribute('maxLength', '500');
  });
  
  it('applies custom rows when provided', () => {
    const propsWithRows = {
      ...defaultProps,
      rows: 8
    };
    
    render(<TextArea {...propsWithRows} />);
    
    // Check if rows attribute is applied
    const textarea = screen.getByTestId('test-textarea-field');
    expect(textarea).toHaveAttribute('rows', '8');
  });
  
  it('uses default rows value when not provided', () => {
    render(<TextArea {...defaultProps} />);
    
    // Check if default rows value (4) is applied
    const textarea = screen.getByTestId('test-textarea-field');
    expect(textarea).toHaveAttribute('rows', '4');
  });
  
  it('applies correct CSS classes based on error state', () => {
    // Render with error
    const propsWithError = {
      ...defaultProps,
      error: 'This field is required'
    };
    
    const { rerender } = render(<TextArea {...propsWithError} />);
    
    // Check if error class is applied to the textarea itself
    const textareaWithError = screen.getByTestId('test-textarea-field');
    expect(textareaWithError).toHaveClass('border-red-300');
    
    // Rerender without error
    rerender(<TextArea {...defaultProps} />);
    
    // Check if error class is not applied
    const textareaWithoutError = screen.getByTestId('test-textarea-field');
    expect(textareaWithoutError).not.toHaveClass('border-red-300');
  });
  
  it('displays error message with correct ID', () => {
    const propsWithError = {
      ...defaultProps,
      error: 'This field is required'
    };
    
    render(<TextArea {...propsWithError} />);
    
    // The error message should have the correct ID
    const errorId = `${defaultProps.id}-error`;
    const errorMessage = screen.getByText('This field is required');
    expect(errorMessage).toHaveAttribute('id', errorId);
  });
});
