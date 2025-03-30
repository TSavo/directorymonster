import React from 'react';
import { render, screen } from '@testing-library/react';
import { BasicInfoStep } from '@/components/admin/sites/components/BasicInfoStep';

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
      <BasicInfoStep 
        values={mockValues}
        onChange={mockOnChange}
        errors={mockErrors}
      />
    );
    
    // Check if error message is displayed
    const errorElement = screen.getByTestId('site-form-name-error');
    expect(errorElement).toBeInTheDocument();
    expect(errorElement).toHaveTextContent('Site name is required');
  });

  it('displays error message for slug field when provided', () => {
    const mockErrors = {
      slug: 'Slug must contain only lowercase letters, numbers, and hyphens'
    };
    
    render(
      <BasicInfoStep 
        values={mockValues}
        onChange={mockOnChange}
        errors={mockErrors}
      />
    );
    
    // Check if error message is displayed
    const errorElement = screen.getByTestId('site-form-slug-error');
    expect(errorElement).toBeInTheDocument();
    expect(errorElement).toHaveTextContent('Slug must contain only lowercase letters, numbers, and hyphens');
  });

  it('adds error class to input fields with errors', () => {
    const mockErrors = {
      name: 'Site name is required',
      slug: 'Invalid slug format'
    };
    
    render(
      <BasicInfoStep 
        values={mockValues}
        onChange={mockOnChange}
        errors={mockErrors}
      />
    );
    
    // Check if input fields have error class
    const nameInput = screen.getByTestId('site-form-name');
    const slugInput = screen.getByTestId('site-form-slug');
    
    expect(nameInput).toHaveClass('error', { exact: false });
    expect(slugInput).toHaveClass('error', { exact: false });
  });

  it('does not show error elements when no errors are provided', () => {
    const mockErrors = {};
    
    render(
      <BasicInfoStep 
        values={mockValues}
        onChange={mockOnChange}
        errors={mockErrors}
      />
    );
    
    // Error elements should not be in the document
    expect(screen.queryByTestId('site-form-name-error')).not.toBeInTheDocument();
    expect(screen.queryByTestId('site-form-slug-error')).not.toBeInTheDocument();
    expect(screen.queryByTestId('site-form-description-error')).not.toBeInTheDocument();
  });
});
