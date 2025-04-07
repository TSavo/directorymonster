/**
 * @jest-environment jsdom
 */
import React from 'react';
import { render, screen } from '@testing-library/react';
import { RoleWizardSteps } from '../RoleWizardSteps';

describe('RoleWizardSteps', () => {
  it('renders all steps', () => {
    render(<RoleWizardSteps currentStep={1} totalSteps={4} />);
    
    // Check that all step labels are rendered
    expect(screen.getByText('Basic Information')).toBeInTheDocument();
    expect(screen.getByText('Permissions')).toBeInTheDocument();
    expect(screen.getByText('Inheritance')).toBeInTheDocument();
    expect(screen.getByText('Review')).toBeInTheDocument();
    
    // Check that all step descriptions are rendered
    expect(screen.getByText('Name and description')).toBeInTheDocument();
    expect(screen.getByText('Set role permissions')).toBeInTheDocument();
    expect(screen.getByText('Inherit from other roles')).toBeInTheDocument();
    expect(screen.getByText('Finalize role creation')).toBeInTheDocument();
  });

  it('highlights the current step', () => {
    const { rerender } = render(<RoleWizardSteps currentStep={1} totalSteps={4} />);
    
    // First step should have the primary background color
    const firstStepIcon = screen.getAllByRole('presentation')[0];
    expect(firstStepIcon).toHaveClass('bg-primary');
    
    // Other steps should not have the primary background color
    const secondStepIcon = screen.getAllByRole('presentation')[1];
    expect(secondStepIcon).not.toHaveClass('bg-primary');
    
    // Change the current step
    rerender(<RoleWizardSteps currentStep={2} totalSteps={4} />);
    
    // Second step should now have the primary background color
    const updatedSecondStepIcon = screen.getAllByRole('presentation')[1];
    expect(updatedSecondStepIcon).toHaveClass('bg-primary');
  });

  it('marks completed steps', () => {
    render(<RoleWizardSteps currentStep={3} totalSteps={4} />);
    
    // First and second steps should be marked as completed
    const firstStepIcon = screen.getAllByRole('presentation')[0];
    const secondStepIcon = screen.getAllByRole('presentation')[1];
    
    expect(firstStepIcon).toHaveClass('bg-primary/20');
    expect(secondStepIcon).toHaveClass('bg-primary/20');
    
    // Third step should be active, not completed
    const thirdStepIcon = screen.getAllByRole('presentation')[2];
    expect(thirdStepIcon).toHaveClass('bg-primary');
    expect(thirdStepIcon).not.toHaveClass('bg-primary/20');
    
    // Fourth step should be pending
    const fourthStepIcon = screen.getAllByRole('presentation')[3];
    expect(fourthStepIcon).toHaveClass('bg-muted');
  });
});
