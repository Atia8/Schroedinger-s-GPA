import React, { createContext, useContext, useEffect, useState } from 'react';
import io from 'socket.io-client';

const SocketContext = createContext();

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) throw new Error('useSocket must be used within SocketProvider');
  return context;
};

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) return;

    // Connect to socket server (just like your chat apps!)
    const newSocket = io('http://localhost:5000', {
      auth: { token },
      transports: ['websocket']
    });

    // Connection events
    newSocket.on('connect', () => {
      console.log('🔌 Connected to notification server');
      setIsConnected(true);
    });

    newSocket.on('disconnect', () => {
      console.log('🔌 Disconnected from notification server');
      setIsConnected(false);
    });

    // Handle incoming notifications
    newSocket.on('notification', (notification) => {
      console.log('📨 Received notification:', notification);
      
      if (notification.type === 'unread_count') {
        setUnreadCount(notification.count);
      } else if (notification.type === 'new_notification') {
        // Dispatch event for components to listen to
        window.dispatchEvent(new CustomEvent('new-notification', {
          detail: notification.notification
        }));
        
        // Play sound for high priority
        if (notification.notification.metadata?.priority === 'high') {
          const audio = new Audio('/notification.mp3');
          audio.play().catch(e => console.log('Audio play failed:', e));
        }
      }
    });

    setSocket(newSocket);

    // Cleanup
    return () => {
      newSocket.close();
    };
  }, []);

  // Function to mark notification as read via socket
  const markAsRead = (notificationId) => {
    if (socket && isConnected) {
      socket.emit('notification:read', notificationId);
    }
  };

  // Function to refresh notifications
  const refreshNotifications = () => {
    if (socket && isConnected) {
      socket.emit('notifications:refresh');
    }
  };

  return (
    <SocketContext.Provider value={{
      socket,
      isConnected,
      unreadCount,
      markAsRead,
      refreshNotifications
    }}>
      {children}
    </SocketContext.Provider>
  );
};