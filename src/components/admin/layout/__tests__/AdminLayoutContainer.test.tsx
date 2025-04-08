import React from 'react';
import { render } from '@testing-library/react';
import { AdminLayoutContainer } from '../AdminLayoutContainer';
import { useAdminLayout } from '../hooks/useAdminLayout';
import { AdminLayoutPresentation } from '../AdminLayoutPresentation';

// Mock the dependencies
jest.mock('../hooks/useAdminLayout');
jest.mock('../AdminLayoutPresentation', () => ({
  AdminLayoutPresentation: jest.fn(() => <div data-testid="mock-presentation" />)
}));
jest.mock('@/contexts/TenantSiteContext', () => ({
  TenantSiteProvider: ({ children }) => <div data-testid="mock-tenant-site-provider">{children}</div>
}));
jest.mock('@/components/ui/context-breadcrumbs', () => ({
  BreadcrumbProvider: ({ children }) => <div data-testid="mock-breadcrumb-provider">{children}</div>
}));

describe('AdminLayoutContainer', () => {
  const mockChildren = <div>Test Children</div>;
  const mockHookReturn = {
    children: mockChildren,
    sidebarOpen: false,
    pathname: '/admin/dashboard',
    toggleSidebar: jest.fn(),
    closeSidebar: jest.fn()
  };

  const mockProps = {
    children: mockChildren
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (useAdminLayout as jest.Mock).mockReturnValue(mockHookReturn);
  });

  it('calls useAdminLayout with the correct props', () => {
    render(<AdminLayoutContainer {...mockProps} />);
    expect(useAdminLayout).toHaveBeenCalledWith(mockProps);
  });

  it('wraps AdminLayoutPresentation with TenantSiteProvider and BreadcrumbProvider', () => {
    const { container } = render(<AdminLayoutContainer {...mockProps} />);
    
    // Check that the providers are rendered
    expect(container.innerHTML).toContain('mock-tenant-site-provider');
    expect(container.innerHTML).toContain('mock-breadcrumb-provider');
    
    // Check that AdminLayoutPresentation is rendered with the correct props
    expect(AdminLayoutPresentation).toHaveBeenCalledWith(
      {
        children: mockHookReturn.children,
        sidebarOpen: mockHookReturn.sidebarOpen,
        toggleSidebar: mockHookReturn.toggleSidebar,
        closeSidebar: mockHookReturn.closeSidebar
      },
      expect.anything()
    );
  });
});
