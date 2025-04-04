import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { SiteFormValidator } from '@/components/admin/sites/components/common/SiteFormValidator';
import { SiteFormProvider } from '@/components/admin/sites/context/SiteFormContext';

// Mock the context
jest.mock('@/components/admin/sites/context/SiteFormContext', () => {
  const originalModule = jest.requireActual('@/components/admin/sites/context/SiteFormContext');
  
  return {
    ...originalModule,
    useSiteForm: jest.fn()
  };
});

// Import the mocked useSiteForm
import { useSiteForm } from '@/components/admin/sites/context/SiteFormContext';

describe('SiteFormValidator Component', () => {
  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();
  });
  
  it('renders children when no validation is needed', () => {
    // Mock the context
    (useSiteForm as jest.Mock).mockReturnValue({
      state: {
        formData: { name: 'Test Site', slug: 'test-site' },
        errors: {},
        isSubmitting: false,
        isValid: true
      },
      updateField: jest.fn(),
      setErrors: jest.fn(),
      submitForm: jest.fn(),
      resetForm: jest.fn()
    });
    
    render(
      <SiteFormValidator
        onValidate={() => ({})}
        onSuccess={jest.fn()}
      >
        <div data-testid="child-content">Child Content</div>
      </SiteFormValidator>
    );
    
    expect(screen.getByTestId('child-content')).toBeInTheDocument();
    expect(screen.getByText('Child Content')).toBeInTheDocument();
  });
  
  it('validates form data when next button is clicked', () => {
    const mockSetErrors = jest.fn();
    const mockOnSuccess = jest.fn();
    const mockOnValidate = jest.fn().mockReturnValue({
      name: 'Name is required'
    });
    
    // Mock the context
    (useSiteForm as jest.Mock).mockReturnValue({
      state: {
        formData: { name: '', slug: 'test-site' },
        errors: {},
        isSubmitting: false,
        isValid: false
      },
      updateField: jest.fn(),
      setErrors: mockSetErrors,
      submitForm: jest.fn(),
      resetForm: jest.fn()
    });
    
    render(
      <SiteFormValidator
        onValidate={mockOnValidate}
        onSuccess={mockOnSuccess}
      >
        <div data-testid="child-content">Child Content</div>
        <button data-testid="next-button">Next</button>
      </SiteFormValidator>
    );
    
    // Click the next button
    fireEvent.click(screen.getByTestId('next-button'));
    
    // Check that validation was called
    expect(mockOnValidate).toHaveBeenCalled();
    
    // Check that errors were set
    expect(mockSetErrors).toHaveBeenCalledWith({
      name: 'Name is required'
    });
    
    // Check that onSuccess was not called
    expect(mockOnSuccess).not.toHaveBeenCalled();
  });
  
  it('calls onSuccess when validation passes', () => {
    const mockSetErrors = jest.fn();
    const mockOnSuccess = jest.fn();
    const mockOnValidate = jest.fn().mockReturnValue({});
    
    // Mock the context
    (useSiteForm as jest.Mock).mockReturnValue({
      state: {
        formData: { name: 'Test Site', slug: 'test-site' },
        errors: {},
        isSubmitting: false,
        isValid: true
      },
      updateField: jest.fn(),
      setErrors: mockSetErrors,
      submitForm: jest.fn(),
      resetForm: jest.fn()
    });
    
    render(
      <SiteFormValidator
        onValidate={mockOnValidate}
        onSuccess={mockOnSuccess}
      >
        <div data-testid="child-content">Child Content</div>
        <button data-testid="next-button">Next</button>
      </SiteFormValidator>
    );
    
    // Click the next button
    fireEvent.click(screen.getByTestId('next-button'));
    
    // Check that validation was called
    expect(mockOnValidate).toHaveBeenCalled();
    
    // Check that errors were set (should be empty)
    expect(mockSetErrors).toHaveBeenCalledWith({});
    
    // Check that onSuccess was called
    expect(mockOnSuccess).toHaveBeenCalled();
  });
});
