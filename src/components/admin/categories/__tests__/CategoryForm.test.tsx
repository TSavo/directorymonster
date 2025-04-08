import React from 'react';
import { render } from '@testing-library/react';
import { CategoryForm } from '../CategoryForm';
import { CategoryFormContainer } from '../CategoryFormContainer';

// Mock the container component
jest.mock('../CategoryFormContainer', () => ({
  CategoryFormContainer: jest.fn(() => <div data-testid="mock-container" />)
}));

describe('CategoryForm', () => {
  const mockProps = {
    siteSlug: 'test-site',
    categoryId: 'category-1',
    initialData: { name: 'Initial Name' },
    onCancel: jest.fn(),
    onSaved: jest.fn()
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders the container component', () => {
    render(<CategoryForm {...mockProps} />);
    expect(CategoryFormContainer).toHaveBeenCalled();
  });

  it('passes all props to the container component', () => {
    render(<CategoryForm {...mockProps} />);
    expect(CategoryFormContainer).toHaveBeenCalledWith(
      expect.objectContaining(mockProps),
      expect.anything()
    );
  });
});
