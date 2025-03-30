"use client";

import React from 'react';

interface FormProgressProps {
  currentStep: number;
  totalSteps: number;
  stepLabels: string[];
  onStepClick?: (step: number) => void;
}

export function FormProgress({
  currentStep,
  totalSteps,
  stepLabels,
  onStepClick
}: FormProgressProps) {
  return (
    <nav aria-label="Progress" data-testid="form-progress">
      <ol className="flex items-center">
        {Array.from({ length: totalSteps }, (_, i) => i + 1).map((step) => {
          const isActive = step === currentStep;
          const isCompleted = step < currentStep;
          const isClickable = onStepClick && isCompleted;
          
          return (
            <li key={step} className={`relative ${step !== 1 ? 'pl-8' : ''} ${step === totalSteps ? '' : 'pr-8'}`}>
              {step !== 1 && (
                <div className="absolute top-4 left-0 -ml-px mt-0.5 h-0.5 w-8 bg-gray-300" aria-hidden="true"></div>
              )}
              
              <button
                type="button"
                onClick={isClickable ? () => onStepClick(step) : undefined}
                className={`group relative flex items-center justify-center ${isClickable ? 'cursor-pointer' : 'cursor-default'}`}
                aria-current={isActive ? 'step' : undefined}
                data-testid={`step-${step}`}
              >
                <span className="flex items-center" aria-hidden="true">
                  <span
                    className={`flex h-8 w-8 items-center justify-center rounded-full ${
                      isCompleted
                        ? 'bg-blue-600 group-hover:bg-blue-800'
                        : isActive
                        ? 'border-2 border-blue-600 bg-white'
                        : 'border-2 border-gray-300 bg-white'
                    }`}
                  >
                    {isCompleted ? (
                      <svg className="h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    ) : (
                      <span className={`text-sm font-medium ${isActive ? 'text-blue-600' : 'text-gray-500'}`}>
                        {step}
                      </span>
                    )}
                  </span>
                </span>
                <span className={`ml-2 text-sm font-medium ${
                  isActive ? 'text-blue-600' : isCompleted ? 'text-gray-900' : 'text-gray-500'
                }`}>
                  {stepLabels[step - 1]}
                </span>
              </button>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

export default FormProgress;
