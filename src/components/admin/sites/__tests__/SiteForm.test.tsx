import React from 'react';
import { render } from '@testing-library/react';
import { SiteForm } from '../SiteForm';
import { SiteFormContainer } from '../SiteFormContainer';

// Mock the container component
jest.mock('../SiteFormContainer', () => ({
  SiteFormContainer: jest.fn(() => <div data-testid="mock-container" />)
}));

describe('SiteForm', () => {
  const mockProps = {
    initialData: {
      id: 'test-id',
      name: 'Test Site'
    },
    mode: 'edit' as const,
    onCancel: jest.fn(),
    onSuccess: jest.fn(),
    apiEndpoint: '/api/sites/test',
    initialStep: 'domains'
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders the container component', () => {
    render(<SiteForm {...mockProps} />);
    expect(SiteFormContainer).toHaveBeenCalled();
  });

  it('passes all props to the container component', () => {
    render(<SiteForm {...mockProps} />);
    expect(SiteFormContainer).toHaveBeenCalledWith(
      expect.objectContaining(mockProps),
      expect.anything()
    );
  });
});
