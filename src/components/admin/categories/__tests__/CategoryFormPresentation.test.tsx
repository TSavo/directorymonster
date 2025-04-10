import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { CategoryFormPresentation } from '../CategoryFormPresentation';

// Mock the form components
jest.mock('../components/form', () => ({
  TextInput: ({ id, label, testId }: any) => (
    <div data-testid={testId || `mock-text-input-${id}`}>
      <label>{label}</label>
      <input id={id} />
    </div>
  ),
  TextArea: ({ id, label, testId }: any) => (
    <div data-testid={testId || `mock-textarea-${id}`}>
      <label>{label}</label>
      <textarea id={id} />
    </div>
  ),
  SelectField: ({ id, label, testId }: any) => (
    <div data-testid={testId || `mock-select-${id}`}>
      <label>{label}</label>
      <select id={id} />
    </div>
  ),
  StatusMessage: ({ error, success, isEditMode }: any) => (
    <div data-testid="mock-status-message">
      {error && <div data-testid="error-message">{error}</div>}
      {success && <div data-testid="success-message">
        {isEditMode ? 'Category updated successfully' : 'Category created successfully'}
      </div>}
    </div>
  ),
  FormActions: ({ isLoading, isEditMode, onCancel }: any) => (
    <div data-testid="mock-form-actions">
      <button type="submit" data-testid="submit-button">
        {isEditMode ? 'Update' : 'Create'}
      </button>
      <button type="button" data-testid="cancel-button" onClick={onCancel}>
        Cancel
      </button>
      {isLoading && <div data-testid="loading-indicator">Loading...</div>}
    </div>
  )
}));

describe('CategoryFormPresentation', () => {
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

  const mockProps = {
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
    handleCancel: jest.fn()
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders the form with all fields', () => {
    render(<CategoryFormPresentation {...mockProps} />);
    
    expect(screen.getByTestId('category-form')).toBeInTheDocument();
    expect(screen.getByTestId('category-form-name')).toBeInTheDocument();
    expect(screen.getByTestId('category-form-slug')).toBeInTheDocument();
    expect(screen.getByTestId('category-form-meta-description')).toBeInTheDocument();
    expect(screen.getByTestId('category-form-parent')).toBeInTheDocument();
    expect(screen.getByTestId('category-form-order')).toBeInTheDocument();
    expect(screen.getByTestId('mock-form-actions')).toBeInTheDocument();
  });

  it('displays error message when error is provided', () => {
    const errorMessage = 'Failed to create category';
    render(<CategoryFormPresentation {...mockProps} error={errorMessage} />);
    
    expect(screen.getByTestId('error-message')).toHaveTextContent(errorMessage);
  });

  it('displays success message when success is true', () => {
    render(<CategoryFormPresentation {...mockProps} success={true} />);
    
    expect(screen.getByTestId('success-message')).toHaveTextContent('Category created successfully');
  });

  it('displays edit mode success message when in edit mode', () => {
    render(<CategoryFormPresentation {...mockProps} success={true} isEditMode={true} />);
    
    expect(screen.getByTestId('success-message')).toHaveTextContent('Category updated successfully');
  });

  it('shows loading indicator when isLoading is true', () => {
    render(<CategoryFormPresentation {...mockProps} isLoading={true} />);
    
    expect(screen.getByTestId('loading-indicator')).toBeInTheDocument();
  });

  it('calls handleSubmit when form is submitted', async () => {
    render(<CategoryFormPresentation {...mockProps} />);
    const user = userEvent.setup();
    
    const form = screen.getByTestId('category-form');
    await user.click(screen.getByTestId('submit-button'));
    
    expect(mockProps.handleSubmit).toHaveBeenCalled();
  });

  it('calls handleCancel when cancel button is clicked', async () => {
    render(<CategoryFormPresentation {...mockProps} />);
    const user = userEvent.setup();
    
    await user.click(screen.getByTestId('cancel-button'));
    
    expect(mockProps.handleCancel).toHaveBeenCalled();
  });
});
