import React, { useState, useEffect, useRef } from 'react';
import { Bell, X, Calendar, Sparkles, AlertTriangle } from 'lucide-react';
import { useSocket } from '../contexts/SocketContext';

const NotificationBell = () => {
  const [notifications, setNotifications] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [loading, setLoading] = useState(false);
  const dropdownRef = useRef(null);
  
  const { unreadCount, markAsRead, refreshNotifications, isConnected } = useSocket();

  // Fetch notifications from REST API
  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:5000/api/notifications?limit=10', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await response.json();
      if (data.success) {
        setNotifications(data.notifications);
      }
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  // Listen for new notifications via WebSocket
  useEffect(() => {
    const handleNewNotification = (event) => {
      setNotifications(prev => [event.detail, ...prev]);
    };
    
    window.addEventListener('new-notification', handleNewNotification);
    return () => window.removeEventListener('new-notification', handleNewNotification);
  }, []);

  // Mark as read via WebSocket (instant!)
  const handleMarkAsRead = async (id) => {
    markAsRead(id); // WebSocket method
    
    // Also update UI immediately
    setNotifications(prev => prev.map(n => 
      n._id === id ? { ...n, read: true } : n
    ));
  };

  // Delete via REST
  const deleteNotification = async (id) => {
    try {
      const token = localStorage.getItem('token');
      await fetch(`http://localhost:5000/api/notifications/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setNotifications(prev => prev.filter(n => n._id !== id));
    } catch (error) {
      console.error('Failed to delete:', error);
    }
  };

  // Mark all as read via REST
  const markAllAsRead = async () => {
    try {
      const token = localStorage.getItem('token');
      await fetch('http://localhost:5000/api/notifications/read-all', {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    } catch (error) {
      console.error('Failed to mark all as read:', error);
    }
  };

  // Get icon based on type
  const getIcon = (type) => {
    switch(type) {
      case 'deadline': return <Calendar className="w-4 h-4 text-red-400" />;
      case 'daily_roast': return <Sparkles className="w-4 h-4 text-amber-400" />;
      case 'despair_alert': return <AlertTriangle className="w-4 h-4 text-rose-400" />;
      default: return <Bell className="w-4 h-4 text-cyan-400" />;
    }
  };

  // Click outside to close
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Fetch on mount and when opening
  useEffect(() => {
    if (showDropdown) {
      fetchNotifications();
      refreshNotifications();
    }
  }, [showDropdown]);

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setShowDropdown(!showDropdown)}
        className="relative p-2 hover:bg-gray-700 rounded-lg transition-colors"
      >
        <Bell className="w-5 h-5 text-gray-300" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center animate-pulse">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
        {!isConnected && (
          <span className="absolute -bottom-1 -right-1 w-2 h-2 bg-gray-500 rounded-full"></span>
        )}
      </button>

      {showDropdown && (
        <div className="absolute right-0 mt-2 w-96 bg-gray-800 rounded-lg shadow-xl border border-gray-700 z-50">
          <div className="p-3 border-b border-gray-700 flex justify-between items-center">
            <h3 className="font-bold text-white">
              Notifications
              {!isConnected && (
                <span className="ml-2 text-xs text-gray-500">(offline)</span>
              )}
            </h3>
            {unreadCount > 0 && (
              <button
                onClick={markAllAsRead}
                className="text-xs text-cyan-400 hover:text-cyan-300"
              >
                Mark all as read
              </button>
            )}
          </div>

          <div className="max-h-96 overflow-y-auto">
            {loading && notifications.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-400 mx-auto mb-2"></div>
                <p className="text-sm">Loading...</p>
              </div>
            ) : notifications.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                <Bell className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No notifications yet</p>
                <p className="text-xs mt-1">Enable them in settings to get roasted</p>
              </div>
            ) : (
              notifications.map(notif => (
                <div
                  key={notif._id}
                  className={`p-3 border-b border-gray-700 hover:bg-gray-750 transition-colors ${
                    !notif.read ? 'bg-cyan-900/20' : ''
                  }`}
                >
                  <div className="flex gap-3">
                    <div className="flex-shrink-0 mt-1">
                      {getIcon(notif.type)}
                    </div>
                    <div className="flex-1">
                      <div className="flex justify-between items-start">
                        <h4 className={`text-sm font-medium ${!notif.read ? 'text-white' : 'text-gray-300'}`}>
                          {notif.title}
                        </h4>
                        <button
                          onClick={() => deleteNotification(notif._id)}
                          className="text-gray-500 hover:text-gray-300"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                      <p className="text-xs text-gray-400 mt-1">{notif.message}</p>
                      <div className="flex justify-between items-center mt-2">
                        <span className="text-xs text-gray-500">
                          {new Date(notif.createdAt).toLocaleDateString()} at{' '}
                          {new Date(notif.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                        {!notif.read && (
                          <button
                            onClick={() => handleMarkAsRead(notif._id)}
                            className="text-xs text-cyan-400 hover:text-cyan-300"
                          >
                            Mark read
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="p-2 border-t border-gray-700 text-center">
            <button
              onClick={() => setShowDropdown(false)}
              className="text-xs text-gray-500 hover:text-gray-300"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationBell;