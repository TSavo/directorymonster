import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { FormField } from '@/components/admin/sites/components/common/FormField';

describe('FormField Component', () => {
  it('renders a text input field correctly', () => {
    render(
      <FormField
        id="test-field"
        label="Test Field"
        name="testField"
        value="Test Value"
        onChange={jest.fn()}
      />
    );

    expect(screen.getByLabelText('Test Field')).toBeInTheDocument();
    expect(screen.getByTestId('form-field-test-field')).toHaveValue('Test Value');
  });

  it('renders a textarea when type is textarea', () => {
    render(
      <FormField
        id="test-area"
        label="Test Area"
        name="testArea"
        value="Test Content"
        onChange={jest.fn()}
        type="textarea"
        rows={3}
      />
    );

    const textarea = screen.getByTestId('form-field-test-area');
    expect(textarea.tagName).toBe('TEXTAREA');
    expect(textarea).toHaveValue('Test Content');
    expect(textarea).toHaveAttribute('rows', '3');
  });

  it('displays an error message when provided', () => {
    render(
      <FormField
        id="test-field"
        label="Test Field"
        name="testField"
        value=""
        onChange={jest.fn()}
        error="This field is required"
      />
    );

    expect(screen.getByText('This field is required')).toBeInTheDocument();
    expect(screen.getByTestId('form-field-test-field')).toHaveClass('border-red-500', { exact: false });
  });

  it('calls onChange handler when input changes', () => {
    const handleChange = jest.fn();

    render(
      <FormField
        id="test-field"
        label="Test Field"
        name="testField"
        value=""
        onChange={handleChange}
      />
    );

    fireEvent.change(screen.getByTestId('form-field-test-field'), { target: { value: 'New Value' } });

    expect(handleChange).toHaveBeenCalledTimes(1);
    // Just verify it was called, as the synthetic event structure is complex
    expect(handleChange).toHaveBeenCalled();
  });

  it('renders a required field with asterisk', () => {
    render(
      <FormField
        id="test-field"
        label="Test Field"
        name="testField"
        value=""
        onChange={jest.fn()}
        required
      />
    );

    // Check for the label and the asterisk separately
    expect(screen.getByText('Test Field')).toBeInTheDocument();
    expect(screen.getByText('*')).toBeInTheDocument();
  });

  it('disables the input when disabled prop is true', () => {
    render(
      <FormField
        id="test-field"
        label="Test Field"
        name="testField"
        value="Test Value"
        onChange={jest.fn()}
        disabled
      />
    );

    expect(screen.getByTestId('form-field-test-field')).toBeDisabled();
  });

  it('renders a help text when provided', () => {
    render(
      <FormField
        id="test-field"
        label="Test Field"
        name="testField"
        value=""
        onChange={jest.fn()}
        helpText="This is a helpful description"
      />
    );

    expect(screen.getByText('This is a helpful description')).toBeInTheDocument();
  });
});
