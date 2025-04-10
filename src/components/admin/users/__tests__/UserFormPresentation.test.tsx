import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { UserFormPresentation } from '../UserFormPresentation';

// Mock the Button component
jest.mock('@/components/ui/Button', () => ({
  Button: ({ children, onClick, type, ...props }: any) => (
    <button
      onClick={onClick}
      type={type}
      disabled={props.isLoading}
      data-testid={props['data-testid']}
    >
      {children}
    </button>
  )
}));

// Mock the child components
jest.mock('../UserBasicInfo', () => ({
  UserBasicInfo: ({ formData, errors, onChange, isExistingUser }: any) => (
    <div data-testid="mock-basic-info">
      <input
        data-testid="mock-name-input"
        value={formData.name}
        onChange={(e: any) => onChange('name', e.target.value)}
      />
      {errors.name && <div data-testid="mock-name-error">{errors.name}</div>}
      <div>Is Existing User: {isExistingUser ? 'Yes' : 'No'}</div>
    </div>
  )
}));

jest.mock('../UserSiteAssociations', () => ({
  UserSiteAssociations: ({ selectedSiteIds, sites, onChange, error }: any) => (
    <div data-testid="mock-site-associations">
      <select
        data-testid="mock-sites-select"
        multiple
        value={selectedSiteIds}
        onChange={(e: any) => {
          const options = e.target.options;
          const values: string[] = [];
          for (let i = 0; i < options.length; i++) {
            if (options[i].selected) {
              values.push(options[i].value);
            }
          }
          onChange('siteIds', values);
        }}
      >
        {sites.map((site: any) => (
          <option key={site.id} value={site.id}>
            {site.name}
          </option>
        ))}
      </select>
      {error && <div data-testid="mock-sites-error">{error}</div>}
    </div>
  )
}));

jest.mock('../UserPermissions', () => ({
  UserPermissions: ({ acl, sites, onChange }: any) => (
    <div data-testid="mock-permissions">
      <button
        data-testid="mock-toggle-permission"
        onClick={() => onChange({
          ...acl,
          entries: [
            ...acl.entries,
            {
              resource: { type: 'site', siteId: sites[0]?.id },
              permission: 'read'
            }
          ]
        })}
      >
        Toggle Permission
      </button>
      <div>Sites: {sites.map((s: any) => s.name).join(', ')}</div>
    </div>
  )
}));

describe('UserFormPresentation Component', () => {
  const mockProps = {
    // Form data
    formData: {
      id: '',
      name: 'Test User',
      email: 'test@example.com',
      password: 'password123',
      siteIds: ['site-1']
    },
    acl: {
      userId: 'new-user',
      entries: []
    },
    errors: {},

    // Form state
    isExistingUser: false,
    isSubmitting: false,
    error: null,
    sites: [
      { id: 'site-1', name: 'Site 1' },
      { id: 'site-2', name: 'Site 2' }
    ],

    // Handlers
    updateFormField: jest.fn(),
    handleACLChange: jest.fn(),
    handleSubmit: jest.fn((e) => e.preventDefault()),
    onCancel: jest.fn()
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders all form sections', () => {
    render(<UserFormPresentation {...mockProps} />);

    expect(screen.getByTestId('user-form')).toBeInTheDocument();
    expect(screen.getByTestId('mock-basic-info')).toBeInTheDocument();
    expect(screen.getByTestId('mock-site-associations')).toBeInTheDocument();
    expect(screen.getByTestId('mock-permissions')).toBeInTheDocument();
    expect(screen.getByTestId('cancel-button')).toBeInTheDocument();
    expect(screen.getByTestId('submit-button')).toBeInTheDocument();
  });

  it('displays error message when error prop is provided', () => {
    render(<UserFormPresentation {...mockProps} error="Test error message" />);

    expect(screen.getByTestId('form-error')).toBeInTheDocument();
    expect(screen.getByText('Test error message')).toBeInTheDocument();
  });

  it('shows correct button text for new user', () => {
    render(<UserFormPresentation {...mockProps} />);
    expect(screen.getByTestId('submit-button')).toHaveTextContent('Create User');
  });

  it('renders with isSubmitting prop', () => {
    render(<UserFormPresentation {...mockProps} isSubmitting={true} />);
    // Just verify it renders without errors
    expect(screen.getByTestId('submit-button')).toBeInTheDocument();
  });

  it('shows correct button text for existing user', () => {
    render(<UserFormPresentation {...mockProps} isExistingUser={true} />);
    expect(screen.getByTestId('submit-button')).toHaveTextContent('Update User');
  });

  it('renders cancel and submit buttons', () => {
    render(<UserFormPresentation {...mockProps} />);

    expect(screen.getByTestId('cancel-button')).toBeInTheDocument();
    expect(screen.getByTestId('submit-button')).toBeInTheDocument();
  });

  it('renders with isSubmitting prop for both buttons', () => {
    render(<UserFormPresentation {...mockProps} isSubmitting={true} />);

    // Just verify both buttons render without errors
    expect(screen.getByTestId('cancel-button')).toBeInTheDocument();
    expect(screen.getByTestId('submit-button')).toBeInTheDocument();
  });

  it('calls handleSubmit when form is submitted', () => {
    render(<UserFormPresentation {...mockProps} />);

    fireEvent.submit(screen.getByTestId('user-form'));

    expect(mockProps.handleSubmit).toHaveBeenCalled();
  });

  it('calls onCancel when cancel button is clicked', () => {
    render(<UserFormPresentation {...mockProps} />);

    fireEvent.click(screen.getByTestId('cancel-button'));

    expect(mockProps.onCancel).toHaveBeenCalled();
  });

  it('calls updateFormField when child components trigger changes', () => {
    render(<UserFormPresentation {...mockProps} />);

    fireEvent.change(screen.getByTestId('mock-name-input'), { target: { value: 'New Name' } });

    expect(mockProps.updateFormField).toHaveBeenCalledWith('name', 'New Name');
  });

  it('calls handleACLChange when permissions are changed', () => {
    render(<UserFormPresentation {...mockProps} />);

    fireEvent.click(screen.getByTestId('mock-toggle-permission'));

    expect(mockProps.handleACLChange).toHaveBeenCalled();
  });
});
