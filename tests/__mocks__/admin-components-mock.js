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
      React.createElement('h3', { key: 'notifications-title' }, 'Notifications'),
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
          React.createElement('a', { href: '#', onClick: () => setUserMenuOpen(false) }, 'Logout')
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
