import { screen } from '@testing-library/react';

// Assert that an element with text is visible
export function assertTextVisible(text: string | RegExp) {
  expect(screen.getByText(text)).toBeVisible();
}

// Assert that an element with text is not in the document
export function assertTextNotPresent(text: string | RegExp) {
  expect(screen.queryByText(text)).not.toBeInTheDocument();
}

// Assert that a button with text is enabled
export function assertButtonEnabled(text: string | RegExp) {
  const button = screen.getByRole('button', { name: text });
  expect(button).toBeEnabled();
}

// Assert that a button with text is disabled
export function assertButtonDisabled(text: string | RegExp) {
  const button = screen.getByRole('button', { name: text });
  expect(button).toBeDisabled();
}

// Assert that a form field has an error
export function assertFieldError(labelText: string | RegExp, errorText: string | RegExp) {
  const field = screen.getByLabelText(labelText);
  expect(field).toBeInvalid();
  expect(screen.getByText(errorText)).toBeVisible();
}

// Assert that a form field is valid
export function assertFieldValid(labelText: string | RegExp) {
  const field = screen.getByLabelText(labelText);
  expect(field).toBeValid();
}

// Assert that a notification is visible
export function assertNotificationVisible(text: string | RegExp, type?: 'success' | 'error' | 'info' | 'warning') {
  const notification = screen.getByText(text);
  expect(notification).toBeVisible();
  
  if (type) {
    expect(notification.closest(`[data-type="${type}"]`)).toBeInTheDocument();
  }
}
