import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { FormProgress } from '@/components/admin/listings/components/form/FormProgress';

describe('FormProgress Component', () => {
  const defaultProps = {
    currentStep: 2,
    totalSteps: 5,
    stepLabels: ['Step 1', 'Step 2', 'Step 3', 'Step 4', 'Step 5'],
    onStepClick: jest.fn()
  };
  
  beforeEach(() => {
    jest.clearAllMocks();
  });
  
  it('renders all steps with correct labels', () => {
    render(<FormProgress {...defaultProps} />);
    
    // All step labels should be rendered
    defaultProps.stepLabels.forEach((label, index) => {
      expect(screen.getByText(label)).toBeInTheDocument();
    });
  });
  
  it('highlights the current step', () => {
    render(<FormProgress {...defaultProps} />);
    
    // Current step (2) should have the active class
    const steps = screen.getAllByRole('listitem');
    expect(steps[1]).toHaveClass('bg-blue-600'); // Current step (index 1 = step 2)
    expect(steps[0]).not.toHaveClass('bg-blue-600'); // Previous step
    expect(steps[2]).not.toHaveClass('bg-blue-600'); // Next step
  });
  
  it('marks completed steps differently', () => {
    render(<FormProgress {...defaultProps} />);
    
    // Step 1 should be marked as completed
    const steps = screen.getAllByRole('listitem');
    expect(steps[0]).toHaveClass('bg-blue-400'); // Completed step
  });
  
  it('calls onStepClick when clicking on a completed step', () => {
    render(<FormProgress {...defaultProps} />);
    
    // Click on step 1 (completed)
    fireEvent.click(screen.getByText('Step 1'));
    
    // onStepClick should be called with step 1
    expect(defaultProps.onStepClick).toHaveBeenCalledWith(1);
  });
  
  it('does not call onStepClick when clicking on the current step', () => {
    render(<FormProgress {...defaultProps} />);
    
    // Click on step 2 (current)
    fireEvent.click(screen.getByText('Step 2'));
    
    // onStepClick should not be called
    expect(defaultProps.onStepClick).not.toHaveBeenCalled();
  });
  
  it('does not call onStepClick when clicking on a future step', () => {
    render(<FormProgress {...defaultProps} />);
    
    // Click on step 3 (future)
    fireEvent.click(screen.getByText('Step 3'));
    
    // onStepClick should not be called
    expect(defaultProps.onStepClick).not.toHaveBeenCalled();
  });
  
  it('renders correctly with no onStepClick handler', () => {
    const propsWithoutClick = {
      ...defaultProps,
      onStepClick: undefined
    };
    
    render(<FormProgress {...propsWithoutClick} />);
    
    // Should render without errors
    expect(screen.getByText('Step 1')).toBeInTheDocument();
    
    // Click on step 1 (should not throw error)
    fireEvent.click(screen.getByText('Step 1'));
  });
  
  it('applies correct ARIA attributes for accessibility', () => {
    render(<FormProgress {...defaultProps} />);
    
    // Navigation should have aria-label
    expect(screen.getByRole('navigation')).toHaveAttribute('aria-label', 'Progress');
    
    // Current step should have aria-current="step"
    const steps = screen.getAllByRole('listitem');
    expect(steps[1]).toHaveAttribute('aria-current', 'step');
    
    // Other steps should not have aria-current
    expect(steps[0]).not.toHaveAttribute('aria-current');
    expect(steps[2]).not.toHaveAttribute('aria-current');
  });
  
  it('renders with custom class names if provided', () => {
    const propsWithClasses = {
      ...defaultProps,
      className: 'custom-class'
    };
    
    render(<FormProgress {...propsWithClasses} />);
    
    // Should have the custom class
    expect(screen.getByRole('navigation')).toHaveClass('custom-class');
  });
});
