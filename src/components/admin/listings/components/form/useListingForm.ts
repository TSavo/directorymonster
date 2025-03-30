"use client";

import { useState, useCallback, useEffect } from 'react';
import { 
  ListingFormData, 
  ListingFormErrors, 
  ListingFormState,
  ListingStatus,
  Listing
} from '../../types';
import { 
  validateListingForm,
  validateStep,
  isStepValid,
  isFormValid
} from './listingFormValidation';

interface UseListingFormProps {
  initialData?: Partial<ListingFormData>;
  onSubmit: (data: ListingFormData) => Promise<void>;
  listing?: Listing;
  totalSteps?: number;
}

const DEFAULT_FORM_DATA: ListingFormData = {
  title: '',
  description: '',
  status: ListingStatus.DRAFT,
  categoryIds: [],
  media: [],
  customFields: []
};

/**
 * Custom hook for managing multi-step listing form state
 */
export const useListingForm = ({
  initialData,
  onSubmit,
  listing,
  totalSteps = 5
}: UseListingFormProps) => {
  const [formState, setFormState] = useState<ListingFormState>({
    formData: { ...DEFAULT_FORM_DATA, ...initialData },
    currentStep: 1,
    totalSteps,
    errors: {},
    touched: {},
    isSubmitting: false,
    isValid: false,
    isDirty: false
  });

  // Initialize form with listing data if provided
  useEffect(() => {
    if (listing) {
      const formData: ListingFormData = {
        title: listing.title,
        description: listing.description,
        status: listing.status,
        categoryIds: listing.categoryIds,
        media: listing.media,
        price: listing.price,
        contactInfo: listing.contactInfo,
        seoData: listing.seoData,
        backlinkInfo: listing.backlinkInfo,
        customFields: listing.customFields,
        featured: listing.featured,
        featuredUntil: listing.featuredUntil
      };
      
      setFormState(prev => ({
        ...prev,
        formData,
        isValid: isFormValid(formData),
        isDirty: false
      }));
    }
  }, [listing]);

  /**
   * Update a specific field in the form
   */
  const updateField = useCallback(<K extends keyof ListingFormData>(
    field: K,
    value: ListingFormData[K]
  ) => {
    setFormState(prev => {
      const newFormData = {
        ...prev.formData,
        [field]: value
      };
      
      const touched = {
        ...prev.touched,
        [field]: true
      };
      
      // Only validate touched fields
      const errorsToCheck = Object.keys(touched).reduce((acc, key) => {
        const k = key as keyof ListingFormData;
        acc[k] = newFormData[k];
        return acc;
      }, {} as Partial<ListingFormData>);
      
      const errors = validateStep(newFormData, prev.currentStep);
      
      return {
        ...prev,
        formData: newFormData,
        errors,
        touched,
        isValid: isStepValid(newFormData, prev.currentStep),
        isDirty: true
      };
    });
  }, []);

  /**
   * Update a nested field in the form
   */
  const updateNestedField = useCallback(<
    K extends keyof ListingFormData,
    NK extends keyof NonNullable<ListingFormData[K]>
  >(
    parentField: K,
    nestedField: NK,
    value: any
  ) => {
    setFormState(prev => {
      const parent = prev.formData[parentField] || {};
      const newParent = {
        ...parent,
        [nestedField]: value
      };
      
      const newFormData = {
        ...prev.formData,
        [parentField]: newParent
      };
      
      const touched = {
        ...prev.touched,
        [`${String(parentField)}.${String(nestedField)}`]: true
      };
      
      const errors = validateStep(newFormData, prev.currentStep);
      
      return {
        ...prev,
        formData: newFormData,
        errors,
        touched,
        isValid: isStepValid(newFormData, prev.currentStep),
        isDirty: true
      };
    });
  }, []);

  /**
   * Move to the next step if valid
   */
  const nextStep = useCallback(() => {
    setFormState(prev => {
      if (prev.currentStep >= prev.totalSteps) {
        return prev;
      }
      
      const isCurrentStepValid = isStepValid(prev.formData, prev.currentStep);
      if (!isCurrentStepValid) {
        return {
          ...prev,
          errors: validateStep(prev.formData, prev.currentStep)
        };
      }
      
      const nextStepNumber = prev.currentStep + 1;
      
      return {
        ...prev,
        currentStep: nextStepNumber,
        errors: validateStep(prev.formData, nextStepNumber),
        isValid: isStepValid(prev.formData, nextStepNumber)
      };
    });
  }, []);

  /**
   * Move to the previous step
   */
  const prevStep = useCallback(() => {
    setFormState(prev => {
      if (prev.currentStep <= 1) {
        return prev;
      }
      
      const prevStepNumber = prev.currentStep - 1;
      
      return {
        ...prev,
        currentStep: prevStepNumber,
        errors: validateStep(prev.formData, prevStepNumber),
        isValid: isStepValid(prev.formData, prevStepNumber)
      };
    });
  }, []);

  /**
   * Go to a specific step
   */
  const goToStep = useCallback((step: number) => {
    setFormState(prev => {
      if (step < 1 || step > prev.totalSteps) {
        return prev;
      }
      
      return {
        ...prev,
        currentStep: step,
        errors: validateStep(prev.formData, step),
        isValid: isStepValid(prev.formData, step)
      };
    });
  }, []);

  /**
   * Submit the form if all steps are valid
   */
  const handleSubmit = useCallback(async () => {
    setFormState(prev => {
      const allErrors = validateListingForm(prev.formData);
      const formIsValid = Object.keys(allErrors).length === 0;
      
      if (!formIsValid) {
        // Find the first step with errors and go to it
        for (let step = 1; step <= prev.totalSteps; step++) {
          const stepErrors = validateStep(prev.formData, step);
          if (Object.keys(stepErrors).length > 0) {
            return {
              ...prev,
              currentStep: step,
              errors: stepErrors,
              isValid: false
            };
          }
        }
      }
      
      return {
        ...prev,
        isSubmitting: true,
        errors: allErrors,
        isValid: formIsValid
      };
    });
    
    try {
      // Only submit if the form is valid
      if (isFormValid(formState.formData)) {
        await onSubmit(formState.formData);
        
        // Reset form after successful submission
        setFormState(prev => ({
          ...prev,
          isSubmitting: false,
          isDirty: false
        }));
      } else {
        setFormState(prev => ({
          ...prev,
          isSubmitting: false
        }));
      }
    } catch (error) {
      console.error('Form submission error:', error);
      
      setFormState(prev => ({
        ...prev,
        isSubmitting: false
      }));
    }
  }, [formState.formData, onSubmit]);

  /**
   * Reset the form to initial values
   */
  const resetForm = useCallback(() => {
    setFormState({
      formData: { ...DEFAULT_FORM_DATA, ...initialData },
      currentStep: 1,
      totalSteps,
      errors: {},
      touched: {},
      isSubmitting: false,
      isValid: false,
      isDirty: false
    });
  }, [initialData, totalSteps]);

  /**
   * Validate the current step
   */
  const validateCurrentStep = useCallback(() => {
    setFormState(prev => {
      const errors = validateStep(prev.formData, prev.currentStep);
      return {
        ...prev,
        errors,
        isValid: Object.keys(errors).length === 0
      };
    });
  }, []);

  /**
   * Check if the form can be submitted
   */
  const canSubmit = isFormValid(formState.formData) && !formState.isSubmitting;

  /**
   * Check if can proceed to next step
   */
  const canProceed = formState.isValid && formState.currentStep < formState.totalSteps;

  /**
   * Check if can go back to previous step
   */
  const canGoBack = formState.currentStep > 1;

  return {
    ...formState,
    updateField,
    updateNestedField,
    nextStep,
    prevStep,
    goToStep,
    handleSubmit,
    resetForm,
    validateCurrentStep,
    canSubmit,
    canProceed,
    canGoBack
  };
};

export default useListingForm;
