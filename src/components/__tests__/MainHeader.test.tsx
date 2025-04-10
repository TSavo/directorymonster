import React from 'react';
import { render } from '@testing-library/react';
import MainHeader from '../MainHeader';
import { MainHeaderContainer } from '../MainHeaderContainer';

// Mock the MainHeaderContainer component
jest.mock('../MainHeaderContainer', () => ({
  MainHeaderContainer: jest.fn(() => <div data-testid="mock-container" />)
}));

describe('MainHeader', () => {
  // Default props for testing
  const mockSite = {
    id: 'site-1',
    name: 'Test Site',
    logoUrl: '/logo.png'
  };

  const mockCategories = [
    { id: 'cat-1', name: 'Category 1', slug: 'category-1' },
    { id: 'cat-2', name: 'Category 2', slug: 'category-2' }
  ];

  // Reset mocks before each test
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders the container component', () => {
    // Render the header
    render(<MainHeader site={mockSite} categories={mockCategories} />);

    // Check that the container component was rendered
    expect(MainHeaderContainer).toHaveBeenCalled();
  });

  it('passes site to the container component', () => {
    // Render the header with site
    render(<MainHeader site={mockSite} categories={mockCategories} />);

    // Check that the container component was rendered with site
    expect(MainHeaderContainer).toHaveBeenCalledWith(
      expect.objectContaining({
        site: mockSite
      }),
      expect.anything()
    );
  });

  it('passes categories to the container component', () => {
    // Render the header with categories
    render(<MainHeader site={mockSite} categories={mockCategories} />);

    // Check that the container component was rendered with categories
    expect(MainHeaderContainer).toHaveBeenCalledWith(
      expect.objectContaining({
        categories: mockCategories
      }),
      expect.anything()
    );
  });

  it('passes empty categories array when categories prop is not provided', () => {
    // Create props without categories
    const propsWithoutCategories = {
      site: mockSite
    };

    // Render the header without categories
    render(<MainHeader {...propsWithoutCategories} />);

    // Check that the container component was rendered with empty categories array
    expect(MainHeaderContainer).toHaveBeenCalledWith(
      expect.objectContaining({
        categories: []
      }),
      expect.anything()
    );
  });
});
