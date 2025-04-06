"use client";

import React, { useCallback } from 'react';
import { Listing, ListingFormData } from './types';
import { ListingStatus } from '@/types/listing';
import BasicInfoStep from './components/form/BasicInfoStep';
import CategorySelectionStep from './components/form/CategorySelectionStep';
import MediaUploadStep from './components/form/MediaUploadStep';
import PricingStep from './components/form/PricingStep';
import BacklinkStep from './components/form/BacklinkStep';
import FormProgress from './components/form/FormProgress';
import StepControls from './components/form/StepControls';
import useListingForm from './components/form/useListingForm';

interface ListingFormProps {
  initialData?: Partial<ListingFormData>;
  onSubmit: (data: ListingFormData) => Promise<void>;
  onCancel?: () => void;
  listing?: Listing;
  siteSlug?: string;
}

export function ListingForm({
  initialData,
  onSubmit,
  onCancel,
  listing,
  siteSlug
}: ListingFormProps) {
  // Step labels
  const stepLabels = [
    'Basic Info',
    'Categories',
    'Media',
    'Pricing',
    'Backlink'
  ];

  // Use the form hook
  const {
    formData,
    errors,
    currentStep,
    totalSteps,
    isSubmitting,
    isValid,
    updateField,
    updateNestedField,
    nextStep,
    prevStep,
    goToStep,
    handleSubmit,
    canProceed,
    canGoBack,
    canSubmit
  } = useListingForm({
    initialData,
    onSubmit,
    listing,
    totalSteps: stepLabels.length
  });

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
          <button
            type="button"
            onClick={onCancel}
            disabled={isSubmitting}
            className="inline-flex justify-center py-2 px-4 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            data-testid="cancel-button"
          >
            Cancel
          </button>
        </div>
      )}
    </div>
  );
}

export default ListingForm;
