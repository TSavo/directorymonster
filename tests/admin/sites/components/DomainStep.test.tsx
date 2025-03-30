import React from 'react';
import { render, screen } from '@testing-library/react';
import { DomainStep } from '@/components/admin/sites/components/DomainStep';

// Mock the DomainManager component that's used by DomainStep
jest.mock('@/components/admin/sites/DomainManager', () => ({
  DomainManager: ({ domains, onDomainsChange, errors }) => (
    <div data-testid="domain-manager">
      <div data-testid="domain-count">{domains.length}</div>
      <div data-testid="domain-error">{errors?.domains}</div>
      <button 
        data-testid="add-domain-button" 
        onClick={() => onDomainsChange([...domains, 'new-domain.com'])}
      >
        Add Domain
      </button>
    </div>
  )
}));

describe('DomainStep Component - Basic Rendering', () => {
  // Mock props
  const mockValues = {
    domains: ['example.com', 'test.org']
  };
  
  // Mock functions
  const mockOnChange = jest.fn();
  const mockErrors = {};
  
  it('renders the DomainManager component', () => {
    render(
      <DomainStep 
        values={mockValues}
        onChange={mockOnChange}
        errors={mockErrors}
      />
    );
    
    // Check if the DomainManager component is rendered
    expect(screen.getByTestId('domain-manager')).toBeInTheDocument();
  });

  it('passes domains from values to DomainManager', () => {
    render(
      <DomainStep 
        values={mockValues}
        onChange={mockOnChange}
        errors={mockErrors}
      />
    );
    
    // Check if domains are passed to DomainManager
    expect(screen.getByTestId('domain-count')).toHaveTextContent('2');
  });

  it('displays section heading and description', () => {
    render(
      <DomainStep 
        values={mockValues}
        onChange={mockOnChange}
        errors={mockErrors}
      />
    );
    
    // Check if heading and description are rendered
    expect(screen.getByTestId('domain-step-heading')).toBeInTheDocument();
    expect(screen.getByTestId('domain-step-heading')).toHaveTextContent(/domains|domain management/i);
    expect(screen.getByTestId('domain-step-description')).toBeInTheDocument();
  });

  it('passes errors to DomainManager when provided', () => {
    const mockErrorsWithDomains = {
      domains: 'At least one domain is required'
    };
    
    render(
      <DomainStep 
        values={mockValues}
        onChange={mockOnChange}
        errors={mockErrorsWithDomains}
      />
    );
    
    // Check if error is passed to DomainManager
    expect(screen.getByTestId('domain-error')).toHaveTextContent('At least one domain is required');
  });
});
