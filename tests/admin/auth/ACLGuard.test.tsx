import React from 'react';
import { render, screen } from '@testing-library/react';
import { ACLGuard } from '@/components/admin/auth/ACLGuard';
import { useAuth } from '@/components/admin/auth/hooks/useAuth';

// Mock the useAuth hook
jest.mock('@/components/admin/auth/hooks/useAuth');

describe('ACLGuard component', () => {
  // Set up mock for useAuth hook
  beforeEach(() => {
    // Reset mock implementation before each test
    (useAuth as jest.Mock).mockReset();
  });

  it('renders children when user has permission', () => {
    // Mock authenticated user with permission
    (useAuth as jest.Mock).mockReturnValue({
      user: { id: 'user1' },
      isAuthenticated: true,
      hasPermission: jest.fn().mockReturnValue(true),
    });

    render(
      <ACLGuard resourceType="site" permission="read" resourceId="site1">
        <div data-testid="protected-content">Protected Content</div>
      </ACLGuard>
    );

    // Should render children
    expect(screen.getByTestId('protected-content')).toBeInTheDocument();
    expect(screen.getByText('Protected Content')).toBeInTheDocument();

    // Should not render fallback
    expect(screen.queryByText('Access Denied')).not.toBeInTheDocument();
  });

  it('renders fallback when user does not have permission', () => {
    // Mock authenticated user without permission
    (useAuth as jest.Mock).mockReturnValue({
      user: { id: 'user1' },
      isAuthenticated: true,
      hasPermission: jest.fn().mockReturnValue(false),
    });

    render(
      <ACLGuard resourceType="site" permission="read" resourceId="site1">
        <div data-testid="protected-content">Protected Content</div>
      </ACLGuard>
    );

    // Should not render children
    expect(screen.queryByTestId('protected-content')).not.toBeInTheDocument();

    // Should render default fallback
    expect(screen.getByText('Access Denied')).toBeInTheDocument();
    expect(screen.getByText(/You don't have the required permissions/i)).toBeInTheDocument();
  });

  it('renders fallback when user is not authenticated', () => {
    // Mock unauthenticated user
    (useAuth as jest.Mock).mockReturnValue({
      user: null,
      isAuthenticated: false,
      hasPermission: jest.fn(),
    });

    render(
      <ACLGuard resourceType="site" permission="read" resourceId="site1">
        <div data-testid="protected-content">Protected Content</div>
      </ACLGuard>
    );

    // Should not render children
    expect(screen.queryByTestId('protected-content')).not.toBeInTheDocument();

    // Should render default fallback
    expect(screen.getByText('Access Denied')).toBeInTheDocument();
  });

  it('renders custom fallback when provided', () => {
    // Mock authenticated user without permission
    (useAuth as jest.Mock).mockReturnValue({
      user: { id: 'user1' },
      isAuthenticated: true,
      hasPermission: jest.fn().mockReturnValue(false),
    });

    render(
      <ACLGuard 
        resourceType="site" 
        permission="read" 
        resourceId="site1"
        fallback={<div data-testid="custom-fallback">Custom Fallback</div>}
      >
        <div data-testid="protected-content">Protected Content</div>
      </ACLGuard>
    );

    // Should not render children
    expect(screen.queryByTestId('protected-content')).not.toBeInTheDocument();

    // Should render custom fallback
    expect(screen.getByTestId('custom-fallback')).toBeInTheDocument();
    expect(screen.getByText('Custom Fallback')).toBeInTheDocument();
  });

  it('passes all permission parameters to hasPermission function', () => {
    // Create a mock for hasPermission
    const mockHasPermission = jest.fn().mockReturnValue(true);

    // Mock authenticated user
    (useAuth as jest.Mock).mockReturnValue({
      user: { id: 'user1' },
      isAuthenticated: true,
      hasPermission: mockHasPermission,
    });

    render(
      <ACLGuard 
        resourceType="category" 
        permission="update" 
        resourceId="category1"
        siteId="site1"
      >
        <div>Protected Content</div>
      </ACLGuard>
    );

    // Check if hasPermission was called with the correct parameters
    expect(mockHasPermission).toHaveBeenCalledWith(
      'category',
      'update',
      'category1',
      'site1'
    );
  });
});
