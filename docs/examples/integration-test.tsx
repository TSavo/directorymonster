import React from 'react';
import { render, screen, setup } from '@/tests/utils/render';
import { userServiceMock } from '@/tests/mocks/services';
import { UserList } from '@/components/UserList';
import { UserForm } from '@/components/UserForm';
import { UserManagement } from '@/components/UserManagement';

// Mock the user service
jest.mock('@/services/userService', () => ({
  userService: userServiceMock
}));

// Mock the components
jest.mock('@/components/UserList', () => ({
  UserList: ({ users, onDelete }) => (
    <div data-testid="user-list">
      <h2>User List</h2>
      <ul>
        {users.map(user => (
          <li key={user.id} data-testid={`user-${user.id}`}>
            {user.name}
            <button onClick={() => onDelete(user.id)}>Delete</button>
          </li>
        ))}
      </ul>
    </div>
  )
}));

jest.mock('@/components/UserForm', () => ({
  UserForm: ({ onSubmit }) => {
    const [name, setName] = React.useState('');
    
    const handleSubmit = (e) => {
      e.preventDefault();
      onSubmit({ name });
      setName('');
    };
    
    return (
      <div data-testid="user-form">
        <h2>Add User</h2>
        <form onSubmit={handleSubmit}>
          <input
            type="text"
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="Name"
            data-testid="name-input"
          />
          <button type="submit" data-testid="submit-button">Add User</button>
        </form>
      </div>
    );
  }
}));

// The component under test
const UserManagement = () => {
  const [users, setUsers] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState(null);
  
  // Fetch users on mount
  React.useEffect(() => {
    const fetchUsers = async () => {
      try {
        setLoading(true);
        setError(null);
        const fetchedUsers = await userServiceMock.getAllUsers();
        setUsers(fetchedUsers);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    
    fetchUsers();
  }, []);
  
  // Add a new user
  const handleAddUser = async (userData) => {
    try {
      setError(null);
      const newUser = await userServiceMock.createUser(userData);
      setUsers(prevUsers => [...prevUsers, newUser]);
    } catch (err) {
      setError(err.message);
    }
  };
  
  // Delete a user
  const handleDeleteUser = async (userId) => {
    try {
      setError(null);
      await userServiceMock.deleteUser(userId);
      setUsers(prevUsers => prevUsers.filter(user => user.id !== userId));
    } catch (err) {
      setError(err.message);
    }
  };
  
  if (loading) {
    return <div data-testid="loading">Loading...</div>;
  }
  
  if (error) {
    return <div data-testid="error">Error: {error}</div>;
  }
  
  return (
    <div data-testid="user-management">
      <h1>User Management</h1>
      <UserForm onSubmit={handleAddUser} />
      <UserList users={users} onDelete={handleDeleteUser} />
    </div>
  );
};

describe('UserManagement Integration', () => {
  // Reset mocks before each test
  beforeEach(() => {
    jest.clearAllMocks();
  });
  
  it('renders the loading state initially', () => {
    // Configure the mock to delay the response
    userServiceMock.getAllUsers.mockImplementationOnce(() => {
      return new Promise(resolve => {
        setTimeout(() => {
          resolve([
            { id: 'user-1', name: 'User 1' },
            { id: 'user-2', name: 'User 2' }
          ]);
        }, 100);
      });
    });
    
    // Render the component
    render(<UserManagement />);
    
    // Assert that the loading state is rendered
    expect(screen.getByTestId('loading')).toBeInTheDocument();
  });
  
  it('renders the user list after loading', async () => {
    // Configure the mock to return users
    userServiceMock.getAllUsers.mockResolvedValueOnce([
      { id: 'user-1', name: 'User 1' },
      { id: 'user-2', name: 'User 2' }
    ]);
    
    // Render the component
    render(<UserManagement />);
    
    // Wait for the user list to be rendered
    const userList = await screen.findByTestId('user-list');
    
    // Assert that the user list is rendered
    expect(userList).toBeInTheDocument();
    expect(screen.getByTestId('user-1')).toBeInTheDocument();
    expect(screen.getByTestId('user-2')).toBeInTheDocument();
  });
  
  it('renders the error state when loading fails', async () => {
    // Configure the mock to throw an error
    userServiceMock.getAllUsers.mockRejectedValueOnce(new Error('Failed to fetch users'));
    
    // Render the component
    render(<UserManagement />);
    
    // Wait for the error to be rendered
    const error = await screen.findByTestId('error');
    
    // Assert that the error is rendered
    expect(error).toBeInTheDocument();
    expect(error).toHaveTextContent('Error: Failed to fetch users');
  });
  
  it('adds a new user', async () => {
    // Configure the mocks
    userServiceMock.getAllUsers.mockResolvedValueOnce([
      { id: 'user-1', name: 'User 1' },
      { id: 'user-2', name: 'User 2' }
    ]);
    
    userServiceMock.createUser.mockResolvedValueOnce({
      id: 'user-3',
      name: 'User 3'
    });
    
    // Render the component
    const { user } = setup(<UserManagement />);
    
    // Wait for the user list to be rendered
    await screen.findByTestId('user-list');
    
    // Fill out the form
    await user.type(screen.getByTestId('name-input'), 'User 3');
    
    // Submit the form
    await user.click(screen.getByTestId('submit-button'));
    
    // Assert that the new user is added to the list
    expect(await screen.findByTestId('user-3')).toBeInTheDocument();
    
    // Assert that the service was called with the correct arguments
    expect(userServiceMock.createUser).toHaveBeenCalledTimes(1);
    expect(userServiceMock.createUser).toHaveBeenCalledWith({ name: 'User 3' });
  });
  
  it('deletes a user', async () => {
    // Configure the mocks
    userServiceMock.getAllUsers.mockResolvedValueOnce([
      { id: 'user-1', name: 'User 1' },
      { id: 'user-2', name: 'User 2' }
    ]);
    
    userServiceMock.deleteUser.mockResolvedValueOnce(true);
    
    // Render the component
    const { user } = setup(<UserManagement />);
    
    // Wait for the user list to be rendered
    await screen.findByTestId('user-list');
    
    // Delete the first user
    await user.click(screen.getAllByText('Delete')[0]);
    
    // Assert that the user is removed from the list
    expect(screen.queryByTestId('user-1')).not.toBeInTheDocument();
    expect(screen.getByTestId('user-2')).toBeInTheDocument();
    
    // Assert that the service was called with the correct arguments
    expect(userServiceMock.deleteUser).toHaveBeenCalledTimes(1);
    expect(userServiceMock.deleteUser).toHaveBeenCalledWith('user-1');
  });
});
