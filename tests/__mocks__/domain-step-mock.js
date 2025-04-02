// Mock for DomainStep component
const React = require('react');

// Create a mock DomainStep component that handles missing domains
const DomainStep = jest.fn().mockImplementation((props) => {
  // Ensure domains is always an array
  const domains = props.values?.domains || [];
  
  return React.createElement('div', 
    { 'data-testid': 'domain-step' },
    [
      React.createElement('h2', { 
        key: 'title',
        'data-testid': 'domainStep-heading'
      }, 'Domain Configuration'),
      
      // Domain input section
      React.createElement('div', { 
        key: 'domain-input-section',
        'data-testid': 'domainStep-input-section'
      }, [
        React.createElement('label', { 
          key: 'domain-label',
          htmlFor: 'domain-input'
        }, 'Domain Name'),
        React.createElement('input', { 
          key: 'domain-input',
          id: 'domain-input',
          'data-testid': 'domainStep-domain-input',
          type: 'text',
          placeholder: 'Enter domain name',
          value: '',
          onChange: (e) => console.log('Domain input changed:', e.target.value)
        })
      ]),
      
      // Domains list
      React.createElement('div', { 
        key: 'domains-list',
        'data-testid': 'domainStep-domains-list'
      }, 
        domains.length > 0 
          ? React.createElement('ul', {}, domains.map((domain, index) => 
              React.createElement('li', { key: `domain-${index}` }, domain.name)
            ))
          : React.createElement('p', {}, 'No domains configured')
      ),
      
      // Add domain button
      React.createElement('button', 
        { 
          key: 'add-domain',
          'data-testid': 'domainStep-add-domain',
          onClick: () => props.onValueChange?.('domains', [...domains, { name: '', primary: false }])
        }, 
        'Add Domain'
      )
    ]
  );
});nent
jest.mock('@/components/admin/sites/components/DomainStep', () => ({
  __esModule: true,
  DomainStep,
  default: DomainStep
}));

// Export the mocked component for direct access in tests
module.exports = {
  DomainStep
};
