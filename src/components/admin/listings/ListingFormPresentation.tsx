"use client";

import React, { useCallback } from 'react';
import { ListingFormData } from './types';
import BasicInfoStep from './components/form/BasicInfoStep';
import CategorySelectionStep from './components/form/CategorySelectionStep';
import MediaUploadStep from './components/form/MediaUploadStep';
import PricingStep from './components/form/PricingStep';
import BacklinkStep from './components/form/BacklinkStep';
import FormProgress from './components/form/FormProgress';
import StepControls from './components/form/StepControls';
import { Button } from '@/components/ui/Button';

export interface ListingFormPresentationProps {
  // Form data and state
  formData: ListingFormData;
  errors: Record<string, any>;
  currentStep: number;
  totalSteps: number;
  isSubmitting: boolean;
  isValid: boolean;
  
  // Step labels
  stepLabels: string[];
  
  // Handlers
  updateField: <K extends keyof ListingFormData>(field: K, value: ListingFormData[K]) => void;
  updateNestedField: <K extends keyof ListingFormData, NK extends keyof NonNullable<ListingFormData[K]>>(
    parentField: K,
    nestedField: NK,
    value: any
  ) => void;
  nextStep: () => void;
  prevStep: () => void;
  goToStep: (step: number) => void;
  handleSubmit: () => Promise<void>;
  
  // Navigation state
  canProceed: boolean;
  canGoBack: boolean;
  canSubmit: boolean;
  
  // Additional props
  listing?: any;
  siteSlug?: string;
  onCancel?: () => void;
}

export function ListingFormPresentation({
  // Form data and state
  formData,
  errors,
  currentStep,
  totalSteps,
  isSubmitting,
  isValid,
  
  // Step labels
  stepLabels,
  
  // Handlers
  updateField,
  updateNestedField,
  nextStep,
  prevStep,
  goToStep,
  handleSubmit,
  
  // Navigation state
  canProceed,
  canGoBack,
  canSubmit,
  
  // Additional props
  listing,
  siteSlug,
  onCancel
}: ListingFormPresentationProps) {
  // Handle step click in the progress bar
  const handleStepClick = useCallback(
    (step: number) => {
      if (step < currentStep) {
        goToStep(step);
      }
    },
    [currentStep, goToStep]
  );

  // Render the current step
  const renderStep = useCallback(() => {
    switch (currentStep) {
      case 1:
        return (
          <BasicInfoStep
            formData={formData}
            errors={errors}
            updateField={updateField}
            isSubmitting={isSubmitting}
          />
        );
      case 2:
        return (
          <CategorySelectionStep
            formData={formData}
            errors={errors}
            updateField={updateField}
            isSubmitting={isSubmitting}
            siteSlug={siteSlug}
          />
        );
      case 3:
        return (
          <MediaUploadStep
            formData={formData}
            errors={errors}
            updateField={updateField}
            isSubmitting={isSubmitting}
          />
        );
      case 4:
        return (
          <PricingStep
            formData={formData}
            errors={errors}
            updateField={updateField}
            updateNestedField={updateNestedField}
            isSubmitting={isSubmitting}
          />
        );
      case 5:
        return (
          <BacklinkStep
            formData={formData}
            errors={errors}
            updateNestedField={updateNestedField}
            isSubmitting={isSubmitting}
          />
        );
      default:
        return <div>Unknown step</div>;
    }
  }, [
    currentStep,
    errors,
    formData,
    isSubmitting,
    siteSlug,
    updateField,
    updateNestedField
  ]);

  return (
    <div className="bg-white shadow overflow-hidden sm:rounded-lg" data-testid="listing-form-container">
      <div className="px-4 py-5 border-b border-gray-200 sm:px-6">
        <h3 className="text-lg leading-6 font-medium text-gray-900">
          {listing ? 'Edit Listing' : 'Create New Listing'}
        </h3>
        <p className="mt-1 text-sm text-gray-500">
          Complete the form below to {listing ? 'update your' : 'create a new'} listing.
        </p>
      </div>

      <div className="px-4 py-5 sm:px-6">
        <FormProgress
          currentStep={currentStep}
          totalSteps={totalSteps}
          stepLabels={stepLabels}
          onStepClick={handleStepClick}
        />
      </div>

      <div className="px-4 py-5 sm:p-6">
        {renderStep()}

        <StepControls
          currentStep={currentStep}
          totalSteps={totalSteps}
          canProceed={canProceed}
          canGoBack={canGoBack}
          canSubmit={canSubmit}
          isSubmitting={isSubmitting}
          onNext={nextStep}
          onPrev={prevStep}
          onSubmit={handleSubmit}
        />
      </div>

      {onCancel && (
        <div className="px-4 py-3 bg-gray-50 text-right sm:px-6">
          <Button
            type="button"
            onClick={onCancel}
            variant="secondary"
            isLoading={isSubmitting}
            data-testid="cancel-button"
          >
            Cancel
          </Button>
        </div>
      )}
    </div>
  );
}

export default ListingFormPresentation;
