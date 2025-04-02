'use client';

import React from 'react';

export interface Step {
  id: string;
  label: string;
}

export interface StepNavigationProps {
  /**
   * Steps for the form
   */
  steps: Step[];
  /**
   * Currently active step
   */
  activeStep: string;
  /**
   * Steps that have been completed
   */
  completedSteps: string[];
  /**
   * Handler for step change
   */
  onStepChange: (stepId: string) => void;
  /**
   * Is the form in loading state
   */
  isLoading?: boolean;
}

/**
 * StepNavigation - Navigation component for multi-step forms
 *
 * Provides a UI for navigating between form steps
 */
export const StepNavigation: React.FC<StepNavigationProps> = ({
  steps,
  activeStep,
  completedSteps,
  onStepChange,
  isLoading = false
}) => {
  return (
    <nav
      className="mb-6"
      aria-label="Form Steps"
      data-testid="site-form-steps-navigation"
    >
      <ol className="flex flex-wrap border-b border-gray-200">
        {steps.map((step, index) => {
          const isActive = step.id === activeStep;
          const isCompleted = completedSteps.includes(step.id);
          const isDisabled = !isActive && !isCompleted;

          return (
            <li
              key={step.id}
              className={`relative flex-grow px-2 text-center`}
              data-testid={`step-item-${step.id}`}
            >
              <button
                type="button"
                onClick={() => {
                  if (!isDisabled) {
                    onStepChange(step.id);
                  }
                }}
                className={`
                  py-3 w-full text-sm font-medium
                  ${isActive
                    ? 'text-blue-600 border-b-2 border-blue-600'
                    : isCompleted
                      ? 'text-gray-700 hover:text-blue-500'
                      : 'text-gray-400'
                  }
                `}
                disabled={isLoading || isDisabled}
                aria-current={isActive ? 'step' : undefined}
                data-testid={`step-button-${step.id}`}
              >
                <span className="inline-flex items-center justify-center mr-2 w-5 h-5 rounded-full text-xs">
                  {isCompleted ? (
                    <svg className="w-4 h-4 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  ) : (
                    <span className={`${isActive ? 'text-blue-600' : 'text-gray-400'}`}>
                      {index + 1}
                    </span>
                  )}
                </span>
                {step.label}
              </button>
            </li>
          );
        })}
      </ol>
    </nav>
  );
};

export default StepNavigation;