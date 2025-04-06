import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import MainLayout from '../MainLayout';

// Mock the child components
jest.mock('../MainHeader', () => {
  return function MockMainHeader({ site, categories }: any) {
    return (
      <header data-testid="mock-main-header">
        <div>Site: {site.name}</div>
        <div>Categories: {categories.length}</div>
      </header>
    );
  };
});

jest.mock('../MainFooter', () => {
  return function MockMainFooter({ site }: any) {
    return (
      <footer data-testid="mock-main-footer">
        <div>Site: {site.name}</div>
      </footer>
    );
  };
});

// Mock the context providers
jest.mock('@/contexts/PublicTenantSiteContext', () => ({
  PublicTenantSiteProvider: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="mock-tenant-site-provider">{children}</div>
  ),
}));

jest.mock('@/components/admin/auth/AuthProvider', () => ({
  AuthProvider: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="mock-auth-provider">{children}</div>
  ),
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

  it('renders the layout with all components', () => {
    render(
      <MainLayout site={mockSite} categories={mockCategories}>
        <div data-testid="test-content">Test Content</div>
      </MainLayout>
    );

    // Check that all components are rendered
    expect(screen.getByTestId('mock-auth-provider')).toBeInTheDocument();
    expect(screen.getByTestId('mock-tenant-site-provider')).toBeInTheDocument();
    expect(screen.getByTestId('mock-main-header')).toBeInTheDocument();
    expect(screen.getByTestId('mock-main-footer')).toBeInTheDocument();
    expect(screen.getByTestId('test-content')).toBeInTheDocument();
  });

  it('passes site and categories props to MainHeader', () => {
    render(
      <MainLayout site={mockSite} categories={mockCategories}>
        <div>Test Content</div>
      </MainLayout>
    );

    // Check that site name and categories count are passed to MainHeader
    const header = screen.getByTestId('mock-main-header');
    expect(header).toHaveTextContent('Site: Test Site');
    expect(header).toHaveTextContent('Categories: 2');
  });

  it('passes site prop to MainFooter', () => {
    render(
      <MainLayout site={mockSite} categories={mockCategories}>
        <div>Test Content</div>
      </MainLayout>
    );

    // Check that site name is passed to MainFooter
    const footer = screen.getByTestId('mock-main-footer');
    expect(footer).toHaveTextContent('Site: Test Site');
  });

  it('renders with empty categories array when not provided', () => {
    render(
      <MainLayout site={mockSite}>
        <div>Test Content</div>
      </MainLayout>
    );

    // Check that categories count is 0
    expect(screen.getByText('Categories: 0')).toBeInTheDocument();
  });

  it('applies correct CSS classes for layout', () => {
    const { container } = render(
      <MainLayout site={mockSite} categories={mockCategories}>
        <div>Test Content</div>
      </MainLayout>
    );

    // Find the flex container div inside the mock provider
    const flexContainer = container.querySelector('.flex.flex-col.min-h-screen');
    expect(flexContainer).toBeInTheDocument();

    // Check that the main content area has the correct class
    const main = flexContainer?.querySelector('main');
    expect(main).toHaveClass('flex-grow');
  });
});
