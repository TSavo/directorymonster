import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { AlertsList } from '../AlertsList';

// Mock the AlertCard component
jest.mock('../AlertCard', () => ({
  AlertCard: ({ alert, onAcknowledge, onResolve, onDismiss, onViewDetails }) => (
    <div data-testid={`alert-card-${alert.id}`}>
      <div>{alert.title}</div>
      <button onClick={() => onAcknowledge(alert.id)} data-testid={`acknowledge-${alert.id}`}>Acknowledge</button>
      <button onClick={() => onResolve(alert.id)} data-testid={`resolve-${alert.id}`}>Resolve</button>
      <button onClick={() => onDismiss(alert.id)} data-testid={`dismiss-${alert.id}`}>Dismiss</button>
      <button onClick={() => onViewDetails(alert)} data-testid={`view-details-${alert.id}`}>View Details</button>
    </div>
  )
}));

describe('AlertsList', () => {
  const mockAlerts = [
    {
      id: '1',
      type: 'login_attempt',
      severity: 'high',
      title: 'Multiple failed login attempts',
      description: 'Multiple failed login attempts detected',
      timestamp: new Date().toISOString(),
      status: 'new',
      affectedUsers: ['user1@example.com'],
      relatedIPs: ['192.168.1.1'],
      details: { attempts: 5 }
    },
    {
      id: '2',
      type: 'suspicious_activity',
      severity: 'medium',
      title: 'Unusual login location',
      description: 'Login from unusual location',
      timestamp: new Date().toISOString(),
      status: 'acknowledged',
      affectedUsers: ['user2@example.com'],
      relatedIPs: ['192.168.1.2'],
      details: { location: 'Moscow, Russia' }
    }
  ];

  const mockHandlers = {
    onLoadMore: jest.fn(),
    onAcknowledge: jest.fn(),
    onResolve: jest.fn(),
    onDismiss: jest.fn(),
    onViewDetails: jest.fn()
  };

  it('renders a list of alerts', () => {
    render(
      <AlertsList
        alerts={mockAlerts}
        isLoading={false}
        error={null}
        hasMore={false}
        {...mockHandlers}
      />
    );
    
    // Check that both alerts are rendered
    expect(screen.getByTestId('alert-card-1')).toBeInTheDocument();
    expect(screen.getByTestId('alert-card-2')).toBeInTheDocument();
    
    // Check that the alert titles are displayed
    expect(screen.getByText('Multiple failed login attempts')).toBeInTheDocument();
    expect(screen.getByText('Unusual login location')).toBeInTheDocument();
  });

  it('shows a loading indicator when isLoading is true and no alerts are present', () => {
    render(
      <AlertsList
        alerts={[]}
        isLoading={true}
        error={null}
        hasMore={false}
        {...mockHandlers}
      />
    );
    
    // Check that the loading indicator is displayed
    expect(screen.getByTestId('alerts-loading')).toBeInTheDocument();
    expect(screen.getByText('Loading alerts...')).toBeInTheDocument();
  });

  it('shows an error message when there is an error', () => {
    render(
      <AlertsList
        alerts={[]}
        isLoading={false}
        error="Failed to fetch alerts"
        hasMore={false}
        {...mockHandlers}
      />
    );
    
    // Check that the error message is displayed
    expect(screen.getByTestId('alerts-error')).toBeInTheDocument();
    expect(screen.getByText('Failed to fetch alerts')).toBeInTheDocument();
  });

  it('shows a message when there are no alerts', () => {
    render(
      <AlertsList
        alerts={[]}
        isLoading={false}
        error={null}
        hasMore={false}
        {...mockHandlers}
      />
    );
    
    // Check that the empty message is displayed
    expect(screen.getByTestId('alerts-empty')).toBeInTheDocument();
    expect(screen.getByText('No alerts found matching your criteria')).toBeInTheDocument();
  });

  it('shows a load more button when hasMore is true', () => {
    render(
      <AlertsList
        alerts={mockAlerts}
        isLoading={false}
        error={null}
        hasMore={true}
        {...mockHandlers}
      />
    );
    
    // Check that the load more button is displayed
    expect(screen.getByTestId('alerts-load-more')).toBeInTheDocument();
    expect(screen.getByText('Load More')).toBeInTheDocument();
  });

  it('calls onLoadMore when the load more button is clicked', () => {
    render(
      <AlertsList
        alerts={mockAlerts}
        isLoading={false}
        error={null}
        hasMore={true}
        {...mockHandlers}
      />
    );
    
    // Click the load more button
    fireEvent.click(screen.getByText('Load More'));
    
    // Check that onLoadMore was called
    expect(mockHandlers.onLoadMore).toHaveBeenCalled();
  });

  it('passes the correct handlers to AlertCard', () => {
    render(
      <AlertsList
        alerts={mockAlerts}
        isLoading={false}
        error={null}
        hasMore={false}
        {...mockHandlers}
      />
    );
    
    // Click the acknowledge button for the first alert
    fireEvent.click(screen.getByTestId('acknowledge-1'));
    expect(mockHandlers.onAcknowledge).toHaveBeenCalledWith('1');
    
    // Click the resolve button for the first alert
    fireEvent.click(screen.getByTestId('resolve-1'));
    expect(mockHandlers.onResolve).toHaveBeenCalledWith('1');
    
    // Click the dismiss button for the first alert
    fireEvent.click(screen.getByTestId('dismiss-1'));
    expect(mockHandlers.onDismiss).toHaveBeenCalledWith('1');
    
    // Click the view details button for the first alert
    fireEvent.click(screen.getByTestId('view-details-1'));
    expect(mockHandlers.onViewDetails).toHaveBeenCalledWith(mockAlerts[0]);
  });

  it('shows a loading indicator when loading more alerts', () => {
    render(
      <AlertsList
        alerts={mockAlerts}
        isLoading={true}
        error={null}
        hasMore={true}
        {...mockHandlers}
      />
    );
    
    // Check that the loading more indicator is displayed
    expect(screen.getByTestId('alerts-loading-more')).toBeInTheDocument();
    expect(screen.getByText('Loading more alerts...')).toBeInTheDocument();
  });
});
