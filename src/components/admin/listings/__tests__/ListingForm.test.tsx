import React from 'react';
import { render } from '@testing-library/react';
import { ListingForm } from '../ListingForm';
import { ListingFormContainer } from '../ListingFormContainer';

// Mock the container component
jest.mock('../ListingFormContainer', () => ({
  ListingFormContainer: jest.fn(() => <div data-testid="mock-container" />)
}));

describe('ListingForm', () => {
  const mockProps = {
    initialData: { title: 'Initial Title' },
    onSubmit: jest.fn(),
    onCancel: jest.fn(),
    listing: { id: '1', title: 'Test Listing' },
    siteSlug: 'test-site'
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders the container component', () => {
    render(<ListingForm {...mockProps} />);
    expect(ListingFormContainer).toHaveBeenCalled();
  });

  it('passes all props to the container component', () => {
    render(<ListingForm {...mockProps} />);
    expect(ListingFormContainer).toHaveBeenCalledWith(
      expect.objectContaining(mockProps),
      expect.anything()
    );
  });
});
