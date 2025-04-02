// Mock for AdminHeader component
const React = require('react');

// Create a mock AdminHeader component
const AdminHeader = jest.fn().mockImplementation(({ toggleSidebar }) => {
  // Create state for dropdowns
  const [notificationsOpen, setNotificationsOpen] = React.useState(false);
  const [userMenuOpen, setUserMenuOpen] = React.useState(false);

  // Toggle functions
  const toggleNotifications = () => {
    setNotificationsOpen(!notificationsOpen);
    if (!notificationsOpen) {
      setUserMenuOpen(false);
    }
  };

  const toggleUserMenu = () => {
    setUserMenuOpen(!userMenuOpen);
    if (!userMenuOpen) {
      setNotificationsOpen(false);
    }
  };

  // Create dropdown elements
  const notificationsDropdown = notificationsOpen ?
    React.createElement('div', { key: 'notifications-dropdown', 'data-testid': 'notifications-dropdown' }, [
      React.createElement('div', { key: 'notifications-title' }, 'Notifications'),
      React.createElement('p', { key: 'no-notifications' }, 'No new notifications')
    ]) : null;

  const userMenuDropdown = userMenuOpen ?
    React.createElement('div', { key: 'user-menu-dropdown', 'data-testid': 'user-menu-dropdown' }, [
      React.createElement('div', { key: 'user-info' }, [
        React.createElement('p', { key: 'user-name' }, 'Admin User'),
        React.createElement('p', { key: 'user-email' }, 'admin@example.com')
      ]),
      React.createElement('ul', { key: 'menu-items' }, [
        React.createElement('li', { key: 'profile' },
          React.createElement('a', { href: '#', onClick: () => setUserMenuOpen(false) }, 'Your Profile')
        ),
        React.createElement('li', { key: 'settings' },
          React.createElement('a', { href: '#', onClick: () => setUserMenuOpen(false) }, 'Settings')
        ),
        React.createElement('li', { key: 'logout' },
          React.createElement('a', { href: '#', onClick: () => setUserMenuOpen(false) }, 'Sign out')
        )
      ])
    ]) : null;

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
          onClick: toggleNotifications,
          'data-testid': 'notifications-button'
        },
        'Notifications'
      ),
      notificationsDropdown,
      React.createElement('button',
        {
          key: 'user-menu',
          'aria-label': 'Open user menu',
          onClick: toggleUserMenu,
          'data-testid': 'user-menu-button'
        },
        'User'
      ),
      userMenuDropdown
    ].filter(Boolean) // Filter out null elements
  );
});

// Create a mock AdminSidebar component
const AdminSidebar = jest.fn().mockImplementation(({ isOpen, closeSidebar, activePath = '' }) => {
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
      className: `admin-sidebar ${isOpen ? 'open' : 'closed'} ${!isOpen ? 'transform -translate-x-full' : ''}`
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
});ents
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
