import React from 'react';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { NotificationProvider, NotificationContext } from './NotificationContext';

describe('NotificationProvider', () => {
  it('should render without crashing', () => {
    render(
      <NotificationProvider>
        <div>Test</div>
      </NotificationProvider>
    );
    expect(screen.getByText('Test')).toBeInTheDocument();
  });

  it('should add a notification when showNotification is called', () => {
    const TestComponent = () => {
      const context = React.useContext(NotificationContext);
      if (!context) return null;
      
      const { showNotification, notifications } = context;
      
      return (
        <div>
          <button 
            data-testid="add-button"
            onClick={() => showNotification({
              type: 'success',
              title: 'Success',
              message: 'This is a success message'
            })}
          >
            Add Notification
          </button>
          {notifications.map((notification) => (
            <div key={notification.id} data-testid="notification">
              <h3>{notification.title}</h3>
              <p>{notification.message}</p>
            </div>
          ))}
        </div>
      );
    };

    render(
      <NotificationProvider>
        <TestComponent />
      </NotificationProvider>
    );

    // Initially, there should be no notifications
    expect(screen.queryByTestId('notification')).not.toBeInTheDocument();

    // Click the button to add a notification
    fireEvent.click(screen.getByTestId('add-button'));

    // Now there should be a notification
    expect(screen.getByTestId('notification')).toBeInTheDocument();
    expect(screen.getByText('Success')).toBeInTheDocument();
    expect(screen.getByText('This is a success message')).toBeInTheDocument();
  });

  it('should remove a notification when dismissNotification is called', () => {
    const TestComponent = () => {
      const context = React.useContext(NotificationContext);
      if (!context) return null;
      
      const { showNotification, dismissNotification, notifications } = context;
      
      return (
        <div>
          <button 
            data-testid="add-button"
            onClick={() => showNotification({
              type: 'info',
              title: 'Info',
              message: 'This is an info message'
            })}
          >
            Add Notification
          </button>
          {notifications.map((notification) => (
            <div key={notification.id} data-testid="notification">
              <h3>{notification.title}</h3>
              <p>{notification.message}</p>
              <button 
                data-testid="dismiss-button"
                onClick={() => dismissNotification(notification.id)}
              >
                Dismiss
              </button>
            </div>
          ))}
        </div>
      );
    };

    render(
      <NotificationProvider>
        <TestComponent />
      </NotificationProvider>
    );

    // Add a notification
    fireEvent.click(screen.getByTestId('add-button'));
    expect(screen.getByTestId('notification')).toBeInTheDocument();

    // Dismiss the notification
    fireEvent.click(screen.getByTestId('dismiss-button'));
    expect(screen.queryByTestId('notification')).not.toBeInTheDocument();
  });

  it('should automatically remove a notification after its duration', () => {
    jest.useFakeTimers();
    
    const TestComponent = () => {
      const context = React.useContext(NotificationContext);
      if (!context) return null;
      
      const { showNotification, notifications } = context;
      
      return (
        <div>
          <button 
            data-testid="add-button"
            onClick={() => showNotification({
              type: 'warning',
              title: 'Warning',
              message: 'This is a warning message',
              duration: 1000 // 1 second
            })}
          >
            Add Notification
          </button>
          {notifications.map((notification) => (
            <div key={notification.id} data-testid="notification">
              <h3>{notification.title}</h3>
              <p>{notification.message}</p>
            </div>
          ))}
        </div>
      );
    };

    render(
      <NotificationProvider>
        <TestComponent />
      </NotificationProvider>
    );

    // Add a notification
    fireEvent.click(screen.getByTestId('add-button'));
    expect(screen.getByTestId('notification')).toBeInTheDocument();

    // Fast-forward time by 1 second
    act(() => {
      jest.advanceTimersByTime(1000);
    });

    // The notification should be gone
    expect(screen.queryByTestId('notification')).not.toBeInTheDocument();
    
    jest.useRealTimers();
  });
});
