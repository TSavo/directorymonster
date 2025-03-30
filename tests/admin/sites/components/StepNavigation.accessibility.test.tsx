import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe, toHaveNoViolations } from 'jest-axe';
import { StepNavigation } from '@/components/admin/sites/components/StepNavigation';

// Add jest-axe matcher
expect.extend(toHaveNoViolations);

// Mock step definitions
const mockSteps = [
  { id: 'basic-info', label: 'Basic Info' },
  { id: 'domains', label: 'Domains' },
  { id: 'theme', label: 'Theme' },
  { id: 'seo', label: 'SEO' }
];

describe('StepNavigation Component - Accessibility', () => {
  it('has no accessibility violations', async () => {
    const mockOnStepChange = jest.fn();
    const { container } = render(
      <StepNavigation 
        steps={mockSteps} 
        currentStep="basic-info" 
        completedSteps={['domains']} 
        onStepChange={mockOnStepChange} 
      />
    );
    
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('uses correct ARIA attributes for current step', () => {
    const mockOnStepChange = jest.fn();
    
    render(
      <StepNavigation 
        steps={mockSteps} 
        currentStep="domains" 
        completedSteps={['basic-info']} 
        onStepChange={mockOnStepChange} 
      />
    );
    
    // Current step should have appropriate ARIA attributes
    const currentStepButton = screen.getByTestId('step-button-domains');
    expect(currentStepButton).toHaveAttribute('aria-current', 'step');
  });

  it('provides keyboard navigation support', async () => {
    const user = userEvent.setup();
    const mockOnStepChange = jest.fn();
    
    render(
      <StepNavigation 
        steps={mockSteps} 
        currentStep="basic-info" 
        completedSteps={[]} 
        onStepChange={mockOnStepChange} 
      />
    );
    
    // Tab to the first step button
    await user.tab();
    expect(screen.getByTestId('step-button-basic-info')).toHaveFocus();
    
    // Tab to the next step button
    await user.tab();
    expect(screen.getByTestId('step-button-domains')).toHaveFocus();
    
    // Press Enter to select
    await user.keyboard('{Enter}');
    expect(mockOnStepChange).toHaveBeenCalledWith('domains');
  });

  it('indicates completed steps for screen readers', () => {
    const mockOnStepChange = jest.fn();
    
    render(
      <StepNavigation 
        steps={mockSteps} 
        currentStep="theme" 
        completedSteps={['basic-info', 'domains']} 
        onStepChange={mockOnStepChange} 
      />
    );
    
    // Completed steps should have appropriate ARIA attributes
    const completedStep = screen.getByTestId('step-button-basic-info');
    expect(completedStep).toHaveAttribute('aria-label', expect.stringContaining('completed'));
  });
});
