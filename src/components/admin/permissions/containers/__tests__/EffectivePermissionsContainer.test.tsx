/**
 * @jest-environment jsdom
 */
import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { EffectivePermissionsContainer } from '../EffectivePermissionsContainer';
import { EffectivePermissions } from '../../EffectivePermissions';

// Mock the EffectivePermissions component
jest.mock('../../EffectivePermissions', () => ({
  EffectivePermissions: jest.fn(() => <div data-testid="effective-permissions" />)
}));

// Mock fetch
global.fetch = jest.fn();

describe('EffectivePermissionsContainer', () => {
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
            ]
          })
        });
      } else if (url.includes('/api/admin/users/user-123/permissions')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({
            effectivePermissions: {
              'user': [
                { resource: 'user', actions: ['create', 'read', 'update', 'delete'] }
              ],
              'role': [
                { resource: 'role', actions: ['read'] }
              ]
            },
            permissionSources: {
              'user-create': ['Admin'],
              'user-read': ['Admin'],
              'user-update': ['Admin'],
              'user-delete': ['Admin'],
              'role-read': ['Admin']
            }
          })
        });
      }
      return Promise.reject(new Error('Not found'));
    });
  });

  it('renders loading state initially', () => {
    render(<EffectivePermissionsContainer userId={mockUserId} />);
    
    expect(screen.getByText(/loading/i)).toBeInTheDocument();
  });

  it('fetches user, roles, and permissions data and renders EffectivePermissions', async () => {
    render(<EffectivePermissionsContainer userId={mockUserId} />);
    
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledTimes(3);
      expect(global.fetch).toHaveBeenCalledWith(`/api/admin/users/${mockUserId}`);
      expect(global.fetch).toHaveBeenCalledWith(`/api/admin/users/${mockUserId}/roles`);
      expect(global.fetch).toHaveBeenCalledWith(`/api/admin/users/${mockUserId}/permissions`);
    });
    
    await waitFor(() => {
      expect(screen.getByTestId('effective-permissions')).toBeInTheDocument();
      expect(EffectivePermissions).toHaveBeenCalledWith(
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
          effectivePermissions: expect.objectContaining({
            'user': expect.arrayContaining([
              expect.objectContaining({
                resource: 'user',
                actions: expect.arrayContaining(['create', 'read', 'update', 'delete'])
              })
            ]),
            'role': expect.arrayContaining([
              expect.objectContaining({
                resource: 'role',
                actions: expect.arrayContaining(['read'])
              })
            ])
          }),
          permissionSources: expect.objectContaining({
            'user-create': expect.arrayContaining(['Admin']),
            'role-read': expect.arrayContaining(['Admin'])
          })
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
    
    render(<EffectivePermissionsContainer userId={mockUserId} />);
    
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
    
    render(<EffectivePermissionsContainer userId={mockUserId} />);
    
    await waitFor(() => {
      expect(screen.getByText(/Failed to fetch roles/i)).toBeInTheDocument();
    });
  });

  it('handles error when fetching permissions data fails', async () => {
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
            ]
          })
        })
      )
      .mockImplementationOnce(() => 
        Promise.resolve({
          ok: false,
          json: () => Promise.resolve({ error: 'Failed to fetch permissions' })
        })
      );
    
    render(<EffectivePermissionsContainer userId={mockUserId} />);
    
    await waitFor(() => {
      expect(screen.getByText(/Failed to fetch permissions/i)).toBeInTheDocument();
    });
  });
});
