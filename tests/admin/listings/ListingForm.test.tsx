import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { ListingForm } from '@/components/admin/listings/ListingForm';
import { ListingStatus } from '@/components/admin/listings/types';
import * as formHooks from '@/components/admin/listings/components/form/useListingForm';

// Mock the form components
jest.mock('@/components/admin/listings/components/form', () => ({
  BasicInfoStep: ({ formData, errors, updateField }) => (
    <div data-testid="basic-info-step">
      <input 
        data-testid="title-input"
        value={formData.title || ''}
        onChange={(e) => updateField('title', e.target.value)}
      />
      {errors.title && <span data-testid="title-error">{errors.title}</span>}
    </div>
  ),
  CategorySelectionStep: ({ formData }) => (
    <div data-testid="category-selection-step">
      <span data-testid="selected-categories">{formData.categoryIds.length}</span>
    </div>
  ),
  MediaUploadStep: ({ formData }) => (
    <div data-testid="media-upload-step">
      <span data-testid="media-count">{formData.media.length}</span>
    </div>
  ),
  PricingStep: ({ formData }) => (
    <div data-testid="pricing-step">
      <span data-testid="price-type">{formData.price?.priceType || 'none'}</span>
    </div>
  ),
  BacklinkStep: ({ formData }) => (
    <div data-testid="backlink-step">
      <span data-testid="backlink-url">{formData.backlinkInfo?.url || 'none'}</span>
    </div>
  ),
  FormProgress: ({ currentStep, totalSteps, stepLabels }) => (
    <div data-testid="form-progress">
      <span data-testid="current-step">{currentStep}</span>
      <span data-testid="total-steps">{totalSteps}</span>
      <div data-testid="step-labels">
        {stepLabels.map((label, i) => (
          <span key={i} data-testid={`step-label-${i + 1}`}>{label}</span>
        ))}
      </div>
    </div>
  ),
  StepControls: ({ currentStep, totalSteps, onNext, onPrev, onSubmit, isSubmitting }) => (
    <div data-testid="step-controls">
      <button 
        data-testid="prev-button" 
        onClick={onPrev}
        disabled={currentStep === 1 || isSubmitting}
      >
        Previous
      </button>
      {currentStep < totalSteps ? (
        <button 
          data-testid="next-button" 
          onClick={onNext}
          disabled={isSubmitting}
        >
          Next
        </button>
      ) : (
        <button 
          data-testid="submit-button" 
          onClick={onSubmit}
          disabled={isSubmitting}
        >
          {isSubmitting ? 'Submitting...' : 'Submit'}
        </button>
      )}
    </div>
  ),
  useListingForm: jest.requireActual('@/components/admin/listings/components/form/useListingForm').useListingForm
}));

describe('ListingForm Component', () => {
  const mockOnSubmit = jest.fn().mockImplementation(() => Promise.resolve());
  const mockOnCancel = jest.fn();
  
  beforeEach(() => {
    jest.clearAllMocks();
  });
  
  it('renders the form with correct title for new listing', () => {
    render(
      <ListingForm 
        onSubmit={mockOnSubmit}
        onCancel={mockOnCancel}
        siteSlug="test-site"
      />
    );
    
    expect(screen.getByText('Create New Listing')).toBeInTheDocument();
    expect(screen.getByText('Complete the form below to create a new listing.')).toBeInTheDocument();
  });
  
  it('renders the form with correct title for editing existing listing', () => {
    const mockListing = {
      id: '123',
      title: 'Test Listing',
      description: 'Test Description',
      status: ListingStatus.DRAFT,
      categoryIds: ['cat1', 'cat2'],
      media: [],
      createdAt: '2023-01-01',
      updatedAt: '2023-01-02'
    };
    
    render(
      <ListingForm 
        onSubmit={mockOnSubmit}
        onCancel={mockOnCancel}
        listing={mockListing}
        siteSlug="test-site"
      />
    );
    
    expect(screen.getByText('Edit Listing')).toBeInTheDocument();
    expect(screen.getByText('Complete the form below to update your listing.')).toBeInTheDocument();
  });
  
  it('displays the form progress with correct steps', () => {
    render(
      <ListingForm 
        onSubmit={mockOnSubmit}
        onCancel={mockOnCancel}
        siteSlug="test-site"
      />
    );
    
    expect(screen.getByTestId('form-progress')).toBeInTheDocument();
    expect(screen.getByTestId('current-step')).toHaveTextContent('1');
    expect(screen.getByTestId('total-steps')).toHaveTextContent('5');
    
    // Check step labels
    expect(screen.getByTestId('step-label-1')).toHaveTextContent('Basic Info');
    expect(screen.getByTestId('step-label-2')).toHaveTextContent('Categories');
    expect(screen.getByTestId('step-label-3')).toHaveTextContent('Media');
    expect(screen.getByTestId('step-label-4')).toHaveTextContent('Pricing');
    expect(screen.getByTestId('step-label-5')).toHaveTextContent('Backlink');
  });
  
  it('shows the correct step content based on current step', () => {
    render(
      <ListingForm 
        onSubmit={mockOnSubmit}
        onCancel={mockOnCancel}
        siteSlug="test-site"
      />
    );
    
    // First step should be visible (Basic Info)
    expect(screen.getByTestId('basic-info-step')).toBeInTheDocument();
    
    // Other steps should not be visible
    expect(screen.queryByTestId('category-selection-step')).not.toBeInTheDocument();
    expect(screen.queryByTestId('media-upload-step')).not.toBeInTheDocument();
    expect(screen.queryByTestId('pricing-step')).not.toBeInTheDocument();
    expect(screen.queryByTestId('backlink-step')).not.toBeInTheDocument();
  });
  
  it('navigates between steps when clicking next and previous buttons', async () => {
    // Mock the useListingForm hook to allow navigation
    jest.spyOn(formHooks, 'useListingForm').mockImplementation(() => ({
      formData: {
        title: 'Test Title',
        description: 'Test Description',
        status: ListingStatus.DRAFT,
        categoryIds: [],
        media: []
      },
      errors: {},
      currentStep: 1,
      totalSteps: 5,
      isSubmitting: false,
      isValid: true,
      updateField: jest.fn(),
      updateNestedField: jest.fn(),
      nextStep: jest.fn().mockImplementation(function() {
        this.currentStep = Math.min(this.currentStep + 1, this.totalSteps);
        return true;
      }),
      prevStep: jest.fn().mockImplementation(function() {
        this.currentStep = Math.max(this.currentStep - 1, 1);
        return true;
      }),
      goToStep: jest.fn(),
      handleSubmit: jest.fn(),
      canProceed: true,
      canGoBack: true,
      canSubmit: false
    }));
    
    render(
      <ListingForm 
        onSubmit={mockOnSubmit}
        onCancel={mockOnCancel}
        siteSlug="test-site"
      />
    );
    
    // First step should be visible
    expect(screen.getByTestId('basic-info-step')).toBeInTheDocument();
    
    // Click next button
    fireEvent.click(screen.getByTestId('next-button'));
    
    // Wait for the next step to be visible
    await waitFor(() => {
      expect(screen.getByTestId('category-selection-step')).toBeInTheDocument();
    });
    
    // Click previous button
    fireEvent.click(screen.getByTestId('prev-button'));
    
    // Wait for the previous step to be visible
    await waitFor(() => {
      expect(screen.getByTestId('basic-info-step')).toBeInTheDocument();
    });
  });
  
  it('calls onSubmit when submitting the form on the last step', async () => {
    // Mock the useListingForm hook for the last step
    jest.spyOn(formHooks, 'useListingForm').mockImplementation(() => ({
      formData: {
        title: 'Test Title',
        description: 'Test Description',
        status: ListingStatus.DRAFT,
        categoryIds: ['cat1'],
        media: [{ id: 'img1', url: 'test.jpg', type: 'image', createdAt: '', updatedAt: '' }],
        backlinkInfo: { url: 'https://example.com' }
      },
      errors: {},
      currentStep: 5, // Last step
      totalSteps: 5,
      isSubmitting: false,
      isValid: true,
      updateField: jest.fn(),
      updateNestedField: jest.fn(),
      nextStep: jest.fn(),
      prevStep: jest.fn(),
      goToStep: jest.fn(),
      handleSubmit: jest.fn().mockImplementation(() => {
        mockOnSubmit();
        return Promise.resolve();
      }),
      canProceed: true,
      canGoBack: true,
      canSubmit: true
    }));
    
    render(
      <ListingForm 
        onSubmit={mockOnSubmit}
        onCancel={mockOnCancel}
        siteSlug="test-site"
      />
    );
    
    // Last step should be visible
    expect(screen.getByTestId('backlink-step')).toBeInTheDocument();
    
    // Click submit button
    fireEvent.click(screen.getByTestId('submit-button'));
    
    // Check if onSubmit was called
    await waitFor(() => {
      expect(mockOnSubmit).toHaveBeenCalled();
    });
  });
  
  it('disables navigation buttons when submitting', () => {
    // Mock the useListingForm hook with isSubmitting=true
    jest.spyOn(formHooks, 'useListingForm').mockImplementation(() => ({
      formData: {
        title: 'Test Title',
        description: 'Test Description',
        status: ListingStatus.DRAFT,
        categoryIds: ['cat1'],
        media: [{ id: 'img1', url: 'test.jpg', type: 'image', createdAt: '', updatedAt: '' }]
      },
      errors: {},
      currentStep: 3,
      totalSteps: 5,
      isSubmitting: true,
      isValid: true,
      updateField: jest.fn(),
      updateNestedField: jest.fn(),
      nextStep: jest.fn(),
      prevStep: jest.fn(),
      goToStep: jest.fn(),
      handleSubmit: jest.fn(),
      canProceed: true,
      canGoBack: true,
      canSubmit: false
    }));
    
    render(
      <ListingForm 
        onSubmit={mockOnSubmit}
        onCancel={mockOnCancel}
        siteSlug="test-site"
      />
    );
    
    // Navigation buttons should be disabled
    expect(screen.getByTestId('prev-button')).toBeDisabled();
    expect(screen.getByTestId('next-button')).toBeDisabled();
  });
});
