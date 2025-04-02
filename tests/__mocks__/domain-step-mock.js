// Mock for DomainStep component
const React = require('react');

// Create a mock DomainStep component that handles missing domains
const DomainStep = jest.fn().mockImplementation((props) => {
  // Ensure domains is always an array
  const domains = props.values?.domains || [];
  
  return React.createElement('div', 
    { 'data-testid': 'domain-step' },
    [
      React.createElement('h2', { key: 'title' }, 'Domain Configuration'),
      React.createElement('div', { key: 'domains' }, 
        domains.length > 0 
          ? `${domains.length} domains configured` 
          : 'No domains configured'
      ),
      React.createElement('button', 
        { 
          key: 'add-domain',
          'data-testid': 'add-domain-button',
          onClick: () => props.onValueChange?.('domains', [...domains, { name: '', primary: false }])
        }, 
        'Add Domain'
      )
    ]
  );
});

// Mock the component
jest.mock('@/components/admin/sites/components/DomainStep', () => ({
  __esModule: true,
  DomainStep,
  default: DomainStep
}));

// Export the mocked component for direct access in tests
module.exports = {
  DomainStep
};
