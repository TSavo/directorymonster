/**
 * @jest-environment jsdom
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import MainHeader from '@/components/MainHeader';

// Mock the UnifiedAuthComponent
jest.mock('@/components/auth', () => ({
  UnifiedAuthComponent: () => <div data-testid="mock-unified-auth">UnifiedAuthComponent</div>
}));

// Mock the useAuth hook
jest.mock('@/components/admin/auth/hooks/useAuth', () => ({
  useAuth: jest.fn().mockReturnValue({
    isAuthenticated: false,
    user: null
  })
}));

// Mock the PublicTenantSiteContext
jest.mock('@/contexts/PublicTenantSiteContext', () => ({
  usePublicTenantSite: jest.fn().mockReturnValue({
    tenants: [],
    sites: [],
    currentTenantId: 'test-tenant',
    currentSiteId: 'test-site',
    setCurrentTenantId: jest.fn(),
    setCurrentSiteId: jest.fn()
  })
}));

describe('MainHeader', () => {
  it('should include the UnifiedAuthComponent', () => {
    render(<MainHeader site={{ id: 'test-site', name: 'Test Site' }} />);

    // Check that the UnifiedAuthComponent is included in the header
    expect(screen.getByTestId('mock-unified-auth')).toBeInTheDocument();
  });
});
