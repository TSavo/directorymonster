import { useState, useCallback } from 'react';
import { v4 as uuidv4 } from 'uuid';

export interface Notification {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message: string;
  duration?: number;
}

export interface UseNotificationsResult {
  notifications: Notification[];
  showNotification: (notification: Omit<Notification, 'id'>) => string;
  dismissNotification: (id: string) => void;
}

/**
 * Hook for managing notifications in the application
 * 
 * @returns Object containing notifications array and functions to show/dismiss notifications
 */
export function useNotifications(): UseNotificationsResult {
  const [notifications, setNotifications] = useState<Notification[]>([]);

  /**
   * Show a new notification
   * 
   * @param notification The notification to show (without ID)
   * @returns The ID of the created notification
   */
  const showNotification = useCallback((notification: Omit<Notification, 'id'>): string => {
    const id = uuidv4();
    const newNotification = { ...notification, id };
    
    setNotifications(prev => [...prev, newNotification]);
    
    // Auto-dismiss after duration if specified
    if (notification.duration) {
      setTimeout(() => {
        dismissNotification(id);
      }, notification.duration);
    }
    
    return id;
  }, []);

  /**
   * Dismiss a notification by ID
   * 
   * @param id The ID of the notification to dismiss
   */
  const dismissNotification = useCallback((id: string): void => {
    setNotifications(prev => prev.filter(notification => notification.id !== id));
  }, []);

  return {
    notifications,
    showNotification,
    dismissNotification
  };
}
