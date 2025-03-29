import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SiteForm } from '@/components/admin/sites/SiteForm';

// Import our custom mock router
import { useRouter, resetMocks } from './__mocks__/nextNavigation.tsx';

// Mock the Next.js navigation module
jest.mock('next/navigation', () => ({
  useRouter: () => useRouter(),
}));

// Mock fetch for API calls
global.fetch = jest.fn();

describe('SiteForm Component', () => {
  // Setup test user for interactions
  const user = userEvent.setup();
  
  beforeEach(() => {
    jest.clearAllMocks();
    resetMocks(); // Reset our custom mock router
    (global.fetch as jest.Mock).mockReset();
    // Setup default successful response
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({ id: 'site-1', name: 'Test Site', slug: 'test-site' })
    });
  });
  
  it('renders in create mode correctly', () => {
    render(<SiteForm />);
    
    // Basic rendering tests
    expect(screen.getByTestId('siteForm-header')).toBeInTheDocument();
    expect(screen.getByTestId('siteForm-header')).toHaveTextContent('Create Site');
    expect(screen.getByTestId('siteForm-basic-info-heading')).toHaveTextContent('Basic Information');
    expect(screen.getByTestId('siteForm-domains-heading')).toHaveTextContent('Domains');
    expect(screen.getByTestId('siteForm-name')).toBeInTheDocument();
    expect(screen.getByTestId('siteForm-slug')).toBeInTheDocument();
    expect(screen.getByTestId('siteForm-description')).toBeInTheDocument();
    expect(screen.getByTestId('siteForm-new-domain')).toBeInTheDocument();
    expect(screen.getByTestId('siteForm-add-domain')).toBeInTheDocument();
    expect(screen.getByTestId('siteForm-submit')).toHaveTextContent('Create Site');
  });

  it('renders in edit mode with initial data', () => {
    const initialData = {
      id: 'site-1',
      name: 'Test Site',
      slug: 'test-site',
      description: 'A test site description',
      domains: ['example.com', 'test.org']
    };
    
    render(<SiteForm initialData={initialData} mode="edit" />);
    
    // Verify component is in edit mode
    expect(screen.getByTestId('siteForm-header')).toHaveTextContent('Edit Site');
    expect(screen.getByTestId('siteForm-submit')).toHaveTextContent('Update Site');
    
    // Verify initial data is loaded into form
    expect(screen.getByTestId('siteForm-name')).toHaveValue('Test Site');
    expect(screen.getByTestId('siteForm-slug')).toHaveValue('test-site');
    expect(screen.getByTestId('siteForm-description')).toHaveValue('A test site description');
    
    // Verify initial domains are displayed
    expect(screen.getByTestId('siteForm-domain-0')).toHaveTextContent('example.com');
    expect(screen.getByTestId('siteForm-domain-1')).toHaveTextContent('test.org');
    
    // Verify remove buttons for each domain
    expect(screen.getByTestId('siteForm-remove-domain-0')).toBeInTheDocument();
    expect(screen.getByTestId('siteForm-remove-domain-1')).toBeInTheDocument();
  });

  it('allows adding a valid domain', async () => {
    render(<SiteForm />);
    
    // Enter a valid domain
    const domainInput = screen.getByTestId('siteForm-new-domain');
    await user.type(domainInput, 'example.com');
    
    // Click add button
    const addButton = screen.getByTestId('siteForm-add-domain');
    await user.click(addButton);
    
    // Verify domain was added
    expect(screen.getByTestId('siteForm-domain-0')).toHaveTextContent('example.com');
    
    // Verify input was cleared
    expect(domainInput).toHaveValue('');
  });

  it('shows an error for an invalid domain', async () => {
    render(<SiteForm />);
    
    // Enter an invalid domain format
    const domainInput = screen.getByTestId('siteForm-new-domain');
    await user.type(domainInput, 'invalid-domain');
    
    // Click add button
    const addButton = screen.getByTestId('siteForm-add-domain');
    await user.click(addButton);
    
    // Verify error message is displayed
    expect(screen.getByTestId('siteForm-new-domain-error')).toBeInTheDocument();
    expect(screen.getByTestId('siteForm-new-domain-error')).toHaveTextContent('Please enter a valid domain name');
    
    // Domain should not be added
    expect(screen.queryByText('invalid-domain')).not.toBeInTheDocument();
  });

  it('prevents adding duplicate domains', async () => {
    // Initialize with one domain already
    const initialData = {
      domains: ['example.com']
    };
    
    render(<SiteForm initialData={initialData} />);
    
    // Try to add the same domain again
    const domainInput = screen.getByTestId('siteForm-new-domain');
    await user.type(domainInput, 'example.com');
    
    // Click add button
    const addButton = screen.getByTestId('siteForm-add-domain');
    await user.click(addButton);
    
    // Verify error message is displayed
    expect(screen.getByTestId('siteForm-new-domain-error')).toBeInTheDocument();
    expect(screen.getByTestId('siteForm-new-domain-error')).toHaveTextContent('This domain has already been added');
    
    // Should still only have one instance of the domain
    expect(screen.getByTestId('siteForm-domain-0')).toHaveTextContent('example.com');
    expect(screen.queryByTestId('siteForm-domain-1')).not.toBeInTheDocument();
  });

  it('allows removing a domain', async () => {
    // Initialize with domains
    const initialData = {
      domains: ['example.com', 'test.com']
    };
    
    render(<SiteForm initialData={initialData} />);
    
    // Verify both domains are initially displayed
    expect(screen.getByTestId('siteForm-domain-0')).toHaveTextContent('example.com');
    expect(screen.getByTestId('siteForm-domain-1')).toHaveTextContent('test.com');
    
    // Click remove button for the first domain
    const removeButton = screen.getByTestId('siteForm-remove-domain-0');
    await user.click(removeButton);
    
    // Verify the domain was removed
    expect(screen.queryByTestId('siteForm-domain-0')).toHaveTextContent('test.com');
    expect(screen.queryByTestId('siteForm-domain-1')).not.toBeInTheDocument();
  });

  it('calls onCancel callback when cancel button is clicked', async () => {
    const mockOnCancel = jest.fn();
    
    render(<SiteForm onCancel={mockOnCancel} />);
    
    // Find and click the cancel button
    const cancelButton = screen.getByTestId('siteForm-cancel');
    await user.click(cancelButton);
    
    // Verify callback was called
    expect(mockOnCancel).toHaveBeenCalledTimes(1);
  });

  it('validates required fields on submission', async () => {
    render(<SiteForm />);
    
    // Try to submit the form without filling in required fields
    const submitButton = screen.getByTestId('siteForm-submit');
    await user.click(submitButton);
    
    // Verify validation errors for required fields
    expect(screen.getByTestId('siteForm-name-error')).toBeInTheDocument();
    expect(screen.getByTestId('siteForm-name-error')).toHaveTextContent('Name is required');
    
    expect(screen.getByTestId('siteForm-slug-error')).toBeInTheDocument();
    expect(screen.getByTestId('siteForm-slug-error')).toHaveTextContent('Slug is required');
    
    expect(screen.getByTestId('siteForm-domains-error')).toBeInTheDocument();
    expect(screen.getByTestId('siteForm-domains-error')).toHaveTextContent('At least one domain is required');
    
    // API should not be called
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it('validates slug format on submission', async () => {
    render(<SiteForm />);
    
    // Fill name but use invalid slug format
    await user.type(screen.getByTestId('siteForm-name'), 'Test Site');
    await user.type(screen.getByTestId('siteForm-slug'), 'Invalid Slug!');
    
    // Add a domain to pass that validation
    const domainInput = screen.getByTestId('siteForm-new-domain');
    await user.type(domainInput, 'example.com');
    await user.click(screen.getByTestId('siteForm-add-domain'));
    
    // Try to submit the form
    const submitButton = screen.getByTestId('siteForm-submit');
    await user.click(submitButton);
    
    // Verify slug validation error
    expect(screen.getByTestId('siteForm-slug-error')).toBeInTheDocument();
    expect(screen.getByTestId('siteForm-slug-error')).toHaveTextContent('Slug can only contain lowercase letters, numbers, and hyphens');
    
    // API should not be called
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it('clears validation errors when fields are changed', async () => {
    render(<SiteForm />);
    
    // Submit to trigger validation errors
    await user.click(screen.getByTestId('siteForm-submit'));
    
    // Verify we have errors
    expect(screen.getByTestId('siteForm-name-error')).toBeInTheDocument();
    
    // Fix the name field
    await user.type(screen.getByTestId('siteForm-name'), 'Test Site');
    
    // Error for name should be cleared
    expect(screen.queryByTestId('siteForm-name-error')).not.toBeInTheDocument();
  });

  it('successfully submits the form in create mode', async () => {
    render(<SiteForm />);
    
    // Fill out the form
    await user.type(screen.getByTestId('siteForm-name'), 'New Test Site');
    await user.type(screen.getByTestId('siteForm-slug'), 'new-test-site');
    await user.type(screen.getByTestId('siteForm-description'), 'This is a test site description');
    
    // Add a domain
    await user.type(screen.getByTestId('siteForm-new-domain'), 'testsite.com');
    await user.click(screen.getByTestId('siteForm-add-domain'));
    
    // Submit the form
    await user.click(screen.getByTestId('siteForm-submit'));
    
    // Verify API was called with correct data
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledTimes(1);
      expect(global.fetch).toHaveBeenCalledWith(
        '/api/sites',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({
            name: 'New Test Site',
            slug: 'new-test-site',
            description: 'This is a test site description',
            domains: ['testsite.com']
          })
        })
      );
    });
    
    // Verify success message
    await waitFor(() => {
      expect(screen.getByTestId('siteForm-success')).toBeInTheDocument();
      expect(screen.getByTestId('siteForm-success')).toHaveTextContent('Site created successfully');
    });
    
    // Verify router was called to redirect
    await waitFor(() => {
      expect(useRouter().push).toHaveBeenCalledWith('/admin/sites/site-1');
    });
  });

  it('successfully submits the form in edit mode', async () => {
    const initialData = {
      id: 'site-123',
      name: 'Existing Site',
      slug: 'existing-site',
      description: 'Original description',
      domains: ['original.com']
    };
    
    render(<SiteForm initialData={initialData} mode="edit" />);
    
    // Update the description
    const descriptionField = screen.getByTestId('siteForm-description');
    await user.clear(descriptionField);
    await user.type(descriptionField, 'Updated description');
    
    // Add another domain
    await user.type(screen.getByTestId('siteForm-new-domain'), 'another.com');
    await user.click(screen.getByTestId('siteForm-add-domain'));
    
    // Submit the form
    await user.click(screen.getByTestId('siteForm-submit'));
    
    // Verify API was called with correct data
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledTimes(1);
      expect(global.fetch).toHaveBeenCalledWith(
        '/api/sites/site-123',
        expect.objectContaining({
          method: 'PUT',
          body: JSON.stringify({
            id: 'site-123',
            name: 'Existing Site',
            slug: 'existing-site',
            description: 'Updated description',
            domains: ['original.com', 'another.com']
          })
        })
      );
    });
    
    // Verify success message
    await waitFor(() => {
      expect(screen.getByTestId('siteForm-success')).toBeInTheDocument();
      expect(screen.getByTestId('siteForm-success')).toHaveTextContent('Site updated successfully');
    });
  });

  it('handles API errors on submission', async () => {
    // Mock a failed API response
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      json: async () => ({ error: 'Slug already exists' })
    });
    
    render(<SiteForm />);
    
    // Fill out the form with minimum required fields
    await user.type(screen.getByTestId('siteForm-name'), 'Test Site');
    await user.type(screen.getByTestId('siteForm-slug'), 'test-site');
    
    // Add a domain
    await user.type(screen.getByTestId('siteForm-new-domain'), 'test.com');
    await user.click(screen.getByTestId('siteForm-add-domain'));
    
    // Submit the form
    await user.click(screen.getByTestId('siteForm-submit'));
    
    // Verify API was called
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledTimes(1);
    });
    
    // Verify error message is displayed
    await waitFor(() => {
      expect(screen.getByTestId('siteForm-error')).toBeInTheDocument();
      expect(screen.getByTestId('siteForm-error')).toHaveTextContent('Slug already exists');
    });
    
    // Router should not be called for redirect on error
    expect(useRouter().push).not.toHaveBeenCalled();
  });

  it('handles network errors on submission', async () => {
    // Mock a network error
    (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'));
    
    render(<SiteForm />);
    
    // Fill out the form with minimum required fields
    await user.type(screen.getByTestId('siteForm-name'), 'Test Site');
    await user.type(screen.getByTestId('siteForm-slug'), 'test-site');
    
    // Add a domain
    await user.type(screen.getByTestId('siteForm-new-domain'), 'test.com');
    await user.click(screen.getByTestId('siteForm-add-domain'));
    
    // Submit the form
    await user.click(screen.getByTestId('siteForm-submit'));
    
    // Verify error message is displayed
    await waitFor(() => {
      expect(screen.getByTestId('siteForm-error')).toBeInTheDocument();
      expect(screen.getByTestId('siteForm-error')).toHaveTextContent('Network error');
    });
  });

  it('calls onSuccess callback when form submission succeeds', async () => {
    const mockOnSuccess = jest.fn();
    
    render(<SiteForm onSuccess={mockOnSuccess} />);
    
    // Fill out minimum required fields
    await user.type(screen.getByTestId('siteForm-name'), 'Test Site');
    await user.type(screen.getByTestId('siteForm-slug'), 'test-site');
    
    // Add a domain
    await user.type(screen.getByTestId('siteForm-new-domain'), 'test.com');
    await user.click(screen.getByTestId('siteForm-add-domain'));
    
    // Submit the form
    await user.click(screen.getByTestId('siteForm-submit'));
    
    // Verify callback was called with response data
    await waitFor(() => {
      expect(mockOnSuccess).toHaveBeenCalledTimes(1);
      expect(mockOnSuccess).toHaveBeenCalledWith({ 
        id: 'site-1', 
        name: 'Test Site', 
        slug: 'test-site' 
      });
    });
  });
});
