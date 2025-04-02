const fs = require('fs');
const path = require('path');

// Function to update the AdminSidebar mock
function updateAdminSidebarMock(dryRun = true) {
  const filePath = path.join(process.cwd(), 'tests/__mocks__/admin-components-mock.js');
  let content = fs.readFileSync(filePath, 'utf8');

  // Find the AdminSidebar component implementation
  const sidebarStartRegex = /const AdminSidebar = jest\.fn\(\)\.mockImplementation\(\(\{ isOpen, closeSidebar(?:, activePath = '') ?\}\) => \{/;
  const sidebarEndRegex = /\}\);(\s+)\/\/ Mock the components/;

  const sidebarStartMatch = content.match(sidebarStartRegex);
  const sidebarEndMatch = content.match(sidebarEndRegex);

  if (!sidebarStartMatch || !sidebarEndMatch) {
    console.error('Could not find AdminSidebar implementation in the mock file');
    return false;
  }

  // Extract the current implementation
  const currentImplementation = content.substring(
    sidebarStartMatch.index,
    sidebarEndMatch.index + sidebarEndMatch[0].length - sidebarEndMatch[1].length
  );

  // Create the new implementation with additional navigation items and active class handling
  const newImplementation = `const AdminSidebar = jest.fn().mockImplementation(({ isOpen, closeSidebar, activePath = '' }) => {
  // Function to determine if a link is active
  const isActive = (path) => {
    if (!activePath) return false;
    return activePath === path || activePath.startsWith(path + '/');
  };

  // Function to get the appropriate class for a link
  const getLinkClass = (path) => {
    return isActive(path) ? 'bg-gray-900 text-white' : 'text-gray-300 hover:bg-gray-700 hover:text-white';
  };

  return React.createElement('aside',
    {
      'data-testid': 'admin-sidebar',
      className: \`admin-sidebar \${isOpen ? 'open' : 'closed'} \${!isOpen ? 'transform -translate-x-full' : ''}\`
    },
    [
      React.createElement('button',
        {
          key: 'close-button',
          onClick: closeSidebar,
          'aria-label': 'Close sidebar',
          'data-testid': 'close-sidebar'
        },
        'Close'
      ),
      React.createElement('nav',
        { key: 'nav' },
        [
          React.createElement('a',
            {
              key: 'dashboard',
              href: '/admin',
              'data-testid': 'nav-dashboard',
              className: getLinkClass('/admin'),
              onClick: () => isOpen && closeSidebar()
            },
            'Dashboard'
          ),
          React.createElement('a',
            {
              key: 'sites',
              href: '/admin/sites',
              'data-testid': 'nav-sites',
              className: getLinkClass('/admin/sites'),
              onClick: () => isOpen && closeSidebar()
            },
            'Sites'
          ),
          React.createElement('a',
            {
              key: 'categories',
              href: '/admin/categories',
              'data-testid': 'nav-categories',
              className: getLinkClass('/admin/categories'),
              onClick: () => isOpen && closeSidebar()
            },
            'Categories'
          ),
          React.createElement('a',
            {
              key: 'listings',
              href: '/admin/listings',
              'data-testid': 'nav-listings',
              className: getLinkClass('/admin/listings'),
              onClick: () => isOpen && closeSidebar()
            },
            'Listings'
          ),
          React.createElement('a',
            {
              key: 'users',
              href: '/admin/users',
              'data-testid': 'nav-users',
              className: getLinkClass('/admin/users'),
              onClick: () => isOpen && closeSidebar()
            },
            'Users'
          ),
          React.createElement('a',
            {
              key: 'analytics',
              href: '/admin/analytics',
              'data-testid': 'nav-analytics',
              className: getLinkClass('/admin/analytics'),
              onClick: () => isOpen && closeSidebar()
            },
            'Analytics'
          ),
          React.createElement('a',
            {
              key: 'settings',
              href: '/admin/settings',
              'data-testid': 'nav-settings',
              className: getLinkClass('/admin/settings'),
              onClick: () => isOpen && closeSidebar()
            },
            'Settings'
          )
        ]
      )
    ]
  );
});`;

  // Replace the old implementation with the new one
  const updatedContent = content.replace(currentImplementation, newImplementation);

  // Write the updated content back to the file if not in dry run mode
  if (!dryRun) {
    fs.writeFileSync(filePath, updatedContent, 'utf8');
  }

  console.log('Updated AdminSidebar mock with additional navigation items and active class handling');
  return {
    file: filePath,
    oldImplementation: currentImplementation,
    newImplementation
  };
}

// Function to update the DomainStep mock
function updateDomainStepMock(dryRun = true) {
  const filePath = path.join(process.cwd(), 'tests/__mocks__/domain-step-mock.js');
  let content = fs.readFileSync(filePath, 'utf8');

  // Find the DomainStep component implementation
  const stepStartRegex = /const DomainStep = jest\.fn\(\)\.mockImplementation\(\(props\) => \{/;

  // If the file doesn't exist, create it
  if (!fs.existsSync(filePath)) {
    const mockDir = path.dirname(filePath);
    if (!fs.existsSync(mockDir)) {
      fs.mkdirSync(mockDir, { recursive: true });
    }

    // Create a basic mock file
    const basicMock = `// Mock for DomainStep component
const React = require('react');

// Create a mock DomainStep component that handles missing domains
const DomainStep = jest.fn().mockImplementation((props) => {});

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
`;

    fs.writeFileSync(filePath, basicMock, 'utf8');
    content = basicMock;
  }
  const stepEndRegex = /\}\);(\s+)\/\/ Mock the component/;

  const stepStartMatch = content.match(stepStartRegex);
  const stepEndMatch = content.match(stepEndRegex);

  if (!stepStartMatch || !stepEndMatch) {
    console.error('Could not find DomainStep implementation in the mock file');
    return false;
  }

  // Extract the current implementation
  const currentImplementation = content.substring(
    stepStartMatch.index,
    stepEndMatch.index + stepEndMatch[0].length - stepEndMatch[1].length
  );

  // Create the new implementation with additional test IDs
  const newImplementation = `const DomainStep = jest.fn().mockImplementation((props) => {
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
              React.createElement('li', { key: \`domain-\${index}\` }, domain.name)
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
});`;

  // Replace the old implementation with the new one
  const updatedContent = content.replace(currentImplementation, newImplementation);

  // Write the updated content back to the file if not in dry run mode
  if (!dryRun) {
    fs.writeFileSync(filePath, updatedContent, 'utf8');
  }

  console.log('Updated DomainStep mock with additional test IDs and structure');
  return {
    file: filePath,
    oldImplementation: currentImplementation,
    newImplementation
  };
}

// Main function
function main(dryRun = true) {
  console.log(`Running in ${dryRun ? 'dry run' : 'live'} mode`);

  const adminSidebarChanges = updateAdminSidebarMock(dryRun);
  const domainStepChanges = updateDomainStepMock(dryRun);

  console.log('\nChanges to be made:');

  if (adminSidebarChanges) {
    console.log(`\nFile: ${adminSidebarChanges.file}`);
    console.log('Changes: Added missing navigation items (Users, Analytics, Settings) and active class handling');
  }

  if (domainStepChanges) {
    console.log(`\nFile: ${domainStepChanges.file}`);
    console.log('Changes: Added missing test IDs (domainStep-heading, domainStep-domain-input, domainStep-add-domain)');
  }

  return { adminSidebarChanges, domainStepChanges };
}

// Run the script in dry run mode
const result = main(true);

// Export the result for potential use in other scripts
module.exports = { result, main };
