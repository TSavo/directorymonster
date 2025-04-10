/**
 * @jest-environment jsdom
 */

import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { UserForm } from '@/components/admin/users/UserForm';

// Mock the child components
jest.mock('@/components/admin/users/UserBasicInfo', () => ({
  UserBasicInfo: ({ formData, errors, onChange, isExistingUser }: any) => (
    <div data-testid="user-basic-info">
      <input
        data-testid="name-input"
        value={formData.name}
        onChange={(e) => onChange('name', e.target.value)}
      />
      <input
        data-testid="email-input"
        value={formData.email}
        onChange={(e) => onChange('email', e.target.value)}
      />
      <input
        data-testid="password-input"
        type="password"
        value={formData.password}
        onChange={(e) => onChange('password', e.target.value)}
      />
      {errors.name && <div data-testid="name-error">{errors.name}</div>}
      {errors.email && <div data-testid="email-error">{errors.email}</div>}
      {errors.password && <div data-testid="password-error">{errors.password}</div>}
    </div>
  ),
}));

jest.mock('@/components/admin/users/UserSiteAssociations', () => ({
  UserSiteAssociations: ({ selectedSiteIds, sites, onChange, error }: any) => (
    <div data-testid="user-site-associations">
      {sites.map((site: any) => (
        <div key={site.id}>
          <input
            type="checkbox"
            data-testid={`site-checkbox-${site.id}`}
            checked={selectedSiteIds.includes(site.id)}
            onChange={() => {
              const newSiteIds = selectedSiteIds.includes(site.id)
                ? selectedSiteIds.filter((id: string) => id !== site.id)
                : [...selectedSiteIds, site.id];
              onChange('siteIds', newSiteIds);
            }}
          />
          <label>{site.name}</label>
        </div>
      ))}
      {error && <div data-testid="sites-error">{error}</div>}
    </div>
  ),
}));

jest.mock('@/components/admin/users/UserPermissions', () => ({
  UserPermissions: ({ acl, sites, onChange }: any) => (
    <div data-testid="user-permissions">
      <button
        data-testid="add-permission-button"
        onClick={() => onChange({
          ...acl,
          entries: [
            ...acl.entries,
            { resource: 'listing', action: 'create', siteId: sites[0]?.id }
          ]
        })}
      >
        Add Permission
      </button>
    </div>
  ),
}));

describe('UserForm Component', () => {
  const mockUser = {
    id: 'user-1',
    name: 'John Doe',
    email: 'john@example.com',
    siteIds: ['site-1'],
    acl: {
      userId: 'user-1',
      entries: [
        { resource: 'listing', action: 'read', siteId: 'site-1' }
      ]
    },
    createdAt: '2023-01-01T00:00:00.000Z',
  };

  const mockSites = [
    { id: 'site-1', name: 'Site 1' },
    { id: 'site-2', name: 'Site 2' },
  ];

  const mockOnSubmit = jest.fn().mockResolvedValue({});
  const mockOnCancel = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders the form with user data for editing', async () => {
    render(
      <UserForm
        user={mockUser}
        onSubmit={mockOnSubmit}
        onCancel={mockOnCancel}
        isSubmitting={false}
        sites={mockSites}
      />
    );

    // Check that form sections are rendered
    await waitFor(() => {
      expect(screen.getByTestId('user-basic-info')).toBeInTheDocument();
      expect(screen.getByTestId('user-site-associations')).toBeInTheDocument();
      expect(screen.getByTestId('user-permissions')).toBeInTheDocument();
    });

    // Check that form fields have the correct values
    expect(screen.getByTestId('name-input')).toHaveValue('John Doe');
    expect(screen.getByTestId('email-input')).toHaveValue('john@example.com');

    // Check that site checkbox is checked
    expect(screen.getByTestId('site-checkbox-site-1')).toBeChecked();
  });

  it('renders the form with empty data for creating a new user', async () => {
    render(
      <UserForm
        onSubmit={mockOnSubmit}
        onCancel={mockOnCancel}
        isSubmitting={false}
        sites={mockSites}
      />
    );

    // Check that form sections are rendered
    await waitFor(() => {
      expect(screen.getByTestId('user-basic-info')).toBeInTheDocument();
      expect(screen.getByTestId('user-site-associations')).toBeInTheDocument();
      expect(screen.getByTestId('user-permissions')).toBeInTheDocument();
    });

    // Check that form fields are empty
    expect(screen.getByTestId('name-input')).toHaveValue('');
    expect(screen.getByTestId('email-input')).toHaveValue('');

    // Check that site checkboxes are not checked
    expect(screen.getByTestId('site-checkbox-site-1')).not.toBeChecked();
    expect(screen.getByTestId('site-checkbox-site-2')).not.toBeChecked();
  });

  it('validates form fields on submission', async () => {
    render(
      <UserForm
        onSubmit={mockOnSubmit}
        onCancel={mockOnCancel}
        isSubmitting={false}
        sites={mockSites}
      />
    );

    // Submit the form without filling in required fields
    const submitButton = screen.getByTestId('submit-button');
    fireEvent.click(submitButton);

    // Check that validation errors are displayed
    await waitFor(() => {
      expect(screen.getByTestId('name-error')).toBeInTheDocument();
      expect(screen.getByTestId('email-error')).toBeInTheDocument();
    });

    // Check that onSubmit was not called
    expect(mockOnSubmit).not.toHaveBeenCalled();
  });

  it('calls onSubmit with form data when valid form is submitted', async () => {
    render(
      <UserForm
        onSubmit={mockOnSubmit}
        onCancel={mockOnCancel}
        isSubmitting={false}
        sites={mockSites}
      />
    );

    // Fill in the form
    fireEvent.change(screen.getByTestId('name-input'), { target: { value: 'New User' } });
    fireEvent.change(screen.getByTestId('email-input'), { target: { value: 'new@example.com' } });
    fireEvent.change(screen.getByTestId('password-input'), { target: { value: 'password123' } });

    // Select a site
    fireEvent.click(screen.getByTestId('site-checkbox-site-1'));

    // Add a permission
    fireEvent.click(screen.getByTestId('add-permission-button'));

    // Submit the form
    const submitButton = screen.getByTestId('submit-button');
    fireEvent.click(submitButton);

    // Check that onSubmit was called with the correct data
    await waitFor(() => {
      expect(mockOnSubmit).toHaveBeenCalledWith(expect.objectContaining({
        name: 'New User',
        email: 'new@example.com',
        password: 'password123',
        siteIds: ['site-1'],
        acl: expect.objectContaining({
          entries: expect.arrayContaining([
            expect.objectContaining({
              resource: 'listing',
              action: 'create',
              siteId: 'site-1'
            })
          ])
        })
      }));
    });
  });

  it('calls onCancel when cancel button is clicked', async () => {
    render(
      <UserForm
        onSubmit={mockOnSubmit}
        onCancel={mockOnCancel}
        isSubmitting={false}
        sites={mockSites}
      />
    );

    // Click the cancel button
    const cancelButton = screen.getByRole('button', { name: /cancel/i });
    fireEvent.click(cancelButton);

    // Check that onCancel was called
    expect(mockOnCancel).toHaveBeenCalledTimes(1);
  });

  it('disables form controls when isSubmitting is true', async () => {
    render(
      <UserForm
        onSubmit={mockOnSubmit}
        onCancel={mockOnCancel}
        isSubmitting={true}
        sites={mockSites}
      />
    );

    // Check that submit button is disabled
    const submitButton = screen.getByRole('button', { name: /saving/i });
    expect(submitButton).toBeDisabled();
  });

  it('displays error message when error prop is provided', async () => {
    render(
      <UserForm
        onSubmit={mockOnSubmit}
        onCancel={mockOnCancel}
        isSubmitting={false}
        error="Failed to save user"
        sites={mockSites}
      />
    );

    // Check that error message is displayed
    await waitFor(() => {
      expect(screen.getByText('Failed to save user')).toBeInTheDocument();
    });
  });
});
