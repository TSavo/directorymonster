import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import DomainStep from '@/components/admin/sites/components/DomainStep';

// Mock the DomainManager component that's used by DomainStep
jest.mock('@/components/admin/sites/DomainManager', () => ({
  DomainManager: ({ domains, onDomainsChange }) => (
    <div data-testid="domain-manager">
      <ul>
        {domains.map((domain, index) => (
          <li key={index} data-testid={`domain-${index}`}>
            {domain}
            <button
              data-testid={`remove-domain-${index}`}
              onClick={() => {
                const newDomains = [...domains];
                newDomains.splice(index, 1);
                onDomainsChange(newDomains);
              }}
            >
              Remove
            </button>
          </li>
        ))}
      </ul>
      <input data-testid="domain-input" />
      <button
        data-testid="add-domain-button"
        onClick={() => onDomainsChange([...domains, 'new-domain.com'])}
      >
        Add Domain
      </button>
    </div>
  )
}));

describe.skip('DomainStep Component - Interaction', () => {
  // Setup test user for interactions
  const user = userEvent.setup();

  // Mock props
  const mockValues = {
    domains: ['example.com', 'test.org']
  };

  it('calls onChange when domains are added', async () => {
    const mockOnChange = jest.fn();
    const mockErrors = {};

    render(
      <DomainStep
        values={mockValues}
        onChange={mockOnChange}
        errors={mockErrors}
      />
    );

    // Click the add domain button
    const addButton = screen.getByTestId('add-domain-button');
    await user.click(addButton);

    // Verify onChange was called with updated domains
    expect(mockOnChange).toHaveBeenCalledTimes(1);
    expect(mockOnChange).toHaveBeenCalledWith('domains', [
      'example.com',
      'test.org',
      'new-domain.com'
    ]);
  });

  it('calls onChange when a domain is removed', async () => {
    const mockOnChange = jest.fn();
    const mockErrors = {};

    render(
      <DomainStep
        values={mockValues}
        onChange={mockOnChange}
        errors={mockErrors}
      />
    );

    // Click the remove button for the first domain
    const removeButton = screen.getByTestId('remove-domain-0');
    await user.click(removeButton);

    // Verify onChange was called with updated domains
    expect(mockOnChange).toHaveBeenCalledTimes(1);
    expect(mockOnChange).toHaveBeenCalledWith('domains', ['test.org']);
  });
});
