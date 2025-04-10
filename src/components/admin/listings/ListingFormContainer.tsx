"use client";

import React from 'react';
import { Listing, ListingFormData } from './types';
import useListingForm from './components/form/useListingForm';
import { ListingFormPresentation } from './ListingFormPresentation';

export interface ListingFormContainerProps {
  initialData?: Partial<ListingFormData>;
  onSubmit: (data: ListingFormData) => Promise<void>;
  onCancel?: () => void;
  listing?: Listing;
  siteSlug?: string;
}

export function ListingFormContainer({
  initialData,
  onSubmit,
  onCancel,
  listing,
  siteSlug
}: ListingFormContainerProps) {
  // Step labels
  const stepLabels = [
    'Basic Info',
    'Categories',
    'Media',
    'Pricing',
    'Backlink'
  ];

  // Use the form hook
  const listingFormHook = useListingForm({
    initialData,
    onSubmit,
    listing,
    totalSteps: stepLabels.length
  });

  return (
    <ListingFormPresentation
      // Form data and state
      formData={listingFormHook.formData}
      errors={listingFormHook.errors}
      currentStep={listingFormHook.currentStep}
      totalSteps={listingFormHook.totalSteps}
      isSubmitting={listingFormHook.isSubmitting}
      isValid={listingFormHook.isValid}
      
      // Step labels
      stepLabels={stepLabels}
      
      // Handlers
      updateField={listingFormHook.updateField}
      updateNestedField={listingFormHook.updateNestedField}
      nextStep={listingFormHook.nextStep}
      prevStep={listingFormHook.prevStep}
      goToStep={listingFormHook.goToStep}
      handleSubmit={listingFormHook.handleSubmit}
      
      // Navigation state
      canProceed={listingFormHook.canProceed}
      canGoBack={listingFormHook.canGoBack}
      canSubmit={listingFormHook.canSubmit}
      
      // Additional props
      listing={listing}
      siteSlug={siteSlug}
      onCancel={onCancel}
    />
  );
}

export default ListingFormContainer;
