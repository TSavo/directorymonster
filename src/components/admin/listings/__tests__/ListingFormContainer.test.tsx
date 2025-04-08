import React from 'react';
import { render } from '@testing-library/react';
import { ListingFormContainer } from '../ListingFormContainer';
import useListingForm from '../components/form/useListingForm';
import { ListingFormPresentation } from '../ListingFormPresentation';
import { ListingStatus } from '@/types/listing';

// Mock the dependencies
jest.mock('../components/form/useListingForm');
jest.mock('../ListingFormPresentation', () => ({
  ListingFormPresentation: jest.fn(() => <div data-testid="mock-presentation" />)
}));

describe('ListingFormContainer', () => {
  const mockFormData = {
    title: 'Test Listing',
    description: 'Test Description',
    status: ListingStatus.DRAFT,
    categoryIds: [],
    media: []
  };

  const mockHookReturn = {
    formData: mockFormData,
    errors: {},
    currentStep: 1,
    totalSteps: 5,
    isSubmitting: false,
    isValid: true,
    updateField: jest.fn(),
    updateNestedField: jest.fn(),
    nextStep: jest.fn(),
    prevStep: jest.fn(),
    goToStep: jest.fn(),
    handleSubmit: jest.fn(),
    resetForm: jest.fn(),
    validateCurrentStep: jest.fn(),
    canSubmit: false,
    canProceed: true,
    canGoBack: false,
    touched: {},
    isDirty: false
  };

  const mockProps = {
    initialData: { title: 'Initial Title' },
    onSubmit: jest.fn(),
    onCancel: jest.fn(),
    listing: { id: '1', title: 'Test Listing' },
    siteSlug: 'test-site'
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (useListingForm as jest.Mock).mockReturnValue(mockHookReturn);
  });

  it('calls useListingForm with the correct props', () => {
    render(<ListingFormContainer {...mockProps} />);
    expect(useListingForm).toHaveBeenCalledWith({
      initialData: mockProps.initialData,
      onSubmit: mockProps.onSubmit,
      listing: mockProps.listing,
      totalSteps: 5 // Length of stepLabels array
    });
  });

  it('renders ListingFormPresentation with the correct props', () => {
    render(<ListingFormContainer {...mockProps} />);
    expect(ListingFormPresentation).toHaveBeenCalledWith(
      expect.objectContaining({
        // Form data and state
        formData: mockHookReturn.formData,
        errors: mockHookReturn.errors,
        currentStep: mockHookReturn.currentStep,
        totalSteps: mockHookReturn.totalSteps,
        isSubmitting: mockHookReturn.isSubmitting,
        isValid: mockHookReturn.isValid,
        
        // Step labels
        stepLabels: ['Basic Info', 'Categories', 'Media', 'Pricing', 'Backlink'],
        
        // Handlers
        updateField: mockHookReturn.updateField,
        updateNestedField: mockHookReturn.updateNestedField,
        nextStep: mockHookReturn.nextStep,
        prevStep: mockHookReturn.prevStep,
        goToStep: mockHookReturn.goToStep,
        handleSubmit: mockHookReturn.handleSubmit,
        
        // Navigation state
        canProceed: mockHookReturn.canProceed,
        canGoBack: mockHookReturn.canGoBack,
        canSubmit: mockHookReturn.canSubmit,
        
        // Additional props
        listing: mockProps.listing,
        siteSlug: mockProps.siteSlug,
        onCancel: mockProps.onCancel
      }),
      expect.anything()
    );
  });
});
