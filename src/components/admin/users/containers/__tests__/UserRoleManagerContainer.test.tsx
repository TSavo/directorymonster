/**
 * @jest-environment jsdom
 */
import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { UserRoleManagerContainer } from '../UserRoleManagerContainer';
import { UserRoleManager } from '../../UserRoleManager';

// Mock the UserRoleManager component
jest.mock('../../UserRoleManager', () => ({
  UserRoleManager: jest.fn(() => <div data-testid="user-role-manager" />)
}));

// Mock fetch
global.fetch = jest.fn();

describe('UserRoleManagerContainer', () => {
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
      } else if (url.includes('/api/admin/users/user-123/roles')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({
            roles: [
              {
                id: 'role-1',
                name: 'Admin',
                description: 'Administrator role'
              }
            ],
            availableRoles: [
              {
                id: 'role-2',
                name: 'Editor',
                description: 'Editor role'
              }
            ]
          })
        });
      }
      return Promise.reject(new Error('Not found'));
    });
  });

  it('renders loading state initially', () => {
    render(<UserRoleManagerContainer userId={mockUserId} />);
    
    expect(screen.getByText(/loading/i)).toBeInTheDocument();
  });

  it('fetches user and roles data and renders UserRoleManager', async () => {
    render(<UserRoleManagerContainer userId={mockUserId} />);
    
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledTimes(2);
      expect(global.fetch).toHaveBeenCalledWith(`/api/admin/users/${mockUserId}`);
      expect(global.fetch).toHaveBeenCalledWith(`/api/admin/users/${mockUserId}/roles`);
    });
    
    await waitFor(() => {
      expect(screen.getByTestId('user-role-manager')).toBeInTheDocument();
      expect(UserRoleManager).toHaveBeenCalledWith(
        expect.objectContaining({
          user: expect.objectContaining({
            id: 'user-123',
            name: 'John Doe'
          }),
          roles: expect.arrayContaining([
            expect.objectContaining({
              id: 'role-1',
              name: 'Admin'
            })
          ]),
          availableRoles: expect.arrayContaining([
            expect.objectContaining({
              id: 'role-2',
              name: 'Editor'
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
    
    render(<UserRoleManagerContainer userId={mockUserId} />);
    
    await waitFor(() => {
      expect(screen.getByText(/Failed to fetch user/i)).toBeInTheDocument();
    });
  });

  it('handles error when fetching roles data fails', async () => {
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
          json: () => Promise.resolve({ error: 'Failed to fetch roles' })
        })
      );
    
    render(<UserRoleManagerContainer userId={mockUserId} />);
    
    await waitFor(() => {
      expect(screen.getByText(/Failed to fetch roles/i)).toBeInTheDocument();
    });
  });

  it('handles adding roles to user', async () => {
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
            roles: [
              {
                id: 'role-1',
                name: 'Admin',
                description: 'Administrator role'
              }
            ],
            availableRoles: [
              {
                id: 'role-2',
                name: 'Editor',
                description: 'Editor role'
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
            roles: [
              {
                id: 'role-1',
                name: 'Admin',
                description: 'Administrator role'
              },
              {
                id: 'role-2',
                name: 'Editor',
                description: 'Editor role'
              }
            ],
            availableRoles: []
          })
        })
      );
    
    render(<UserRoleManagerContainer userId={mockUserId} />);
    
    await waitFor(() => {
      expect(screen.getByTestId('user-role-manager')).toBeInTheDocument();
    });
    
    // Get the onAddRoles prop from the UserRoleManager component
    const { onAddRoles } = (UserRoleManager as jest.Mock).mock.calls[0][0];
    
    // Call the onAddRoles function
    await onAddRoles(['role-2']);
    
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(`/api/admin/users/${mockUserId}/roles`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ roleIds: ['role-2'] })
      });
    });
  });

  it('handles removing a role from user', async () => {
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
            roles: [
              {
                id: 'role-1',
                name: 'Admin',
                description: 'Administrator role'
              }
            ],
            availableRoles: [
              {
                id: 'role-2',
                name: 'Editor',
                description: 'Editor role'
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
            roles: [],
            availableRoles: [
              {
                id: 'role-1',
                name: 'Admin',
                description: 'Administrator role'
              },
              {
                id: 'role-2',
                name: 'Editor',
                description: 'Editor role'
              }
            ]
          })
        })
      );
    
    render(<UserRoleManagerContainer userId={mockUserId} />);
    
    await waitFor(() => {
      expect(screen.getByTestId('user-role-manager')).toBeInTheDocument();
    });
    
    // Get the onRemoveRole prop from the UserRoleManager component
    const { onRemoveRole } = (UserRoleManager as jest.Mock).mock.calls[0][0];
    
    // Call the onRemoveRole function
    await onRemoveRole('role-1');
    
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(`/api/admin/users/${mockUserId}/roles/role-1`, {
        method: 'DELETE'
      });
    });
  });
});
