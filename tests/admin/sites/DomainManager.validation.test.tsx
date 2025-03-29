import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { DomainManager } from '@/components/admin/sites/DomainManager';

describe('DomainManager Validation', () => {
  it('validates required fields and shows error messages', async () => {
    const user = userEvent.setup();
    render(<DomainManager />);
    
    // Submit form without filling required fields
    const submitButton = screen.getByTestId('domainManager-submit');
    await user.click(submitButton);
    
    // Check for error messages
    expect(await screen.findByText(/name is required/i)).toBeInTheDocument();
    expect(await screen.findByText(/slug is required/i)).toBeInTheDocument();
    expect(await screen.findByText(/at least one domain is required/i)).toBeInTheDocument();
  });

  it('validates field formats with appropriate error messages', async () => {
    const user = userEvent.setup();
    render(<DomainManager />);
    
    // Fill fields with invalid values
    await user.type(screen.getByLabelText(/name/i), 'A'.repeat(51)); // Too long
    await user.type(screen.getByLabelText(/slug/i), 'Invalid Slug!'); // Invalid characters
    await user.type(screen.getByLabelText(/description/i), 'A'.repeat(501)); // Too long
    
    // Submit the form
    await user.click(screen.getByTestId('domainManager-submit'));
    
    // Check for validation errors
    expect(await screen.findByText(/name cannot exceed 50 characters/i)).toBeInTheDocument();
    expect(await screen.findByText(/slug can only contain lowercase letters/i)).toBeInTheDocument();
    expect(await screen.findByText(/description cannot exceed 500 characters/i)).toBeInTheDocument();
  });

  it('validates domain format', async () => {
    const user = userEvent.setup();
    render(<DomainManager />);
    
    // Try to add invalid domain
    await user.type(screen.getByPlaceholderText(/enter domain/i), 'invalid');
    await user.click(screen.getByText(/\\+ add/i));
    
    // Check for validation error
    expect(await screen.findByText(/enter a valid domain name/i)).toBeInTheDocument();
    
    // Fix the domain and try again
    await user.clear(screen.getByPlaceholderText(/enter domain/i));
    await user.type(screen.getByPlaceholderText(/enter domain/i), 'valid.com');
    await user.click(screen.getByText(/\\+ add/i));
    
    // Check domain was added and error cleared
    expect(screen.getByText('valid.com')).toBeInTheDocument();
    expect(screen.queryByText(/enter a valid domain name/i)).not.toBeInTheDocument();
  });

  it('prevents adding duplicate domains', async () => {
    const user = userEvent.setup();
    render(<DomainManager />);
    
    // Add a domain
    await user.type(screen.getByPlaceholderText(/enter domain/i), 'example.com');
    await user.click(screen.getByText(/\\+ add/i));
    
    // Try to add the same domain again
    await user.type(screen.getByPlaceholderText(/enter domain/i), 'example.com');
    await user.click(screen.getByText(/\\+ add/i));
    
    // Check for validation error
    expect(await screen.findByText(/this domain has already been added/i)).toBeInTheDocument();
  });

  it('clears field errors when values are changed', async () => {
    const user = userEvent.setup();
    render(<DomainManager />);
    
    // Submit empty form to trigger validation errors
    await user.click(screen.getByTestId('domainManager-submit'));
    
    // Check for validation errors
    expect(await screen.findByText(/name is required/i)).toBeInTheDocument();
    
    // Type in the field with error
    await user.type(screen.getByLabelText(/name/i), 'Test Name');
    
    // Check that error was cleared
    expect(screen.queryByText(/name is required/i)).not.toBeInTheDocument();
  });
});
