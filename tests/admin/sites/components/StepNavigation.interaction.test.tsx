import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { StepNavigation } from '@/components/admin/sites/components/StepNavigation';

// Mock step definitions
const mockSteps = [
  { id: 'basic_info', label: 'Basic Info' },
  { id: 'domains', label: 'Domains' },
  { id: 'theme', label: 'Theme' },
  { id: 'seo', label: 'SEO' }
];

describe('StepNavigation Component - Interaction', () => {
  // Setup test user for interactions
  const user = userEvent.setup();
  
  it('calls onStepChange when a step button is clicked', async () => {
    const mockOnStepChange = jest.fn();
    
    render(
      <StepNavigation 
        steps={mockSteps} 
        activeStep="basic_info" 
        completedSteps={['domains']} 
        onStepChange={mockOnStepChange} 
      />
    );
    
    // Click on a completed step
    const domainsStepButton = screen.getByTestId('step-button-domains');
    await user.click(domainsStepButton);
    
    // Verify callback was called with correct step ID
    expect(mockOnStepChange).toHaveBeenCalledTimes(1);
    expect(mockOnStepChange).toHaveBeenCalledWith('domains');
  });

  it('prevents clicking steps that are disabled', async () => {
    const mockOnStepChange = jest.fn();
    
    render(
      <StepNavigation 
        steps={mockSteps} 
        activeStep="basic_info" 
        completedSteps={[]} 
        onStepChange={mockOnStepChange}
      />
    );
    
    // Try to click on a disabled step
    const themeStepButton = screen.getByTestId('step-button-theme');
    await user.click(themeStepButton);
    
    // Verify callback was not called
    expect(mockOnStepChange).not.toHaveBeenCalled();
  });

  it('allows navigation to completed steps', async () => {
    const mockOnStepChange = jest.fn();
    
    render(
      <StepNavigation 
        steps={mockSteps} 
        activeStep="domains" 
        completedSteps={['basic_info']} 
        onStepChange={mockOnStepChange} 
      />
    );
    
    // Click on a completed step
    const basicInfoStepButton = screen.getByTestId('step-button-basic_info');
    await user.click(basicInfoStepButton);
    
    // Verify callback was called
    expect(mockOnStepChange).toHaveBeenCalledTimes(1);
    expect(mockOnStepChange).toHaveBeenCalledWith('basic_info');
  });
});
