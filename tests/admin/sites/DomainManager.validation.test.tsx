import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { DomainManager } from '@/components/admin/sites/DomainManager';

// Mock next/navigation
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    prefetch: jest.fn(),
    back: jest.fn(),
    forward: jest.fn(),
  }),
}));

describe('DomainManager Validation', () => {
  it('validates required fields and shows error messages', async () => {
    const user = userEvent.setup();
    render(<DomainManager />);
    
    // Submit form without filling required fields
    const submitButton = screen.getByTestId('domainManager-submit');
    await user.click(submitButton);
    
    // Check for error messages
    expect(await screen.findByTestId('domainManager-domains-error')).toBeInTheDocument();
  });

  it('validates domain format with appropriate error messages', async () => {
    const user = userEvent.setup();
    render(<DomainManager />);
    
    // Fill in domain with invalid format
    await user.type(screen.getByPlaceholderText(/enter domain/i), 'invalid-domain');
    
    // Try to add the invalid domain
    await user.click(screen.getByTestId('domainManager-add-domain'));
    
    // Check for format validation error messages
    expect(await screen.findByText(/invalid domain format/i)).toBeInTheDocument();
  });

  it('allows adding valid domains', async () => {
    const user = userEvent.setup();
    render(<DomainManager />);
    
    // Add a valid domain
    await user.type(screen.getByPlaceholderText(/enter domain/i), 'valid.com');
    await user.click(screen.getByTestId('domainManager-add-domain'));
    
    // Check domain was added without errors
    expect(screen.getByText('valid.com')).toBeInTheDocument();
    expect(screen.queryByText(/invalid domain format/i)).not.toBeInTheDocument();
  });

  it('prevents adding duplicate domains', async () => {
    const user = userEvent.setup();
    render(<DomainManager />);
    
    // Add a domain
    await user.type(screen.getByPlaceholderText(/enter domain/i), 'example.com');
    await user.click(screen.getByTestId('domainManager-add-domain'));
    
    // Try to add the same domain again
    await user.type(screen.getByPlaceholderText(/enter domain/i), 'example.com');
    await user.click(screen.getByTestId('domainManager-add-domain'));
    
    // Check for validation error
    expect(await screen.findByText(/domain already exists/i)).toBeInTheDocument();
  });
});
