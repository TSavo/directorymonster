import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SiteSettings } from '@/components/admin/sites/SiteSettings';

// Mock the useRouter hook
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
  }),
}));

// Mock fetch function
global.fetch = jest.fn();

describe('SiteSettings Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Reset fetch mock before each test
    (global.fetch as jest.Mock).mockReset();
  });

  it('renders correctly with default values', () => {
    render(<SiteSettings initialData={{ id: 'site-1' }} />);
    
    // Check if component renders with default values
    expect(screen.getByTestId('siteSettings-header')).toBeInTheDocument();
    expect(screen.getByTestId('siteSettings-isPublic')).toBeChecked();
    expect(screen.getByTestId('siteSettings-theme')).toHaveValue('default');
    expect(screen.getByTestId('siteSettings-listingsPerPage')).toHaveValue(20);
    expect(screen.getByTestId('siteSettings-enableCategories')).toBeChecked();
    expect(screen.getByTestId('siteSettings-enableSearch')).toBeChecked();
    expect(screen.getByTestId('siteSettings-enableUserRegistration')).not.toBeChecked();
    expect(screen.getByTestId('siteSettings-maintenanceMode')).not.toBeChecked();
  });

  it('renders correctly with provided initial data', () => {
    const initialData = {
      id: 'site-1',
      name: 'Test Site',
      slug: 'test-site',
      isPublic: false,
      theme: 'dark',
      listingsPerPage: 50,
      enableCategories: false,
      enableSearch: false,
      enableUserRegistration: true,
      maintenanceMode: true,
      contactEmail: 'test@example.com',
      customStyles: '.test { color: red; }'
    };
    
    render(<SiteSettings initialData={initialData} />);
    
    // Check if component renders with provided values
    expect(screen.getByText('Test Site')).toBeInTheDocument();
    expect(screen.getByText('Slug: test-site')).toBeInTheDocument();
    expect(screen.getByTestId('siteSettings-isPublic')).not.toBeChecked();
    expect(screen.getByTestId('siteSettings-theme')).toHaveValue('dark');
    expect(screen.getByTestId('siteSettings-listingsPerPage')).toHaveValue(50);
    expect(screen.getByTestId('siteSettings-enableCategories')).not.toBeChecked();
    expect(screen.getByTestId('siteSettings-enableSearch')).not.toBeChecked();
    expect(screen.getByTestId('siteSettings-enableUserRegistration')).toBeChecked();
    expect(screen.getByTestId('siteSettings-maintenanceMode')).toBeChecked();
    expect(screen.getByTestId('siteSettings-contactEmail')).toHaveValue('test@example.com');
    expect(screen.getByTestId('siteSettings-customStyles')).toHaveValue('.test { color: red; }');
  });

  it('validates and handles form submission', async () => {
    const user = userEvent.setup();
    const onSuccess = jest.fn();
    const initialData = {
      id: 'site-1',
      name: 'Test Site',
      slug: 'test-site'
    };
    
    // Mock successful API response
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ 
        id: 'site-1',
        success: true
      })
    });
    
    render(<SiteSettings initialData={initialData} onSuccess={onSuccess} />);
    
    // Change settings values
    await user.click(screen.getByTestId('siteSettings-maintenanceMode'));
    await user.clear(screen.getByTestId('siteSettings-listingsPerPage'));
    await user.type(screen.getByTestId('siteSettings-listingsPerPage'), '30');
    await user.selectOptions(screen.getByTestId('siteSettings-theme'), 'blue');
    await user.type(screen.getByTestId('siteSettings-contactEmail'), 'admin@example.com');
    
    // Submit the form
    await user.click(screen.getByTestId('siteSettings-submit'));
    
    // Check if fetch was called with correct data
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledTimes(1);
    });
    
    const fetchCall = (global.fetch as jest.Mock).mock.calls[0];
    expect(fetchCall[0]).toBe('/api/sites/site-1/settings');
    expect(fetchCall[1].method).toBe('PUT');
    
    // Check request body contains updated values
    const requestBody = JSON.parse(fetchCall[1].body);
    expect(requestBody.theme).toBe('blue');
    expect(requestBody.listingsPerPage).toBe(30);
    expect(requestBody.maintenanceMode).toBe(true);
    expect(requestBody.contactEmail).toBe('admin@example.com');
    
    // Success callback should be called
    expect(onSuccess).toHaveBeenCalledTimes(1);
    
    // Success message should be displayed
    expect(await screen.findByTestId('siteSettings-success')).toBeInTheDocument();
  });

  it('validates form fields and shows error messages', async () => {
    const user = userEvent.setup();
    
    render(<SiteSettings initialData={{ id: 'site-1' }} />);
    
    // Set invalid values
    await user.clear(screen.getByTestId('siteSettings-listingsPerPage'));
    await user.type(screen.getByTestId('siteSettings-listingsPerPage'), '0');
    await user.type(screen.getByTestId('siteSettings-contactEmail'), 'invalid-email');
    await user.type(screen.getByTestId('siteSettings-customStyles'), '{ unclosed brace');
    
    // Submit the form
    await user.click(screen.getByTestId('siteSettings-submit'));
    
    // Validation errors should be displayed
    expect(screen.getByTestId('siteSettings-listingsPerPage-error')).toBeInTheDocument();
    expect(screen.getByTestId('siteSettings-contactEmail-error')).toBeInTheDocument();
    expect(screen.getByTestId('siteSettings-customStyles-error')).toBeInTheDocument();
    
    // Fetch should not be called due to validation errors
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it('handles API errors', async () => {
    const user = userEvent.setup();
    
    // Mock failed API response
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      json: async () => ({ error: 'Server error occurred' })
    });
    
    render(<SiteSettings initialData={{ id: 'site-1' }} />);
    
    // Submit the form
    await user.click(screen.getByTestId('siteSettings-submit'));
    
    // Error message should be displayed
    expect(await screen.findByTestId('siteSettings-error')).toBeInTheDocument();
    expect(await screen.findByText('Server error occurred')).toBeInTheDocument();
  });

  it('displays loading state during form submission', async () => {
    const user = userEvent.setup();
    
    // Mock a delayed API response
    (global.fetch as jest.Mock).mockImplementationOnce(() => 
      new Promise(resolve => {
        setTimeout(() => {
          resolve({
            ok: true,
            json: () => Promise.resolve({ id: 'site-1' })
          });
        }, 100);
      })
    );
    
    render(<SiteSettings initialData={{ id: 'site-1' }} />);
    
    // Submit the form
    await user.click(screen.getByTestId('siteSettings-submit'));
    
    // Loading state should be displayed
    expect(screen.getByTestId('siteSettings-submit-loading')).toBeInTheDocument();
    
    // Form controls should be disabled during loading
    expect(screen.getByTestId('siteSettings-isPublic')).toBeDisabled();
    expect(screen.getByTestId('siteSettings-theme')).toBeDisabled();
    expect(screen.getByTestId('siteSettings-listingsPerPage')).toBeDisabled();
    
    // Wait for completion
    await waitFor(() => {
      expect(screen.queryByTestId('siteSettings-submit-loading')).not.toBeInTheDocument();
    });
  });

  it('calls cancel callback when cancel button is clicked', async () => {
    const user = userEvent.setup();
    const onCancel = jest.fn();
    
    render(<SiteSettings initialData={{ id: 'site-1' }} onCancel={onCancel} />);
    
    // Click cancel button
    await user.click(screen.getByTestId('siteSettings-cancel'));
    
    // Cancel callback should be called
    expect(onCancel).toHaveBeenCalledTimes(1);
  });

  it('clears validation errors when field values are changed', async () => {
    const user = userEvent.setup();
    
    render(<SiteSettings initialData={{ id: 'site-1' }} />);
    
    // Set invalid values and submit to trigger validation errors
    await user.clear(screen.getByTestId('siteSettings-listingsPerPage'));
    await user.type(screen.getByTestId('siteSettings-listingsPerPage'), '0');
    await user.type(screen.getByTestId('siteSettings-contactEmail'), 'invalid-email');
    
    // Submit to trigger validation
    await user.click(screen.getByTestId('siteSettings-submit'));
    
    // Validation errors should be displayed
    expect(screen.getByTestId('siteSettings-listingsPerPage-error')).toBeInTheDocument();
    expect(screen.getByTestId('siteSettings-contactEmail-error')).toBeInTheDocument();
    
    // Fix the values
    await user.clear(screen.getByTestId('siteSettings-listingsPerPage'));
    await user.type(screen.getByTestId('siteSettings-listingsPerPage'), '20');
    
    // Error for listings per page should be cleared
    expect(screen.queryByTestId('siteSettings-listingsPerPage-error')).not.toBeInTheDocument();
    
    // Error for contact email should still be present
    expect(screen.getByTestId('siteSettings-contactEmail-error')).toBeInTheDocument();
    
    // Fix the email
    await user.clear(screen.getByTestId('siteSettings-contactEmail'));
    await user.type(screen.getByTestId('siteSettings-contactEmail'), 'valid@example.com');
    
    // Error for contact email should be cleared
    expect(screen.queryByTestId('siteSettings-contactEmail-error')).not.toBeInTheDocument();
  });

  it('validates custom CSS with balanced braces', async () => {
    const user = userEvent.setup();
    
    render(<SiteSettings initialData={{ id: 'site-1' }} />);
    
    // Set valid CSS
    await user.type(screen.getByTestId('siteSettings-customStyles'), '.header { color: blue; } .footer { background: gray; }');
    
    // Submit the form
    await user.click(screen.getByTestId('siteSettings-submit'));
    
    // No CSS error should be displayed
    expect(screen.queryByTestId('siteSettings-customStyles-error')).not.toBeInTheDocument();
    
    // Set invalid CSS with unbalanced braces
    await user.clear(screen.getByTestId('siteSettings-customStyles'));
    await user.type(screen.getByTestId('siteSettings-customStyles'), '.header { color: blue; .footer { background: gray; }');
    
    // Submit the form
    await user.click(screen.getByTestId('siteSettings-submit'));
    
    // CSS error should be displayed
    expect(screen.getByTestId('siteSettings-customStyles-error')).toBeInTheDocument();
    expect(screen.getByText('CSS syntax error: unbalanced braces')).toBeInTheDocument();
  });

  it('allows toggling all boolean settings', async () => {
    const user = userEvent.setup();
    
    render(<SiteSettings initialData={{ id: 'site-1' }} />);
    
    // Toggle all boolean settings
    await user.click(screen.getByTestId('siteSettings-isPublic'));
    await user.click(screen.getByTestId('siteSettings-enableCategories'));
    await user.click(screen.getByTestId('siteSettings-enableSearch'));
    await user.click(screen.getByTestId('siteSettings-enableUserRegistration'));
    await user.click(screen.getByTestId('siteSettings-maintenanceMode'));
    
    // Check that all were toggled
    expect(screen.getByTestId('siteSettings-isPublic')).not.toBeChecked();
    expect(screen.getByTestId('siteSettings-enableCategories')).not.toBeChecked();
    expect(screen.getByTestId('siteSettings-enableSearch')).not.toBeChecked();
    expect(screen.getByTestId('siteSettings-enableUserRegistration')).toBeChecked();
    expect(screen.getByTestId('siteSettings-maintenanceMode')).toBeChecked();
    
    // Toggle them back
    await user.click(screen.getByTestId('siteSettings-isPublic'));
    await user.click(screen.getByTestId('siteSettings-enableCategories'));
    await user.click(screen.getByTestId('siteSettings-enableSearch'));
    await user.click(screen.getByTestId('siteSettings-enableUserRegistration'));
    await user.click(screen.getByTestId('siteSettings-maintenanceMode'));
    
    // Check that all were toggled back
    expect(screen.getByTestId('siteSettings-isPublic')).toBeChecked();
    expect(screen.getByTestId('siteSettings-enableCategories')).toBeChecked();
    expect(screen.getByTestId('siteSettings-enableSearch')).toBeChecked();
    expect(screen.getByTestId('siteSettings-enableUserRegistration')).not.toBeChecked();
    expect(screen.getByTestId('siteSettings-maintenanceMode')).not.toBeChecked();
  });

  it('allows selecting different themes', async () => {
    const user = userEvent.setup();
    
    render(<SiteSettings initialData={{ id: 'site-1' }} />);
    
    // Theme select should show all available themes
    const themeOptions = screen.getAllByRole('option');
    expect(themeOptions.length).toBeGreaterThanOrEqual(5); // At least 5 themes
    
    // Try selecting different themes
    await user.selectOptions(screen.getByTestId('siteSettings-theme'), 'dark');
    expect(screen.getByTestId('siteSettings-theme')).toHaveValue('dark');
    
    await user.selectOptions(screen.getByTestId('siteSettings-theme'), 'blue');
    expect(screen.getByTestId('siteSettings-theme')).toHaveValue('blue');
    
    await user.selectOptions(screen.getByTestId('siteSettings-theme'), 'green');
    expect(screen.getByTestId('siteSettings-theme')).toHaveValue('green');
  });
});
