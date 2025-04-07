/**
 * @jest-environment jsdom
 */
import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { UserSiteAccessContainer } from '../UserSiteAccessContainer';
import { UserSiteAccess } from '../../UserSiteAccess';

// Mock the UserSiteAccess component
jest.mock('../../UserSiteAccess', () => ({
  UserSiteAccess: jest.fn(() => <div data-testid="user-site-access" />)
}));

// Mock fetch
global.fetch = jest.fn();

describe('UserSiteAccessContainer', () => {
  const mockUserId = 'user-123';
  
  beforeEach(() => {
    jest.clearAllMocks();
    (global.fetch as jest.Mock).mockImplementation((url) => {
      if (url.includes('/api/admin/users/user-123')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({
            user: {
              id: 'user-123',
              name: 'John Doe',
              email: 'john@example.com'
            }
          })
        });
      } else if (url.includes('/api/admin/users/user-123/sites')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({
            sites: [
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
            ],
            availableRoles: [
              {
                id: 'role-1',
                name: 'Site Admin',
                description: 'Site administrator role',
                siteId: 'site-1'
              }
            ]
          })
        });
      }
      return Promise.reject(new Error('Not found'));
    });
  });

  it('renders loading state initially', () => {
    render(<UserSiteAccessContainer userId={mockUserId} />);
    
    expect(screen.getByText(/loading/i)).toBeInTheDocument();
  });

  it('fetches user and sites data and renders UserSiteAccess', async () => {
    render(<UserSiteAccessContainer userId={mockUserId} />);
    
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledTimes(2);
      expect(global.fetch).toHaveBeenCalledWith(`/api/admin/users/${mockUserId}`);
      expect(global.fetch).toHaveBeenCalledWith(`/api/admin/users/${mockUserId}/sites`);
    });
    
    await waitFor(() => {
      expect(screen.getByTestId('user-site-access')).toBeInTheDocument();
      expect(UserSiteAccess).toHaveBeenCalledWith(
        expect.objectContaining({
          user: expect.objectContaining({
            id: 'user-123',
            name: 'John Doe'
          }),
          sites: expect.arrayContaining([
            expect.objectContaining({
              id: 'site-1',
              name: 'Main Site',
              hasAccess: true
            }),
            expect.objectContaining({
              id: 'site-2',
              name: 'Blog',
              hasAccess: false
            })
          ]),
          availableRoles: expect.arrayContaining([
            expect.objectContaining({
              id: 'role-1',
              name: 'Site Admin'
            })
          ])
        }),
        expect.anything()
      );
    });
  });

  it('handles error when fetching user data fails', async () => {
    (global.fetch as jest.Mock).mockImplementationOnce(() => 
      Promise.resolve({
        ok: false,
        json: () => Promise.resolve({ error: 'Failed to fetch user' })
      })
    );
    
    render(<UserSiteAccessContainer userId={mockUserId} />);
    
    await waitFor(() => {
      expect(screen.getByText(/Failed to fetch user/i)).toBeInTheDocument();
    });
  });

  it('handles error when fetching sites data fails', async () => {
    (global.fetch as jest.Mock)
      .mockImplementationOnce(() => 
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve({
            user: {
              id: 'user-123',
              name: 'John Doe',
              email: 'john@example.com'
            }
          })
        })
      )
      .mockImplementationOnce(() => 
        Promise.resolve({
          ok: false,
          json: () => Promise.resolve({ error: 'Failed to fetch sites' })
        })
      );
    
    render(<UserSiteAccessContainer userId={mockUserId} />);
    
    await waitFor(() => {
      expect(screen.getByText(/Failed to fetch sites/i)).toBeInTheDocument();
    });
  });

  it('handles granting access to a site', async () => {
    (global.fetch as jest.Mock)
      .mockImplementationOnce(() => 
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve({
            user: {
              id: 'user-123',
              name: 'John Doe',
              email: 'john@example.com'
            }
          })
        })
      )
      .mockImplementationOnce(() => 
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve({
            sites: [
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
            ],
            availableRoles: [
              {
                id: 'role-1',
                name: 'Site Admin',
                description: 'Site administrator role',
                siteId: 'site-1'
              }
            ]
          })
        })
      )
      .mockImplementationOnce(() => 
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ success: true })
        })
      )
      .mockImplementationOnce(() => 
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve({
            sites: [
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
                hasAccess: true,
                roles: []
              }
            ],
            availableRoles: [
              {
                id: 'role-1',
                name: 'Site Admin',
                description: 'Site administrator role',
                siteId: 'site-1'
              }
            ]
          })
        })
      );
    
    render(<UserSiteAccessContainer userId={mockUserId} />);
    
    await waitFor(() => {
      expect(screen.getByTestId('user-site-access')).toBeInTheDocument();
    });
    
    // Get the onGrantAccess prop from the UserSiteAccess component
    const { onGrantAccess } = (UserSiteAccess as jest.Mock).mock.calls[0][0];
    
    // Call the onGrantAccess function
    await onGrantAccess('site-2');
    
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(`/api/admin/users/${mockUserId}/sites/site-2/access`, {
        method: 'POST'
      });
    });
  });

  it('handles revoking access from a site', async () => {
    (global.fetch as jest.Mock)
      .mockImplementationOnce(() => 
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve({
            user: {
              id: 'user-123',
              name: 'John Doe',
              email: 'john@example.com'
            }
          })
        })
      )
      .mockImplementationOnce(() => 
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve({
            sites: [
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
            ],
            availableRoles: [
              {
                id: 'role-1',
                name: 'Site Admin',
                description: 'Site administrator role',
                siteId: 'site-1'
              }
            ]
          })
        })
      )
      .mockImplementationOnce(() => 
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ success: true })
        })
      )
      .mockImplementationOnce(() => 
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve({
            sites: [
              {
                id: 'site-1',
                name: 'Main Site',
                slug: 'main',
                domain: 'example.com',
                hasAccess: false,
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
            ],
            availableRoles: [
              {
                id: 'role-1',
                name: 'Site Admin',
                description: 'Site administrator role',
                siteId: 'site-1'
              }
            ]
          })
        })
      );
    
    render(<UserSiteAccessContainer userId={mockUserId} />);
    
    await waitFor(() => {
      expect(screen.getByTestId('user-site-access')).toBeInTheDocument();
    });
    
    // Get the onRevokeAccess prop from the UserSiteAccess component
    const { onRevokeAccess } = (UserSiteAccess as jest.Mock).mock.calls[0][0];
    
    // Call the onRevokeAccess function
    await onRevokeAccess('site-1');
    
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(`/api/admin/users/${mockUserId}/sites/site-1/access`, {
        method: 'DELETE'
      });
    });
  });

  it('handles adding a role to a site', async () => {
    (global.fetch as jest.Mock)
      .mockImplementationOnce(() => 
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve({
            user: {
              id: 'user-123',
              name: 'John Doe',
              email: 'john@example.com'
            }
          })
        })
      )
      .mockImplementationOnce(() => 
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve({
            sites: [
              {
                id: 'site-1',
                name: 'Main Site',
                slug: 'main',
                domain: 'example.com',
                hasAccess: true,
                roles: []
              }
            ],
            availableRoles: [
              {
                id: 'role-1',
                name: 'Site Admin',
                description: 'Site administrator role',
                siteId: 'site-1'
              }
            ]
          })
        })
      )
      .mockImplementationOnce(() => 
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ success: true })
        })
      )
      .mockImplementationOnce(() => 
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve({
            sites: [
              {
                id: 'site-1',
                name: 'Main Site',
                slug: 'main',
                domain: 'example.com',
                hasAccess: true,
                roles: [
                  {
                    id: 'role-1',
                    name: 'Site Admin',
                    description: 'Site administrator role',
                    siteId: 'site-1'
                  }
                ]
              }
            ],
            availableRoles: []
          })
        })
      );
    
    render(<UserSiteAccessContainer userId={mockUserId} />);
    
    await waitFor(() => {
      expect(screen.getByTestId('user-site-access')).toBeInTheDocument();
    });
    
    // Get the onAddRole prop from the UserSiteAccess component
    const { onAddRole } = (UserSiteAccess as jest.Mock).mock.calls[0][0];
    
    // Call the onAddRole function
    await onAddRole('site-1', 'role-1');
    
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(`/api/admin/users/${mockUserId}/sites/site-1/roles`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ roleId: 'role-1' })
      });
    });
  });
});
