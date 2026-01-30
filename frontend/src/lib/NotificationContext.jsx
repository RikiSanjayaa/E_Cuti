import { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';

/**
 * NotificationContext
 * 
 * Manages WebSocket connection for real-time notifications.
 * Provides functions to subscribe/unsubscribe to entity changes
 * and displays toast notifications for database changes.
 */

const NotificationContext = createContext(null);

// WebSocket URL - use relative path to go through Vite proxy in dev
const getWsUrl = () => {
  const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  const host = window.location.host;
  return `${protocol}//${host}/ws/notifications`;
};

export function NotificationProvider({ children }) {
  const [isConnected, setIsConnected] = useState(false);
  const [toasts, setToasts] = useState([]);
  const [notificationHistory, setNotificationHistory] = useState(() => {
    // Load from localStorage on init
    try {
      const stored = localStorage.getItem('notification_history');
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });
  const wsRef = useRef(null);
  const subscribersRef = useRef(new Map()); // Map<entity, Set<callback>>
  const reconnectTimeoutRef = useRef(null);
  const reconnectAttempts = useRef(0);
  const MAX_RECONNECT_ATTEMPTS = 10;
  const RECONNECT_BASE_DELAY = 1000;
  const MAX_HISTORY_ITEMS = 50;

  // Compute unread count
  const unreadCount = notificationHistory.filter(n => !n.read).length;

  // Persist history to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('notification_history', JSON.stringify(notificationHistory));
    } catch (error) {
      console.error('[Notifications] Failed to persist history:', error);
    }
  }, [notificationHistory]);

  // Add notification to history
  const addToHistory = useCallback((notification) => {
    const historyItem = {
      id: Date.now() + Math.random(),
      ...notification,
      read: false,
      receivedAt: new Date().toISOString()
    };
    setNotificationHistory(prev => {
      const updated = [historyItem, ...prev].slice(0, MAX_HISTORY_ITEMS);
      return updated;
    });
  }, []);

  // Mark a notification as read
  const markAsRead = useCallback((id) => {
    setNotificationHistory(prev =>
      prev.map(n => n.id === id ? { ...n, read: true } : n)
    );
  }, []);

  // Mark all notifications as read
  const markAllAsRead = useCallback(() => {
    setNotificationHistory(prev =>
      prev.map(n => ({ ...n, read: true }))
    );
  }, []);

  // Clear all notification history
  const clearHistory = useCallback(() => {
    setNotificationHistory([]);
  }, []);

  // Add a toast notification
  const addToast = useCallback((toast) => {
    const id = Date.now() + Math.random();
    const newToast = { id, ...toast };
    setToasts((prev) => [...prev, newToast]);

    // Auto-dismiss after 5 seconds
    setTimeout(() => {
      removeToast(id);
    }, 5000);

    return id;
  }, []);

  // Remove a toast
  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  // Subscribe to entity changes
  const subscribe = useCallback((entity, callback) => {
    if (!subscribersRef.current.has(entity)) {
      subscribersRef.current.set(entity, new Set());
    }
    subscribersRef.current.get(entity).add(callback);

    // Return unsubscribe function
    return () => {
      const subscribers = subscribersRef.current.get(entity);
      if (subscribers) {
        subscribers.delete(callback);
      }
    };
  }, []);

  // Unsubscribe from entity changes
  const unsubscribe = useCallback((entity, callback) => {
    const subscribers = subscribersRef.current.get(entity);
    if (subscribers) {
      subscribers.delete(callback);
    }
  }, []);

  // Notify all subscribers for an entity
  const notifySubscribers = useCallback((entity, data) => {
    const subscribers = subscribersRef.current.get(entity);
    if (subscribers) {
      subscribers.forEach((callback) => {
        try {
          callback(data);
        } catch (error) {
          console.error('[WS] Error in subscriber callback:', error);
        }
      });
    }

    // Also notify 'audit' subscribers for any data change (audit logs track all changes)
    if (entity !== 'audit') {
      const auditSubscribers = subscribersRef.current.get('audit');
      if (auditSubscribers) {
        auditSubscribers.forEach((callback) => {
          try {
            callback(data);
          } catch (error) {
            console.error('[WS] Error in audit subscriber callback:', error);
          }
        });
      }
    }
  }, []);

  // Handle incoming WebSocket message
  const handleMessage = useCallback((event) => {
    try {
      const data = JSON.parse(event.data);

      if (data.type === 'data_change') {
        const { entity, action, username, details } = data;

        // Show toast notification
        const actionLabels = {
          create: 'membuat',
          update: 'mengubah',
          delete: 'menghapus'
        };

        const entityLabels = {
          leaves: 'data cuti',
          personnel: 'data personel',
          users: 'data pengguna',
          leave_types: 'jenis cuti',
          holidays: 'hari libur',
          audit: 'audit log'
        };

        addToast({
          type: action === 'delete' ? 'warning' : 'info',
          title: 'Data Diperbarui',
          message: `${username} ${actionLabels[action] || action} ${entityLabels[entity] || entity}`,
          entity,
          action
        });

        // Add to notification history
        addToHistory({
          type: action === 'delete' ? 'warning' : 'info',
          title: 'Data Diperbarui',
          message: `${username} ${actionLabels[action] || action} ${entityLabels[entity] || entity}`,
          entity,
          action,
          username,
          details
        });

        // Notify all subscribers for this entity
        notifySubscribers(entity, data);
      }
    } catch (error) {
      console.error('[WS] Error parsing message:', error);
    }
  }, [addToast, addToHistory, notifySubscribers]);

  // Connect to WebSocket
  const connect = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      return;
    }

    // Don't connect if not authenticated
    const token = localStorage.getItem('token');
    if (!token) {
      console.log('[WS] Not authenticated, skipping connection');
      return;
    }

    try {
      const wsUrl = getWsUrl();
      console.log('[WS] Connecting to:', wsUrl);
      wsRef.current = new WebSocket(wsUrl);

      wsRef.current.onopen = () => {
        console.log('[WS] Connected');
        setIsConnected(true);
        reconnectAttempts.current = 0;
      };

      wsRef.current.onclose = (event) => {
        console.log('[WS] Disconnected:', event.code, event.reason);
        setIsConnected(false);
        wsRef.current = null;

        // Only reconnect if we haven't exceeded max attempts and user is still authenticated
        if (reconnectAttempts.current < MAX_RECONNECT_ATTEMPTS && localStorage.getItem('token')) {
          const delay = Math.min(
            RECONNECT_BASE_DELAY * Math.pow(2, reconnectAttempts.current),
            30000
          );
          console.log(`[WS] Reconnecting in ${delay}ms (attempt ${reconnectAttempts.current + 1})`);

          reconnectTimeoutRef.current = setTimeout(() => {
            reconnectAttempts.current++;
            connect();
          }, delay);
        }
      };

      wsRef.current.onerror = (error) => {
        console.error('[WS] Error:', error);
      };

      wsRef.current.onmessage = handleMessage;
    } catch (error) {
      console.error('[WS] Connection error:', error);
    }
  }, [handleMessage]);

  // Disconnect from WebSocket
  const disconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }

    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }

    setIsConnected(false);
    reconnectAttempts.current = MAX_RECONNECT_ATTEMPTS; // Prevent auto-reconnect
  }, []);

  // Connect on mount if authenticated (with delay to let backend fully initialize)
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      // Small delay to ensure backend is ready and avoid initial connection errors
      const connectTimeout = setTimeout(() => {
        connect();
      }, 1000);

      return () => {
        clearTimeout(connectTimeout);
        disconnect();
      };
    }

    return () => {
      disconnect();
    };
  }, [connect, disconnect]);

  // Send heartbeat to keep connection alive
  useEffect(() => {
    if (!isConnected) return;

    const heartbeatInterval = setInterval(() => {
      if (wsRef.current?.readyState === WebSocket.OPEN) {
        wsRef.current.send(JSON.stringify({ type: 'heartbeat' }));
      }
    }, 30000);

    return () => clearInterval(heartbeatInterval);
  }, [isConnected]);

  const value = {
    isConnected,
    toasts,
    addToast,
    removeToast,
    subscribe,
    unsubscribe,
    connect,
    disconnect,
    // History management
    notificationHistory,
    unreadCount,
    markAsRead,
    markAllAsRead,
    clearHistory
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
}

// Hook for subscribing to entity changes with auto-cleanup
export function useEntitySubscription(entity, callback) {
  const { subscribe } = useNotifications();

  useEffect(() => {
    if (!entity || !callback) return;

    const unsubscribe = subscribe(entity, callback);
    return unsubscribe;
  }, [entity, callback, subscribe]);
}

export default NotificationContext;
