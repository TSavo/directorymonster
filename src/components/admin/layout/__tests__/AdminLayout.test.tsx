import React from 'react';
import { render } from '@testing-library/react';
import { AdminLayout } from '../AdminLayout';
import { AdminLayoutContainer } from '../AdminLayoutContainer';

// Mock the container component
jest.mock('../AdminLayoutContainer', () => ({
  AdminLayoutContainer: jest.fn(() => <div data-testid="mock-container" />)
}));

describe('AdminLayout', () => {
  const mockChildren = <div>Test Children</div>;
  const mockProps = {
    children: mockChildren
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders the container component', () => {
    render(<AdminLayout {...mockProps} />);
    expect(AdminLayoutContainer).toHaveBeenCalled();
  });

  it('passes all props to the container component', () => {
    render(<AdminLayout {...mockProps} />);
    expect(AdminLayoutContainer).toHaveBeenCalledWith(
      expect.objectContaining(mockProps),
      expect.anything()
    );
  });
});
