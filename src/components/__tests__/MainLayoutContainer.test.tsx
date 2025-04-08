import React from 'react';
import { render } from '@testing-library/react';
import { MainLayoutContainer } from '../MainLayoutContainer';
import { useMainLayout } from '../hooks/useMainLayout';
import { MainLayoutPresentation } from '../MainLayoutPresentation';

// Mock the dependencies
jest.mock('../hooks/useMainLayout');
jest.mock('../MainLayoutPresentation', () => ({
  MainLayoutPresentation: jest.fn(() => <div data-testid="mock-presentation" />)
}));
jest.mock('@/contexts/PublicTenantSiteContext', () => ({
  PublicTenantSiteProvider: ({ children }) => <div data-testid="mock-tenant-site-provider">{children}</div>
}));
jest.mock('@/components/admin/auth/AuthProvider', () => ({
  AuthProvider: ({ children }) => <div data-testid="mock-auth-provider">{children}</div>
}));

describe('MainLayoutContainer', () => {
  const mockSite = {
    id: 'site-1',
    name: 'Test Site',
    logoUrl: 'https://example.com/logo.png'
  };

  const mockCategories = [
    { id: 'cat-1', name: 'Category 1', slug: 'category-1' },
    { id: 'cat-2', name: 'Category 2', slug: 'category-2' }
  ];

  const mockChildren = <div>Test Children</div>;

  const mockHookReturn = {
    site: mockSite,
    categories: mockCategories,
    children: mockChildren
  };

  const mockProps = {
    site: mockSite,
    categories: mockCategories,
    children: mockChildren
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (useMainLayout as jest.Mock).mockReturnValue(mockHookReturn);
  });

  it('calls useMainLayout with the correct props', () => {
    render(<MainLayoutContainer {...mockProps} />);
    expect(useMainLayout).toHaveBeenCalledWith(mockProps);
  });

  it('wraps MainLayoutPresentation with AuthProvider and PublicTenantSiteProvider', () => {
    const { container } = render(<MainLayoutContainer {...mockProps} />);
    
    // Check that the providers are rendered
    expect(container.innerHTML).toContain('mock-auth-provider');
    expect(container.innerHTML).toContain('mock-tenant-site-provider');
    
    // Check that MainLayoutPresentation is rendered with the correct props
    expect(MainLayoutPresentation).toHaveBeenCalledWith(
      mockHookReturn,
      expect.anything()
    );
  });
});
