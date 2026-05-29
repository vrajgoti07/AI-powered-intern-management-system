import React, { createContext, useContext, useEffect } from 'react';
import { useSocket } from '../hooks/useSocket';
import { useAuth } from '../hooks/useAuth';
import { useNotificationStore, Notification } from '../store/useNotificationStore';
import toast from 'react-hot-toast';

interface NotificationContextType {
  // We keep this context lightweight and proxy to Zustand
  // for backwards compatibility if any other component uses it
  unreadNotifications: Notification[];
  markAsRead: (id: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  fetchNotifications: () => Promise<void>;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const socket = useSocket();
  const { user } = useAuth();
  
  const { 
    notifications, 
    markAsRead, 
    markAllAsRead, 
    fetchNotifications,
    addNotification
  } = useNotificationStore();

  const unreadNotifications = notifications.filter(n => !n.isRead);

  useEffect(() => {
    if (user) {
      fetchNotifications();
    }
  }, [user, fetchNotifications]);

  useEffect(() => {
    if (!socket || !user) return;

    const handleNewNotification = (data: any) => {
      console.log('[NotificationContext] Received new socket event:', data);
      
      // Handle the case where the payload is nested like { notification: {...}, data: {...} }
      const notification = data.notification ? data.notification : data;
      
      if (!notification.userId || notification.userId === user.id) {
        addNotification(notification);
        
        toast.custom((t) => (
          <div
            className={`${
              t.visible ? 'animate-enter' : 'animate-leave'
            } max-w-md w-full bg-white shadow-lg rounded-lg pointer-events-auto flex ring-1 ring-black ring-opacity-5`}
          >
            <div className="flex-1 w-0 p-4">
              <div className="flex items-start">
                <div className="ml-3 flex-1">
                  <p className="text-sm font-medium text-gray-900">
                    {notification.title || 'New Notification'}
                  </p>
                  <p className="mt-1 text-sm text-gray-500 line-clamp-2">
                    {notification.message}
                  </p>
                </div>
              </div>
            </div>
            <div className="flex border-l border-gray-200">
              <button
                onClick={() => toast.dismiss(t.id)}
                className="w-full border border-transparent rounded-none rounded-r-lg p-4 flex items-center justify-center text-sm font-medium text-indigo-600 hover:text-indigo-500 focus:outline-none"
              >
                Close
              </button>
            </div>
          </div>
        ));
      }
    };

    // Listen to our specific events instead of just generic ones
    socket.on('task:assigned', handleNewNotification);
    socket.on('task:updated', handleNewNotification);
    socket.on('attendance:marked', handleNewNotification);
    socket.on('leave:new', handleNewNotification);
    socket.on('leave:decision', handleNewNotification);
    socket.on('announcement:new', handleNewNotification);
    socket.on('offer:received', handleNewNotification);
    
    // Also listen to the generic ones
    socket.on('new-notification', handleNewNotification);
    socket.on('notification', handleNewNotification);

    return () => {
      socket.off('task:assigned', handleNewNotification);
      socket.off('task:updated', handleNewNotification);
      socket.off('attendance:marked', handleNewNotification);
      socket.off('leave:new', handleNewNotification);
      socket.off('leave:decision', handleNewNotification);
      socket.off('announcement:new', handleNewNotification);
      socket.off('offer:received', handleNewNotification);
      socket.off('new-notification', handleNewNotification);
      socket.off('notification', handleNewNotification);
    };
  }, [socket, user, addNotification]);

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
