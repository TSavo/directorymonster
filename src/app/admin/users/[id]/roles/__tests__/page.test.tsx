/**
 * @jest-environment jsdom
 */
import React from 'react';
import { render, screen } from '@testing-library/react';
import UserRolesPage from '../page';
import { AdminLayout } from '@/components/admin/layout/AdminLayout';
import { UserDetailTabs } from '@/components/admin/users/UserDetailTabs';
import { UserRoleManagerContainer } from '@/components/admin/users/containers';

// Mock the components
jest.mock('@/components/admin/layout/AdminLayout', () => ({
  AdminLayout: jest.fn(({ children }) => <div data-testid="admin-layout">{children}</div>)
}));

jest.mock('@/components/admin/users/UserDetailTabs', () => ({
  UserDetailTabs: jest.fn(() => <div data-testid="user-detail-tabs" />)
}));

jest.mock('@/components/admin/users/containers', () => ({
  UserRoleManagerContainer: jest.fn(() => <div data-testid="user-role-manager-container" />)
}));

describe('UserRolesPage', () => {
  const mockParams = {
    id: 'user-123'
  };

  it('renders the page with correct components', () => {
    render(<UserRolesPage params={mockParams} />);
    
    // Check that the layout is rendered
    expect(screen.getByTestId('admin-layout')).toBeInTheDocument();
    
    // Check that the tabs are rendered
    expect(screen.getByTestId('user-detail-tabs')).toBeInTheDocument();
    
    // Check that the container is rendered
    expect(screen.getByTestId('user-role-manager-container')).toBeInTheDocument();
    
    // Check that the components are called with correct props
    expect(UserDetailTabs).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: 'user-123',
        activeTab: 'roles'
      }),
      expect.anything()
    );
    
    expect(UserRoleManagerContainer).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: 'user-123'
      }),
      expect.anything()
    );
  });
});
