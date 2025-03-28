import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SiteForm } from '@/components/admin/sites/SiteForm';

/**
 * Submission tests for the SiteForm component
 * 
 * These tests focus on form submission behavior including:
 * - API interaction during form submission
 * - Loading states during submission
 * - Success and error handling after submission
 * - Redirect behavior after successful submission
 * - Form data processing and transformation
 */
describe('SiteForm Submission', () => {
  
  beforeEach(() => {
    // Mock fetch for API calls
    global.fetch = jest.fn();
    
    // Mock useRouter
    jest.mock('next/navigation', () => ({
      useRouter: () => ({
        push: jest.fn(),
        replace: jest.fn(),
        back: jest.fn()
      })
    }));
  });

  afterEach(() => {
    // Clean up mocks
    jest.restoreAllMocks();
  });

  it('shows loading state during form submission', async () => {
    global.fetch = jest.fn().mockImplementation(() => {
      return new Promise(resolve => {
        // Delay to simulate loading
        setTimeout(() => {
          resolve({
            ok: true,
            json: () => Promise.resolve({ success: true, site: { id: '123' } })
          });
        }, 100);
      });
    });

    const user = userEvent.setup();
    render(<SiteForm mode="create" />);
    
    // Fill form with valid data
    await user.type(screen.getByLabelText(/site name/i), 'Test Site');
    await user.type(screen.getByLabelText(/site slug/i), 'test-site');
    await user.type(screen.getByLabelText(/description/i), 'Test description');
    
    // Submit form
    await user.click(screen.getByTestId('site-form-submit'));
    
    // Check loading state
    expect(screen.getByTestId('site-form-submit-loading')).toBeInTheDocument();
    expect(screen.getByTestId('site-form-submit')).toBeDisabled();
    
    // Wait for submission to complete
    await waitFor(() => {
      expect(screen.queryByTestId('site-form-submit-loading')).not.toBeInTheDocument();
    });
  });

  it('sends correct data to API on form submission', async () => {
    // Mock fetch to resolve successfully
    global.fetch = jest.fn().mockImplementation(() => {
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ success: true, site: { id: '123' } })
      });
    });

    const user = userEvent.setup();
    render(<SiteForm mode="create" />);
    
    // Fill form with valid data
    const testName = 'Test Site Name';
    const testSlug = 'test-site-slug';
    const testDescription = 'This is a test site description';
    
    await user.type(screen.getByLabelText(/site name/i), testName);
    await user.type(screen.getByLabelText(/site slug/i), testSlug);
    await user.type(screen.getByLabelText(/description/i), testDescription);
    
    // Add a domain
    await user.click(screen.getByTestId('add-domain-button'));
    await user.type(screen.getByTestId('domain-input-0'), 'example.com');
    
    // Submit form
    await user.click(screen.getByTestId('site-form-submit'));
    
    // Wait for submission to complete
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledTimes(1);
    });
    
    // Check that correct data was sent
    expect(global.fetch).toHaveBeenCalledWith(
      '/api/sites',
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({
          'Content-Type': 'application/json'
        }),
        body: JSON.stringify({
          name: testName,
          slug: testSlug,
          description: testDescription,
          domains: ['example.com']
        })
      })
    );
  });

  it('handles successful form submission with success message', async () => {
    // Mock fetch to resolve successfully
    global.fetch = jest.fn().mockImplementation(() => {
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ 
          success: true, 
          site: { id: '123', name: 'Test Site', slug: 'test-site' } 
        })
      });
    });

    const user = userEvent.setup();
    render(<SiteForm mode="create" />);
    
    // Fill form with valid data
    await user.type(screen.getByLabelText(/site name/i), 'Test Site');
    await user.type(screen.getByLabelText(/site slug/i), 'test-site');
    await user.type(screen.getByLabelText(/description/i), 'Test description');
    
    // Submit form
    await user.click(screen.getByTestId('site-form-submit'));
    
    // Wait for submission to complete and check success message
    await waitFor(() => {
      expect(screen.getByTestId('site-form-success')).toBeInTheDocument();
      expect(screen.getByTestId('site-form-success')).toHaveTextContent('Site created successfully');
    });
  });

  it('handles API errors during form submission', async () => {
    // Mock fetch to reject with an error
    global.fetch = jest.fn().mockImplementation(() => {
      return Promise.resolve({
        ok: false,
        status: 500,
        json: () => Promise.resolve({ 
          success: false, 
          error: 'Failed to create site' 
        })
      });
    });

    const user = userEvent.setup();
    render(<SiteForm mode="create" />);
    
    // Fill form with valid data
    await user.type(screen.getByLabelText(/site name/i), 'Test Site');
    await user.type(screen.getByLabelText(/site slug/i), 'test-site');
    await user.type(screen.getByLabelText(/description/i), 'Test description');
    
    // Submit form
    await user.click(screen.getByTestId('site-form-submit'));
    
    // Wait for submission to complete and check error message
    await waitFor(() => {
      expect(screen.getByTestId('site-form-error')).toBeInTheDocument();
      expect(screen.getByTestId('site-form-error')).toHaveTextContent('Failed to create site');
    });
    
    // Verify the form is still enabled for editing
    expect(screen.getByLabelText(/site name/i)).not.toBeDisabled();
    expect(screen.getByTestId('site-form-submit')).not.toBeDisabled();
  });

  it('redirects to the appropriate page after successful submission', async () => {
    // Mock router
    const mockPush = jest.fn();
    jest.mock('next/navigation', () => ({
      useRouter: () => ({
        push: mockPush,
        replace: jest.fn(),
        back: jest.fn()
      })
    }));
    
    // Mock fetch to resolve successfully
    global.fetch = jest.fn().mockImplementation(() => {
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ 
          success: true, 
          site: { id: '123', name: 'Test Site', slug: 'test-site' } 
        })
      });
    });

    const user = userEvent.setup();
    render(<SiteForm mode="create" />);
    
    // Fill form with valid data
    await user.type(screen.getByLabelText(/site name/i), 'Test Site');
    await user.type(screen.getByLabelText(/site slug/i), 'test-site');
    await user.type(screen.getByLabelText(/description/i), 'Test description');
    
    // Submit form
    await user.click(screen.getByTestId('site-form-submit'));
    
    // Wait for submission to complete
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledTimes(1);
    });
    
    // Check redirect
    expect(mockPush).toHaveBeenCalledWith('/admin/sites/test-site');
  });

  it('disables form inputs during submission', async () => {
    // Mock fetch with delay
    global.fetch = jest.fn().mockImplementation(() => {
      return new Promise(resolve => {
        setTimeout(() => {
          resolve({
            ok: true,
            json: () => Promise.resolve({ success: true, site: { id: '123' } })
          });
        }, 100);
      });
    });

    const user = userEvent.setup();
    render(<SiteForm mode="create" />);
    
    // Fill form with valid data
    await user.type(screen.getByLabelText(/site name/i), 'Test Site');
    await user.type(screen.getByLabelText(/site slug/i), 'test-site');
    await user.type(screen.getByLabelText(/description/i), 'Test description');
    
    // Submit form
    await user.click(screen.getByTestId('site-form-submit'));
    
    // Check that form inputs are disabled during submission
    expect(screen.getByLabelText(/site name/i)).toBeDisabled();
    expect(screen.getByLabelText(/site slug/i)).toBeDisabled();
    expect(screen.getByLabelText(/description/i)).toBeDisabled();
    expect(screen.getByTestId('site-form-submit')).toBeDisabled();
    
    // Wait for submission to complete
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledTimes(1);
    });
  });

  it('transforms form data correctly before submission', async () => {
    // Mock fetch to resolve successfully
    global.fetch = jest.fn().mockImplementation(() => {
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ success: true, site: { id: '123' } })
      });
    });

    const user = userEvent.setup();
    render(<SiteForm mode="create" />);
    
    // Fill form with data that needs transformation
    const testName = '  Test Site Name with Spaces  '; // Has leading/trailing spaces
    const testSlug = 'test-SITE-slug'; // Has uppercase letters
    const testDescription = 'Test description';
    
    await user.type(screen.getByLabelText(/site name/i), testName);
    await user.type(screen.getByLabelText(/site slug/i), testSlug);
    await user.type(screen.getByLabelText(/description/i), testDescription);
    
    // Add a domain with leading/trailing spaces
    await user.click(screen.getByTestId('add-domain-button'));
    await user.type(screen.getByTestId('domain-input-0'), '  example.com  ');
    
    // Submit form
    await user.click(screen.getByTestId('site-form-submit'));
    
    // Wait for submission to complete
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledTimes(1);
    });
    
    // Check that data was transformed correctly before sending
    expect(global.fetch).toHaveBeenCalledWith(
      '/api/sites',
      expect.objectContaining({
        body: JSON.stringify({
          name: 'Test Site Name with Spaces', // Spaces trimmed
          slug: 'test-site-slug', // Converted to lowercase
          description: 'Test description',
          domains: ['example.com'] // Domain trimmed
        })
      })
    );
  });

  it('uses PUT method when updating an existing site', async () => {
    // Mock fetch to resolve successfully
    global.fetch = jest.fn().mockImplementation(() => {
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ success: true, site: { id: '123' } })
      });
    });

    const existingSite = {
      id: '123',
      name: 'Existing Site',
      slug: 'existing-site',
      description: 'Existing description',
      domains: ['existing.com']
    };

    const user = userEvent.setup();
    render(<SiteForm mode="edit" initialData={existingSite} />);
    
    // Modify some fields
    const nameInput = screen.getByLabelText(/site name/i);
    await user.clear(nameInput);
    await user.type(nameInput, 'Updated Site Name');
    
    const descriptionInput = screen.getByLabelText(/description/i);
    await user.clear(descriptionInput);
    await user.type(descriptionInput, 'Updated description');
    
    // Submit form
    await user.click(screen.getByTestId('site-form-submit'));
    
    // Wait for submission to complete
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledTimes(1);
    });
    
    // Check that PUT method was used with the correct URL
    expect(global.fetch).toHaveBeenCalledWith(
      '/api/sites/existing-site',
      expect.objectContaining({
        method: 'PUT',
        body: expect.any(String)
      })
    );
    
    // Check payload contains updated data
    const requestBody = JSON.parse(global.fetch.mock.calls[0][1].body);
    expect(requestBody).toEqual({
      id: '123',
      name: 'Updated Site Name',
      slug: 'existing-site',
      description: 'Updated description',
      domains: ['existing.com']
    });
  });

});
