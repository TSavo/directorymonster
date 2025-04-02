import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { CategoryForm } from '@/components/admin/categories/CategoryForm';
import { useCategoryForm } from '@/components/admin/categories/components/form/useCategoryForm';

// Mock the next/navigation module
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
  }),
}));

// Mock the useCategoryForm hook
jest.mock('@/components/admin/categories/components/form/useCategoryForm', () => ({
  useCategoryForm: jest.fn(),
}));

describe('CategoryForm Component', () => {
  // Default mock implementation for the useCategoryForm hook
  const mockUseCategoryForm = {
    formData: {
      name: '',
      slug: '',
      metaDescription: '',
      parentId: '',
      order: 0,
    },
    touched: {},
    validationErrors: {},
    isLoading: false,
    error: null,
    success: false,
    isEditMode: false,
    parentCategories: [],
    loadingParents: false,
    handleChange: jest.fn(),
    handleBlur: jest.fn(),
    handleSubmit: jest.fn((e) => e.preventDefault()),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (useCategoryForm as jest.Mock).mockReturnValue(mockUseCategoryForm);
  });

  it('renders the form with all fields', () => {
    render(<CategoryForm siteSlug="test-site" />);

    // Check if all form fields are rendered
    expect(screen.getByTestId('category-form')).toBeInTheDocument();
    expect(screen.getByTestId('category-form-name')).toBeInTheDocument();
    expect(screen.getByTestId('category-form-slug')).toBeInTheDocument();
    expect(screen.getByTestId('category-form-meta-description')).toBeInTheDocument();
    expect(screen.getByTestId('category-form-parent')).toBeInTheDocument();
    expect(screen.getByTestId('category-form-order')).toBeInTheDocument();

    // Check for submit and cancel buttons
    expect(screen.getByTestId('category-form-submit')).toBeInTheDocument();
    expect(screen.getByTestId('category-form-cancel')).toBeInTheDocument();
  });

  it('displays validation errors when present', () => {
    const mockWithErrors = {
      ...mockUseCategoryForm,
      validationErrors: {
        name: 'Name is required',
        slug: 'Slug is required',
      },
      touched: {
        name: true,
        slug: true,
      },
    };

    (useCategoryForm as jest.Mock).mockReturnValue(mockWithErrors);

    render(<CategoryForm siteSlug="test-site" />);

    // Check if validation errors are displayed
    expect(screen.getByText('Name is required')).toBeInTheDocument();
    expect(screen.getByText('Slug is required')).toBeInTheDocument();
  });

  it('calls handleSubmit when form is submitted', async () => {
    render(<CategoryForm siteSlug="test-site" />);

    // Submit the form
    fireEvent.submit(screen.getByTestId('category-form'));

    // Check if handleSubmit was called
    expect(mockUseCategoryForm.handleSubmit).toHaveBeenCalled();
  });

  it('displays success message when form submission is successful', () => {
    const mockWithSuccess = {
      ...mockUseCategoryForm,
      success: true,
      isEditMode: false,
    };

    (useCategoryForm as jest.Mock).mockReturnValue(mockWithSuccess);

    render(<CategoryForm siteSlug="test-site" />);

    // Check if success message is displayed
    expect(screen.getByText(/category created successfully/i)).toBeInTheDocument();
  });

  it('displays error message when form submission fails', () => {
    const mockWithError = {
      ...mockUseCategoryForm,
      error: 'Failed to create category',
    };

    (useCategoryForm as jest.Mock).mockReturnValue(mockWithError);

    render(<CategoryForm siteSlug="test-site" />);

    // Check if error message is displayed
    expect(screen.getByText('Failed to create category')).toBeInTheDocument();
  });

  it('shows parent category options when available', () => {
    const mockWithParentCategories = {
      ...mockUseCategoryForm,
      parentCategories: [
        { id: 'cat1', name: 'Category 1' },
        { id: 'cat2', name: 'Category 2' },
      ],
    };

    (useCategoryForm as jest.Mock).mockReturnValue(mockWithParentCategories);

    render(<CategoryForm siteSlug="test-site" />);

    // Open the select dropdown
    fireEvent.click(screen.getByTestId('category-form-parent'));

    // Check if parent category options are displayed
    expect(screen.getByText('No Parent (Top Level)')).toBeInTheDocument();
    expect(screen.getByText('Category 1')).toBeInTheDocument();
    expect(screen.getByText('Category 2')).toBeInTheDocument();
  });

  it('calls onCancel when cancel button is clicked', () => {
    const onCancelMock = jest.fn();

    render(<CategoryForm siteSlug="test-site" onCancel={onCancelMock} />);

    // Click the cancel button
    fireEvent.click(screen.getByRole('button', { name: /cancel/i }));

    // Check if onCancel was called
    expect(onCancelMock).toHaveBeenCalled();
  });

  it('shows loading state when submitting the form', () => {
    const mockWithLoading = {
      ...mockUseCategoryForm,
      isLoading: true,
    };

    (useCategoryForm as jest.Mock).mockReturnValue(mockWithLoading);

    render(<CategoryForm siteSlug="test-site" />);

    // Check if loading indicator is displayed
    expect(screen.getByText(/saving/i)).toBeInTheDocument();
    expect(screen.getByTestId('category-form-submit')).toBeDisabled();
  });

  it('shows edit mode UI when categoryId is provided', () => {
    const mockEditMode = {
      ...mockUseCategoryForm,
      isEditMode: true,
      formData: {
        name: 'Existing Category',
        slug: 'existing-category',
        metaDescription: 'This is an existing category',
        parentId: '',
        order: 1,
      },
    };

    (useCategoryForm as jest.Mock).mockReturnValue(mockEditMode);

    render(<CategoryForm siteSlug="test-site" categoryId="cat1" />);

    // Check if form is in edit mode
    expect(screen.getByDisplayValue('Existing Category')).toBeInTheDocument();
    expect(screen.getByDisplayValue('existing-category')).toBeInTheDocument();
    expect(screen.getByDisplayValue('This is an existing category')).toBeInTheDocument();
    expect(screen.getByDisplayValue('1')).toBeInTheDocument();

    // Check for update button instead of create
    expect(screen.getByTestId('category-form-submit')).toBeInTheDocument();
  });
});
