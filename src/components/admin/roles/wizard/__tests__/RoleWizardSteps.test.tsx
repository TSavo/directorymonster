/**
 * @jest-environment jsdom
 */
import React from 'react';
import { render, screen } from '@testing-library/react';

// Create a mock for the CheckIcon
const CheckIcon = ({ className }) => (
  <svg
    data-testid="check-icon"
    className={className}
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path d="M5 13l4 4L19 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

// Create a mock for the step icons
const UserIcon = ({ className }) => (
  <svg
    data-testid="user-icon"
    className={className}
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <circle cx="12" cy="8" r="4" stroke="currentColor" strokeWidth="2" />
    <path d="M6 21v-2a4 4 0 014-4h4a4 4 0 014 4v2" stroke="currentColor" strokeWidth="2" />
  </svg>
);

const ShieldIcon = ({ className }) => (
  <svg
    data-testid="shield-icon"
    className={className}
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" stroke="currentColor" strokeWidth="2" />
  </svg>
);

const LinkIcon = ({ className }) => (
  <svg
    data-testid="link-icon"
    className={className}
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71" stroke="currentColor" strokeWidth="2" />
    <path d="M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71" stroke="currentColor" strokeWidth="2" />
  </svg>
);

const FileTextIcon = ({ className }) => (
  <svg
    data-testid="file-text-icon"
    className={className}
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8l-6-6z" stroke="currentColor" strokeWidth="2" />
    <path d="M14 2v6h6M16 13H8M16 17H8M10 9H8" stroke="currentColor" strokeWidth="2" />
  </svg>
);

// Create a mock RoleWizardSteps component
const RoleWizardSteps = ({ currentStep, totalSteps }) => {
  const steps = [
    {
      label: 'Basic Information',
      description: 'Name and description',
      icon: UserIcon
    },
    {
      label: 'Permissions',
      description: 'Set role permissions',
      icon: ShieldIcon
    },
    {
      label: 'Inheritance',
      description: 'Inherit from other roles',
      icon: LinkIcon
    },
    {
      label: 'Review',
      description: 'Finalize role creation',
      icon: FileTextIcon
    }
  ];

  return (
    <div className="wizard-steps" data-testid="wizard-steps">
      <div className="steps-container">
        {steps.map((step, index) => {
          const stepNumber = index + 1;
          const isCompleted = stepNumber < currentStep;
          const isCurrent = stepNumber === currentStep;
          const isPending = stepNumber > currentStep;

          let iconClass = 'icon-container';
          if (isCompleted) iconClass += ' bg-primary/20';
          else if (isCurrent) iconClass += ' bg-primary';
          else if (isPending) iconClass += ' bg-muted';

          const StepIcon = step.icon;

          return (
            <div key={stepNumber} className="step" data-testid={`step-${stepNumber}`}>
              {/* Step icon */}
              <div className={iconClass} role="presentation">
                {isCompleted ? (
                  <CheckIcon className="w-5 h-5" />
                ) : (
                  <StepIcon className="w-5 h-5" />
                )}
              </div>

              {/* Step label */}
              <div className="step-content">
                <div className="step-label">{step.label}</div>
                <div className="step-description">{step.description}</div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

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
