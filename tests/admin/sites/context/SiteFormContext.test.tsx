import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SiteFormProvider, useSiteForm } from '@/components/admin/sites/context/SiteFormContext';

// Test component that uses the context
const TestComponent = () => {
  const { state, updateField } = useSiteForm();

  return (
    <div>
      <div data-testid="form-data">{JSON.stringify(state.formData)}</div>
      <div data-testid="form-errors">{JSON.stringify(state.errors)}</div>
      <input
        data-testid="name-input"
        value={state.formData.name || ''}
        onChange={(e) => updateField('name', e.target.value)}
      />
      <button
        data-testid="validate-button"
        onClick={() => state.validateStep('basic_info')}
      >
        Validate
      </button>
    </div>
  );
};

describe('SiteFormContext', () => {
  it('provides form state and methods to child components', () => {
    render(
      <SiteFormProvider initialData={{ name: 'Test Site' }}>
        <TestComponent />
      </SiteFormProvider>
    );

    // This test should fail because we haven't implemented the context yet
    expect(screen.getByTestId('form-data')).toHaveTextContent('Test Site');
  });

  it('allows updating form fields', async () => {
    const user = userEvent.setup();

    render(
      <SiteFormProvider>
        <TestComponent />
      </SiteFormProvider>
    );

    const input = screen.getByTestId('name-input');
    await user.clear(input);
    await user.type(input, 'New Site Name');

    // This test should fail because we haven't implemented the context yet
    expect(screen.getByTestId('form-data')).toHaveTextContent('New Site Name');
  });

  it('validates form fields', async () => {
    const user = userEvent.setup();

    render(
      <SiteFormProvider>
        <TestComponent />
      </SiteFormProvider>
    );

    // Click validate without entering required fields
    await user.click(screen.getByTestId('validate-button'));

    // Check that validation errors are present
    const errorsElement = screen.getByTestId('form-errors');
    expect(errorsElement).toHaveTextContent('Name is required');
    expect(errorsElement).toHaveTextContent('Slug is required');
  });
});
