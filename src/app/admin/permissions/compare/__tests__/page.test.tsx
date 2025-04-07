/**
 * @jest-environment jsdom
 */
import React from 'react';
import { render, screen } from '@testing-library/react';
import PermissionComparisonPage from '../page';
import { AdminLayout } from '@/components/admin/layout/AdminLayout';
import { PermissionComparisonContainer } from '@/components/admin/permissions/containers';

// Mock the components
jest.mock('@/components/admin/layout/AdminLayout', () => ({
  AdminLayout: jest.fn(({ children }) => <div data-testid="admin-layout">{children}</div>)
}));

jest.mock('@/components/admin/permissions/containers', () => ({
  PermissionComparisonContainer: jest.fn(() => <div data-testid="permission-comparison-container" />)
}));

describe('PermissionComparisonPage', () => {
  it('renders the page with correct components', () => {
    render(<PermissionComparisonPage />);
    
    // Check that the layout is rendered
    expect(screen.getByTestId('admin-layout')).toBeInTheDocument();
    
    // Check that the container is rendered
    expect(screen.getByTestId('permission-comparison-container')).toBeInTheDocument();
    
    // Check that the components are called with correct props
    expect(PermissionComparisonContainer).toHaveBeenCalled();
  });
});
