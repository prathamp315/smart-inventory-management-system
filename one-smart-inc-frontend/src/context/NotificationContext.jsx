import React, { createContext, useContext, useState, useCallback, useMemo } from 'react';

const NotificationContext = createContext({
  notifications: [],
  addNotification: () => {},
  removeNotification: () => {},
  clearNotifications: () => {},
  unreadCount: 0,
});

export const useNotifications = () => useContext(NotificationContext);

// Icons mapped by type
const typeIcons = {
  lowStock: '⚠️',
  expiry: '⏰',
  requisition: '📋',
  manufacturing: '🏭',
  sales: '💰',
  system: '🔔',
  success: '✅',
  error: '❌',
  info: 'ℹ️',
  warning: '⚠️',
};

export const NotificationProvider = ({ children }) => {
  const [notifications, setNotifications] = useState([]);

  const addNotification = useCallback((message, type = 'info', extra = {}) => {
    const notification = {
      id: Date.now() + Math.random(),
      message,
      type,
      icon: typeIcons[type] || typeIcons.info,
      timestamp: new Date(),
      read: false,
      ...extra,
    };
    setNotifications((prev) => [notification, ...prev].slice(0, 50));
  }, []);

  const removeNotification = useCallback((id) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  }, []);

  const markAsRead = useCallback((id) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
  }, []);

  const markAllAsRead = useCallback(() => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  }, []);

  const clearNotifications = useCallback(() => {
    setNotifications([]);
  }, []);

  const unreadCount = useMemo(
    () => notifications.filter((n) => !n.read).length,
    [notifications]
  );

  const value = useMemo(
    () => ({
      notifications,
      addNotification,
      removeNotification,
      markAsRead,
      markAllAsRead,
      clearNotifications,
      unreadCount,
    }),
    [notifications, addNotification, removeNotification, markAsRead, markAllAsRead, clearNotifications, unreadCount]
  );

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};

export default NotificationContext;
