import React, { createContext, useReducer, useContext, ReactNode } from 'react';

// Define notification types
export type NotificationType = 'success' | 'error' | 'warning' | 'info';

// Define notification interface
export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  duration?: number;
}

// Define notification context state
interface NotificationState {
  notifications: Notification[];
}

// Define notification context actions
type NotificationAction =
  | { type: 'ADD_NOTIFICATION'; payload: Notification }
  | { type: 'REMOVE_NOTIFICATION'; payload: { id: string } };

// Define notification context interface
interface NotificationContextType {
  notifications: Notification[];
  showNotification: (notification: Omit<Notification, 'id'>) => void;
  dismissNotification: (id: string) => void;
}

// Create notification context
const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

// Create notification reducer
const notificationReducer = (state: NotificationState, action: NotificationAction): NotificationState => {
  switch (action.type) {
    case 'ADD_NOTIFICATION':
      return {
        ...state,
        notifications: [...state.notifications, action.payload],
      };
    case 'REMOVE_NOTIFICATION':
      return {
        ...state,
        notifications: state.notifications.filter((notification) => notification.id !== action.payload.id),
      };
    default:
      return state;
  }
};

// Create notification provider
export const NotificationProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(notificationReducer, { notifications: [] });

  // Generate a unique ID for notifications
  const generateId = (): string => {
    return `notification-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  };

  // Show a notification
  const showNotification = (notification: Omit<Notification, 'id'>) => {
    const id = generateId();
    const newNotification = { ...notification, id };
    
    dispatch({ type: 'ADD_NOTIFICATION', payload: newNotification });

    // Auto-dismiss notification after duration (if provided)
    if (notification.duration) {
      setTimeout(() => {
        dismissNotification(id);
      }, notification.duration);
    }
  };

  // Dismiss a notification
  const dismissNotification = (id: string) => {
    dispatch({ type: 'REMOVE_NOTIFICATION', payload: { id } });
  };

  return (
    <NotificationContext.Provider
      value={{
        notifications: state.notifications,
        showNotification,
        dismissNotification,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
};

// Create notification hook
export const useNotifications = (): NotificationContextType => {
  const context = useContext(NotificationContext);
  
  if (context === undefined) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  
  return context;
};
