import React from 'react';
import { render, screen } from '@testing-library/react';
import { BasicInfoStep } from '@/components/admin/sites/components/BasicInfoStep';

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
    expect(screen.getByTestId('site-form-name')).toBeInTheDocument();
    expect(screen.getByTestId('site-form-slug')).toBeInTheDocument();
    expect(screen.getByTestId('site-form-description')).toBeInTheDocument();
    
    // Check if labels are rendered
    expect(screen.getByText('Site Name')).toBeInTheDocument();
    expect(screen.getByText('Slug')).toBeInTheDocument();
    expect(screen.getByText('Description')).toBeInTheDocument();
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
    expect(screen.getByTestId('site-form-name')).toHaveValue('Test Site');
    expect(screen.getByTestId('site-form-slug')).toHaveValue('test-site');
    expect(screen.getByTestId('site-form-description')).toHaveValue('This is a test site description');
  });

  it('shows helper text for form fields', () => {
    render(
      <BasicInfoStep 
        values={mockValues}
        onChange={mockOnChange}
        errors={mockErrors}
      />
    );
    
    // Check if helper text is displayed
    expect(screen.getByTestId('site-form-slug-helper')).toBeInTheDocument();
    expect(screen.getByTestId('site-form-slug-helper')).toHaveTextContent(/lowercase.*hyphens/i);
  });
});
