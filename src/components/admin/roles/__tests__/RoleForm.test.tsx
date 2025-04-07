/**
 * @jest-environment jsdom
 */
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { RoleForm } from '../RoleForm';
import { Role, RoleScope, RoleType } from '@/types/role';

describe('RoleForm Component', () => {
  const mockRole: Role = {
    id: 'role-1',
    name: 'Admin',
    description: 'Administrator role',
    type: RoleType.CUSTOM,
    scope: RoleScope.TENANT,
    tenantId: 'tenant-1',
    permissions: [
      { resource: 'user', actions: ['create', 'read', 'update', 'delete'] },
      { resource: 'role', actions: ['read'] }
    ],
    userCount: 5,
    createdAt: '2023-01-01T00:00:00.000Z',
    updatedAt: '2023-01-01T00:00:00.000Z'
  };

  const mockSiteOptions = [
    { id: 'site-1', name: 'Site 1' },
    { id: 'site-2', name: 'Site 2' }
  ];

  const mockOnSubmit = jest.fn();
  const mockOnCancel = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders create form correctly', () => {
    render(
      <RoleForm
        tenantId="tenant-1"
        siteOptions={mockSiteOptions}
        onSubmit={mockOnSubmit}
        onCancel={mockOnCancel}
      />
    );
    
    // Check that the form title is rendered
    expect(screen.getByText('Create Role')).toBeInTheDocument();
    
    // Check that the form fields are rendered
    expect(screen.getByLabelText('Name')).toBeInTheDocument();
    expect(screen.getByLabelText('Description')).toBeInTheDocument();
    expect(screen.getByLabelText('Scope')).toBeInTheDocument();
    
    // Check that the buttons are rendered
    expect(screen.getByText('Create')).toBeInTheDocument();
    expect(screen.getByText('Cancel')).toBeInTheDocument();
  });

  it('renders edit form correctly', () => {
    render(
      <RoleForm
        role={mockRole}
        tenantId="tenant-1"
        siteOptions={mockSiteOptions}
        onSubmit={mockOnSubmit}
        onCancel={mockOnCancel}
      />
    );
    
    // Check that the form title is rendered
    expect(screen.getByText('Edit Role')).toBeInTheDocument();
    
    // Check that the form fields are pre-filled
    expect(screen.getByLabelText('Name')).toHaveValue('Admin');
    expect(screen.getByLabelText('Description')).toHaveValue('Administrator role');
    
    // Check that the buttons are rendered
    expect(screen.getByText('Save')).toBeInTheDocument();
    expect(screen.getByText('Cancel')).toBeInTheDocument();
  });

  it('validates required fields', async () => {
    render(
      <RoleForm
        tenantId="tenant-1"
        siteOptions={mockSiteOptions}
        onSubmit={mockOnSubmit}
        onCancel={mockOnCancel}
      />
    );
    
    // Submit the form without filling required fields
    fireEvent.click(screen.getByText('Create'));
    
    // Check that validation errors are displayed
    await waitFor(() => {
      expect(screen.getByText('Name is required')).toBeInTheDocument();
    });
    
    // Check that onSubmit was not called
    expect(mockOnSubmit).not.toHaveBeenCalled();
  });

  it('submits form with valid data', async () => {
    render(
      <RoleForm
        tenantId="tenant-1"
        siteOptions={mockSiteOptions}
        onSubmit={mockOnSubmit}
        onCancel={mockOnCancel}
      />
    );
    
    // Fill in the form
    fireEvent.change(screen.getByLabelText('Name'), { target: { value: 'New Role' } });
    fireEvent.change(screen.getByLabelText('Description'), { target: { value: 'New role description' } });
    
    // Select tenant scope
    fireEvent.click(screen.getByLabelText('Scope'));
    fireEvent.click(screen.getByText('Tenant'));
    
    // Submit the form
    fireEvent.click(screen.getByText('Create'));
    
    // Check that onSubmit was called with the correct data
    await waitFor(() => {
      expect(mockOnSubmit).toHaveBeenCalledWith({
        name: 'New Role',
        description: 'New role description',
        scope: RoleScope.TENANT,
        tenantId: 'tenant-1',
        type: RoleType.CUSTOM
      });
    });
  });

  it('shows site selection when site scope is selected', async () => {
    render(
      <RoleForm
        tenantId="tenant-1"
        siteOptions={mockSiteOptions}
        onSubmit={mockOnSubmit}
        onCancel={mockOnCancel}
      />
    );
    
    // Select site scope
    fireEvent.click(screen.getByLabelText('Scope'));
    fireEvent.click(screen.getByText('Site'));
    
    // Check that site selection is displayed
    await waitFor(() => {
      expect(screen.getByLabelText('Site')).toBeInTheDocument();
    });
    
    // Select a site
    fireEvent.click(screen.getByLabelText('Site'));
    fireEvent.click(screen.getByText('Site 1'));
    
    // Fill in other required fields
    fireEvent.change(screen.getByLabelText('Name'), { target: { value: 'Site Role' } });
    
    // Submit the form
    fireEvent.click(screen.getByText('Create'));
    
    // Check that onSubmit was called with the correct data
    await waitFor(() => {
      expect(mockOnSubmit).toHaveBeenCalledWith({
        name: 'Site Role',
        description: '',
        scope: RoleScope.SITE,
        tenantId: 'tenant-1',
        siteId: 'site-1',
        type: RoleType.CUSTOM
      });
    });
  });

  it('calls onCancel when cancel button is clicked', () => {
    render(
      <RoleForm
        tenantId="tenant-1"
        siteOptions={mockSiteOptions}
        onSubmit={mockOnSubmit}
        onCancel={mockOnCancel}
      />
    );
    
    // Click cancel button
    fireEvent.click(screen.getByText('Cancel'));
    
    // Check that onCancel was called
    expect(mockOnCancel).toHaveBeenCalled();
  });
});
