import { screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

/**
 * Fills out a form field by label text
 * 
 * @param labelText The text of the label for the field
 * @param value The value to enter into the field
 */
export async function fillFieldByLabel(labelText: string, value: string): Promise<void> {
  try {
    // Try to find the label first
    const label = screen.getByText(labelText, { selector: 'label' });
    const fieldId = label.getAttribute('for');
    
    if (fieldId) {
      // If the label has a 'for' attribute, use it to find the field
      const field = document.getElementById(fieldId);
      if (field) {
        await userEvent.type(field as HTMLElement, value);
        return;
      }
    }
    
    // If we couldn't find the field by ID, try to find it by label text
    const field = screen.getByLabelText(labelText);
    await userEvent.type(field, value);
  } catch (error) {
    // If we couldn't find the field by label, try to find it by test ID
    try {
      // Try common test IDs based on the label text
      const testId = `input-${labelText.toLowerCase().replace(/\s+/g, '-')}`;
      const field = screen.getByTestId(testId);
      await userEvent.type(field, value);
    } catch (innerError) {
      // If all else fails, throw a helpful error
      throw new Error(`Could not find field with label "${labelText}". ${error}`);
    }
  }
}

/**
 * Fills out a form field by test ID
 * 
 * @param testId The test ID of the field
 * @param value The value to enter into the field
 */
export async function fillFieldByTestId(testId: string, value: string): Promise<void> {
  const field = screen.getByTestId(testId);
  await userEvent.type(field, value);
}

/**
 * Selects an option in a select field by label text
 * 
 * @param labelText The text of the label for the select field
 * @param optionText The text of the option to select
 */
export async function selectOptionByLabel(labelText: string, optionText: string): Promise<void> {
  try {
    // Try to find the label first
    const label = screen.getByText(labelText, { selector: 'label' });
    const fieldId = label.getAttribute('for');
    
    if (fieldId) {
      // If the label has a 'for' attribute, use it to find the select field
      const selectField = document.getElementById(fieldId) as HTMLSelectElement;
      if (selectField) {
        fireEvent.change(selectField, { target: { value: optionText } });
        return;
      }
    }
    
    // If we couldn't find the field by ID, try to find it by label text
    const selectField = screen.getByLabelText(labelText) as HTMLSelectElement;
    fireEvent.change(selectField, { target: { value: optionText } });
  } catch (error) {
    // If we couldn't find the field by label, try to find it by test ID
    try {
      // Try common test IDs based on the label text
      const testId = `select-${labelText.toLowerCase().replace(/\s+/g, '-')}`;
      const selectField = screen.getByTestId(testId) as HTMLSelectElement;
      fireEvent.change(selectField, { target: { value: optionText } });
    } catch (innerError) {
      // If all else fails, throw a helpful error
      throw new Error(`Could not find select field with label "${labelText}". ${error}`);
    }
  }
}

/**
 * Submits a form
 * 
 * @param formTestId The test ID of the form (optional)
 */
export async function submitForm(formTestId?: string): Promise<void> {
  try {
    // Try to find the form by test ID
    const form = formTestId 
      ? screen.getByTestId(formTestId) 
      : screen.getByTestId('form');
    
    fireEvent.submit(form);
    
    // Wait for the form submission to complete
    await waitFor(() => {
      // This is just to ensure the event loop has a chance to process the submission
    });
  } catch (error) {
    // If we couldn't find the form by test ID, try to find a submit button
    try {
      const submitButton = screen.getByRole('button', { name: /submit|save|create|update/i });
      fireEvent.click(submitButton);
      
      // Wait for the form submission to complete
      await waitFor(() => {
        // This is just to ensure the event loop has a chance to process the submission
      });
    } catch (innerError) {
      // If all else fails, throw a helpful error
      throw new Error(`Could not find form or submit button. ${error}`);
    }
  }
}

export default {
  fillFieldByLabel,
  fillFieldByTestId,
  selectOptionByLabel,
  submitForm
};
