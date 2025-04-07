"use client";

import React from 'react';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, Check, Loader2 } from 'lucide-react';

interface RoleWizardNavigationProps {
  currentStep: number;
  totalSteps: number;
  onBack: () => void;
  onNext: () => void;
  onFinish: () => void;
  isNextDisabled: boolean;
  isSubmitting?: boolean;
}

export function RoleWizardNavigation({
  currentStep,
  totalSteps,
  onBack,
  onNext,
  onFinish,
  isNextDisabled,
  isSubmitting = false
}: RoleWizardNavigationProps) {
  return (
    <div className="flex justify-between">
      <Button
        variant="outline"
        onClick={onBack}
        disabled={currentStep === 1 || isSubmitting}
        className="flex items-center gap-1"
      >
        <ChevronLeft className="h-4 w-4" />
        Back
      </Button>
      
      {currentStep < totalSteps ? (
        <Button
          onClick={onNext}
          disabled={isNextDisabled || isSubmitting}
          className="flex items-center gap-1"
        >
          Next
          <ChevronRight className="h-4 w-4" />
        </Button>
      ) : (
        <Button
          onClick={onFinish}
          disabled={isNextDisabled || isSubmitting}
          className="flex items-center gap-1"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Creating...
            </>
          ) : (
            <>
              Finish
              <Check className="h-4 w-4" />
            </>
          )}
        </Button>
      )}
    </div>
  );
}
