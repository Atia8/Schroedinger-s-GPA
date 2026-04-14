const jwt = require('jsonwebtoken');
const Notification = require('../models/Notification');

class SocketManager {
  constructor(io) {
    this.io = io;
    this.connectedUsers = new Map(); // userId -> socketId
    this.setupMiddleware();
    this.setupEventHandlers();
  }

  setupMiddleware() {
    // Authentication middleware (just like your chat apps!)
    this.io.use((socket, next) => {
      const token = socket.handshake.auth.token;
      
      if (!token) {
        return next(new Error('Authentication required'));
      }

      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        socket.userId = decoded.userId;
        next();
      } catch (err) {
        return next(new Error('Invalid token'));
      }
    });
  }

  setupEventHandlers() {
    this.io.on('connection', (socket) => {
      console.log(`🔌 User connected: ${socket.userId}`);
      
      // Store connection
      this.connectedUsers.set(socket.userId, socket.id);
      
      // Join user's personal room (like chat rooms)
      socket.join(`user:${socket.userId}`);
      
      // Send welcome notification
      this.sendToUser(socket.userId, {
        type: 'connection',
        title: '🎉 Connected!',
        message: 'Real-time notifications active',
        timestamp: new Date()
      });

      // Handle manual refresh request
      socket.on('notifications:refresh', async () => {
        await this.sendUnreadCount(socket.userId);
      });

      // Handle mark as read via socket (faster than REST)
      socket.on('notification:read', async (notificationId) => {
        await Notification.findByIdAndUpdate(notificationId, { read: true });
        await this.sendUnreadCount(socket.userId);
      });

      // Handle disconnect (just like chat apps)
      socket.on('disconnect', () => {
        console.log(`🔌 User disconnected: ${socket.userId}`);
        this.connectedUsers.delete(socket.userId);
      });
    });
  }

  // Send notification to specific user
  sendToUser(userId, notification) {
    const socketId = this.connectedUsers.get(userId);
    if (socketId) {
      this.io.to(socketId).emit('notification', notification);
      return true;
    }
    return false; // User offline
  }

  // Send unread count update
  async sendUnreadCount(userId) {
    const count = await Notification.countDocuments({ 
      user: userId, 
      read: false 
    });
    
    this.sendToUser(userId, {
      type: 'unread_count',
      count
    });
  }

  // Broadcast to all connected users
  broadcastToAll(notification) {
    this.io.emit('notification', notification);
  }

  // Get connected users count
  getConnectedCount() {
    return this.connectedUsers.size;
  }
}

module.exports = SocketManager;