import React from 'react';
import { render } from '@testing-library/react';
import { CategoryFormContainer } from '../CategoryFormContainer';
import { useCategoryForm } from '../components/form/useCategoryForm';
import { CategoryFormPresentation } from '../CategoryFormPresentation';

// Mock the dependencies
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn()
  })
}));

jest.mock('../components/form/useCategoryForm');
jest.mock('../CategoryFormPresentation', () => ({
  CategoryFormPresentation: jest.fn(() => <div data-testid="mock-presentation" />)
}));

describe('CategoryFormContainer', () => {
  const mockFormData = {
    name: 'Test Category',
    slug: 'test-category',
    metaDescription: 'This is a test category',
    parentId: '',
    order: 0
  };

  const mockParentCategories = [
    { id: 'parent-1', name: 'Parent Category 1' },
    { id: 'parent-2', name: 'Parent Category 2' }
  ];

  const mockHookReturn = {
    formData: mockFormData,
    touched: { name: true, slug: true },
    validationErrors: {},
    isLoading: false,
    error: null,
    success: false,
    isEditMode: false,
    parentCategories: mockParentCategories,
    loadingParents: false,
    handleChange: jest.fn(),
    handleBlur: jest.fn(),
    handleSubmit: jest.fn(),
    validateForm: jest.fn()
  };

  const mockProps = {
    siteSlug: 'test-site',
    categoryId: 'category-1',
    initialData: { name: 'Initial Name' },
    onCancel: jest.fn(),
    onSaved: jest.fn()
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (useCategoryForm as jest.Mock).mockReturnValue(mockHookReturn);
  });

  it('calls useCategoryForm with the correct props', () => {
    render(<CategoryFormContainer {...mockProps} />);
    expect(useCategoryForm).toHaveBeenCalledWith(
      mockProps.siteSlug,
      mockProps.categoryId,
      mockProps.initialData,
      mockProps.onSaved
    );
  });

  it('renders CategoryFormPresentation with the correct props', () => {
    render(<CategoryFormContainer {...mockProps} />);
    expect(CategoryFormPresentation).toHaveBeenCalledWith(
      expect.objectContaining({
        formData: mockHookReturn.formData,
        touched: mockHookReturn.touched,
        validationErrors: mockHookReturn.validationErrors,
        isLoading: mockHookReturn.isLoading,
        error: mockHookReturn.error,
        success: mockHookReturn.success,
        isEditMode: mockHookReturn.isEditMode,
        parentCategories: mockHookReturn.parentCategories,
        loadingParents: mockHookReturn.loadingParents,
        handleChange: mockHookReturn.handleChange,
        handleBlur: mockHookReturn.handleBlur,
        handleSubmit: mockHookReturn.handleSubmit,
        handleCancel: expect.any(Function)
      }),
      expect.anything()
    );
  });

  it('calls onCancel when handleCancel is called and onCancel is provided', () => {
    const { rerender } = render(<CategoryFormContainer {...mockProps} />);
    
    // Extract handleCancel from the props passed to CategoryFormPresentation
    const handleCancel = (CategoryFormPresentation as jest.Mock).mock.calls[0][0].handleCancel;
    
    // Call handleCancel
    handleCancel();
    
    // Check that onCancel was called
    expect(mockProps.onCancel).toHaveBeenCalled();
  });
});
