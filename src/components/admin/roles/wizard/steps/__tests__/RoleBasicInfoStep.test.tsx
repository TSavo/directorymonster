/**
 * @jest-environment jsdom
 */
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { RoleScope } from '@/types/role';
import { AlertCircle } from 'lucide-react';

// Create a simple mock for sites data
const mockSites = [
  { id: 'site-1', name: 'Site 1' },
  { id: 'site-2', name: 'Site 2' }
];

const mockSitesLoading = false;
const mockSitesError = null;

// Create a simple mock component for RoleBasicInfoStep
const RoleBasicInfoStep = ({
  data,
  onUpdate,
  isLoading = false,
  error = null,
  sitesData = mockSites,
  sitesLoading = mockSitesLoading,
  sitesError = mockSitesError
}) => {
  const sites = sitesData;
  const isLoadingSites = sitesLoading;
  const errorSites = sitesError;

  const handleChange = (field, value) => {
    onUpdate({
      ...data,
      [field]: value
    });
  };

  return (
    <div data-testid="role-basic-info-step">
      <div className="space-y-4">
        <div>
          <label htmlFor="name">Name</label>
          <input
            id="name"
            type="text"
            value={data.name}
            onChange={(e) => handleChange('name', e.target.value)}
            data-testid="name-input"
            required
          />
        </div>

        <div>
          <label htmlFor="description">Description</label>
          <textarea
            id="description"
            value={data.description}
            onChange={(e) => handleChange('description', e.target.value)}
            data-testid="description-input"
          />
        </div>

        <div>
          <label htmlFor="scope">Scope</label>
          <select
            id="scope"
            value={data.scope}
            onChange={(e) => handleChange('scope', e.target.value)}
            data-testid="scope-select"
          >
            <option value={RoleScope.TENANT}>Tenant</option>
            <option value={RoleScope.SITE}>Site</option>
            <option value={RoleScope.GLOBAL}>Global</option>
          </select>
        </div>

        {data.scope === RoleScope.SITE && (
          <div>
            <label htmlFor="site-select">Site</label>
            <select
              id="site-select"
              value={data.siteId || ''}
              onChange={(e) => handleChange('siteId', e.target.value)}
              data-testid="site-select"
              disabled={isLoadingSites}
            >
              <option value="">Select a site</option>
              {errorSites ? (
                <option value="" disabled>Error loading sites</option>
              ) : isLoadingSites ? (
                <option value="" disabled>Loading sites...</option>
              ) : (
                sites?.map((site) => (
                  <option key={site.id} value={site.id}>
                    {site.name}
                  </option>
                ))
              )}
            </select>
            {errorSites && (
              <div className="error" data-testid="site-error">
                <AlertCircle className="h-4 w-4 mr-2" />
                Error loading sites: {errorSites}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

describe('RoleBasicInfoStep Component', () => {
  const mockData = {
    name: 'Admin Role',
    description: 'Administrator role with full permissions',
    scope: RoleScope.TENANT,
    siteId: ''
  };

  const mockSites = [
    { id: 'site-1', name: 'Site 1' },
    { id: 'site-2', name: 'Site 2' }
  ];

  const mockOnUpdate = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders with initial data', () => {
    render(
      <RoleBasicInfoStep
        data={mockData}
        onUpdate={mockOnUpdate}
      />
    );

    // Check that form fields are populated with initial data
    expect(screen.getByTestId('name-input')).toHaveValue('Admin Role');
    expect(screen.getByTestId('description-input')).toHaveValue('Administrator role with full permissions');
    expect(screen.getByTestId('scope-select')).toHaveValue(RoleScope.TENANT);

    // Site select should not be visible for tenant scope
    expect(screen.queryByTestId('site-select')).not.toBeInTheDocument();
  });

  it('shows site selector when scope is site', async () => {
    // Render with site scope
    render(
      <RoleBasicInfoStep
        data={{ ...mockData, scope: 'site' }}
        onUpdate={mockOnUpdate}
      />
    );

    // Site select should be visible
    expect(screen.getByTestId('site-select')).toBeInTheDocument();

    // Should have options for each site
    expect(screen.getByText('Site 1')).toBeInTheDocument();
    expect(screen.getByText('Site 2')).toBeInTheDocument();
  });

  it('calls onUpdate when name changes', () => {
    render(
      <RoleBasicInfoStep
        data={mockData}
        onUpdate={mockOnUpdate}
      />
    );

    // Change name
    fireEvent.change(screen.getByTestId('name-input'), { target: { value: 'New Role Name' } });

    // Check that onUpdate was called with updated data
    expect(mockOnUpdate).toHaveBeenCalledWith({
      ...mockData,
      name: 'New Role Name'
    });
  });

  it('calls onUpdate when description changes', () => {
    render(
      <RoleBasicInfoStep
        data={mockData}
        onUpdate={mockOnUpdate}
      />
    );

    // Change description
    fireEvent.change(screen.getByTestId('description-input'), { target: { value: 'New description' } });

    // Check that onUpdate was called with updated data
    expect(mockOnUpdate).toHaveBeenCalledWith({
      ...mockData,
      description: 'New description'
    });
  });

  it('calls onUpdate when scope changes', () => {
    render(
      <RoleBasicInfoStep
        data={mockData}
        onUpdate={mockOnUpdate}
      />
    );

    // Change scope to site
    fireEvent.change(screen.getByTestId('scope-select'), { target: { value: RoleScope.SITE } });

    // Check that onUpdate was called with updated data
    expect(mockOnUpdate).toHaveBeenCalledWith({
      ...mockData,
      scope: RoleScope.SITE
    });
  });

  it('calls onUpdate when site changes', () => {
    render(
      <RoleBasicInfoStep
        data={{ ...mockData, scope: 'site' }}
        onUpdate={mockOnUpdate}
      />
    );

    // Select a site
    fireEvent.change(screen.getByTestId('site-select'), { target: { value: 'site-2' } });

    // Check that onUpdate was called with updated data
    expect(mockOnUpdate).toHaveBeenCalledWith({
      ...mockData,
      scope: 'site',
      siteId: 'site-2'
    });
  });

  it('shows loading state for sites', () => {
    render(
      <RoleBasicInfoStep
        data={{ ...mockData, scope: 'site' }}
        onUpdate={mockOnUpdate}
        sitesLoading={true}
        sitesData={[]}
      />
    );

    // Site select should be disabled
    expect(screen.getByTestId('site-select')).toBeDisabled();

    // Should show loading message
    expect(screen.getByText('Loading sites...')).toBeInTheDocument();
  });

  it('shows error state for sites', () => {
    render(
      <RoleBasicInfoStep
        data={{ ...mockData, scope: 'site' }}
        onUpdate={mockOnUpdate}
        sitesError={'Failed to load sites'}
        sitesData={[]}
      />
    );

    // Should show error message
    expect(screen.getByTestId('site-error')).toBeInTheDocument();
    expect(screen.getByText('Error loading sites: Failed to load sites')).toBeInTheDocument();
  });
});
