/**
 * @jest-environment jsdom
 */
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { UserSiteAccessContainer } from '@/components/admin/users/containers';
import UserSitesPage from '@/app/admin/users/[id]/sites/page';

// Mock Next.js router
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    back: jest.fn(),
    refresh: jest.fn()
  })
}));

// Mock fetch API
global.fetch = jest.fn();

describe('User Site Access Integration', () => {
  const mockUser = {
    id: 'user-1',
    name: 'John Doe',
    email: 'john@example.com',
    status: 'active',
    createdAt: '2023-01-01T00:00:00.000Z'
  };

  const mockSites = [
    {
      id: 'site-1',
      name: 'Main Site',
      slug: 'main',
      domain: 'example.com',
      hasAccess: true,
      roles: []
    },
    {
      id: 'site-2',
      name: 'Blog',
      slug: 'blog',
      domain: 'blog.example.com',
      hasAccess: false,
      roles: []
    }
  ];

  const mockAvailableRoles = [
    {
      id: 'role-1',
      name: 'Site Admin',
      description: 'Site administrator role',
      type: 'custom',
      scope: 'site',
      tenantId: 'tenant-1',
      siteId: 'site-1',
      permissions: [],
      userCount: 3,
      createdAt: '2023-01-01T00:00:00.000Z',
      updatedAt: '2023-01-01T00:00:00.000Z'
    }
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock fetch for different API endpoints
    (global.fetch as jest.Mock).mockImplementation((url) => {
      // Single user
      if (url.match(/\/api\/admin\/users\/user-1$/)) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({
            user: mockUser
          })
        });
      }
      
      // User sites
      if (url.includes('/api/admin/users/user-1/sites')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({
            sites: mockSites,
            availableRoles: mockAvailableRoles
          })
        });
      }
      
      return Promise.reject(new Error('Not found'));
    });
  });

  it('renders the user sites page with correct data', async () => {
    // Render the sites page
    render(<UserSitesPage params={{ id: 'user-1' }} />);
    
    // Wait for sites to load
    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument();
      expect(screen.getByText('Main Site')).toBeInTheDocument();
      expect(screen.getByText('Blog')).toBeInTheDocument();
    });
    
    // Check that fetch was called for user and sites
    expect(global.fetch).toHaveBeenCalledWith('/api/admin/users/user-1');
    expect(global.fetch).toHaveBeenCalledWith('/api/admin/users/user-1/sites');
  });

  it('allows granting access to a site', async () => {
    // Mock POST response for granting access
    (global.fetch as jest.Mock).mockImplementationOnce(() => 
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({
          user: mockUser
        })
      })
    ).mockImplementationOnce(() => 
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({
          sites: mockSites,
          availableRoles: mockAvailableRoles
        })
      })
    ).mockImplementationOnce(() => 
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ success: true })
      })
    ).mockImplementationOnce(() => 
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({
          sites: [
            mockSites[0],
            { ...mockSites[1], hasAccess: true }
          ],
          availableRoles: mockAvailableRoles
        })
      })
    );
    
    // Render the site access container
    render(<UserSiteAccessContainer userId="user-1" />);
    
    // Wait for sites to load
    await waitFor(() => {
      expect(screen.getByText('Main Site')).toBeInTheDocument();
      expect(screen.getByText('Blog')).toBeInTheDocument();
    });
    
    // Find and click the "Grant Access" button for the Blog site
    const grantAccessButton = screen.getByTestId('grant-access-site-2');
    fireEvent.click(grantAccessButton);
    
    // Check that fetch was called to grant access
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith('/api/admin/users/user-1/sites/site-2/access', expect.objectContaining({
        method: 'POST'
      }));
    });
    
    // Check that sites were refreshed
    expect(global.fetch).toHaveBeenCalledWith('/api/admin/users/user-1/sites');
  });

  it('allows revoking access from a site', async () => {
    // Mock DELETE response for revoking access
    (global.fetch as jest.Mock).mockImplementationOnce(() => 
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({
          user: mockUser
        })
      })
    ).mockImplementationOnce(() => 
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({
          sites: mockSites,
          availableRoles: mockAvailableRoles
        })
      })
    ).mockImplementationOnce(() => 
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ success: true })
      })
    ).mockImplementationOnce(() => 
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({
          sites: [
            { ...mockSites[0], hasAccess: false },
            mockSites[1]
          ],
          availableRoles: mockAvailableRoles
        })
      })
    );
    
    // Render the site access container
    render(<UserSiteAccessContainer userId="user-1" />);
    
    // Wait for sites to load
    await waitFor(() => {
      expect(screen.getByText('Main Site')).toBeInTheDocument();
      expect(screen.getByText('Blog')).toBeInTheDocument();
    });
    
    // Find and click the "Revoke Access" button for the Main Site
    const revokeAccessButton = screen.getByTestId('revoke-access-site-1');
    fireEvent.click(revokeAccessButton);
    
    // Wait for the confirmation dialog
    await waitFor(() => {
      expect(screen.getByText('Revoke Site Access')).toBeInTheDocument();
    });
    
    // Confirm revocation
    fireEvent.click(screen.getByText('Revoke Access'));
    
    // Check that fetch was called to revoke access
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith('/api/admin/users/user-1/sites/site-1/access', expect.objectContaining({
        method: 'DELETE'
      }));
    });
    
    // Check that sites were refreshed
    expect(global.fetch).toHaveBeenCalledWith('/api/admin/users/user-1/sites');
  });

  it('allows adding a role to a site', async () => {
    // Update mock sites to include one with access
    const updatedMockSites = [
      {
        ...mockSites[0],
        hasAccess: true,
        roles: []
      },
      mockSites[1]
    ];
    
    // Mock fetch responses for adding a role
    (global.fetch as jest.Mock).mockImplementationOnce(() => 
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({
          user: mockUser
        })
      })
    ).mockImplementationOnce(() => 
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({
          sites: updatedMockSites,
          availableRoles: mockAvailableRoles
        })
      })
    ).mockImplementationOnce(() => 
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ success: true })
      })
    ).mockImplementationOnce(() => 
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({
          sites: [
            {
              ...updatedMockSites[0],
              roles: [mockAvailableRoles[0]]
            },
            updatedMockSites[1]
          ],
          availableRoles: []
        })
      })
    );
    
    // Render the site access container
    render(<UserSiteAccessContainer userId="user-1" />);
    
    // Wait for sites to load
    await waitFor(() => {
      expect(screen.getByText('Main Site')).toBeInTheDocument();
    });
    
    // Find and click the "Add Role" button for the Main Site
    const addRoleButton = screen.getByTestId('add-role-site-1');
    fireEvent.click(addRoleButton);
    
    // Wait for the dialog to open
    await waitFor(() => {
      expect(screen.getByText('Add Site Role')).toBeInTheDocument();
      expect(screen.getByText('Site Admin')).toBeInTheDocument();
    });
    
    // Select the Site Admin role
    const siteAdminRadio = screen.getByTestId('select-role-role-1');
    fireEvent.click(siteAdminRadio);
    
    // Click the "Add Role" button
    fireEvent.click(screen.getByText('Add Role'));
    
    // Check that fetch was called to add the role
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith('/api/admin/users/user-1/sites/site-1/roles', expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({ roleId: 'role-1' })
      }));
    });
    
    // Check that sites were refreshed
    expect(global.fetch).toHaveBeenCalledWith('/api/admin/users/user-1/sites');
  });
});
