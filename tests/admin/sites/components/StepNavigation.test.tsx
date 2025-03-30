import React from 'react';
import { render, screen } from '@testing-library/react';
import { StepNavigation } from '@/components/admin/sites/components/StepNavigation';

// Mock step definitions
const mockSteps = [
  { id: 'basic-info', label: 'Basic Info' },
  { id: 'domains', label: 'Domains' },
  { id: 'theme', label: 'Theme' },
  { id: 'seo', label: 'SEO' }
];

describe('StepNavigation Component - Basic Rendering', () => {
  it('renders all step buttons correctly', () => {
    const mockOnStepChange = jest.fn();
    
    render(
      <StepNavigation 
        steps={mockSteps} 
        currentStep="basic-info" 
        completedSteps={[]} 
        onStepChange={mockOnStepChange} 
      />
    );
    
    // Check if all steps are rendered
    expect(screen.getByTestId('step-button-basic-info')).toBeInTheDocument();
    expect(screen.getByTestId('step-button-domains')).toBeInTheDocument();
    expect(screen.getByTestId('step-button-theme')).toBeInTheDocument();
    expect(screen.getByTestId('step-button-seo')).toBeInTheDocument();
    
    // Check labels are visible
    expect(screen.getByText('Basic Info')).toBeInTheDocument();
    expect(screen.getByText('Domains')).toBeInTheDocument();
    expect(screen.getByText('Theme')).toBeInTheDocument();
    expect(screen.getByText('SEO')).toBeInTheDocument();
  });
  
  it('has appropriate ARIA attributes for accessibility', () => {
    const mockOnStepChange = jest.fn();
    
    render(
      <StepNavigation 
        steps={mockSteps} 
        currentStep="basic-info" 
        completedSteps={[]} 
        onStepChange={mockOnStepChange} 
      />
    );
    
    // Check for aria-label on the navigation element
    const navElement = screen.getByRole('navigation');
    expect(navElement).toHaveAttribute('aria-label', 'Form Steps');
    
    // Check for appropriate roles on step buttons
    const stepButtons = screen.getAllByRole('button');
    expect(stepButtons.length).toBe(4);
  });
});
