/**
 * Tests for the TenantSelector component
 * 
 * These tests focus on the tenant selection modal used for role removal.
 */

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import UserAssignment from '../UserAssignment';

// Import the TenantSelector component directly
// Note: Since TenantSelector is an internal component of UserAssignment,
// we extract it for testing using a render function pattern

// Helper function to render the TenantSelector in isolation
const renderTenantSelector = (props: {
  userId: string;
  onCancel: () => void;
  onConfirm: (tenantId: string) => void;
  isLoading: boolean;
}) => {
  // We render the UserAssignment first with setup to show the TenantSelector
  render(
    <div data-testid="tenant-selector-wrapper">
      {React.createElement(
        // @ts-ignore - Accessing the internal TenantSelector component
        UserAssignment.__TEST_ONLY__.TenantSelector,
        props
      )}
    </div>
  );
};

describe('TenantSelector Component', () => {
  // Mock functions
  const mockOnCancel = jest.fn();
  const mockOnConfirm = jest.fn();

  // Default props
  const defaultProps = {
    userId: 'test-user',
    onCancel: mockOnCancel,
    onConfirm: mockOnConfirm,
    isLoading: false
  };

  // Setup before each test
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders with the proper user information', () => {
    renderTenantSelector(defaultProps);
    
    // Verify title and description
    expect(screen.getByText('Select Tenant Context')).toBeInTheDocument();
    expect(screen.getByText(/Please specify which tenant context to remove this role from user/)).toBeInTheDocument();
    expect(screen.getByText('test-user')).toBeInTheDocument();
    
    // Verify form elements
    expect(screen.getByLabelText('Tenant ID')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Enter tenant ID')).toBeInTheDocument();
    expect(screen.getByText('Cancel')).toBeInTheDocument();
    expect(screen.getByText('Remove Role')).toBeInTheDocument();
  });

  it('disables the confirm button when no tenant ID is entered', () => {
    renderTenantSelector(defaultProps);
    
    // Verify confirm button is disabled
    const confirmButton = screen.getByText('Remove Role');
    expect(confirmButton).toBeDisabled();
  });

  it('enables the confirm button when tenant ID is entered', () => {
    renderTenantSelector(defaultProps);
    
    // Enter tenant ID
    const tenantInput = screen.getByPlaceholderText('Enter tenant ID');
    fireEvent.change(tenantInput, { target: { value: 'tenant-456' } });
    
    // Verify confirm button is enabled
    const confirmButton = screen.getByText('Remove Role');
    expect(confirmButton).not.toBeDisabled();
  });

  it('calls onCancel when Cancel button is clicked', () => {
    renderTenantSelector(defaultProps);
    
    // Click the Cancel button
    const cancelButton = screen.getByText('Cancel');
    fireEvent.click(cancelButton);
    
    // Verify onCancel was called
    expect(mockOnCancel).toHaveBeenCalledTimes(1);
  });

  it('calls onConfirm with tenant ID when confirm button is clicked', () => {
    renderTenantSelector(defaultProps);
    
    // Enter tenant ID
    const tenantInput = screen.getByPlaceholderText('Enter tenant ID');
    fireEvent.change(tenantInput, { target: { value: 'tenant-456' } });
    
    // Click the confirm button
    const confirmButton = screen.getByText('Remove Role');
    fireEvent.click(confirmButton);
    
    // Verify onConfirm was called with the tenant ID
    expect(mockOnConfirm).toHaveBeenCalledTimes(1);
    expect(mockOnConfirm).toHaveBeenCalledWith('tenant-456');
  });

  it('disables buttons when isLoading is true', () => {
    renderTenantSelector({ ...defaultProps, isLoading: true });
    
    // Verify buttons are disabled
    const cancelButton = screen.getByText('Cancel');
    const confirmButton = screen.getByText('Removing...');
    
    expect(cancelButton).toBeDisabled();
    expect(confirmButton).toBeDisabled();
    
    // Verify input is disabled
    const tenantInput = screen.getByPlaceholderText('Enter tenant ID');
    expect(tenantInput).toBeDisabled();
  });

  it('shows "Removing..." text when isLoading is true', () => {
    renderTenantSelector({ ...defaultProps, isLoading: true });
    
    // Verify loading text is displayed
    expect(screen.getByText('Removing...')).toBeInTheDocument();
    expect(screen.queryByText('Remove Role')).not.toBeInTheDocument();
  });
});
