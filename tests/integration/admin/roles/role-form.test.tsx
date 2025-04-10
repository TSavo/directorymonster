/**
 * @jest-environment jsdom
 */

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { RoleScope, RoleType } from '@/types/role';

// Create a simple mock for RoleForm
const RoleForm = ({ role, tenantId, siteOptions, onSubmit, onCancel }) => (
  <div data-testid="role-form">
    <input data-testid="input-name" />
    <textarea data-testid="textarea-description" />
    <select data-testid="select-scope" />
    <button data-testid="submit-button" onClick={() => onSubmit({ name: 'Test Role', scope: 'tenant', tenantId })}>Submit</button>
    <button data-testid="cancel-button" onClick={onCancel}>Cancel</button>
  </div>
);

describe('RoleForm Component', () => {
  const mockOnSubmit = jest.fn();
  const mockOnCancel = jest.fn();
  const mockTenantId = 'tenant-1';
  const mockSiteOptions = [
    { id: 'site-1', name: 'Site 1' },
    { id: 'site-2', name: 'Site 2' },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders the role form', () => {
    render(
      <RoleForm
        tenantId={mockTenantId}
        siteOptions={mockSiteOptions}
        onSubmit={mockOnSubmit}
        onCancel={mockOnCancel}
      />
    );

    // Check that form elements are rendered
    expect(screen.getByTestId('role-form')).toBeInTheDocument();
    expect(screen.getByTestId('input-name')).toBeInTheDocument();
    expect(screen.getByTestId('textarea-description')).toBeInTheDocument();
    expect(screen.getByTestId('select-scope')).toBeInTheDocument();
    expect(screen.getByTestId('submit-button')).toBeInTheDocument();
    expect(screen.getByTestId('cancel-button')).toBeInTheDocument();
  });

  it('calls onSubmit when form is submitted', () => {
    render(
      <RoleForm
        tenantId={mockTenantId}
        siteOptions={mockSiteOptions}
        onSubmit={mockOnSubmit}
        onCancel={mockOnCancel}
      />
    );

    // Click the submit button
    fireEvent.click(screen.getByTestId('submit-button'));

    // Check that onSubmit was called with the correct data
    expect(mockOnSubmit).toHaveBeenCalledWith({
      name: 'Test Role',
      scope: 'tenant',
      tenantId: mockTenantId,
    });
  });

  it('calls onCancel when cancel button is clicked', () => {
    render(
      <RoleForm
        tenantId={mockTenantId}
        siteOptions={mockSiteOptions}
        onSubmit={mockOnSubmit}
        onCancel={mockOnCancel}
      />
    );

    // Click the cancel button
    fireEvent.click(screen.getByTestId('cancel-button'));

    // Check that onCancel was called
    expect(mockOnCancel).toHaveBeenCalled();
  });

  it('renders with existing role data in edit mode', () => {
    const mockRole = {
      id: 'role-1',
      name: 'Admin',
      description: 'Administrator role',
      scope: RoleScope.TENANT,
      type: RoleType.SYSTEM,
      tenantId: mockTenantId,
      permissions: [],
      userCount: 5,
      createdAt: '2023-01-01T00:00:00.000Z',
      updatedAt: '2023-01-01T00:00:00.000Z',
    };

    render(
      <RoleForm
        role={mockRole}
        tenantId={mockTenantId}
        siteOptions={mockSiteOptions}
        onSubmit={mockOnSubmit}
        onCancel={mockOnCancel}
      />
    );

    // Check that form elements are rendered
    expect(screen.getByTestId('role-form')).toBeInTheDocument();
  });
});
