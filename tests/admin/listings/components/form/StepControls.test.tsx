import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { StepControls } from '@/components/admin/listings/components/form/StepControls';

describe('StepControls Component', () => {
  const defaultProps = {
    currentStep: 2,
    totalSteps: 5,
    canProceed: true,
    canGoBack: true,
    canSubmit: false,
    isSubmitting: false,
    onNext: jest.fn(),
    onPrev: jest.fn(),
    onSubmit: jest.fn()
  };
  
  beforeEach(() => {
    jest.clearAllMocks();
  });
  
  it('renders previous and next buttons on middle steps', () => {
    render(<StepControls {...defaultProps} />);
    
    expect(screen.getByTestId('prev-step-button')).toBeInTheDocument();
    expect(screen.getByTestId('next-step-button')).toBeInTheDocument();
    expect(screen.queryByTestId('submit-button')).not.toBeInTheDocument();
  });
  
  it('renders previous and submit buttons on last step', () => {
    const lastStepProps = {
      ...defaultProps,
      currentStep: 5,
      canSubmit: true
    };
    
    render(<StepControls {...lastStepProps} />);
    
    expect(screen.getByTestId('prev-step-button')).toBeInTheDocument();
    expect(screen.getByTestId('submit-button')).toBeInTheDocument();
    expect(screen.queryByTestId('next-step-button')).not.toBeInTheDocument();
  });
  
  it('disables previous button when canGoBack is false', () => {
    const cannotGoBackProps = {
      ...defaultProps,
      canGoBack: false
    };
    
    render(<StepControls {...cannotGoBackProps} />);
    
    expect(screen.getByTestId('prev-step-button')).toBeDisabled();
  });
  
  it('disables next button when canProceed is false', () => {
    const cannotProceedProps = {
      ...defaultProps,
      canProceed: false
    };
    
    render(<StepControls {...cannotProceedProps} />);
    
    expect(screen.getByTestId('next-step-button')).toBeDisabled();
  });
  
  it('disables submit button when canSubmit is false', () => {
    const cannotSubmitProps = {
      ...defaultProps,
      currentStep: 5,
      canSubmit: false
    };
    
    render(<StepControls {...cannotSubmitProps} />);
    
    expect(screen.getByTestId('submit-button')).toBeDisabled();
  });
  
  it('disables all buttons when isSubmitting is true', () => {
    const submittingProps = {
      ...defaultProps,
      isSubmitting: true
    };
    
    render(<StepControls {...submittingProps} />);
    
    expect(screen.getByTestId('prev-step-button')).toBeDisabled();
    expect(screen.getByTestId('next-step-button')).toBeDisabled();
  });
  
  it('calls onPrev when previous button is clicked', () => {
    render(<StepControls {...defaultProps} />);
    
    fireEvent.click(screen.getByTestId('prev-step-button'));
    
    expect(defaultProps.onPrev).toHaveBeenCalled();
  });
  
  it('calls onNext when next button is clicked', () => {
    render(<StepControls {...defaultProps} />);
    
    fireEvent.click(screen.getByTestId('next-step-button'));
    
    expect(defaultProps.onNext).toHaveBeenCalled();
  });
  
  it('calls onSubmit when submit button is clicked', () => {
    const lastStepProps = {
      ...defaultProps,
      currentStep: 5,
      canSubmit: true
    };
    
    render(<StepControls {...lastStepProps} />);
    
    fireEvent.click(screen.getByTestId('submit-button'));
    
    expect(defaultProps.onSubmit).toHaveBeenCalled();
  });
  
  it('shows loading text on submit button when submitting', () => {
    const submittingProps = {
      ...defaultProps,
      currentStep: 5,
      canSubmit: true,
      isSubmitting: true
    };
    
    render(<StepControls {...submittingProps} />);
    
    expect(screen.getByTestId('submit-button')).toHaveTextContent(/submitting|loading/i);
  });
  
  it('applies correct ARIA attributes for accessibility', () => {
    render(<StepControls {...defaultProps} />);
    
    // Buttons should have appropriate aria attributes
    expect(screen.getByTestId('prev-step-button')).toHaveAttribute('aria-label', 'Go to previous step');
    expect(screen.getByTestId('next-step-button')).toHaveAttribute('aria-label', 'Go to next step');
  });
});
