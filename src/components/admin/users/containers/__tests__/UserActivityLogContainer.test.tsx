/**
 * @jest-environment jsdom
 */
import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { UserActivityLogContainer } from '../UserActivityLogContainer';
import { UserActivityLog } from '../../UserActivityLog';

// Mock the UserActivityLog component
jest.mock('../../UserActivityLog', () => ({
  UserActivityLog: jest.fn(() => <div data-testid="user-activity-log" />)
}));

// Mock fetch
global.fetch = jest.fn();

// Mock window.location
Object.defineProperty(window, 'location', {
  value: {
    href: ''
  },
  writable: true
});

describe('UserActivityLogContainer', () => {
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
      } else if (url.includes('/api/admin/users/user-123/activities')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({
            activities: [
              {
                id: 'activity-1',
                action: 'login',
                resource: 'auth',
                resourceId: null,
                description: 'User logged in',
                ipAddress: '192.168.1.1',
                userAgent: 'Mozilla/5.0',
                timestamp: '2023-01-01T00:00:00.000Z'
              },
              {
                id: 'activity-2',
                action: 'update',
                resource: 'profile',
                resourceId: 'user-123',
                description: 'Updated profile',
                ipAddress: '192.168.1.1',
                userAgent: 'Mozilla/5.0',
                timestamp: '2023-01-02T00:00:00.000Z'
              }
            ],
            pagination: {
              page: 1,
              perPage: 10,
              total: 2,
              totalPages: 1
            }
          })
        });
      }
      return Promise.reject(new Error('Not found'));
    });
  });

  it('renders loading state initially', () => {
    render(<UserActivityLogContainer userId={mockUserId} />);
    
    expect(screen.getByText(/loading/i)).toBeInTheDocument();
  });

  it('fetches user and activities data and renders UserActivityLog', async () => {
    render(<UserActivityLogContainer userId={mockUserId} />);
    
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledTimes(2);
      expect(global.fetch).toHaveBeenCalledWith(`/api/admin/users/${mockUserId}`);
      expect(global.fetch).toHaveBeenCalledWith(`/api/admin/users/${mockUserId}/activities`);
    });
    
    await waitFor(() => {
      expect(screen.getByTestId('user-activity-log')).toBeInTheDocument();
      expect(UserActivityLog).toHaveBeenCalledWith(
        expect.objectContaining({
          user: expect.objectContaining({
            id: 'user-123',
            name: 'John Doe'
          }),
          activities: expect.arrayContaining([
            expect.objectContaining({
              id: 'activity-1',
              action: 'login',
              resource: 'auth'
            }),
            expect.objectContaining({
              id: 'activity-2',
              action: 'update',
              resource: 'profile'
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
    
    render(<UserActivityLogContainer userId={mockUserId} />);
    
    await waitFor(() => {
      expect(screen.getByText(/Failed to fetch user/i)).toBeInTheDocument();
    });
  });

  it('handles error when fetching activities data fails', async () => {
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
          json: () => Promise.resolve({ error: 'Failed to fetch activities' })
        })
      );
    
    render(<UserActivityLogContainer userId={mockUserId} />);
    
    await waitFor(() => {
      expect(screen.getByText(/Failed to fetch activities/i)).toBeInTheDocument();
    });
  });

  it('handles filter changes', async () => {
    render(<UserActivityLogContainer userId={mockUserId} />);
    
    await waitFor(() => {
      expect(screen.getByTestId('user-activity-log')).toBeInTheDocument();
    });
    
    // Reset fetch mock to track new calls
    (global.fetch as jest.Mock).mockClear();
    
    // Mock fetch for filtered activities
    (global.fetch as jest.Mock).mockImplementationOnce(() => 
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({
          activities: [
            {
              id: 'activity-1',
              action: 'login',
              resource: 'auth',
              resourceId: null,
              description: 'User logged in',
              ipAddress: '192.168.1.1',
              userAgent: 'Mozilla/5.0',
              timestamp: '2023-01-01T00:00:00.000Z'
            }
          ],
          pagination: {
            page: 1,
            perPage: 10,
            total: 1,
            totalPages: 1
          }
        })
      })
    );
    
    // Get the onFilterChange prop from the UserActivityLog component
    const { onFilterChange } = (UserActivityLog as jest.Mock).mock.calls[0][0];
    
    // Call the onFilterChange function with a filter
    await onFilterChange({ action: 'login' });
    
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(`/api/admin/users/${mockUserId}/activities?action=login`);
    });
  });

  it('handles export', async () => {
    render(<UserActivityLogContainer userId={mockUserId} />);
    
    await waitFor(() => {
      expect(screen.getByTestId('user-activity-log')).toBeInTheDocument();
    });
    
    // Get the onExport prop from the UserActivityLog component
    const { onExport } = (UserActivityLog as jest.Mock).mock.calls[0][0];
    
    // Call the onExport function
    await onExport();
    
    // Check that window.location.href was set correctly
    expect(window.location.href).toBe(`/api/admin/users/${mockUserId}/activities/export?export=true`);
  });
});
