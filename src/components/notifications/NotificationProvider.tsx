import React, { createContext, useContext } from 'react';
import { useNotifications, UseNotificationsResult, Notification } from './hooks/useNotifications';

// Create context for notifications
const NotificationContext = createContext<UseNotificationsResult | undefined>(undefined);

// Notification component to display a single notification
const NotificationItem: React.FC<{
  notification: Notification;
  onDismiss: (id: string) => void;
}> = ({ notification, onDismiss }) => {
  const { id, type, title, message } = notification;

  // Determine background color based on notification type
  const getBgColor = () => {
    switch (type) {
      case 'success':
        return 'bg-green-50 border-green-500';
      case 'error':
        return 'bg-red-50 border-red-500';
      case 'warning':
        return 'bg-yellow-50 border-yellow-500';
      case 'info':
      default:
        return 'bg-blue-50 border-blue-500';
    }
  };

  // Determine text color based on notification type
  const getTextColor = () => {
    switch (type) {
      case 'success':
        return 'text-green-800';
      case 'error':
        return 'text-red-800';
      case 'warning':
        return 'text-yellow-800';
      case 'info':
      default:
        return 'text-blue-800';
    }
  };

  return (
    <div
      className={`${getBgColor()} border-l-4 p-4 mb-3 rounded shadow-md`}
      role="alert"
      data-testid={`notification-${id}`}
    >
      <div className="flex justify-between items-start">
        <div>
          <p className={`font-bold ${getTextColor()}`}>{title}</p>
          <p className={`${getTextColor()}`}>{message}</p>
        </div>
        <button
          onClick={() => onDismiss(id)}
          className="text-gray-400 hover:text-gray-600"
          aria-label="Dismiss notification"
          data-testid={`dismiss-notification-${id}`}
        >
          <svg
            className="h-5 w-5"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>
      </div>
    </div>
  );
};

// Notification container to display all notifications
const NotificationContainer: React.FC = () => {
  const notificationContext = useContext(NotificationContext);
  
  if (!notificationContext) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  
  const { notifications, dismissNotification } = notificationContext;
  
  if (notifications.length === 0) {
    return null;
  }
  
  return (
    <div
      className="fixed top-5 right-5 z-50 w-80"
      role="region"
      aria-label="Notifications"
      data-testid="notification-container"
    >
      {notifications.map(notification => (
        <NotificationItem
          key={notification.id}
          notification={notification}
          onDismiss={dismissNotification}
        />
      ))}
    </div>
  );
};

// Provider component to wrap the application
export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const notificationsData = useNotifications();
  
  return (
    <NotificationContext.Provider value={notificationsData}>
      {children}
      <NotificationContainer />
    </NotificationContext.Provider>
  );
};

// Hook to use notifications in components
export const useNotificationsContext = (): UseNotificationsResult => {
  const context = useContext(NotificationContext);
  
  if (!context) {
    throw new Error('useNotificationsContext must be used within a NotificationProvider');
  }
  
  return context;
};
