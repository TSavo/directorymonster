import React from 'react';
import { render } from '@testing-library/react';
import '@testing-library/jest-dom';
import MainLayout from '../MainLayout';
import { MainLayoutContainer } from '../MainLayoutContainer';

// Mock the container component
jest.mock('../MainLayoutContainer', () => ({
  MainLayoutContainer: jest.fn(() => <div data-testid="mock-container" />)
}));

describe('MainLayout Component', () => {
  const mockSite = {
    id: 'site-1',
    name: 'Test Site',
    logoUrl: '/logo.png',
  };

  const mockCategories = [
    { id: 'cat-1', name: 'Category 1', slug: 'category-1' },
    { id: 'cat-2', name: 'Category 2', slug: 'category-2' },
  ];

  const mockChildren = <div data-testid="test-content">Test Content</div>;

  const mockProps = {
    site: mockSite,
    categories: mockCategories,
    children: mockChildren
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders the container component', () => {
    render(<MainLayout {...mockProps} />);
    expect(MainLayoutContainer).toHaveBeenCalled();
  });

  it('passes all props to the container component', () => {
    render(<MainLayout {...mockProps} />);
    expect(MainLayoutContainer).toHaveBeenCalledWith(
      expect.objectContaining(mockProps),
      expect.anything()
    );
  });
});
