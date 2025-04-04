import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { SiteFormProvider, useSiteForm } from '@/components/admin/sites/context/SiteFormContext';

// Test component that uses the context
const TestComponent = () => {
  const { state, updateField, setErrors, resetForm } = useSiteForm();
  
  return (
    <div>
      <div data-testid="form-data">{JSON.stringify(state.formData)}</div>
      <div data-testid="form-errors">{JSON.stringify(state.errors)}</div>
      <div data-testid="is-submitting">{state.isSubmitting.toString()}</div>
      <div data-testid="is-valid">{state.isValid.toString()}</div>
      
      <button 
        data-testid="update-name-btn" 
        onClick={() => updateField('name', 'Test Site')}
      >
        Update Name
      </button>
      
      <button 
        data-testid="set-errors-btn" 
        onClick={() => setErrors({ name: 'Name is required' })}
      >
        Set Errors
      </button>
      
      <button 
        data-testid="reset-form-btn" 
        onClick={() => resetForm()}
      >
        Reset Form
      </button>
    </div>
  );
};

describe('SiteFormContext', () => {
  it('should throw an error when used outside of provider', () => {
    // Suppress console errors for this test
    const originalConsoleError = console.error;
    console.error = jest.fn();
    
    expect(() => {
      render(<TestComponent />);
    }).toThrow('useSiteForm must be used within a SiteFormProvider');
    
    // Restore console.error
    console.error = originalConsoleError;
  });
  
  it('should provide initial state', () => {
    render(
      <SiteFormProvider>
        <TestComponent />
      </SiteFormProvider>
    );
    
    const formDataElement = screen.getByTestId('form-data');
    expect(formDataElement).toHaveTextContent('"name":""');
    expect(formDataElement).toHaveTextContent('"slug":""');
    expect(formDataElement).toHaveTextContent('"description":""');
    
    expect(screen.getByTestId('form-errors')).toHaveTextContent('{}');
    expect(screen.getByTestId('is-submitting')).toHaveTextContent('false');
    expect(screen.getByTestId('is-valid')).toHaveTextContent('false');
  });
  
  it('should update field values', () => {
    render(
      <SiteFormProvider>
        <TestComponent />
      </SiteFormProvider>
    );
    
    fireEvent.click(screen.getByTestId('update-name-btn'));
    
    expect(screen.getByTestId('form-data')).toHaveTextContent('"name":"Test Site"');
  });
  
  it('should set errors', () => {
    render(
      <SiteFormProvider>
        <TestComponent />
      </SiteFormProvider>
    );
    
    fireEvent.click(screen.getByTestId('set-errors-btn'));
    
    expect(screen.getByTestId('form-errors')).toHaveTextContent('"name":"Name is required"');
    expect(screen.getByTestId('is-valid')).toHaveTextContent('false');
  });
  
  it('should reset the form', () => {
    render(
      <SiteFormProvider>
        <TestComponent />
      </SiteFormProvider>
    );
    
    // First update a field
    fireEvent.click(screen.getByTestId('update-name-btn'));
    expect(screen.getByTestId('form-data')).toHaveTextContent('"name":"Test Site"');
    
    // Then reset the form
    fireEvent.click(screen.getByTestId('reset-form-btn'));
    
    // Check that the form was reset
    expect(screen.getByTestId('form-data')).toHaveTextContent('"name":""');
    expect(screen.getByTestId('form-errors')).toHaveTextContent('{}');
    expect(screen.getByTestId('is-submitting')).toHaveTextContent('false');
    expect(screen.getByTestId('is-valid')).toHaveTextContent('false');
  });
  
  it('should accept initial data', () => {
    render(
      <SiteFormProvider initialData={{ name: 'Initial Site', slug: 'initial-site' }}>
        <TestComponent />
      </SiteFormProvider>
    );
    
    expect(screen.getByTestId('form-data')).toHaveTextContent('"name":"Initial Site"');
    expect(screen.getByTestId('form-data')).toHaveTextContent('"slug":"initial-site"');
  });
});
