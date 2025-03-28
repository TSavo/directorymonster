import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { DomainManager } from '@/components/admin/sites/DomainManager';

// Mock the useRouter hook
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
  }),
}));

// Mock fetch function
global.fetch = jest.fn();

describe('DomainManager - Domain Management Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Reset fetch mock before each test
    (global.fetch as jest.Mock).mockReset();
  });

  it('renders domain list correctly', () => {
    const initialData = {
      id: 'site-1',
      domains: ['example.com', 'test.example.com']
    };
    
    render(<DomainManager initialData={initialData} mode="edit" />);
    
    // Check if domains are displayed
    expect(screen.getByText('example.com')).toBeInTheDocument();
    expect(screen.getByText('test.example.com')).toBeInTheDocument();
  });

  it('allows adding a new domain', async () => {
    const user = userEvent.setup();
    render(<DomainManager />);
    
    // Find the domain input field and add button
    const domainInput = screen.getByTestId('domainManager-domain-input');
    const addButton = screen.getByTestId('domainManager-add-domain');
    
    // Enter a domain and click add
    await user.type(domainInput, 'newdomain.com');
    await user.click(addButton);
    
    // Domain should be added to the list
    expect(screen.getByText('newdomain.com')).toBeInTheDocument();
  });

  it('shows validation error for invalid domain format', async () => {
    const user = userEvent.setup();
    render(<DomainManager />);
    
    // Find the domain input field and add button
    const domainInput = screen.getByTestId('domainManager-domain-input');
    const addButton = screen.getByTestId('domainManager-add-domain');
    
    // Enter an invalid domain and click add
    await user.type(domainInput, 'invalid domain');
    await user.click(addButton);
    
    // Error message should be displayed
    expect(screen.getByText(/invalid domain format/i)).toBeInTheDocument();
    
    // Domain should not be added
    expect(screen.queryByText('invalid domain')).not.toBeInTheDocument();
  });

  it('prevents adding duplicate domains', async () => {
    const user = userEvent.setup();
    const initialData = {
      id: 'site-1',
      domains: ['example.com']
    };
    
    render(<DomainManager initialData={initialData} mode="edit" />);
    
    // Find the domain input field and add button
    const domainInput = screen.getByTestId('domainManager-domain-input');
    const addButton = screen.getByTestId('domainManager-add-domain');
    
    // Try to add a duplicate domain
    await user.type(domainInput, 'example.com');
    await user.click(addButton);
    
    // Error message for duplicate should be displayed
    expect(screen.getByText(/domain already exists/i)).toBeInTheDocument();
  });

  it('allows removing a domain', async () => {
    const user = userEvent.setup();
    const initialData = {
      id: 'site-1',
      domains: ['example.com', 'test.example.com']
    };
    
    render(<DomainManager initialData={initialData} mode="edit" />);
    
    // Find and click the remove button for the first domain
    const removeButtons = screen.getAllByTestId(/domainManager-remove-domain/);
    await user.click(removeButtons[0]);
    
    // The domain should be removed
    expect(screen.queryByText('example.com')).not.toBeInTheDocument();
    expect(screen.getByText('test.example.com')).toBeInTheDocument();
  });

  it('includes domains in form submission', async () => {
    const user = userEvent.setup();
    const onSuccess = jest.fn();
    const initialData = {
      id: 'site-1',
      domains: ['example.com']
    };
    
    // Mock successful API response
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ id: 'site-1', domains: ['example.com', 'newdomain.com'] })
    });
    
    render(<DomainManager initialData={initialData} mode="edit" onSuccess={onSuccess} />);
    
    // Add a new domain
    const domainInput = screen.getByTestId('domainManager-domain-input');
    const addButton = screen.getByTestId('domainManager-add-domain');
    
    await user.type(domainInput, 'newdomain.com');
    await user.click(addButton);
    
    // Submit the form
    const submitButton = screen.getByTestId('domainManager-submit');
    await user.click(submitButton);
    
    // Wait for form submission to complete
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledTimes(1);
    });
    
    // Check that domains were included in submission
    const fetchCall = (global.fetch as jest.Mock).mock.calls[0];
    const requestBody = JSON.parse(fetchCall[1].body);
    
    expect(requestBody.domains).toContain('example.com');
    expect(requestBody.domains).toContain('newdomain.com');
    
    // Success callback should be called
    expect(onSuccess).toHaveBeenCalledTimes(1);
  });
});
