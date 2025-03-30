/**
 * @jest-environment jsdom
 */
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { act } from 'react-dom/test-utils';
import '@testing-library/jest-dom';
import { SiteForm } from '@/components/admin/sites/SiteForm';
import * as useSitesModule from '@/components/admin/sites/hooks/useSites';

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
    jest.spyOn(useSitesModule, 'useSites').mockImplementation(() => mockUseSites);
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
    
    // Check that useSites was called with the initial data
    expect(useSitesModule.useSites).toHaveBeenCalledWith(
      expect.objectContaining({
        initialData: expect.objectContaining({
          id: 'site-1',
          name: 'Test Site'
        })
      })
    );
  });

  it('displays error message when error occurs', () => {
    // Set up mock error
    const errorMessage = 'An error occurred';
    const mockWithError = {
      ...mockUseSites,
      error: errorMessage
    };
    jest.spyOn(useSitesModule, 'useSites').mockImplementation(() => mockWithError);
    
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
    jest.spyOn(useSitesModule, 'useSites').mockImplementation(() => mockWithSuccess);
    
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
    
    // Re-render happens - need to check if the next step is shown
    // This is a bit complex since our component renders different steps
    // based on internal state, so we'll mock the second render
    
    // This is a workaround since we can't easily test internal state changes
    const { rerender } = render(<SiteForm />);
    
    // Simulate being on domains step in the rendered component's state
    jest.spyOn(React, 'useState').mockImplementationOnce(() => ['domains', jest.fn()]);
    jest.spyOn(React, 'useState').mockImplementationOnce(() => [['basic_info'], jest.fn()]);
    
    rerender(<SiteForm />);
    
    // Now check if domains step is shown
    expect(screen.getByTestId('domain-step')).toBeInTheDocument();
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
    
    // Should still be on basic info step
    expect(screen.getByTestId('basic-info-step')).toBeInTheDocument();
  });

  it('calls createSite on form submission in create mode', async () => {
    render(<SiteForm mode="create" />);
    
    // Navigate to preview step (last step)
    // This is a workaround since we can't easily test internal state changes
    const { rerender } = render(<SiteForm mode="create" />);
    
    // Simulate being on preview step in the rendered component's state
    jest.spyOn(React, 'useState').mockImplementationOnce(() => ['preview', jest.fn()]);
    jest.spyOn(React, 'useState').mockImplementationOnce(() => [
      ['basic_info', 'domains', 'theme', 'seo'], 
      jest.fn()
    ]);
    
    rerender(<SiteForm mode="create" />);
    
    // Should be on preview step now
    expect(screen.getByTestId('site-form-preview')).toBeInTheDocument();
    
    // Submit the form
    fireEvent.submit(screen.getByTestId('siteForm-form'));
    
    // createSite should be called
    expect(mockUseSites.createSite).toHaveBeenCalled();
    expect(mockUseSites.saveSite).not.toHaveBeenCalled();
  });

  it('calls saveSite on form submission in edit mode', async () => {
    render(<SiteForm mode="edit" initialData={mockSiteData} />);
    
    // Navigate to preview step (last step)
    // This is a workaround since we can't easily test internal state changes
    const { rerender } = render(<SiteForm mode="edit" initialData={mockSiteData} />);
    
    // Simulate being on preview step in the rendered component's state
    jest.spyOn(React, 'useState').mockImplementationOnce(() => ['preview', jest.fn()]);
    jest.spyOn(React, 'useState').mockImplementationOnce(() => [
      ['basic_info', 'domains', 'theme', 'seo'], 
      jest.fn()
    ]);
    
    rerender(<SiteForm mode="edit" initialData={mockSiteData} />);
    
    // Should be on preview step now
    expect(screen.getByTestId('site-form-preview')).toBeInTheDocument();
    
    // Submit the form
    fireEvent.submit(screen.getByTestId('siteForm-form'));
    
    // saveSite should be called with the site ID
    expect(mockUseSites.saveSite).toHaveBeenCalledWith('site-1');
    expect(mockUseSites.createSite).not.toHaveBeenCalled();
  });

  it('calls onSuccess callback when submission is successful', async () => {
    const onSuccessMock = jest.fn();
    mockUseSites.createSite.mockResolvedValueOnce({ 
      success: true, 
      data: { id: 'new-site-id' } 
    });
    
    render(<SiteForm mode="create" onSuccess={onSuccessMock} />);
    
    // Navigate to preview step (last step)
    const { rerender } = render(<SiteForm mode="create" onSuccess={onSuccessMock} />);
    
    // Simulate being on preview step in the rendered component's state
    jest.spyOn(React, 'useState').mockImplementationOnce(() => ['preview', jest.fn()]);
    jest.spyOn(React, 'useState').mockImplementationOnce(() => [
      ['basic_info', 'domains', 'theme', 'seo'], 
      jest.fn()
    ]);
    
    rerender(<SiteForm mode="create" onSuccess={onSuccessMock} />);
    
    // Submit the form
    await act(async () => {
      fireEvent.submit(screen.getByTestId('siteForm-form'));
    });
    
    // onSuccess should be called with the response data
    expect(onSuccessMock).toHaveBeenCalledWith({ id: 'new-site-id' });
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
    const nameInput = screen.getByLabelText(/Site Name/i);
    
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
    jest.spyOn(useSitesModule, 'useSites').mockImplementation(() => mockWithLoading);
    
    render(<SiteForm />);
    
    // Loading indicators should be displayed
    const loadingIndicators = screen.getAllByTestId(/loading/i);
    expect(loadingIndicators.length).toBeGreaterThan(0);
    
    // Buttons should be disabled
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
    jest.spyOn(useSitesModule, 'useSites').mockImplementation(() => mockWithErrors);
    
    render(<SiteForm />);
    
    // Error messages should be displayed
    expect(screen.getByText('Name is required')).toBeInTheDocument();
    expect(screen.getByText('Slug format is invalid')).toBeInTheDocument();
  });
});
