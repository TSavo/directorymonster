import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SiteForm } from '@/components/admin/sites/SiteForm';

// Mock Next.js router
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    back: jest.fn(),
    refresh: jest.fn(),
  }),
}));

describe('SiteForm Validation', () => {
  it.skip('validates required fields and shows error messages', async () => {
    const user = userEvent.setup();
    render(<SiteForm />);

    // Submit form without filling required fields
    const nextButton = screen.getByTestId('next-button');
    await user.click(nextButton);

    // Check for error messages
    expect(await screen.findByText(/name is required/i)).toBeInTheDocument();
    expect(await screen.findByText(/slug is required/i)).toBeInTheDocument();
  });

  it.skip('validates field formats with appropriate error messages', async () => {
    const user = userEvent.setup();
    render(<SiteForm />);

    // Fill fields with invalid values
    await user.type(screen.getByTestId('siteForm-name'), 'A'.repeat(51)); // Too long
    await user.type(screen.getByTestId('siteForm-slug'), 'Invalid Slug!'); // Invalid characters
    await user.type(screen.getByTestId('siteForm-description'), 'A'.repeat(501)); // Too long

    // Submit the form
    await user.click(screen.getByTestId('next-button'));

    // Check for validation errors
    expect(await screen.findByText(/name cannot exceed 50 characters/i)).toBeInTheDocument();
    expect(await screen.findByText(/slug can only contain lowercase letters/i)).toBeInTheDocument();
    expect(await screen.findByText(/description cannot exceed 500 characters/i)).toBeInTheDocument();
  });

  it.skip('validates domain format', async () => {
    const user = userEvent.setup();
    render(<SiteForm initialStep="domains" />);

    // Try to add invalid domain
    await user.type(screen.getByTestId('domainStep-domain-input'), 'invalid');
    await user.click(screen.getByTestId('domainStep-add-domain'));

    // Check for validation error
    expect(await screen.findByText(/enter a valid domain name/i)).toBeInTheDocument();

    // Fix the domain and try again
    await user.clear(screen.getByTestId('domainStep-domain-input'));
    await user.type(screen.getByTestId('domainStep-domain-input'), 'valid.com');
    await user.click(screen.getByTestId('domainStep-add-domain'));

    // Check domain was added and error cleared
    expect(screen.getByText('valid.com')).toBeInTheDocument();
    expect(screen.queryByText(/enter a valid domain name/i)).not.toBeInTheDocument();
  });

  it.skip('prevents adding duplicate domains', async () => {
    const user = userEvent.setup();
    render(<SiteForm initialStep="domains" />);

    // Add a domain
    await user.type(screen.getByTestId('domainStep-domain-input'), 'example.com');
    await user.click(screen.getByTestId('domainStep-add-domain'));

    // Try to add the same domain again
    await user.type(screen.getByTestId('domainStep-domain-input'), 'example.com');
    await user.click(screen.getByTestId('domainStep-add-domain'));

    // Check for validation error
    expect(await screen.findByText(/this domain has already been added/i)).toBeInTheDocument();
  });

  it.skip('clears field errors when values are changed', async () => {
    const user = userEvent.setup();
    render(<SiteForm />);

    // Submit empty form to trigger validation errors
    await user.click(screen.getByTestId('next-button'));

    // Check for validation errors
    expect(await screen.findByText(/name is required/i)).toBeInTheDocument();

    // Type in the field with error
    await user.type(screen.getByTestId('siteForm-name'), 'Test Name');

    // Check that error was cleared
    expect(screen.queryByText(/name is required/i)).not.toBeInTheDocument();
  });
});
