import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

/**
 * Options for testing a form
 */
export interface FormTestOptions {
  /**
   * Initial form values
   */
  initialValues?: Record<string, any>;
  
  /**
   * Mock submit handler
   */
  onSubmit?: jest.Mock;
  
  /**
   * Whether to automatically submit the form after filling it
   * @default false
   */
  autoSubmit?: boolean;
  
  /**
   * Additional render options
   */
  renderOptions?: Parameters<typeof render>[1];
}

/**
 * Form field configuration
 */
export interface FormField {
  /**
   * The name of the field
   */
  name: string;
  
  /**
   * The test ID of the field
   */
  testId: string;
  
  /**
   * The value to set
   */
  value: string | boolean;
  
  /**
   * The type of the field
   * @default 'text'
   */
  type?: 'text' | 'select' | 'checkbox' | 'radio' | 'textarea';
}

/**
 * Result of testing a form
 */
export interface FormTestResult {
  /**
   * The rendered component
   */
  component: ReturnType<typeof render>;
  
  /**
   * Fill the form with the provided values
   */
  fillForm: (fields: FormField[]) => Promise<void>;
  
  /**
   * Submit the form
   */
  submitForm: () => Promise<void>;
  
  /**
   * Get the current form values
   */
  getFormValues: () => Record<string, any>;
  
  /**
   * Check if the form has validation errors
   */
  hasErrors: () => Promise<boolean>;
  
  /**
   * Get validation errors
   */
  getErrors: () => Promise<Record<string, string>>;
}

/**
 * Test a form component
 * 
 * @param FormComponent The form component to test
 * @param options Test options
 * @returns Form test utilities
 */
export function testForm(
  FormComponent: React.ComponentType<any>,
  options: FormTestOptions = {}
): FormTestResult {
  const {
    initialValues = {},
    onSubmit = jest.fn(),
    autoSubmit = false,
    renderOptions = {}
  } = options;
  
  // Render the form
  const component = render(
    <FormComponent
      initialValues={initialValues}
      onSubmit={onSubmit}
      {...(renderOptions.wrapper ? {} : {})}
    />,
    renderOptions
  );
  
  /**
   * Fill the form with the provided values
   */
  const fillForm = async (fields: FormField[]): Promise<void> => {
    const user = userEvent.setup();
    
    for (const field of fields) {
      const { name, testId, value, type = 'text' } = field;
      const element = screen.getByTestId(testId);
      
      switch (type) {
        case 'text':
        case 'textarea':
          await user.clear(element);
          await user.type(element, value as string);
          break;
          
        case 'select':
          await user.selectOptions(element, value as string);
          break;
          
        case 'checkbox':
          if ((value as boolean) !== (element as HTMLInputElement).checked) {
            await user.click(element);
          }
          break;
          
        case 'radio':
          await user.click(element);
          break;
      }
    }
    
    if (autoSubmit) {
      await submitForm();
    }
  };
  
  /**
   * Submit the form
   */
  const submitForm = async (): Promise<void> => {
    const user = userEvent.setup();
    const submitButton = screen.getByRole('button', { name: /submit|save|create|update/i });
    await user.click(submitButton);
    
    // Wait for the form to be submitted
    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalled();
    });
  };
  
  /**
   * Get the current form values
   */
  const getFormValues = (): Record<string, any> => {
    // This is a simplified implementation
    // In a real implementation, you would need to get the values from the form elements
    return {};
  };
  
  /**
   * Check if the form has validation errors
   */
  const hasErrors = async (): Promise<boolean> => {
    // Look for elements with error messages
    const errorElements = screen.queryAllByRole('alert');
    return errorElements.length > 0;
  };
  
  /**
   * Get validation errors
   */
  const getErrors = async (): Promise<Record<string, string>> => {
    const errors: Record<string, string> = {};
    const errorElements = screen.queryAllByRole('alert');
    
    errorElements.forEach(element => {
      const field = element.getAttribute('data-field');
      if (field) {
        errors[field] = element.textContent || '';
      }
    });
    
    return errors;
  };
  
  return {
    component,
    fillForm,
    submitForm,
    getFormValues,
    hasErrors,
    getErrors
  };
}

/**
 * Test a specific form field
 * 
 * @param fieldTestId The test ID of the field
 * @param validValue A valid value for the field
 * @param invalidValue An invalid value for the field
 * @param errorMessage The expected error message
 * @returns A function that tests the field
 */
export function testFormField(
  fieldTestId: string,
  validValue: string | boolean,
  invalidValue: string | boolean,
  errorMessage: string
): (fillForm: FormTestResult['fillForm']) => Promise<void> {
  return async (fillForm: FormTestResult['fillForm']): Promise<void> => {
    // Test with invalid value
    await fillForm([
      {
        name: fieldTestId,
        testId: fieldTestId,
        value: invalidValue,
        type: typeof invalidValue === 'boolean' ? 'checkbox' : 'text'
      }
    ]);
    
    // Check for error message
    const errorElement = screen.getByText(errorMessage);
    expect(errorElement).toBeInTheDocument();
    
    // Test with valid value
    await fillForm([
      {
        name: fieldTestId,
        testId: fieldTestId,
        value: validValue,
        type: typeof validValue === 'boolean' ? 'checkbox' : 'text'
      }
    ]);
    
    // Check that error message is gone
    expect(screen.queryByText(errorMessage)).not.toBeInTheDocument();
  };
}
