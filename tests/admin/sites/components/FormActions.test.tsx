import React from 'react';
import { render, screen } from '@testing-library/react';
import { FormActions } from '@/components/admin/sites/components/FormActions';

describe('FormActions Component - Basic Rendering', () => {
  it('renders next and back buttons correctly', () => {
    const mockHandleNext = jest.fn();
    const mockHandleBack = jest.fn();
    
    render(
      <FormActions 
        currentStep={1} 
        totalSteps={4} 
        handleNext={mockHandleNext} 
        handleBack={mockHandleBack} 
        isLastStep={false}
        isFirstStep={false}
        isSubmitting={false}
      />
    );
    
    // Check if both buttons are rendered
    expect(screen.getByTestId('form-back-button')).toBeInTheDocument();
    expect(screen.getByTestId('form-next-button')).toBeInTheDocument();
    
    // Next button should say "Next" not "Submit"
    expect(screen.getByTestId('form-next-button')).toHaveTextContent('Next');
  });

  it('renders submit button on last step', () => {
    const mockHandleNext = jest.fn();
    const mockHandleBack = jest.fn();
    
    render(
      <FormActions 
        currentStep={4} 
        totalSteps={4} 
        handleNext={mockHandleNext} 
        handleBack={mockHandleBack} 
        isLastStep={true}
        isFirstStep={false}
        isSubmitting={false}
      />
    );
    
    // Check if both buttons are rendered
    expect(screen.getByTestId('form-back-button')).toBeInTheDocument();
    expect(screen.getByTestId('form-next-button')).toBeInTheDocument();
    
    // Next button should say "Submit" on last step
    expect(screen.getByTestId('form-next-button')).toHaveTextContent('Submit');
  });

  it('hides back button on first step', () => {
    const mockHandleNext = jest.fn();
    const mockHandleBack = jest.fn();
    
    render(
      <FormActions 
        currentStep={1} 
        totalSteps={4} 
        handleNext={mockHandleNext} 
        handleBack={mockHandleBack} 
        isLastStep={false}
        isFirstStep={true}
        isSubmitting={false}
      />
    );
    
    // Back button should not be visible
    expect(screen.queryByTestId('form-back-button')).not.toBeInTheDocument();
    
    // Next button should be visible
    expect(screen.getByTestId('form-next-button')).toBeInTheDocument();
  });

  it('shows loading state when submitting', () => {
    const mockHandleNext = jest.fn();
    const mockHandleBack = jest.fn();
    
    render(
      <FormActions 
        currentStep={4} 
        totalSteps={4} 
        handleNext={mockHandleNext} 
        handleBack={mockHandleBack} 
        isLastStep={true}
        isFirstStep={false}
        isSubmitting={true}
      />
    );
    
    // Next button should be disabled when submitting
    const submitButton = screen.getByTestId('form-next-button');
    expect(submitButton).toBeDisabled();
    
    // Should show loading indicator/text
    expect(submitButton).toHaveTextContent(/submitting|loading/i);
  });
});
