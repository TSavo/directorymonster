"use client";

import React from 'react';
import { Button } from '@/components/ui/Button';

interface StepControlsProps {
  currentStep: number;
  totalSteps: number;
  canProceed: boolean;
  canGoBack: boolean;
  canSubmit: boolean;
  isSubmitting: boolean;
  onNext: () => void;
  onPrev: () => void;
  onSubmit: () => void;
}

export function StepControls({
  currentStep,
  totalSteps,
  canProceed,
  canGoBack,
  canSubmit,
  isSubmitting,
  onNext,
  onPrev,
  onSubmit
}: StepControlsProps) {
  const isLastStep = currentStep === totalSteps;

  return (
    <div className="flex justify-between mt-8" data-testid="step-controls">
      <Button
        type="button"
        onClick={onPrev}
        variant="secondary"
        isLoading={isSubmitting}
        disabled={!canGoBack}
        data-testid="prev-step-button"
        className="inline-flex items-center"
      >
        <svg className="-ml-1 mr-2 h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M9.707 14.707a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 1.414L7.414 9H15a1 1 0 110 2H7.414l2.293 2.293a1 1 0 010 1.414z" clipRule="evenodd" />
        </svg>
        Previous
      </Button>

      <div>
        {isLastStep ? (
          <Button
            type="button"
            onClick={onSubmit}
            variant="primary"
            isLoading={isSubmitting}
            disabled={!canSubmit}
            data-testid="submit-button"
            className="inline-flex items-center"
          >
            {!isSubmitting && (
              <>
                Submit
                <svg className="ml-2 -mr-1 h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              </>
            )}
          </Button>
        ) : (
          <Button
            type="button"
            onClick={onNext}
            variant="primary"
            isLoading={isSubmitting}
            disabled={!canProceed}
            data-testid="next-step-button"
            className="inline-flex items-center"
          >
            Next
            <svg className="ml-2 -mr-1 h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L12.586 11H5a1 1 0 110-2h7.586l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </Button>
        )}
      </div>
    </div>
  );
}

export default StepControls;
