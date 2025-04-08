import React from 'react';
import { render, screen } from '@testing-library/react';
import { MainLayoutPresentation } from '../MainLayoutPresentation';

// Mock the dependencies
jest.mock('../MainHeader', () => ({
  __esModule: true,
  default: ({ site, categories }) => (
    <header data-testid="mock-header">
      <div data-testid="site-name">{site.name}</div>
      <div data-testid="categories-count">{categories.length}</div>
    </header>
  )
}));

jest.mock('../MainFooter', () => ({
  __esModule: true,
  default: ({ site }) => (
    <footer data-testid="mock-footer">
      <div data-testid="site-id">{site.id}</div>
    </footer>
  )
}));

describe('MainLayoutPresentation', () => {
  const mockSite = {
    id: 'site-1',
    name: 'Test Site',
    logoUrl: 'https://example.com/logo.png'
  };

  const mockCategories = [
    { id: 'cat-1', name: 'Category 1', slug: 'category-1' },
    { id: 'cat-2', name: 'Category 2', slug: 'category-2' }
  ];

  const mockChildren = <div data-testid="mock-children">Test Children</div>;

  it('renders the header, main content, and footer', () => {
    render(
      <MainLayoutPresentation
        site={mockSite}
        categories={mockCategories}
        children={mockChildren}
      />
    );

    // Check that header is rendered with correct props
    expect(screen.getByTestId('mock-header')).toBeInTheDocument();
    expect(screen.getByTestId('site-name')).toHaveTextContent('Test Site');
    expect(screen.getByTestId('categories-count')).toHaveTextContent('2');

    // Check that main content is rendered
    expect(screen.getByTestId('mock-children')).toBeInTheDocument();
    expect(screen.getByTestId('mock-children')).toHaveTextContent('Test Children');

    // Check that footer is rendered with correct props
    expect(screen.getByTestId('mock-footer')).toBeInTheDocument();
    expect(screen.getByTestId('site-id')).toHaveTextContent('site-1');
  });

  it('renders with empty categories array', () => {
    render(
      <MainLayoutPresentation
        site={mockSite}
        categories={[]}
        children={mockChildren}
      />
    );

    expect(screen.getByTestId('categories-count')).toHaveTextContent('0');
  });
});
