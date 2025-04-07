/**
 * @jest-environment jsdom
 */

import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { RoleForm } from '@/components/admin/roles/RoleForm';
import { RoleScope, RoleType } from '@/types/role';

// Mock the UI components
jest.mock('@/components/ui/form', () => ({
  Form: ({ children, ...props }: any) => <form {...props}>{children}</form>,
  FormField: ({ control, name, render }: any) => render({ field: { name, value: '', onChange: jest.fn() } }),
  FormItem: ({ children }: any) => <div>{children}</div>,
  FormLabel: ({ children }: any) => <label>{children}</label>,
  FormControl: ({ children }: any) => <div>{children}</div>,
  FormDescription: ({ children }: any) => <div>{children}</div>,
  FormMessage: ({ children }: any) => <div>{children}</div>,
}));

jest.mock('@/components/ui/input', () => ({
  Input: (props: any) => <input data-testid={`input-${props.name}`} {...props} />,
}));

jest.mock('@/components/ui/textarea', () => ({
  Textarea: (props: any) => <textarea data-testid={`textarea-${props.name}`} {...props} />,
}));

jest.mock('@/components/ui/select', () => ({
  Select: ({ children, onValueChange, value }: any) => (
    <div>
      <select 
        data-testid="select" 
        value={value} 
        onChange={(e) => onValueChange(e.target.value)}
      >
        {children}
      </select>
    </div>
  ),
  SelectTrigger: ({ children }: any) => <div>{children}</div>,
  SelectValue: ({ placeholder }: any) => <span>{placeholder}</span>,
  SelectContent: ({ children }: any) => <div>{children}</div>,
  SelectItem: ({ value, children }: any) => <option value={value}>{children}</option>,
}));

jest.mock('@/components/ui/button', () => ({
  Button: ({ children, onClick, type, disabled }: any) => (
    <button 
      onClick={onClick} 
      type={type} 
      disabled={disabled}
      data-testid={`button-${children.toString().toLowerCase().replace(/\s+/g, '-')}`}
    >
      {children}
    </button>
  ),
}));

describe('RoleForm Component', () => {
  const mockRole = {
    id: 'role-1',
    name: 'Admin',
    description: 'Administrator role',
    scope: RoleScope.TENANT,
    type: RoleType.CUSTOM,
    tenantId: 'tenant-1',
    createdAt: '2023-01-01T00:00:00.000Z',
    updatedAt: '2023-01-01T00:00:00.000Z',
  };

  const mockSiteOptions = [
    { id: 'site-1', name: 'Site 1' },
    { id: 'site-2', name: 'Site 2' },
  ];

  const mockOnSubmit = jest.fn();
  const mockOnCancel = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders the form with role data for editing', async () => {
    render(
      <RoleForm
        role={mockRole}
        tenantId="tenant-1"
        siteOptions={mockSiteOptions}
        onSubmit={mockOnSubmit}
        onCancel={mockOnCancel}
      />
    );

    // Check that form fields are rendered
    await waitFor(() => {
      expect(screen.getByText('Name')).toBeInTheDocument();
      expect(screen.getByText('Description')).toBeInTheDocument();
      expect(screen.getByText('Scope')).toBeInTheDocument();
    });

    // Check that form fields have the correct values
    expect(screen.getByTestId('input-name')).toHaveValue('Admin');
    expect(screen.getByTestId('textarea-description')).toHaveValue('Administrator role');
    
    // Check that buttons are rendered
    expect(screen.getByTestId('button-save')).toBeInTheDocument();
    expect(screen.getByTestId('button-cancel')).toBeInTheDocument();
  });

  it('renders the form with empty data for creating a new role', async () => {
    render(
      <RoleForm
        tenantId="tenant-1"
        siteOptions={mockSiteOptions}
        onSubmit={mockOnSubmit}
        onCancel={mockOnCancel}
      />
    );

    // Check that form fields are rendered
    await waitFor(() => {
      expect(screen.getByText('Name')).toBeInTheDocument();
      expect(screen.getByText('Description')).toBeInTheDocument();
      expect(screen.getByText('Scope')).toBeInTheDocument();
    });

    // Check that form fields are empty
    expect(screen.getByTestId('input-name')).toHaveValue('');
    expect(screen.getByTestId('textarea-description')).toHaveValue('');
  });

  it('calls onSubmit with form data when form is submitted', async () => {
    render(
      <RoleForm
        tenantId="tenant-1"
        siteOptions={mockSiteOptions}
        onSubmit={mockOnSubmit}
        onCancel={mockOnCancel}
      />
    );

    // Fill in the form
    fireEvent.change(screen.getByTestId('input-name'), { target: { value: 'New Role' } });
    fireEvent.change(screen.getByTestId('textarea-description'), { target: { value: 'New role description' } });
    
    // Select tenant scope
    fireEvent.change(screen.getByTestId('select'), { target: { value: RoleScope.TENANT } });

    // Submit the form
    fireEvent.submit(screen.getByRole('form'));

    // Check that onSubmit was called with the correct data
    await waitFor(() => {
      expect(mockOnSubmit).toHaveBeenCalledWith(expect.objectContaining({
        name: 'New Role',
        description: 'New role description',
        scope: RoleScope.TENANT,
        tenantId: 'tenant-1',
      }));
    });
  });

  it('calls onCancel when cancel button is clicked', async () => {
    render(
      <RoleForm
        tenantId="tenant-1"
        siteOptions={mockSiteOptions}
        onSubmit={mockOnSubmit}
        onCancel={mockOnCancel}
      />
    );

    // Click the cancel button
    fireEvent.click(screen.getByTestId('button-cancel'));

    // Check that onCancel was called
    expect(mockOnCancel).toHaveBeenCalledTimes(1);
  });

  it('disables name field for system roles', async () => {
    const systemRole = {
      ...mockRole,
      type: RoleType.SYSTEM,
    };

    render(
      <RoleForm
        role={systemRole}
        tenantId="tenant-1"
        siteOptions={mockSiteOptions}
        onSubmit={mockOnSubmit}
        onCancel={mockOnCancel}
      />
    );

    // Check that name field is disabled
    await waitFor(() => {
      expect(screen.getByTestId('input-name')).toBeDisabled();
    });
  });

  it('shows site selector when site scope is selected', async () => {
    render(
      <RoleForm
        tenantId="tenant-1"
        siteOptions={mockSiteOptions}
        onSubmit={mockOnSubmit}
        onCancel={mockOnCancel}
      />
    );

    // Select site scope
    fireEvent.change(screen.getByTestId('select'), { target: { value: RoleScope.SITE } });

    // Check that site selector is displayed
    await waitFor(() => {
      expect(screen.getByText('Site')).toBeInTheDocument();
    });
  });

  it('hides site selector when tenant or global scope is selected', async () => {
    render(
      <RoleForm
        tenantId="tenant-1"
        siteOptions={mockSiteOptions}
        onSubmit={mockOnSubmit}
        onCancel={mockOnCancel}
      />
    );

    // Select tenant scope
    fireEvent.change(screen.getByTestId('select'), { target: { value: RoleScope.TENANT } });

    // Check that site selector is not displayed
    await waitFor(() => {
      expect(screen.queryByText('Site')).not.toBeInTheDocument();
    });

    // Select global scope
    fireEvent.change(screen.getByTestId('select'), { target: { value: RoleScope.GLOBAL } });

    // Check that site selector is not displayed
    await waitFor(() => {
      expect(screen.queryByText('Site')).not.toBeInTheDocument();
    });
  });
});
