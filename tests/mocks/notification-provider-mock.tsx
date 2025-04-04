import React, { createContext, useContext, ReactNode } from 'react';

// Define the notification types
export type NotificationType = 'success' | 'error' | 'info' | 'warning';

export interface Notification {
  id: string;
  type: NotificationType;
  message: string;
  title?: string;
  duration?: number;
}

export interface UseNotificationsResult {
  notifications: Notification[];
  addNotification: (notification: Omit<Notification, 'id'>) => void;
  removeNotification: (id: string) => void;
  clearNotifications: () => void;
}

// Create the context with a default value
const NotificationContext = createContext<UseNotificationsResult | null>(null);

// Mock implementation of the provider
export const NotificationProvider = ({ children }: { children: ReactNode }) => {
  // Mock implementation of the context value
  const notificationsData: UseNotificationsResult = {
    notifications: [],
    addNotification: jest.fn(),
    removeNotification: jest.fn(),
    clearNotifications: jest.fn(),
  };

  return (
    <NotificationContext.Provider value={notificationsData}>
      {children}
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
