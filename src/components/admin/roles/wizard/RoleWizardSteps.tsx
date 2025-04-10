"use client";

import React from 'react';
import {
  ClipboardList,
  Shield,
  GitMerge,
  CheckCircle
} from 'lucide-react';

interface RoleWizardStepsProps {
  currentStep: number;
  totalSteps: number;
}

export function RoleWizardSteps({ currentStep, totalSteps }: RoleWizardStepsProps) {
  const steps = [
    {
      label: 'Basic Information',
      description: 'Name and description',
      icon: ClipboardList
    },
    {
      label: 'Permissions',
      description: 'Set role permissions',
      icon: Shield
    },
    {
      label: 'Inheritance',
      description: 'Inherit from other roles',
      icon: GitMerge
    },
    {
      label: 'Review',
      description: 'Finalize role creation',
      icon: CheckCircle
    }
  ];

  return (
    <div className="w-full">
      <div className="flex items-center justify-between">
        {steps.map((step, index) => {
          const stepNumber = index + 1;
          const StepIcon = step.icon;

          // Determine step status
          const isActive = stepNumber === currentStep;
          const isCompleted = stepNumber < currentStep;
          const isPending = stepNumber > currentStep;

          // Set classes based on status
          let stepClass = "flex flex-col items-center relative";
          let iconClass = "w-10 h-10 rounded-full flex items-center justify-center";
          let lineClass = "absolute top-5 h-0.5 w-full left-1/2";

          if (isActive) {
            iconClass += " bg-primary text-primary-foreground";
          } else if (isCompleted) {
            iconClass += " bg-primary/20 text-primary";
          } else {
            iconClass += " bg-muted text-muted-foreground";
          }

          if (isCompleted) {
            lineClass += " bg-primary/20";
          } else {
            lineClass += " bg-muted";
          }

          return (
            <div key={stepNumber} className={stepClass} style={{ width: `${100 / totalSteps}%` }}>
              {/* Connector line */}
              {stepNumber < totalSteps && (
                <div className={lineClass} style={{ width: '100%' }}></div>
              )}

              {/* Step icon */}
              <div className={iconClass} role="presentation">
                <StepIcon className="w-5 h-5" />
              </div>

              {/* Step label */}
              <div className="mt-2 text-center">
                <p className={`text-sm font-medium ${isActive ? 'text-primary' : isPending ? 'text-muted-foreground' : 'text-foreground'}`}>
                  {step.label}
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {step.description}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
