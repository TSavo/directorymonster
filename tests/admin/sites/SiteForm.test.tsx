import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SiteForm } from '@/components/admin/sites/SiteForm';
import { useRouter } from 'next/navigation';

// Mock the useRouter hook
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
}));

describe('SiteForm', () => {
  const mockRouter = {
    push: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (useRouter as jest.Mock).mockReturnValue(mockRouter);
  });

  it('renders the form with correct elements', () => {
    render(<SiteForm />);
    
    // Check form elements are present
    expect(screen.getByTestId('siteForm-header')).toBeInTheDocument();
    expect(screen.getByTestId('siteForm-form')).toBeInTheDocument();
    expect(screen.getByLabelText(/name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/slug/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/description/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/enter domain/i)).toBeInTheDocument();
    expect(screen.getByText(/cancel/i)).toBeInTheDocument();
    expect(screen.getByText(/create site/i)).toBeInTheDocument();
  });

  it('displays edit mode when initialData is provided', () => {
    const initialData = {
      id: '123',
      name: 'Test Site',
      slug: 'test-site',
      description: 'A test site',
      domains: ['test.com']
    };
    
    render(<SiteForm initialData={initialData} mode="edit" />);
    
    // Check form is in edit mode with values pre-filled
    expect(screen.getByText(/edit site/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/name/i)).toHaveValue('Test Site');
    expect(screen.getByLabelText(/slug/i)).toHaveValue('test-site');
    expect(screen.getByLabelText(/description/i)).toHaveValue('A test site');
    expect(screen.getByText('test.com')).toBeInTheDocument();
    expect(screen.getByText(/update site/i)).toBeInTheDocument();
  });

  it('validates required fields', async () => {
    const user = userEvent.setup();
    render(<SiteForm />);
    
    // Submit the form without filling required fields
    await user.click(screen.getByText(/create site/i));
    
    // Check for validation errors
    expect(await screen.findByText(/name is required/i)).toBeInTheDocument();
    expect(await screen.findByText(/slug is required/i)).toBeInTheDocument();
    expect(await screen.findByText(/at least one domain is required/i)).toBeInTheDocument();
  });

  it('validates field formats and constraints', async () => {
    const user = userEvent.setup();
    render(<SiteForm />);
    
    // Fill fields with invalid values
    await user.type(screen.getByLabelText(/name/i), 'A'.repeat(51)); // Too long
    await user.type(screen.getByLabelText(/slug/i), 'Invalid Slug!'); // Invalid characters
    await user.type(screen.getByLabelText(/description/i), 'A'.repeat(501)); // Too long
    
    // Try to submit the form
    await user.click(screen.getByText(/create site/i));
    
    // Check for validation errors
    expect(await screen.findByText(/name cannot exceed 50 characters/i)).toBeInTheDocument();
    expect(await screen.findByText(/slug can only contain lowercase letters/i)).toBeInTheDocument();
    expect(await screen.findByText(/description cannot exceed 500 characters/i)).toBeInTheDocument();
  });

  it('allows adding and removing domains', async () => {
    const user = userEvent.setup();
    render(<SiteForm />);
    
    // Add a domain
    await user.type(screen.getByPlaceholderText(/enter domain/i), 'example.com');
    await user.click(screen.getByText(/\+ add/i));
    
    // Check domain was added
    expect(screen.getByText('example.com')).toBeInTheDocument();
    
    // Add another domain
    await user.type(screen.getByPlaceholderText(/enter domain/i), 'test.com');
    await user.click(screen.getByText(/\+ add/i));
    
    // Check both domains are present
    expect(screen.getByText('example.com')).toBeInTheDocument();
    expect(screen.getByText('test.com')).toBeInTheDocument();
    
    // Remove a domain
    await user.click(screen.getAllByLabelText(/remove domain/i)[0]);
    
    // Check domain was removed
    expect(screen.queryByText('example.com')).not.toBeInTheDocument();
    expect(screen.getByText('test.com')).toBeInTheDocument();
  });

  it('validates domain format', async () => {
    const user = userEvent.setup();
    render(<SiteForm />);
    
    // Try to add invalid domain
    await user.type(screen.getByPlaceholderText(/enter domain/i), 'invalid');
    await user.click(screen.getByText(/\+ add/i));
    
    // Check for validation error
    expect(await screen.findByText(/enter a valid domain name/i)).toBeInTheDocument();
    
    // Fix the domain and try again
    await user.clear(screen.getByPlaceholderText(/enter domain/i));
    await user.type(screen.getByPlaceholderText(/enter domain/i), 'valid.com');
    await user.click(screen.getByText(/\+ add/i));
    
    // Check domain was added and error cleared
    expect(screen.getByText('valid.com')).toBeInTheDocument();
    expect(screen.queryByText(/enter a valid domain name/i)).not.toBeInTheDocument();
  });

  it('prevents adding duplicate domains', async () => {
    const user = userEvent.setup();
    render(<SiteForm />);
    
    // Add a domain
    await user.type(screen.getByPlaceholderText(/enter domain/i), 'example.com');
    await user.click(screen.getByText(/\+ add/i));
    
    // Try to add the same domain again
    await user.type(screen.getByPlaceholderText(/enter domain/i), 'example.com');
    await user.click(screen.getByText(/\+ add/i));
    
    // Check for validation error
    expect(await screen.findByText(/this domain has already been added/i)).toBeInTheDocument();
  });

  it('submits the form with valid data', async () => {
    global.fetch = jest.fn().mockResolvedValueOnce({
      ok: true,
      json: jest.fn().mockResolvedValueOnce({ id: '123', slug: 'test-site' })
    });
    
    const user = userEvent.setup();
    const onSuccess = jest.fn();
    
    render(<SiteForm onSuccess={onSuccess} />);
    
    // Fill in form with valid data
    await user.type(screen.getByLabelText(/name/i), 'Test Site');
    await user.type(screen.getByLabelText(/slug/i), 'test-site');
    await user.type(screen.getByLabelText(/description/i), 'This is a test site');
    await user.type(screen.getByPlaceholderText(/enter domain/i), 'test.com');
    await user.click(screen.getByText(/\+ add/i));
    
    // Submit the form
    await user.click(screen.getByText(/create site/i));
    
    // Verify fetch was called with correct data
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        '/api/sites',
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'Content-Type': 'application/json'
          }),
          body: JSON.stringify({
            name: 'Test Site',
            slug: 'test-site',
            description: 'This is a test site',
            domains: ['test.com']
          })
        })
      );
    });
    
    // Check success callback was called
    expect(onSuccess).toHaveBeenCalledWith(expect.objectContaining({
      id: '123',
      slug: 'test-site'
    }));
    
    // Check success message is displayed
    expect(await screen.findByText(/site created successfully/i)).toBeInTheDocument();
    
    // Verify that router.push was called after timeout
    await waitFor(() => {
      expect(mockRouter.push).toHaveBeenCalledWith('/admin/sites/test-site');
    }, { timeout: 2000 });
  });

  it('handles API errors', async () => {
    global.fetch = jest.fn().mockResolvedValueOnce({
      ok: false,
      json: jest.fn().mockResolvedValueOnce({ error: 'API error message' })
    });
    
    const user = userEvent.setup();
    
    render(<SiteForm />);
    
    // Fill in form with valid data
    await user.type(screen.getByLabelText(/name/i), 'Test Site');
    await user.type(screen.getByLabelText(/slug/i), 'test-site');
    await user.type(screen.getByPlaceholderText(/enter domain/i), 'test.com');
    await user.click(screen.getByText(/\+ add/i));
    
    // Submit the form
    await user.click(screen.getByText(/create site/i));
    
    // Check error message is displayed
    expect(await screen.findByText(/API error message/i)).toBeInTheDocument();
  });

  it('calls onCancel when cancel button is clicked', async () => {
    const user = userEvent.setup();
    const onCancel = jest.fn();
    
    render(<SiteForm onCancel={onCancel} />);
    
    // Click cancel button
    await user.click(screen.getByText(/cancel/i));
    
    // Check onCancel was called
    expect(onCancel).toHaveBeenCalledTimes(1);
  });

  it('handles network errors during submission', async () => {
    global.fetch = jest.fn().mockRejectedValueOnce(new Error('Network error'));
    
    const user = userEvent.setup();
    
    render(<SiteForm />);
    
    // Fill in form with valid data
    await user.type(screen.getByLabelText(/name/i), 'Test Site');
    await user.type(screen.getByLabelText(/slug/i), 'test-site');
    await user.type(screen.getByPlaceholderText(/enter domain/i), 'test.com');
    await user.click(screen.getByText(/\+ add/i));
    
    // Submit the form
    await user.click(screen.getByText(/create site/i));
    
    // Check error message is displayed
    expect(await screen.findByText(/network error/i)).toBeInTheDocument();
  });

  it('clears field errors when values are changed', async () => {
    const user = userEvent.setup();
    render(<SiteForm />);
    
    // Submit empty form to trigger validation errors
    await user.click(screen.getByText(/create site/i));
    
    // Check for validation errors
    expect(await screen.findByText(/name is required/i)).toBeInTheDocument();
    
    // Type in the field with error
    await user.type(screen.getByLabelText(/name/i), 'Test Site');
    
    // Check that error was cleared
    expect(screen.queryByText(/name is required/i)).not.toBeInTheDocument();
  });
});
