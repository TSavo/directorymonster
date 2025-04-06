/**
 * @jest-environment jsdom
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';

// Unmock the AdminHeader component
jest.unmock('@/components/admin/layout/AdminHeader');

// Import the real AdminHeader component
import { AdminHeader } from '@/components/admin/layout/AdminHeader';

// Mock the UnifiedAuthComponent
jest.mock('@/components/auth', () => ({
  UnifiedAuthComponent: () => <div data-testid="mock-unified-auth">UnifiedAuthComponent</div>
}));

// Mock the useAuth hook
jest.mock('@/components/admin/auth/hooks/useAuth', () => ({
  useAuth: jest.fn().mockReturnValue({
    isAuthenticated: true,
    user: { username: 'admin', role: 'admin' }
  })
}));

// Mock the TenantSelector component
jest.mock('@/components/admin/tenant/TenantSelector', () => ({
  TenantSelector: () => <div data-testid="mock-tenant-selector">TenantSelector</div>
}));

// Mock the SiteSelector component
jest.mock('@/components/admin/tenant/SiteSelector', () => ({
  SiteSelector: () => <div data-testid="mock-site-selector">SiteSelector</div>
}));

// Mock the TenantSiteContext
jest.mock('@/contexts/TenantSiteContext', () => ({
  useTenantSite: jest.fn().mockReturnValue({
    tenants: [],
    sites: [],
    currentTenantId: 'test-tenant',
    currentSiteId: 'test-site',
    setCurrentTenantId: jest.fn(),
    setCurrentSiteId: jest.fn()
  })
}));

describe('AdminHeader', () => {
  it('should include the UnifiedAuthComponent', () => {
    render(<AdminHeader toggleSidebar={() => {}} />);

    // Check that the UnifiedAuthComponent is included in the header
    expect(screen.getByTestId('mock-unified-auth')).toBeInTheDocument();
  });
});
