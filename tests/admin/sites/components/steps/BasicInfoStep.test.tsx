import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { BasicInfoStep } from '@/components/admin/sites/components/steps/BasicInfoStep';
import { SiteFormProvider, useSiteForm } from '@/components/admin/sites/context/SiteFormContext';

// Mock the FormField component to simplify testing
jest.mock('@/components/admin/sites/components/common/FormField', () => ({
  __esModule: true,
  default: ({ id, label, name, value, onChange, error, required, helpText }: any) => {
    return (
      <div data-testid={`mock-form-field-${id}`}>
        <label>{label} {required && '*'}</label>
        <input
          data-testid={`input-${id}`}
          name={name}
          value={value}
          onChange={onChange}
        />
        {error && <div data-testid={`error-${id}`}>{error}</div>}
        {helpText && <div data-testid={`help-${id}`}>{helpText}</div>}
      </div>
    );
  }
}));

// Create a mock for the useSiteForm hook
const mockUpdateField = jest.fn();
const mockSetErrors = jest.fn();
const mockSubmitForm = jest.fn();
const mockResetForm = jest.fn();

// Mock the SiteFormContext to return our mock values
jest.mock('@/components/admin/sites/context/SiteFormContext', () => {
  const originalModule = jest.requireActual('@/components/admin/sites/context/SiteFormContext');
  return {
    ...originalModule,
    useSiteForm: jest.fn()
  };
});

describe('BasicInfoStep Component', () => {
  it('renders all required fields', () => {
    // Set up the mock for this test
    (useSiteForm as jest.Mock).mockReturnValue({
      state: {
        formData: { name: '', slug: '', description: '' },
        errors: {},
        isSubmitting: false,
        isValid: true
      },
      updateField: mockUpdateField,
      setErrors: mockSetErrors,
      submitForm: mockSubmitForm,
      resetForm: mockResetForm
    });

    render(
      <SiteFormProvider>
        <BasicInfoStep />
      </SiteFormProvider>
    );

    // Check that all required fields are rendered
    expect(screen.getByTestId('mock-form-field-site-name')).toBeInTheDocument();
    expect(screen.getByTestId('mock-form-field-site-slug')).toBeInTheDocument();
    expect(screen.getByTestId('mock-form-field-site-description')).toBeInTheDocument();
  });

  it('updates form data when fields change', () => {
    // Set up the mock for this test
    const formData = { name: '', slug: '', description: '' };

    // Create a mock that updates the formData when updateField is called
    mockUpdateField.mockImplementation((field, value) => {
      formData[field] = value;
    });

    (useSiteForm as jest.Mock).mockReturnValue({
      state: {
        formData,
        errors: {},
        isSubmitting: false,
        isValid: true
      },
      updateField: mockUpdateField,
      setErrors: mockSetErrors,
      submitForm: mockSubmitForm,
      resetForm: mockResetForm
    });

    render(
      <SiteFormProvider>
        <BasicInfoStep />
      </SiteFormProvider>
    );

    // Simulate input changes
    fireEvent.change(screen.getByTestId('input-site-name'), {
      target: { name: 'name', value: 'Test Site' }
    });

    fireEvent.change(screen.getByTestId('input-site-slug'), {
      target: { name: 'slug', value: 'test-site' }
    });

    fireEvent.change(screen.getByTestId('input-site-description'), {
      target: { name: 'description', value: 'This is a test site' }
    });

    // Check that updateField was called with the correct values
    expect(mockUpdateField).toHaveBeenCalledWith('name', 'Test Site');
    expect(mockUpdateField).toHaveBeenCalledWith('slug', 'test-site');
    expect(mockUpdateField).toHaveBeenCalledWith('description', 'This is a test site');
  });

  it('generates a slug from the site name', () => {
    // Set up the mock for this test
    const formData = { name: 'My Test Site', slug: '', description: '' };

    // Create a mock that updates the formData when updateField is called
    mockUpdateField.mockImplementation((field, value) => {
      formData[field] = value;

      // For testing purposes, simulate the slug generation
      if (field === 'slug') {
        // Update the input value in our mock
        const slugInput = screen.getByTestId('input-site-slug');
        (slugInput as HTMLInputElement).value = value;
      }
    });

    (useSiteForm as jest.Mock).mockReturnValue({
      state: {
        formData,
        errors: {},
        isSubmitting: false,
        isValid: true
      },
      updateField: mockUpdateField,
      setErrors: mockSetErrors,
      submitForm: mockSubmitForm,
      resetForm: mockResetForm
    });

    render(
      <SiteFormProvider>
        <BasicInfoStep />
      </SiteFormProvider>
    );

    // Click the generate slug button
    fireEvent.click(screen.getByTestId('generate-slug-button'));

    // Check that updateField was called with the correct slug
    expect(mockUpdateField).toHaveBeenCalledWith('slug', 'my-test-site');
  });

  it('displays validation errors', () => {
    // Set up the mock for this test
    (useSiteForm as jest.Mock).mockReturnValue({
      state: {
        formData: { name: '', slug: '', description: '' },
        errors: { name: 'Name is required' },
        isSubmitting: false,
        isValid: false
      },
      updateField: mockUpdateField,
      setErrors: mockSetErrors,
      submitForm: mockSubmitForm,
      resetForm: mockResetForm
    });

    render(
      <SiteFormProvider>
        <BasicInfoStep />
      </SiteFormProvider>
    );

    // Check that the error is passed to the FormField component
    const mockFormField = screen.getByTestId('mock-form-field-site-name');
    expect(mockFormField).toBeInTheDocument();

    // Check that the error element is rendered
    const errorElement = screen.getByTestId('error-site-name');
    expect(errorElement).toBeInTheDocument();
    expect(errorElement).toHaveTextContent('Name is required');
  });
});
