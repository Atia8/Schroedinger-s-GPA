const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const NotificationService = require('../services/notificationService');

// Get socket manager from app
router.use((req, res, next) => {
  const socketManager = req.app.get('socketManager');
  req.notificationService = new NotificationService(socketManager);
  next();
});

router.use(authMiddleware.authenticateToken);

// In notificationRoutes.js
router.post('/check-despair', authMiddleware.authenticateToken, async (req, res) => {
  console.log('CHECK-DESPAIR ENDPOINT WAS CALLED');
  
  try {
    const socketManager = req.app.get('socketManager');
    console.log('Socket manager:', socketManager ? 'Found' : 'Not found');
    
    const NotificationService = require('../services/notificationService');
    const notificationService = new NotificationService(socketManager);
    console.log('Notification service created');
    
    await notificationService.checkAndCreateDespairAlert(req.user.userId);
    
    console.log('Despair check completed');
    res.json({ success: true, message: 'Despair check completed' });
  } catch (error) {
    console.error('Despair check error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get notifications
router.get('/', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    
    const result = await req.notificationService.getUserNotifications(
      req.user.userId,
      page,
      limit
    );
    
    res.json({ success: true, ...result });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get unread count
router.get('/unread-count', async (req, res) => {
  try {
    const count = await req.notificationService.getUnreadCount(req.user.userId);
    res.json({ success: true, count });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Mark as read
router.patch('/:id/read', async (req, res) => {
  try {
    const notification = await req.notificationService.markAsRead(
      req.user.userId,
      req.params.id
    );
    res.json({ success: true, notification });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Mark all as read
router.patch('/read-all', async (req, res) => {
  try {
    await req.notificationService.markAllAsRead(req.user.userId);
    res.json({ success: true, message: 'All marked as read' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Delete notification
router.delete('/:id', async (req, res) => {
  try {
    await req.notificationService.deleteNotification(req.user.userId, req.params.id);
    res.json({ success: true, message: 'Deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;