import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { AlertCard } from '../AlertCard';

// Mock the date-fns library
jest.mock('date-fns', () => ({
  formatDistanceToNow: jest.fn(() => '2 days ago')
}));

describe('AlertCard', () => {
  const mockAlert = {
    id: '1',
    type: 'login_attempt',
    severity: 'high',
    title: 'Multiple failed login attempts',
    description: 'Multiple failed login attempts detected from IP 192.168.1.1',
    timestamp: new Date().toISOString(),
    status: 'new',
    affectedUsers: ['user1@example.com'],
    relatedIPs: ['192.168.1.1'],
    details: { attempts: 5, timeframe: '10 minutes' }
  };

  const mockHandlers = {
    onAcknowledge: jest.fn(),
    onResolve: jest.fn(),
    onDismiss: jest.fn(),
    onViewDetails: jest.fn()
  };

  it('renders alert information correctly', () => {
    render(<AlertCard alert={mockAlert} />);
    
    // Check that the title and description are displayed
    expect(screen.getByText(mockAlert.title)).toBeInTheDocument();
    expect(screen.getByText(mockAlert.description)).toBeInTheDocument();
    
    // Check that the severity badge is displayed
    expect(screen.getByText('High')).toBeInTheDocument();
    
    // Check that the status badge is displayed
    expect(screen.getByText('New')).toBeInTheDocument();
    
    // Check that the timestamp is displayed
    expect(screen.getByText('2 days ago')).toBeInTheDocument();
    
    // Check that affected users are displayed
    expect(screen.getByText('Affected Users:')).toBeInTheDocument();
    expect(screen.getByText('user1@example.com')).toBeInTheDocument();
    
    // Check that related IPs are displayed
    expect(screen.getByText('Related IPs:')).toBeInTheDocument();
    expect(screen.getByText('192.168.1.1')).toBeInTheDocument();
  });

  it('renders action buttons for new alerts', () => {
    render(
      <AlertCard 
        alert={mockAlert} 
        onAcknowledge={mockHandlers.onAcknowledge}
        onResolve={mockHandlers.onResolve}
        onDismiss={mockHandlers.onDismiss}
        onViewDetails={mockHandlers.onViewDetails}
      />
    );
    
    // Check that the action buttons are displayed
    expect(screen.getByTestId('acknowledge-button')).toBeInTheDocument();
    expect(screen.getByTestId('resolve-button')).toBeInTheDocument();
    expect(screen.getByTestId('dismiss-button')).toBeInTheDocument();
    expect(screen.getByTestId('view-details-button')).toBeInTheDocument();
  });

  it('calls the appropriate handler when a button is clicked', () => {
    render(
      <AlertCard 
        alert={mockAlert} 
        onAcknowledge={mockHandlers.onAcknowledge}
        onResolve={mockHandlers.onResolve}
        onDismiss={mockHandlers.onDismiss}
        onViewDetails={mockHandlers.onViewDetails}
      />
    );
    
    // Click the acknowledge button
    fireEvent.click(screen.getByTestId('acknowledge-button'));
    expect(mockHandlers.onAcknowledge).toHaveBeenCalledWith(mockAlert.id);
    
    // Click the resolve button
    fireEvent.click(screen.getByTestId('resolve-button'));
    expect(mockHandlers.onResolve).toHaveBeenCalledWith(mockAlert.id);
    
    // Click the dismiss button
    fireEvent.click(screen.getByTestId('dismiss-button'));
    expect(mockHandlers.onDismiss).toHaveBeenCalledWith(mockAlert.id);
    
    // Click the view details button
    fireEvent.click(screen.getByTestId('view-details-button'));
    expect(mockHandlers.onViewDetails).toHaveBeenCalledWith(mockAlert);
  });

  it('does not render buttons when handlers are not provided', () => {
    render(<AlertCard alert={mockAlert} />);
    
    // Check that the action buttons are not displayed
    expect(screen.queryByText('Acknowledge')).not.toBeInTheDocument();
    expect(screen.queryByText('Resolve')).not.toBeInTheDocument();
    expect(screen.queryByText('Dismiss')).not.toBeInTheDocument();
    expect(screen.queryByText('View Details')).not.toBeInTheDocument();
  });

  it('renders different buttons based on alert status', () => {
    // Render an acknowledged alert
    const acknowledgedAlert = { ...mockAlert, status: 'acknowledged' };
    const { rerender } = render(
      <AlertCard 
        alert={acknowledgedAlert} 
        onAcknowledge={mockHandlers.onAcknowledge}
        onResolve={mockHandlers.onResolve}
        onDismiss={mockHandlers.onDismiss}
        onViewDetails={mockHandlers.onViewDetails}
      />
    );
    
    // Check that the acknowledge button is not displayed
    expect(screen.queryByTestId('acknowledge-button')).not.toBeInTheDocument();
    
    // Check that the resolve button is displayed
    expect(screen.getByTestId('resolve-button')).toBeInTheDocument();
    
    // Render a resolved alert
    const resolvedAlert = { ...mockAlert, status: 'resolved' };
    rerender(
      <AlertCard 
        alert={resolvedAlert} 
        onAcknowledge={mockHandlers.onAcknowledge}
        onResolve={mockHandlers.onResolve}
        onDismiss={mockHandlers.onDismiss}
        onViewDetails={mockHandlers.onViewDetails}
      />
    );
    
    // Check that the acknowledge and resolve buttons are not displayed
    expect(screen.queryByTestId('acknowledge-button')).not.toBeInTheDocument();
    expect(screen.queryByTestId('resolve-button')).not.toBeInTheDocument();
    
    // Render a dismissed alert
    const dismissedAlert = { ...mockAlert, status: 'dismissed' };
    rerender(
      <AlertCard 
        alert={dismissedAlert} 
        onAcknowledge={mockHandlers.onAcknowledge}
        onResolve={mockHandlers.onResolve}
        onDismiss={mockHandlers.onDismiss}
        onViewDetails={mockHandlers.onViewDetails}
      />
    );
    
    // Check that the dismiss button is not displayed
    expect(screen.queryByTestId('dismiss-button')).not.toBeInTheDocument();
  });
});
