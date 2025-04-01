/**
 * Unit tests for TenantGuard component
 */

const React = require('react');
const { render, screen, waitFor } = require('@testing-library/react');
require('@testing-library/jest-dom');
const { TenantGuard } = require('@/components/admin/auth/guards/TenantGuard');
const { useAuth } = require('@/components/admin/auth/hooks/useAuth');
const { useTenant } = require('@/lib/tenant/use-tenant');
const TenantMembershipService = require('@/lib/tenant-membership-service').default;

// Mock the hooks properly
jest.mock('@/components/admin/auth/hooks/useAuth', () => ({
  useAuth: jest.fn()
}));

jest.mock('@/lib/tenant/use-tenant', () => ({
  useTenant: jest.fn()
}));

jest.mock('@/lib/tenant-membership-service', () => ({
  __esModule: true,
  default: {
    isTenantMember: jest.fn()
  }
}));

describe('TenantGuard', () => {
  // Test data
  const testUser = { id: 'user-123', name: 'Test User' };
  const testTenant = { id: 'tenant-456', name: 'Test Tenant' };
  
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock hooks with default values
    useAuth.mockReturnValue({
      user: testUser,
      isAuthenticated: true,
    });
    
    useTenant.mockReturnValue({
      tenant: testTenant,
    });
    
    // Mock TenantMembershipService
    TenantMembershipService.isTenantMember.mockResolvedValue(true);
  });
  
  it('should render children when user has tenant access', async () => {
    // Arrange
    const testContent = 'Protected Content';
    
    // Act
    render(
      <TenantGuard>
        <div>{testContent}</div>
      </TenantGuard>
    );
    
    // First it should show loading state
    expect(screen.getByRole('status')).toBeInTheDocument();
    
    // Then it should show the content
    await waitFor(() => {
      expect(screen.getByText(testContent)).toBeInTheDocument();
    });
    
    // Assert service was called with correct params
    expect(TenantMembershipService.isTenantMember).toHaveBeenCalledWith(
      testUser.id,
      testTenant.id
    );
  });
  
  it('should render fallback when user is not authenticated', async () => {
    // Arrange
    useAuth.mockReturnValue({
      user: null,
      isAuthenticated: false,
    });
    
    // Act
    render(
      <TenantGuard>
        <div>Protected Content</div>
      </TenantGuard>
    );
    
    // Wait for component to process
    await waitFor(() => {
      expect(screen.getByText('Access Denied')).toBeInTheDocument();
    });
    
    // Assert service was not called
    expect(TenantMembershipService.isTenantMember).not.toHaveBeenCalled();
  });
  
  it('should render fallback when tenant is not resolved', async () => {
    // Arrange
    useTenant.mockReturnValue({
      tenant: null,
    });
    
    // Act
    render(
      <TenantGuard>
        <div>Protected Content</div>
      </TenantGuard>
    );
    
    // Wait for component to process
    await waitFor(() => {
      expect(screen.getByText('Access Denied')).toBeInTheDocument();
    });
    
    // Assert service was not called
    expect(TenantMembershipService.isTenantMember).not.toHaveBeenCalled();
  });
  
  it('should render fallback when user does not have tenant access', async () => {
    // Arrange
    TenantMembershipService.isTenantMember.mockResolvedValue(false);
    
    // Act
    render(
      <TenantGuard>
        <div>Protected Content</div>
      </TenantGuard>
    );
    
    // Wait for component to process
    await waitFor(() => {
      expect(screen.getByText('Access Denied')).toBeInTheDocument();
    });
    
    // Assert service was called
    expect(TenantMembershipService.isTenantMember).toHaveBeenCalled();
  });
  
  it('should render custom fallback', async () => {
    // Arrange
    TenantMembershipService.isTenantMember.mockResolvedValue(false);
    const customFallback = 'Custom Fallback';
    
    // Act
    render(
      <TenantGuard fallback={<div>{customFallback}</div>}>
        <div>Protected Content</div>
      </TenantGuard>
    );
    
    // Wait for component to process
    await waitFor(() => {
      expect(screen.getByText(customFallback)).toBeInTheDocument();
    });
  });
  
  it('should handle service errors gracefully', async () => {
    // Arrange
    TenantMembershipService.isTenantMember.mockRejectedValue(
      new Error('Service error')
    );
    
    // Spy on console.error
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
    
    // Act
    render(
      <TenantGuard>
        <div>Protected Content</div>
      </TenantGuard>
    );
    
    // Wait for component to process
    await waitFor(() => {
      expect(screen.getByText('Access Denied')).toBeInTheDocument();
    });
    
    // Assert error was logged
    expect(consoleSpy).toHaveBeenCalled();
    
    // Restore console.error
    consoleSpy.mockRestore();
  });
});
