import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SiteFormProvider } from '@/components/admin/sites/context/SiteFormContext';
import { DomainStep } from '@/components/admin/sites/components/DomainStepFixed';

// Wrap component with context provider for testing
const renderWithContext = (initialData = {}) => {
  return render(
    <SiteFormProvider initialData={initialData}>
      <DomainStep />
    </SiteFormProvider>
  );
};

describe('DomainStep with Context', () => {
  it('renders the domain management form', () => {
    renderWithContext();

    // Check for heading and description
    expect(screen.getByTestId('domainStep-heading')).toBeInTheDocument();
    expect(screen.getByTestId('domainStep-description')).toBeInTheDocument();

    // Check for domain input and add button
    expect(screen.getByTestId('domainStep-domain-input')).toBeInTheDocument();
    expect(screen.getByTestId('domainStep-add-domain')).toBeInTheDocument();
  });

  it('displays initial domains when provided', () => {
    const initialData = {
      domains: ['example.com', 'test.com']
    };

    renderWithContext(initialData);

    // Check that domains are displayed
    expect(screen.getByTestId('domainStep-domain-0')).toHaveTextContent('example.com');
    expect(screen.getByTestId('domainStep-domain-1')).toHaveTextContent('test.com');
  });

  it('allows adding a valid domain', async () => {
    const user = userEvent.setup();
    renderWithContext();

    // Add a domain
    await user.type(screen.getByTestId('domainStep-domain-input'), 'example.com');
    await user.click(screen.getByTestId('domainStep-add-domain'));

    // Check that domain was added
    expect(await screen.findByTestId('domainStep-domain-0')).toHaveTextContent('example.com');

    // Check that input was cleared
    expect(screen.getByTestId('domainStep-domain-input')).toHaveValue('');
  });

  it('shows validation error for invalid domain', async () => {
    const user = userEvent.setup();
    renderWithContext();

    // Try to add an invalid domain
    await user.type(screen.getByTestId('domainStep-domain-input'), 'invalid');
    await user.click(screen.getByTestId('domainStep-add-domain'));

    // Check for validation error
    expect(await screen.findByTestId('domainStep-domain-input-error')).toBeInTheDocument();
    expect(screen.getByTestId('domainStep-domain-input-error')).toHaveTextContent(/valid domain/i);
  });

  it('shows validation error for duplicate domain', async () => {
    const user = userEvent.setup();
    renderWithContext({ domains: ['example.com'] });

    // Try to add a duplicate domain
    await user.type(screen.getByTestId('domainStep-domain-input'), 'example.com');
    await user.click(screen.getByTestId('domainStep-add-domain'));

    // Check for validation error
    expect(await screen.findByTestId('domainStep-domain-input-error')).toBeInTheDocument();
    expect(screen.getByTestId('domainStep-domain-input-error')).toHaveTextContent(/already been added/i);
  });

  it('allows removing a domain', async () => {
    const user = userEvent.setup();
    renderWithContext({ domains: ['example.com'] });

    // Check that domain is displayed
    expect(screen.getByTestId('domainStep-domain-0')).toHaveTextContent('example.com');

    // Remove the domain
    await user.click(screen.getByTestId('domainStep-remove-domain-0'));

    // Check that domain was removed
    await waitFor(() => {
      expect(screen.queryByTestId('domainStep-domain-0')).not.toBeInTheDocument();
    });
  });
});
