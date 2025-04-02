// Mock for AdminHeader component
const React = require('react');

// Create a mock AdminHeader component
const AdminHeader = jest.fn().mockImplementation(({ toggleSidebar }) => {
  return React.createElement('header', 
    { 'data-testid': 'admin-header', className: 'admin-header' },
    [
      React.createElement('div', { key: 'title', className: 'header-title' }, 'Admin Portal'),
      React.createElement('button', 
        { 
          key: 'menu-button',
          'aria-label': 'Open sidebar',
          onClick: toggleSidebar,
          'data-testid': 'sidebar-toggle'
        }, 
        'Menu'
      ),
      React.createElement('button', 
        { 
          key: 'notifications',
          'aria-label': 'View notifications',
          'data-testid': 'notifications-button'
        }, 
        'Notifications'
      ),
      React.createElement('button', 
        { 
          key: 'user-menu',
          'aria-label': 'Open user menu',
          'data-testid': 'user-menu-button'
        }, 
        'User'
      )
    ]
  );
});

// Create a mock AdminSidebar component
const AdminSidebar = jest.fn().mockImplementation(({ isOpen, closeSidebar }) => {
  return React.createElement('aside', 
    { 
      'data-testid': 'admin-sidebar',
      className: `admin-sidebar ${isOpen ? 'open' : 'closed'}`
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
            { key: 'dashboard', href: '/admin', 'data-testid': 'nav-dashboard' }, 
            'Dashboard'
          ),
          React.createElement('a', 
            { key: 'sites', href: '/admin/sites', 'data-testid': 'nav-sites' }, 
            'Sites'
          ),
          React.createElement('a', 
            { key: 'categories', href: '/admin/categories', 'data-testid': 'nav-categories' }, 
            'Categories'
          ),
          React.createElement('a', 
            { key: 'listings', href: '/admin/listings', 'data-testid': 'nav-listings' }, 
            'Listings'
          )
        ]
      )
    ]
  );
});

// Mock the components
jest.mock('@/components/admin/layout/AdminHeader', () => ({
  __esModule: true,
  AdminHeader,
  default: AdminHeader
}));

jest.mock('@/components/admin/layout/AdminSidebar', () => ({
  __esModule: true,
  AdminSidebar,
  default: AdminSidebar
}));

// Export the mocked components for direct access in tests
module.exports = {
  AdminHeader,
  AdminSidebar
};
