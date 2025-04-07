/**
 * @jest-environment jsdom
 */
import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { PermissionComparisonContainer } from '../PermissionComparisonContainer';
import { PermissionComparison } from '../../PermissionComparison';

// Mock the PermissionComparison component
jest.mock('../../PermissionComparison', () => ({
  PermissionComparison: jest.fn(() => <div data-testid="permission-comparison" />)
}));

// Mock fetch
global.fetch = jest.fn();

// Mock document.createElement and related methods for export functionality
const mockAppendChild = jest.fn();
const mockRemoveChild = jest.fn();
const mockClick = jest.fn();
const mockCreateElement = jest.fn().mockImplementation(() => ({
  href: '',
  download: '',
  click: mockClick
}));

document.createElement = mockCreateElement;
document.body.appendChild = mockAppendChild;
document.body.removeChild = mockRemoveChild;

// Mock URL.createObjectURL and URL.revokeObjectURL
global.URL.createObjectURL = jest.fn().mockReturnValue('blob:url');
global.URL.revokeObjectURL = jest.fn();

describe('PermissionComparisonContainer', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (global.fetch as jest.Mock).mockImplementation((url) => {
      if (url.includes('/api/admin/roles')) {
        return Promise.resolve({
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
            ]
          })
        });
      } else if (url.includes('/api/admin/users')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({
            users: [
              {
                id: 'user-1',
                name: 'John Doe',
                email: 'john@example.com'
              },
              {
                id: 'user-2',
                name: 'Jane Smith',
                email: 'jane@example.com'
              }
            ]
          })
        });
      }
      return Promise.reject(new Error('Not found'));
    });
  });

  it('renders loading state initially', () => {
    render(<PermissionComparisonContainer />);
    
    expect(screen.getByText(/loading/i)).toBeInTheDocument();
  });

  it('fetches roles and users data and renders PermissionComparison', async () => {
    render(<PermissionComparisonContainer />);
    
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledTimes(2);
      expect(global.fetch).toHaveBeenCalledWith('/api/admin/roles?limit=100');
      expect(global.fetch).toHaveBeenCalledWith('/api/admin/users?limit=100');
    });
    
    await waitFor(() => {
      expect(screen.getByTestId('permission-comparison')).toBeInTheDocument();
      expect(PermissionComparison).toHaveBeenCalledWith(
        expect.objectContaining({
          roles: expect.arrayContaining([
            expect.objectContaining({
              id: 'role-1',
              name: 'Admin'
            }),
            expect.objectContaining({
              id: 'role-2',
              name: 'Editor'
            })
          ]),
          users: expect.arrayContaining([
            expect.objectContaining({
              id: 'user-1',
              name: 'John Doe'
            }),
            expect.objectContaining({
              id: 'user-2',
              name: 'Jane Smith'
            })
          ])
        }),
        expect.anything()
      );
    });
  });

  it('handles error when fetching roles data fails', async () => {
    (global.fetch as jest.Mock).mockImplementationOnce(() => 
      Promise.resolve({
        ok: false,
        json: () => Promise.resolve({ error: 'Failed to fetch roles' })
      })
    );
    
    render(<PermissionComparisonContainer />);
    
    await waitFor(() => {
      expect(screen.getByText(/Failed to fetch roles/i)).toBeInTheDocument();
    });
  });

  it('handles error when fetching users data fails', async () => {
    (global.fetch as jest.Mock)
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
            ]
          })
        })
      )
      .mockImplementationOnce(() => 
        Promise.resolve({
          ok: false,
          json: () => Promise.resolve({ error: 'Failed to fetch users' })
        })
      );
    
    render(<PermissionComparisonContainer />);
    
    await waitFor(() => {
      expect(screen.getByText(/Failed to fetch users/i)).toBeInTheDocument();
    });
  });

  it('handles export functionality', async () => {
    render(<PermissionComparisonContainer />);
    
    await waitFor(() => {
      expect(screen.getByTestId('permission-comparison')).toBeInTheDocument();
    });
    
    // Get the onExport prop from the PermissionComparison component
    const { onExport } = (PermissionComparison as jest.Mock).mock.calls[0][0];
    
    // Mock data to export
    const mockExportData = {
      type: 'roles',
      items: ['role-1', 'role-2'],
      results: {
        'user': {
          'create': { 'Admin': true, 'Editor': false }
        }
      }
    };
    
    // Call the onExport function
    await onExport(mockExportData);
    
    // Check that the export functionality was called correctly
    expect(global.URL.createObjectURL).toHaveBeenCalledWith(expect.any(Blob));
    expect(mockCreateElement).toHaveBeenCalledWith('a');
    expect(mockAppendChild).toHaveBeenCalled();
    expect(mockClick).toHaveBeenCalled();
    expect(mockRemoveChild).toHaveBeenCalled();
    expect(global.URL.revokeObjectURL).toHaveBeenCalledWith('blob:url');
  });
});
