import React from 'react';
import { render } from '@testing-library/react';
import MainFooter from '../MainFooter';
import { MainFooterContainer } from '../MainFooterContainer';

// Mock the container component
jest.mock('../MainFooterContainer', () => ({
  MainFooterContainer: jest.fn(() => <div data-testid="mock-container" />)
}));

describe('MainFooter', () => {
  const mockSite = {
    id: 'site-1',
    name: 'Test Site'
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders the container component', () => {
    render(<MainFooter site={mockSite} />);
    expect(MainFooterContainer).toHaveBeenCalled();
  });

  it('passes site to the container component', () => {
    render(<MainFooter site={mockSite} />);
    expect(MainFooterContainer).toHaveBeenCalledWith(
      expect.objectContaining({
        site: mockSite
      }),
      expect.anything()
    );
  });
});
