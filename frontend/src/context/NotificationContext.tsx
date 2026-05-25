import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';
import { useSocket } from '../hooks/useSocket';
import { useAuth } from '../hooks/useAuth';

export interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: string;
  isRead: boolean;
  createdAt: string;
}

interface NotificationContextType {
  unreadNotifications: Notification[];
  markAsRead: (id: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  fetchNotifications: () => Promise<void>;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [unreadNotifications, setUnreadNotifications] = useState<Notification[]>([]);
  const socket = useSocket();
  const { user } = useAuth();

  const fetchNotifications = async () => {
    if (!user) return;
    try {
      const response = await api.get('/notifications');
      const allNotifications: Notification[] = response.data.notifications || [];
      const unread = allNotifications.filter((n) => !n.isRead);
      setUnreadNotifications(unread);
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, [user]);

  useEffect(() => {
    if (!socket) return;

    const handleNewNotification = (notification: Notification) => {
      console.log('[NotificationContext] Received new notification:', notification);
      // Ensure we only add it if it belongs to current user or if simple socket is broadcasting
      if (!notification.userId || (user && notification.userId === user.id)) {
        setUnreadNotifications((prev) => {
          // Avoid duplicate entries
          if (prev.some((n) => n.id === notification.id)) return prev;
          return [notification, ...prev];
        });
      }
    };

    socket.on('new-notification', handleNewNotification);
    socket.on('notification', handleNewNotification);

    return () => {
      socket.off('new-notification', handleNewNotification);
      socket.off('notification', handleNewNotification);
    };
  }, [socket, user]);

  const markAsRead = async (id: string) => {
    try {
      await api.patch(`/notifications/${id}/read`);
      setUnreadNotifications((prev) => prev.filter((n) => n.id !== id));
    } catch (error) {
      console.error(`Failed to mark notification ${id} as read via PATCH, trying PUT fallback:`, error);
      try {
        await api.put(`/notifications/${id}/read`);
        setUnreadNotifications((prev) => prev.filter((n) => n.id !== id));
      } catch (putError) {
        console.error(`Fallback PUT also failed:`, putError);
      }
    }
  };

  const markAllAsRead = async () => {
    try {
      await api.put('/notifications/read-all');
      setUnreadNotifications([]);
    } catch (error) {
      console.error('Failed to mark all as read:', error);
    }
  };

  return (
    <NotificationContext.Provider
      value={{
        unreadNotifications,
        markAsRead,
        markAllAsRead,
        fetchNotifications,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotificationContext = () => {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error('useNotificationContext must be used within a NotificationProvider');
  }
  return context;
};
