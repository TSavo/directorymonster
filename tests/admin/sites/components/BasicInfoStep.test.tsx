import React from 'react';
import { render, screen } from '@testing-library/react';
import BasicInfoStep from '@/components/admin/sites/components/BasicInfoStep';

describe('BasicInfoStep Component - Basic Rendering', () => {
  // Mock form values
  const mockValues = {
    name: '',
    slug: '',
    description: ''
  };

  // Mock functions
  const mockOnChange = jest.fn();
  const mockErrors = {};

  it('renders all form fields correctly', () => {
    render(
      <BasicInfoStep
        values={mockValues}
        onChange={mockOnChange}
        errors={mockErrors}
      />
    );

    // Check if all form fields are rendered
    expect(screen.getByTestId('siteForm-name')).toBeInTheDocument();
    expect(screen.getByTestId('siteForm-slug')).toBeInTheDocument();
    expect(screen.getByTestId('siteForm-description')).toBeInTheDocument();

    // Check if labels are rendered
    expect(screen.getByText(/Site Name \*/i)).toBeInTheDocument();
    expect(screen.getByText(/Slug \*/i)).toBeInTheDocument();
    expect(screen.getByText(/Description/i)).toBeInTheDocument();
  });

  it('displays initial values in form fields', () => {
    const valuesWithData = {
      name: 'Test Site',
      slug: 'test-site',
      description: 'This is a test site description'
    };

    render(
      <BasicInfoStep
        values={valuesWithData}
        onChange={mockOnChange}
        errors={mockErrors}
      />
    );

    // Check if values are displayed in form fields
    expect(screen.getByTestId('siteForm-name')).toHaveValue('Test Site');
    expect(screen.getByTestId('siteForm-slug')).toHaveValue('test-site');
    expect(screen.getByTestId('siteForm-description')).toHaveValue('This is a test site description');
  });

  it('shows helper text for form fields', () => {
    render(
      <BasicInfoStep
        values={mockValues}
        onChange={mockOnChange}
        errors={mockErrors}
      />
    );

    // The helper text is now part of the label, not a separate element with a testid
    // Check if the slug label contains the helper text
    expect(screen.getByText(/URL-friendly name/i)).toBeInTheDocument();
  });
});
