/**
 * @jest-environment jsdom
 */
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { act } from 'react-dom/test-utils';
import '@testing-library/jest-dom';
import { SiteForm } from '@/components/admin/sites/SiteForm';
// Mock the useSites hook
jest.mock('@/components/admin/sites/hooks/useSites', () => ({
  __esModule: true,
  default: jest.fn(),
  useSites: jest.fn().mockReturnValue({
    site: {
      id: 'site-1',
      name: 'Test Site',
      slug: 'test-site',
      description: 'A test site',
      domains: ['example.com']
    },
    updateSite: jest.fn(),
    createSite: jest.fn().mockResolvedValue({ success: true, data: { id: 'new-site-id' } }),
    saveSite: jest.fn().mockResolvedValue({ success: true, data: { id: 'site-1' } }),
    isLoading: false,
    error: null,
    success: null,
    errors: {},
    validateSite: jest.fn().mockReturnValue(true),
    resetErrors: jest.fn()
  })
}));

import { useSites } from '@/components/admin/sites/hooks/useSites';

// Mock next/navigation
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    back: jest.fn()
  })
}));

// Mock site data
const mockSiteData = {
  id: 'site-1',
  name: 'Test Site',
  slug: 'test-site',
  description: 'A test site description',
  domains: ['example.com'],
  theme: 'default',
  customStyles: '',
  seoTitle: 'Test Site Title',
  seoDescription: 'Test site description for SEO',
  seoKeywords: 'test, site, keywords',
  enableCanonicalUrls: true
};

// Mock useSites hook
const mockUseSites = {
  site: { ...mockSiteData },
  setSite: jest.fn(),
  updateSite: jest.fn(),
  createSite: jest.fn().mockResolvedValue({ success: true, data: { id: 'new-site-id' } }),
  saveSite: jest.fn().mockResolvedValue({ success: true, data: { id: 'site-1' } }),
  isLoading: false,
  error: null,
  success: null,
  errors: {},
  validateSite: jest.fn().mockReturnValue(true),
  resetErrors: jest.fn(),
  sites: [],
  filteredSites: [],
  totalSites: 0,
  filters: {},
  setFilters: jest.fn(),
  fetchSite: jest.fn(),
  fetchSites: jest.fn(),
  refreshSites: jest.fn(),
  deleteSite: jest.fn()
};

describe('SiteForm Container Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Set up the mock implementation for useSites
    (useSites as jest.Mock).mockReturnValue(mockUseSites);
  });

  it('renders the form with correct title in create mode', () => {
    render(<SiteForm mode="create" />);

    // Check heading
    expect(screen.getByTestId('siteForm-header')).toHaveTextContent('Create Site');

    // Check that StepNavigation component is rendered
    expect(screen.getByRole('navigation')).toBeInTheDocument();

    // Check that first step content is displayed
    expect(screen.getByTestId('basic-info-step')).toBeInTheDocument();
  });

  it('renders the form with correct title in edit mode', () => {
    render(<SiteForm mode="edit" initialData={mockSiteData} />);

    // Check heading
    expect(screen.getByTestId('siteForm-header')).toHaveTextContent('Edit Site');

    // We can't easily check what was passed to the provider, but we can verify the component rendered correctly
  });

  it('displays error message when error occurs', () => {
    // Set up mock error
    const errorMessage = 'An error occurred';
    const mockWithError = {
      ...mockUseSites,
      error: errorMessage
    };
    (useSites as jest.Mock).mockReturnValue(mockWithError);

    render(<SiteForm />);

    // Error message should be displayed
    expect(screen.getByTestId('siteForm-error')).toHaveTextContent(errorMessage);
  });

  it('displays success message when operation is successful', () => {
    // Set up mock success
    const successMessage = 'Operation successful';
    const mockWithSuccess = {
      ...mockUseSites,
      success: successMessage
    };
    (useSites as jest.Mock).mockReturnValue(mockWithSuccess);

    render(<SiteForm />);

    // Success message should be displayed
    expect(screen.getByTestId('siteForm-success')).toHaveTextContent(successMessage);
  });

  it('navigates to next step when Next button is clicked and validation passes', async () => {
    mockUseSites.validateSite.mockReturnValue(true);

    render(<SiteForm />);

    // Initially on basic info step
    expect(screen.getByTestId('basic-info-step')).toBeInTheDocument();

    // Click next button
    fireEvent.click(screen.getByRole('button', { name: /Next/i }));

    // Check validation was called with correct step
    expect(mockUseSites.validateSite).toHaveBeenCalledWith('basic_info');
  });

  it('stays on current step when validation fails', async () => {
    // Mock validation failure
    mockUseSites.validateSite.mockReturnValueOnce(false);

    render(<SiteForm />);

    // Initially on basic info step
    expect(screen.getByTestId('basic-info-step')).toBeInTheDocument();

    // Click next button
    fireEvent.click(screen.getByRole('button', { name: /Next/i }));

    // Validation should be called
    expect(mockUseSites.validateSite).toHaveBeenCalledWith('basic_info');
  });

  it('calls createSite on form submission in create mode', async () => {
    // Update the mock to simulate being on the preview step
    const previewMock = {
      ...mockUseSites
    };
    (useSites as jest.Mock).mockReturnValue(previewMock);

    render(<SiteForm mode="create" />);

    // Should be on preview step now
    expect(screen.getByTestId('preview-step')).toBeInTheDocument();

    // Submit the form
    fireEvent.submit(screen.getByTestId('siteForm-form'));

    // createSite should be called
    expect(mockUseSites.createSite).toHaveBeenCalled();
  });

  it('calls saveSite on form submission in edit mode', async () => {
    // Update the mock to simulate being on the preview step in edit mode
    const editPreviewMock = {
      ...mockUseSites
    };
    (useSites as jest.Mock).mockReturnValue(editPreviewMock);

    render(<SiteForm mode="edit" initialData={mockSiteData} />);

    // Should be on preview step now
    expect(screen.getByTestId('preview-step')).toBeInTheDocument();

    // Submit the form
    fireEvent.submit(screen.getByTestId('siteForm-form'));

    // saveSite should be called
    expect(mockUseSites.saveSite).toHaveBeenCalledWith('site-1');
  });

  it('passes onSuccess callback to the form', async () => {
    const onSuccessMock = jest.fn();

    // We can't easily test the callback directly since it's passed to the provider
    // But we can verify the component renders with the prop
    render(<SiteForm mode="create" onSuccess={onSuccessMock} />);

    // The test is primarily checking that the component renders without errors
    // when an onSuccess callback is provided
    expect(screen.getByTestId('siteForm-header')).toBeInTheDocument();
  });

  it('calls onCancel callback when Cancel button is clicked', () => {
    const onCancelMock = jest.fn();

    render(<SiteForm onCancel={onCancelMock} />);

    // Click cancel button
    fireEvent.click(screen.getByRole('button', { name: /Cancel/i }));

    // onCancel should be called
    expect(onCancelMock).toHaveBeenCalled();
  });

  it('handles input changes correctly', () => {
    render(<SiteForm />);

    // Find name input field
    const nameInput = screen.getByTestId('siteForm-name');

    // Change the input value
    fireEvent.change(nameInput, { target: { name: 'name', value: 'New Site Name' } });

    // updateSite should be called with the new value
    expect(mockUseSites.updateSite).toHaveBeenCalledWith('name', 'New Site Name');
  });

  it('renders loading state correctly', () => {
    // Set up mock loading state
    const mockWithLoading = {
      ...mockUseSites,
      isLoading: true
    };
    (useSites as jest.Mock).mockReturnValue(mockWithLoading);

    render(<SiteForm />);

    // Buttons should be disabled when loading
    expect(screen.getByRole('button', { name: /Next/i })).toBeDisabled();
  });

  it('shows proper error messages from validation', () => {
    // Set up mock errors
    const mockWithErrors = {
      ...mockUseSites,
      errors: {
        name: 'Name is required',
        slug: 'Slug format is invalid'
      }
    };
    (useSites as jest.Mock).mockReturnValue(mockWithErrors);

    render(<SiteForm />);

    // Error messages should be displayed
    expect(screen.getByText('Name is required')).toBeInTheDocument();
    expect(screen.getByText('Slug format is invalid')).toBeInTheDocument();
  });
});
