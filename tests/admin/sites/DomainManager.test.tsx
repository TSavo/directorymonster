import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { DomainManager } from '@/components/admin/sites/DomainManager';

// Import our custom mock router
import { useRouter, resetMocks } from './__mocks__/nextNavigation.tsx';

// Mock the Next.js navigation module
jest.mock('next/navigation', () => ({
  useRouter: () => useRouter(),
}));

// Mock fetch for API calls
global.fetch = jest.fn();

describe('DomainManager Component', () => {
  // Setup test user for interactions
  const user = userEvent.setup();
  
  beforeEach(() => {
    jest.clearAllMocks();
    resetMocks(); // Reset our custom mock router
    (global.fetch as jest.Mock).mockReset();
    // Setup default successful response
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({ id: 'site-1', domains: ['example.com'] })
    });
  });
  
  it('renders in create mode correctly', () => {
    render(<DomainManager />);
    
    // Basic rendering tests
    expect(screen.getByTestId('domainManager-header')).toBeInTheDocument();
    expect(screen.getByTestId('domainManager-header')).toHaveTextContent('Create Domain Settings');
    expect(screen.getByTestId('domainManager-section-heading')).toHaveTextContent('Domain Management');
    expect(screen.getByTestId('domainManager-domain-input')).toBeInTheDocument();
    expect(screen.getByTestId('domainManager-add-domain')).toBeInTheDocument();
    expect(screen.getByTestId('domainManager-submit')).toHaveTextContent('Create Domain Settings');
    expect(screen.getByTestId('domainManager-format-help')).toBeInTheDocument();
  });

  it('renders in edit mode with initial domains', () => {
    const initialData = {
      id: 'site-1',
      domains: ['test.com', 'example.org']
    };
    
    render(<DomainManager initialData={initialData} mode="edit" />);
    
    // Verify component is in edit mode
    expect(screen.getByTestId('domainManager-header')).toHaveTextContent('Edit Domain Settings');
    expect(screen.getByTestId('domainManager-submit')).toHaveTextContent('Update Domain Settings');
    
    // Verify initial domains are displayed
    expect(screen.getByTestId('domainManager-domain-0')).toHaveTextContent('test.com');
    expect(screen.getByTestId('domainManager-domain-1')).toHaveTextContent('example.org');
    
    // Verify remove buttons for each domain
    expect(screen.getByTestId('domainManager-remove-domain-0')).toBeInTheDocument();
    expect(screen.getByTestId('domainManager-remove-domain-1')).toBeInTheDocument();
  });

  it('allows adding a valid domain', async () => {
    render(<DomainManager />);
    
    // Enter a valid domain
    const domainInput = screen.getByTestId('domainManager-domain-input');
    await user.type(domainInput, 'example.com');
    
    // Click add button
    const addButton = screen.getByTestId('domainManager-add-domain');
    await user.click(addButton);
    
    // Verify domain was added
    expect(screen.getByTestId('domainManager-domain-0')).toHaveTextContent('example.com');
    
    // Verify input was cleared
    expect(domainInput).toHaveValue('');
  });

  it('shows an error for an invalid domain', async () => {
    render(<DomainManager />);
    
    // Enter an invalid domain
    const domainInput = screen.getByTestId('domainManager-domain-input');
    await user.type(domainInput, 'invalid-domain');
    
    // Click add button
    const addButton = screen.getByTestId('domainManager-add-domain');
    await user.click(addButton);
    
    // Verify error message is displayed
    expect(screen.getByTestId('domainManager-domain-input-error')).toBeInTheDocument();
    expect(screen.getByTestId('domainManager-domain-input-error')).toHaveTextContent('Invalid domain format');
    
    // Domain should not be added
    expect(screen.queryByTestId('domainManager-domain-0')).not.toBeInTheDocument();
  });

  it('prevents adding duplicate domains', async () => {
    // Initialize with one domain already
    const initialData = {
      domains: ['example.com']
    };
    
    render(<DomainManager initialData={initialData} />);
    
    // Try to add the same domain again
    const domainInput = screen.getByTestId('domainManager-domain-input');
    await user.type(domainInput, 'example.com');
    
    // Click add button
    const addButton = screen.getByTestId('domainManager-add-domain');
    await user.click(addButton);
    
    // Verify error message is displayed
    expect(screen.getByTestId('domainManager-domain-input-error')).toBeInTheDocument();
    expect(screen.getByTestId('domainManager-domain-input-error')).toHaveTextContent('Domain already exists');
    
    // Should still only have one instance of the domain
    expect(screen.getByTestId('domainManager-domain-0')).toHaveTextContent('example.com');
    expect(screen.queryByTestId('domainManager-domain-1')).not.toBeInTheDocument();
  });

  it('allows removing a domain', async () => {
    // Initialize with domains
    const initialData = {
      domains: ['example.com', 'test.com']
    };
    
    render(<DomainManager initialData={initialData} />);
    
    // Verify both domains are initially displayed
    expect(screen.getByTestId('domainManager-domain-0')).toHaveTextContent('example.com');
    expect(screen.getByTestId('domainManager-domain-1')).toHaveTextContent('test.com');
    
    // Click remove button for the first domain
    const removeButton = screen.getByTestId('domainManager-remove-domain-0');
    await user.click(removeButton);
    
    // Verify the domain was removed
    expect(screen.queryByTestId('domainManager-domain-0')).toHaveTextContent('test.com');
    expect(screen.queryByTestId('domainManager-domain-1')).not.toBeInTheDocument();
  });

  it('calls onCancel callback when cancel button is clicked', async () => {
    const mockOnCancel = jest.fn();
    
    render(<DomainManager onCancel={mockOnCancel} />);
    
    // Find and click the cancel button
    const cancelButton = screen.getByTestId('domainManager-cancel');
    await user.click(cancelButton);
    
    // Verify callback was called
    expect(mockOnCancel).toHaveBeenCalledTimes(1);
  });

  it('submits domains successfully in create mode', async () => {
    // Mock fetch response
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ id: 'new-site-1', domains: ['example.com'] })
    });
    
    const mockOnSuccess = jest.fn();
    
    render(<DomainManager onSuccess={mockOnSuccess} />);
    
    // Add a domain
    const domainInput = screen.getByTestId('domainManager-domain-input');
    await user.type(domainInput, 'example.com');
    
    const addButton = screen.getByTestId('domainManager-add-domain');
    await user.click(addButton);
    
    // Submit the form
    const submitButton = screen.getByTestId('domainManager-submit');
    await user.click(submitButton);
    
    // Verify API was called correctly
    expect(global.fetch).toHaveBeenCalledTimes(1);
    expect(global.fetch).toHaveBeenCalledWith(
      '/api/domain-manager',
      expect.objectContaining({
        method: 'POST',
        body: expect.stringContaining('example.com')
      })
    );
    
    // Verify success callback was called
    await waitFor(() => {
      expect(mockOnSuccess).toHaveBeenCalledTimes(1);
      expect(mockOnSuccess).toHaveBeenCalledWith({ id: 'new-site-1', domains: ['example.com'] });
    });
    
    // Verify success message
    expect(screen.getByTestId('domainManager-success')).toBeInTheDocument();
    
    // Verify router navigation was called
    await waitFor(() => {
      expect(useRouter().push).toHaveBeenCalledWith('/sites/new-site-1');
    });
  });

  it('submits domains successfully in edit mode', async () => {
    // Mock fetch response
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ id: 'site-1', domains: ['example.com', 'test.com'] })
    });
    
    const mockOnSuccess = jest.fn();
    const initialData = {
      id: 'site-1',
      domains: ['example.com']
    };
    
    render(
      <DomainManager 
        mode="edit" 
        initialData={initialData} 
        onSuccess={mockOnSuccess} 
      />
    );
    
    // Add another domain
    const domainInput = screen.getByTestId('domainManager-domain-input');
    await user.type(domainInput, 'test.com');
    
    const addButton = screen.getByTestId('domainManager-add-domain');
    await user.click(addButton);
    
    // Submit the form
    const submitButton = screen.getByTestId('domainManager-submit');
    await user.click(submitButton);
    
    // Verify API was called correctly with PUT method
    expect(global.fetch).toHaveBeenCalledTimes(1);
    expect(global.fetch).toHaveBeenCalledWith(
      '/api/domain-manager/site-1',
      expect.objectContaining({
        method: 'PUT',
        body: expect.stringContaining('"domains":["example.com","test.com"]')
      })
    );
    
    // Verify success callback was called
    await waitFor(() => {
      expect(mockOnSuccess).toHaveBeenCalledTimes(1);
    });
    
    // Verify success message
    expect(screen.getByTestId('domainManager-success')).toBeInTheDocument();
  });

  it('handles API errors when submitting domains', async () => {
    // Mock fetch with error response
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      json: async () => ({ error: 'Domain validation failed on server' })
    });
    
    render(<DomainManager />);
    
    // Add a domain
    const domainInput = screen.getByTestId('domainManager-domain-input');
    await user.type(domainInput, 'example.com');
    
    const addButton = screen.getByTestId('domainManager-add-domain');
    await user.click(addButton);
    
    // Submit the form
    const submitButton = screen.getByTestId('domainManager-submit');
    await user.click(submitButton);
    
    // Verify error message is displayed
    await waitFor(() => {
      expect(screen.getByTestId('domainManager-error')).toBeInTheDocument();
      expect(screen.getByTestId('domainManager-error')).toHaveTextContent('Domain validation failed on server');
    });
    
    // Verify router navigation was not called
    expect(useRouter().push).not.toHaveBeenCalled();
  });

  it('handles network errors when submitting domains', async () => {
    // Mock fetch with network error
    (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'));
    
    render(<DomainManager />);
    
    // Add a domain
    const domainInput = screen.getByTestId('domainManager-domain-input');
    await user.type(domainInput, 'example.com');
    
    const addButton = screen.getByTestId('domainManager-add-domain');
    await user.click(addButton);
    
    // Submit the form
    const submitButton = screen.getByTestId('domainManager-submit');
    await user.click(submitButton);
    
    // Verify error message is displayed
    await waitFor(() => {
      expect(screen.getByTestId('domainManager-error')).toBeInTheDocument();
      expect(screen.getByTestId('domainManager-error')).toHaveTextContent('Network error');
    });
  });

  it('prevents submission when no domains are added', async () => {
    render(<DomainManager />);
    
    // Try to submit the form without adding domains
    const submitButton = screen.getByTestId('domainManager-submit');
    await user.click(submitButton);
    
    // Verify error message
    expect(screen.getByTestId('domainManager-domains-error')).toBeInTheDocument();
    expect(screen.getByTestId('domainManager-domains-error')).toHaveTextContent('At least one domain is required');
    
    // API should not be called
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it('disables submit button during loading state', async () => {
    // Mock slow fetch response to test loading state
    let resolvePromise: (value: any) => void;
    const fetchPromise = new Promise((resolve) => {
      resolvePromise = resolve;
    });
    
    (global.fetch as jest.Mock).mockImplementationOnce(() => fetchPromise);
    
    render(<DomainManager />);
    
    // Add a domain
    const domainInput = screen.getByTestId('domainManager-domain-input');
    await user.type(domainInput, 'example.com');
    
    const addButton = screen.getByTestId('domainManager-add-domain');
    await user.click(addButton);
    
    // Submit the form
    const submitButton = screen.getByTestId('domainManager-submit');
    await user.click(submitButton);
    
    // Verify loading state
    expect(screen.getByTestId('domainManager-submit-loading')).toBeInTheDocument();
    expect(submitButton).toBeDisabled();
    
    // Also verify the domain input and add button are disabled
    expect(screen.getByTestId('domainManager-domain-input')).toBeDisabled();
    expect(screen.getByTestId('domainManager-add-domain')).toBeDisabled();
    
    // Resolve the promise to complete the test
    resolvePromise!({
      ok: true,
      json: async () => ({ id: 'site-1', domains: ['example.com'] })
    });
  });

  it('uses custom API endpoint when provided', async () => {
    // Custom API endpoint
    const customEndpoint = '/api/custom-domain-manager';
    
    render(<DomainManager apiEndpoint={customEndpoint} />);
    
    // Add a domain
    const domainInput = screen.getByTestId('domainManager-domain-input');
    await user.type(domainInput, 'example.com');
    
    const addButton = screen.getByTestId('domainManager-add-domain');
    await user.click(addButton);
    
    // Submit the form
    const submitButton = screen.getByTestId('domainManager-submit');
    await user.click(submitButton);
    
    // Verify custom API endpoint was used
    expect(global.fetch).toHaveBeenCalledWith(
      customEndpoint,
      expect.anything()
    );
  });
});

