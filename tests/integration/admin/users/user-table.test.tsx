/**
 * @jest-environment jsdom
 */

import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { UserTable } from '@/components/admin/users/UserTable';
import { useUsers } from '@/components/admin/users/hooks/useUsers';
import { useSites } from '@/components/admin/sites/hooks/useSites';

// Mock the hooks
jest.mock('@/components/admin/users/hooks/useUsers', () => ({
  useUsers: jest.fn(),
}));

jest.mock('@/components/admin/sites/hooks/useSites', () => ({
  useSites: jest.fn(),
}));

// Mock the UserFormModal component
jest.mock('@/components/admin/users/UserFormModal', () => ({
  UserFormModal: ({ isOpen, onClose, onSubmit, user }: any) => (
    <div data-testid="user-form-modal" style={{ display: isOpen ? 'block' : 'none' }}>
      <button onClick={onClose} data-testid="modal-close-button">Close</button>
      <button 
        onClick={() => onSubmit({ id: user?.id || 'new-id', name: 'Test User', email: 'test@example.com' })}
        data-testid="modal-submit-button"
      >
        Submit
      </button>
    </div>
  ),
}));

// Mock Next.js Link component
jest.mock('next/link', () => ({
  __esModule: true,
  default: ({ href, children, ...rest }: any) => (
    <a href={href} {...rest}>{children}</a>
  ),
}));

describe('UserTable Component', () => {
  const mockUsers = [
    {
      id: 'user-1',
      name: 'John Doe',
      email: 'john@example.com',
      siteIds: ['site-1', 'site-2'],
      createdAt: '2023-01-01T00:00:00.000Z',
    },
    {
      id: 'user-2',
      name: 'Jane Smith',
      email: 'jane@example.com',
      siteIds: ['site-1'],
      createdAt: '2023-01-02T00:00:00.000Z',
    },
  ];

  const mockSites = [
    { id: 'site-1', name: 'Site 1' },
    { id: 'site-2', name: 'Site 2' },
  ];

  beforeEach(() => {
    jest.clearAllMocks();

    // Mock the hooks to return data
    (useUsers as jest.Mock).mockReturnValue({
      users: mockUsers,
      isLoading: false,
      error: null,
      createUser: jest.fn(),
      updateUser: jest.fn(),
      deleteUser: jest.fn(),
    });

    (useSites as jest.Mock).mockReturnValue({
      sites: mockSites,
      isLoading: false,
      error: null,
    });
  });

  it('renders the user table with users', async () => {
    render(<UserTable />);

    // Check that the table is rendered
    await waitFor(() => {
      expect(screen.getByRole('table')).toBeInTheDocument();
    });

    // Check that user rows are rendered
    expect(screen.getByText('John Doe')).toBeInTheDocument();
    expect(screen.getByText('jane@example.com')).toBeInTheDocument();
  });

  it('renders loading state when data is loading', async () => {
    // Override the mock to return loading state
    (useUsers as jest.Mock).mockReturnValue({
      users: [],
      isLoading: true,
      error: null,
      createUser: jest.fn(),
      updateUser: jest.fn(),
      deleteUser: jest.fn(),
    });

    render(<UserTable />);

    // Check that loading state is rendered
    await waitFor(() => {
      expect(screen.getByTestId('loading-indicator')).toBeInTheDocument();
    });
  });

  it('renders error state when there is an error', async () => {
    // Override the mock to return error
    (useUsers as jest.Mock).mockReturnValue({
      users: [],
      isLoading: false,
      error: 'Failed to load users',
      createUser: jest.fn(),
      updateUser: jest.fn(),
      deleteUser: jest.fn(),
    });

    render(<UserTable />);

    // Check that error message is displayed
    await waitFor(() => {
      expect(screen.getByText('Failed to load users')).toBeInTheDocument();
    });
  });

  it('opens the user form modal when Add User button is clicked', async () => {
    render(<UserTable />);

    // Find and click the Add User button
    const addButton = screen.getByRole('button', { name: /add user/i });
    fireEvent.click(addButton);

    // Check that the modal is opened
    await waitFor(() => {
      expect(screen.getByTestId('user-form-modal')).toHaveStyle({ display: 'block' });
    });
  });

  it('opens the user form modal with user data when Edit button is clicked', async () => {
    render(<UserTable />);

    // Find and click the Edit button for the first user
    const editButton = screen.getByTestId('edit-user-user-1');
    fireEvent.click(editButton);

    // Check that the modal is opened
    await waitFor(() => {
      expect(screen.getByTestId('user-form-modal')).toHaveStyle({ display: 'block' });
    });
  });

  it('calls createUser when form is submitted for a new user', async () => {
    const mockCreateUser = jest.fn().mockResolvedValue({});
    (useUsers as jest.Mock).mockReturnValue({
      users: mockUsers,
      isLoading: false,
      error: null,
      createUser: mockCreateUser,
      updateUser: jest.fn(),
      deleteUser: jest.fn(),
    });

    render(<UserTable />);

    // Open the modal for a new user
    const addButton = screen.getByRole('button', { name: /add user/i });
    fireEvent.click(addButton);

    // Submit the form
    const submitButton = screen.getByTestId('modal-submit-button');
    fireEvent.click(submitButton);

    // Check that createUser was called
    await waitFor(() => {
      expect(mockCreateUser).toHaveBeenCalledTimes(1);
    });
  });

  it('calls updateUser when form is submitted for an existing user', async () => {
    const mockUpdateUser = jest.fn().mockResolvedValue({});
    (useUsers as jest.Mock).mockReturnValue({
      users: mockUsers,
      isLoading: false,
      error: null,
      createUser: jest.fn(),
      updateUser: mockUpdateUser,
      deleteUser: jest.fn(),
    });

    render(<UserTable />);

    // Open the modal for an existing user
    const editButton = screen.getByTestId('edit-user-user-1');
    fireEvent.click(editButton);

    // Submit the form
    const submitButton = screen.getByTestId('modal-submit-button');
    fireEvent.click(submitButton);

    // Check that updateUser was called
    await waitFor(() => {
      expect(mockUpdateUser).toHaveBeenCalledTimes(1);
    });
  });

  it('calls deleteUser when Delete button is clicked and confirmed', async () => {
    const mockDeleteUser = jest.fn().mockResolvedValue({});
    (useUsers as jest.Mock).mockReturnValue({
      users: mockUsers,
      isLoading: false,
      error: null,
      createUser: jest.fn(),
      updateUser: jest.fn(),
      deleteUser: mockDeleteUser,
    });

    // Mock the confirm dialog to return true
    window.confirm = jest.fn().mockReturnValue(true);

    render(<UserTable />);

    // Find and click the Delete button for the first user
    const deleteButton = screen.getByTestId('delete-user-user-1');
    fireEvent.click(deleteButton);

    // Check that deleteUser was called
    await waitFor(() => {
      expect(mockDeleteUser).toHaveBeenCalledWith('user-1');
    });
  });

  it('does not call deleteUser when Delete button is clicked but not confirmed', async () => {
    const mockDeleteUser = jest.fn().mockResolvedValue({});
    (useUsers as jest.Mock).mockReturnValue({
      users: mockUsers,
      isLoading: false,
      error: null,
      createUser: jest.fn(),
      updateUser: jest.fn(),
      deleteUser: mockDeleteUser,
    });

    // Mock the confirm dialog to return false
    window.confirm = jest.fn().mockReturnValue(false);

    render(<UserTable />);

    // Find and click the Delete button for the first user
    const deleteButton = screen.getByTestId('delete-user-user-1');
    fireEvent.click(deleteButton);

    // Check that deleteUser was not called
    await waitFor(() => {
      expect(mockDeleteUser).not.toHaveBeenCalled();
    });
  });

  it('displays site names for each user', async () => {
    render(<UserTable />);

    // Check that site names are displayed
    await waitFor(() => {
      expect(screen.getByText('Site 1, Site 2')).toBeInTheDocument();
      expect(screen.getByText('Site 1')).toBeInTheDocument();
    });
  });

  it('renders empty state when there are no users', async () => {
    // Override the mock to return empty data
    (useUsers as jest.Mock).mockReturnValue({
      users: [],
      isLoading: false,
      error: null,
      createUser: jest.fn(),
      updateUser: jest.fn(),
      deleteUser: jest.fn(),
    });

    render(<UserTable />);

    // Check that empty state message is displayed
    await waitFor(() => {
      expect(screen.getByText('No users found')).toBeInTheDocument();
    });
  });
});
