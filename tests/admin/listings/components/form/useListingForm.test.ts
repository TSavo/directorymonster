import { renderHook, act } from '@testing-library/react';
import { useListingForm } from '@/components/admin/listings/components/form/useListingForm';
import { ListingStatus, PriceType } from '@/components/admin/listings/types';

describe('useListingForm Hook', () => {
  const mockOnSubmit = jest.fn().mockImplementation(() => Promise.resolve());
  
  beforeEach(() => {
    jest.clearAllMocks();
  });
  
  it('initializes with default values', () => {
    const { result } = renderHook(() => useListingForm({
      onSubmit: mockOnSubmit
    }));
    
    expect(result.current.formData).toEqual({
      title: '',
      description: '',
      status: ListingStatus.DRAFT,
      categoryIds: [],
      media: [],
      customFields: []
    });
    expect(result.current.currentStep).toBe(1);
    expect(result.current.totalSteps).toBe(5);
    expect(result.current.errors).toEqual({});
    expect(result.current.isSubmitting).toBe(false);
    expect(result.current.isValid).toBe(false);
  });
  
  it('initializes with provided initial data', () => {
    const initialData = {
      title: 'Test Listing',
      description: 'Test Description',
      status: ListingStatus.PUBLISHED
    };
    
    const { result } = renderHook(() => useListingForm({
      initialData,
      onSubmit: mockOnSubmit
    }));
    
    expect(result.current.formData.title).toBe('Test Listing');
    expect(result.current.formData.description).toBe('Test Description');
    expect(result.current.formData.status).toBe(ListingStatus.PUBLISHED);
  });
  
  it('updates field values correctly', () => {
    const { result } = renderHook(() => useListingForm({
      onSubmit: mockOnSubmit
    }));
    
    act(() => {
      result.current.updateField('title', 'New Title');
    });
    
    expect(result.current.formData.title).toBe('New Title');
  });
  
  it('updates nested field values correctly', () => {
    const { result } = renderHook(() => useListingForm({
      onSubmit: mockOnSubmit
    }));
    
    act(() => {
      result.current.updateNestedField('price', 'priceType', PriceType.FIXED);
    });
    
    expect(result.current.formData.price?.priceType).toBe(PriceType.FIXED);
  });
  
  it('navigates to next step when current step is valid', () => {
    const { result } = renderHook(() => useListingForm({
      initialData: {
        title: 'Valid Title',
        description: 'This is a valid description that meets the minimum length requirement.'
      },
      onSubmit: mockOnSubmit
    }));
    
    act(() => {
      result.current.nextStep();
    });
    
    expect(result.current.currentStep).toBe(2);
  });
  
  it('does not navigate to next step when current step is invalid', () => {
    const { result } = renderHook(() => useListingForm({
      initialData: {
        title: '', // Invalid: empty title
        description: 'Too short' // Invalid: too short description
      },
      onSubmit: mockOnSubmit
    }));
    
    act(() => {
      result.current.nextStep();
    });
    
    // Should stay on step 1
    expect(result.current.currentStep).toBe(1);
    // Should have validation errors
    expect(result.current.errors.title).toBeDefined();
    expect(result.current.errors.description).toBeDefined();
  });
  
  it('navigates to previous step', () => {
    const { result } = renderHook(() => useListingForm({
      initialData: {
        title: 'Valid Title',
        description: 'This is a valid description that meets the minimum length requirement.'
      },
      onSubmit: mockOnSubmit
    }));
    
    // First go to step 2
    act(() => {
      result.current.nextStep();
    });
    expect(result.current.currentStep).toBe(2);
    
    // Then go back to step 1
    act(() => {
      result.current.prevStep();
    });
    expect(result.current.currentStep).toBe(1);
  });
  
  it('goes to a specific step', () => {
    const { result } = renderHook(() => useListingForm({
      onSubmit: mockOnSubmit
    }));
    
    act(() => {
      result.current.goToStep(3);
    });
    
    expect(result.current.currentStep).toBe(3);
  });
  
  it('handles form submission', async () => {
    const { result } = renderHook(() => useListingForm({
      initialData: {
        title: 'Valid Title',
        description: 'This is a valid description that meets the minimum length requirement.',
        status: ListingStatus.DRAFT,
        categoryIds: ['cat1'],
        media: [{ id: 'img1', url: 'test.jpg', type: 'image', createdAt: '', updatedAt: '' }]
      },
      onSubmit: mockOnSubmit
    }));
    
    await act(async () => {
      await result.current.handleSubmit();
    });
    
    expect(mockOnSubmit).toHaveBeenCalledWith(result.current.formData);
  });
  
  it('validates the form data', () => {
    const { result } = renderHook(() => useListingForm({
      initialData: {
        title: '', // Invalid
        description: 'Too short', // Invalid
        status: ListingStatus.DRAFT,
        categoryIds: [], // Invalid: no categories
        media: [] // Invalid: no media
      },
      onSubmit: mockOnSubmit
    }));
    
    expect(result.current.isValid).toBe(false);
    expect(result.current.errors.title).toBeDefined();
    expect(result.current.errors.description).toBeDefined();
    expect(result.current.errors.categoryIds).toBeDefined();
    expect(result.current.errors.media).toBeDefined();
  });
  
  it('determines if user can proceed to next step', () => {
    const { result } = renderHook(() => useListingForm({
      initialData: {
        title: 'Valid Title',
        description: 'This is a valid description that meets the minimum length requirement.'
      },
      onSubmit: mockOnSubmit
    }));
    
    expect(result.current.canProceed).toBe(true);
    
    // Go to last step
    act(() => {
      result.current.goToStep(5);
    });
    
    // Can't proceed past the last step
    expect(result.current.canProceed).toBe(false);
  });
  
  it('determines if user can go back to previous step', () => {
    const { result } = renderHook(() => useListingForm({
      onSubmit: mockOnSubmit
    }));
    
    // Can't go back from first step
    expect(result.current.canGoBack).toBe(false);
    
    // Go to step 2
    act(() => {
      result.current.goToStep(2);
    });
    
    // Now can go back
    expect(result.current.canGoBack).toBe(true);
  });
  
  it('determines if form can be submitted', () => {
    const validData = {
      title: 'Valid Title',
      description: 'This is a valid description that meets the minimum length requirement.',
      status: ListingStatus.DRAFT,
      categoryIds: ['cat1'],
      media: [{ id: 'img1', url: 'test.jpg', type: 'image', createdAt: '', updatedAt: '' }],
      backlinkInfo: { url: 'https://example.com' }
    };
    
    const { result } = renderHook(() => useListingForm({
      initialData: validData,
      onSubmit: mockOnSubmit
    }));
    
    // Go to last step
    act(() => {
      result.current.goToStep(5);
    });
    
    // Should be able to submit on last step with valid data
    expect(result.current.canSubmit).toBe(true);
    
    // Go back to step 1
    act(() => {
      result.current.goToStep(1);
    });
    
    // Can't submit from step 1
    expect(result.current.canSubmit).toBe(false);
  });
});
