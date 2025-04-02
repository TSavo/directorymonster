import React from 'react';
import { render, screen } from '@testing-library/react';
import BasicInfoStep from '@/components/admin/sites/components/BasicInfoStep';
import { SiteFormProvider } from '@/components/admin/sites/context/SiteFormContext';

describe('BasicInfoStep Component - Validation', () => {
  // Mock form values
  const mockValues = {
    name: 'Test Site',
    slug: 'test-site',
    description: 'This is a test description'
  };

  // Mock functions
  const mockOnChange = jest.fn();

  it('displays error message for name field when provided', () => {
    const mockErrors = {
      name: 'Site name is required'
    };

    render(
      <SiteFormProvider>
        <BasicInfoStep
          values={mockValues}
          onValueChange={mockOnChange}
          errors={mockErrors}
        />
      </SiteFormProvider>
    );

    // Check if error message is displayed
    const errorElement = screen.getByTestId('siteForm-name-error');
    expect(errorElement).toBeInTheDocument();
    expect(errorElement).toHaveTextContent('Site name is required');
  });

  it('displays error message for slug field when provided', () => {
    const mockErrors = {
      slug: 'Slug must contain only lowercase letters, numbers, and hyphens'
    };

    render(
      <SiteFormProvider>
        <BasicInfoStep
          values={mockValues}
          onValueChange={mockOnChange}
          errors={mockErrors}
        />
      </SiteFormProvider>
    );

    // Check if error message is displayed
    const errorElement = screen.getByTestId('siteForm-slug-error');
    expect(errorElement).toBeInTheDocument();
    expect(errorElement).toHaveTextContent('Slug must contain only lowercase letters, numbers, and hyphens');
  });

  it('adds error class to input fields with errors', () => {
    const mockErrors = {
      name: 'Site name is required',
      slug: 'Invalid slug format'
    };

    render(
      <SiteFormProvider>
        <BasicInfoStep
          values={mockValues}
          onValueChange={mockOnChange}
          errors={mockErrors}
        />
      </SiteFormProvider>
    );

    // Check if input fields have error class
    const nameInput = screen.getByTestId('siteForm-name');
    const slugInput = screen.getByTestId('siteForm-slug');

    expect(nameInput).toHaveClass('border-red-500', { exact: false });
    expect(slugInput).toHaveClass('border-red-500', { exact: false });
  });

  it('does not show error elements when no errors are provided', () => {
    const mockErrors = {};

    render(
      <SiteFormProvider>
        <BasicInfoStep
          values={mockValues}
          onValueChange={mockOnChange}
          errors={mockErrors}
        />
      </SiteFormProvider>
    );

    // Error elements should not be in the document
    expect(screen.queryByTestId('siteForm-name-error')).not.toBeInTheDocument();
    expect(screen.queryByTestId('siteForm-slug-error')).not.toBeInTheDocument();
    expect(screen.queryByTestId('siteForm-description-error')).not.toBeInTheDocument();
  });
});
