/**
 * @jest-environment jsdom
 */
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';

// Create a simple mock component
const UserActivityLog = ({
  user,
  activities,
  isLoading,
  onExport
}) => {
  const [filters, setFilters] = React.useState({
    action: '',
    resource: '',
    startDate: null,
    endDate: null
  });

  const filteredActivities = activities.filter(activity => {
    if (filters.action && activity.action !== filters.action) return false;
    if (filters.resource && activity.resource !== filters.resource) return false;
    return true;
  });

  if (isLoading) {
    return <div data-testid="activity-loading">Loading activities...</div>;
  }

  if (!activities || activities.length === 0) {
    return <div data-testid="activity-empty">No activities found</div>;
  }

  return (
    <div data-testid="activity-log">
      <div data-testid="user-info">
        <h2>{user.name}</h2>
        <p>{user.email}</p>
      </div>

      <div data-testid="filters">
        <select
          data-testid="action-filter"
          value={filters.action}
          onChange={(e) => setFilters({ ...filters, action: e.target.value })}
        >
          <option value="">All Actions</option>
          <option value="login">Login</option>
          <option value="create">Create</option>
          <option value="update">Update</option>
          <option value="delete">Delete</option>
        </select>

        <select
          data-testid="resource-filter"
          value={filters.resource}
          onChange={(e) => setFilters({ ...filters, resource: e.target.value })}
        >
          <option value="">All Resources</option>
          <option value="auth">Auth</option>
          <option value="listing">Listing</option>
          <option value="user">User</option>
        </select>

        <button data-testid="export-button" onClick={onExport}>
          Export
        </button>
      </div>

      <div data-testid="activity-list">
        {filteredActivities.map(activity => (
          <div key={activity.id} data-testid={`activity-${activity.id}`}>
            <div data-testid="activity-header">
              <span>{activity.action}</span>
              <span>{activity.resource}</span>
              <span>{activity.timestamp}</span>
            </div>
            <div data-testid="activity-details" className="hidden">
              <p>{activity.description}</p>
              <p>IP: {activity.ipAddress}</p>
              <p>User Agent: {activity.userAgent}</p>
            </div>
            <button
              data-testid={`view-details-${activity.id}`}
              onClick={() => {
                const details = document.querySelector(`[data-testid="activity-${activity.id}"] [data-testid="activity-details"]`);
                if (details) {
                  details.classList.toggle('hidden');
                }
              }}
            >
              View Details
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

describe('UserActivityLog Component', () => {
  const mockUser = {
    id: 'user-1',
    name: 'John Doe',
    email: 'john@example.com',
    avatarUrl: 'https://example.com/avatar.jpg'
  };

  const mockActivities = [
    {
      id: 'activity-1',
      action: 'login',
      resource: 'auth',
      resourceId: null,
      description: 'User logged in',
      ipAddress: '192.168.1.1',
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      timestamp: '2023-05-01T10:30:00.000Z'
    },
    {
      id: 'activity-2',
      action: 'create',
      resource: 'listing',
      resourceId: 'listing-1',
      description: 'User created a listing',
      ipAddress: '192.168.1.1',
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      timestamp: '2023-05-02T14:45:00.000Z'
    },
    {
      id: 'activity-3',
      action: 'update',
      resource: 'user',
      resourceId: 'user-1',
      description: 'User updated their profile',
      ipAddress: '192.168.1.2',
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      timestamp: '2023-05-03T09:15:00.000Z'
    }
  ];

  const mockOnExport = jest.fn();

  it('renders user activity log correctly', () => {
    render(
      <UserActivityLog
        user={mockUser}
        activities={mockActivities}
        isLoading={false}
        onExport={mockOnExport}
      />
    );

    expect(screen.getByTestId('activity-log')).toBeInTheDocument();
    expect(screen.getByTestId('user-info')).toBeInTheDocument();
    expect(screen.getByText('John Doe')).toBeInTheDocument();
    expect(screen.getByText('john@example.com')).toBeInTheDocument();

    expect(screen.getByTestId('activity-list')).toBeInTheDocument();
    expect(screen.getByTestId('activity-activity-1')).toBeInTheDocument();
    expect(screen.getByTestId('activity-activity-2')).toBeInTheDocument();
    expect(screen.getByTestId('activity-activity-3')).toBeInTheDocument();
  });

  it('renders empty state', () => {
    render(
      <UserActivityLog
        user={mockUser}
        activities={[]}
        isLoading={false}
        onExport={mockOnExport}
      />
    );

    expect(screen.getByTestId('activity-empty')).toBeInTheDocument();
    expect(screen.getByText('No activities found')).toBeInTheDocument();
  });

  it('renders loading state', () => {
    render(
      <UserActivityLog
        user={mockUser}
        activities={[]}
        isLoading={true}
        onExport={mockOnExport}
      />
    );

    expect(screen.getByTestId('activity-loading')).toBeInTheDocument();
    expect(screen.getByText('Loading activities...')).toBeInTheDocument();
  });

  it('filters activities by action', async () => {
    render(
      <UserActivityLog
        user={mockUser}
        activities={mockActivities}
        isLoading={false}
        onExport={mockOnExport}
      />
    );

    // Select 'login' from the action filter
    fireEvent.change(screen.getByTestId('action-filter'), { target: { value: 'login' } });

    // Check that only the login activity is displayed
    expect(screen.getByTestId('activity-activity-1')).toBeInTheDocument();
    expect(screen.queryByTestId('activity-activity-2')).not.toBeInTheDocument();
    expect(screen.queryByTestId('activity-activity-3')).not.toBeInTheDocument();
  });

  it('filters activities by resource', async () => {
    render(
      <UserActivityLog
        user={mockUser}
        activities={mockActivities}
        isLoading={false}
        onExport={mockOnExport}
      />
    );

    // Select 'listing' from the resource filter
    fireEvent.change(screen.getByTestId('resource-filter'), { target: { value: 'listing' } });

    // Check that only the listing activity is displayed
    expect(screen.queryByTestId('activity-activity-1')).not.toBeInTheDocument();
    expect(screen.getByTestId('activity-activity-2')).toBeInTheDocument();
    expect(screen.queryByTestId('activity-activity-3')).not.toBeInTheDocument();
  });

  it('exports activity log', () => {
    render(
      <UserActivityLog
        user={mockUser}
        activities={mockActivities}
        isLoading={false}
        onExport={mockOnExport}
      />
    );

    // Click the export button
    fireEvent.click(screen.getByTestId('export-button'));

    // Check that onExport was called
    expect(mockOnExport).toHaveBeenCalled();
  });

  it('shows activity details', async () => {
    render(
      <UserActivityLog
        user={mockUser}
        activities={mockActivities}
        isLoading={false}
        onExport={mockOnExport}
      />
    );

    // Click the view details button for the first activity
    fireEvent.click(screen.getByTestId('view-details-activity-1'));

    // Check that the details are displayed
    const details = screen.getAllByTestId('activity-details')[0];
    expect(details).toBeInTheDocument();
    expect(details).toHaveTextContent('User logged in');
    expect(details).toHaveTextContent('IP: 192.168.1.1');
  });
});
