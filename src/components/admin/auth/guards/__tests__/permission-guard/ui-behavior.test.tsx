import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { PermissionGuard } from '../../PermissionGuard';
import { 
  setupMocks, 
  mockHasPermissionInTenant 
} from './setup';

describe('PermissionGuard - UI Behavior', () => {
  beforeEach(setupMocks);

  it('should render fallback content when user lacks permission', async () => {
    mockHasPermissionInTenant.mockResolvedValue(false);
    
    render(
      <PermissionGuard 
        resourceType="category" 
        permission="update"
        fallback={<div data-testid="fallback-content">Access Denied</div>}
      >
        <div data-testid="protected-content">Protected Content</div>
      </PermissionGuard>
    );
    
    // Should render fallback content
    await waitFor(() => {
      expect(screen.queryByTestId('protected-content')).not.toBeInTheDocument();
      expect(screen.getByTestId('fallback-content')).toBeInTheDocument();
    });
  });

  it('should show loading indicator when loading and showLoading is true', async () => {
    // Don't resolve the permission check yet
    const permissionPromise = new Promise<boolean>(resolve => {
      // Resolve after some time to keep the component in loading state
      setTimeout(() => resolve(true), 100);
    });
    mockHasPermissionInTenant.mockReturnValue(permissionPromise);
    
    render(
      <PermissionGuard resourceType="category" permission="read" showLoading={true}>
        <div data-testid="protected-content">Protected Content</div>
      </PermissionGuard>
    );
    
    // Should show loading indicator
    const loadingElement = screen.getByRole('status', { hidden: true });
    expect(loadingElement).toBeInTheDocument();
    
    // Wait for permission check to resolve
    await waitFor(() => {
      expect(screen.getByTestId('protected-content')).toBeInTheDocument();
    }, { timeout: 200 });
  });

  it('should render nothing when silent is true and permission is denied', async () => {
    mockHasPermissionInTenant.mockResolvedValue(false);
    
    render(
      <PermissionGuard 
        resourceType="category" 
        permission="update"
        fallback={<div data-testid="fallback-content">Access Denied</div>}
        silent={true}
      >
        <div data-testid="protected-content">Protected Content</div>
      </PermissionGuard>
    );
    
    // Should render neither children nor fallback
    await waitFor(() => {
      expect(screen.queryByTestId('protected-content')).not.toBeInTheDocument();
      expect(screen.queryByTestId('fallback-content')).not.toBeInTheDocument();
    });
  });

  it('should not show loading indicator when showLoading is false', async () => {
    // Don't resolve the permission check yet
    const permissionPromise = new Promise<boolean>(resolve => {
      // Resolve after some time to keep the component in loading state
      setTimeout(() => resolve(true), 100);
    });
    mockHasPermissionInTenant.mockReturnValue(permissionPromise);
    
    render(
      <PermissionGuard resourceType="category" permission="read" showLoading={false}>
        <div data-testid="protected-content">Protected Content</div>
      </PermissionGuard>
    );
    
    // Should not show loading indicator
    expect(screen.queryByRole('status', { hidden: true })).not.toBeInTheDocument();
    
    // Should show nothing initially
    expect(screen.queryByTestId('protected-content')).not.toBeInTheDocument();
    
    // Wait for permission check to resolve
    await waitFor(() => {
      expect(screen.getByTestId('protected-content')).toBeInTheDocument();
    }, { timeout: 200 });
  });
});