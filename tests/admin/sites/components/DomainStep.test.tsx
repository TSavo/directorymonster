import React from 'react';
import { render, screen } from '@testing-library/react';
import { DomainStep } from '@/components/admin/sites/components/DomainStep';

describe('DomainStep Component - Basic Rendering', () => {
  // Mock props
  const mockDomains = ['example.com', 'test.org'];

  // Mock functions
  const mockOnChange = jest.fn();
  const mockOnAdd = jest.fn();
  const mockOnRemove = jest.fn();
  const mockErrors = {};

  it('renders the DomainStep component', () => {
    render(
      <DomainStep
        domains={mockDomains}
        onChange={mockOnChange}
        onAdd={mockOnAdd}
        onRemove={mockOnRemove}
        errors={mockErrors}
      />
    );

    // Check if the component is rendered with the correct heading
    expect(screen.getByTestId('domainStep-heading')).toBeInTheDocument();
  });

  it('displays domains list correctly', () => {
    render(
      <DomainStep
        domains={mockDomains}
        onChange={mockOnChange}
        onAdd={mockOnAdd}
        onRemove={mockOnRemove}
        errors={mockErrors}
      />
    );

    // Check if domains are displayed
    expect(screen.getByTestId('domainStep-domain-0')).toHaveTextContent('example.com');
    expect(screen.getByTestId('domainStep-domain-1')).toHaveTextContent('test.org');
  });

  it('displays section heading and description', () => {
    render(
      <DomainStep
        domains={mockDomains}
        onChange={mockOnChange}
        onAdd={mockOnAdd}
        onRemove={mockOnRemove}
        errors={mockErrors}
      />
    );

    // Check if heading and description are rendered
    expect(screen.getByTestId('domainStep-heading')).toBeInTheDocument();
    expect(screen.getByTestId('domainStep-heading')).toHaveTextContent(/domains|domain management/i);
    expect(screen.getByTestId('domainStep-description')).toBeInTheDocument();
  });

  it('displays domain error when provided', () => {
    const mockErrorsWithDomains = {
      domains: 'At least one domain is required'
    };

    render(
      <DomainStep
        domains={mockDomains}
        onChange={mockOnChange}
        onAdd={mockOnAdd}
        onRemove={mockOnRemove}
        errors={mockErrorsWithDomains}
      />
    );

    // Check if error is displayed
    expect(screen.getByTestId('domainStep-domains-error')).toHaveTextContent('At least one domain is required');
  });
});
