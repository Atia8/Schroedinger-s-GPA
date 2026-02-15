const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const User = require('../models/User');

// Get current user profile
router.get('/profile', authMiddleware.authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId);
    if (!user) {
      return res.status(404).json({ 
        success: false, 
        message: 'User not found. Like your motivation.' 
      });
    }
    
    res.json({
      success: true,
      user
    });
  } catch (error) {
    console.error('Profile fetch error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch profile. Typical.' 
    });
  }
});

// Update username
router.patch('/username', authMiddleware.authenticateToken, async (req, res) => {
  try {
    const { username } = req.body;
    
    if (!username || username.trim().length < 3) {
      return res.status(400).json({ 
        success: false, 
        message: 'Username must be at least 3 characters. Unlike your attention span.' 
      });
    }

    const user = await User.findByIdAndUpdate(
      req.user.userId,
      { username: username.trim() },
      { new: true }
    );
    
    res.json({
      success: true,
      message: 'Username updated. New identity, same procrastination.',
      user
    });
  } catch (error) {
    console.error('Username update error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to update username. Blame the system.' 
    });
  }
});

// Update sarcasm/roast level
router.patch('/sarcasm', authMiddleware.authenticateToken, async (req, res) => {
  try {
    const { sarcasmLevel } = req.body;
    
    if (!['mild', 'brutal', 'damage'].includes(sarcasmLevel)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid sarcasm level. Choose mild, brutal, or damage.' 
      });
    }

    const user = await User.findByIdAndUpdate(
      req.user.userId,
      { sarcasmLevel },
      { new: true } 
    );
    
    res.json({
      success: true,
      message: `Roast mode set to ${sarcasmLevel}. Your NPCs will adjust accordingly.`,
      user
    });
  } catch (error) {
    console.error('Sarcasm update error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to update roast settings.' 
    });
  }
});

// Update notification preferences
router.patch('/notifications', authMiddleware.authenticateToken, async (req, res) => {
  try {
    const { deadlineReminders, dailyRoasts, despairAlerts, soundEffects } = req.body;
    
    const user = await User.findByIdAndUpdate(
      req.user.userId,
      { 
        notificationPreferences: {
          deadlineReminders,
          dailyRoasts,
          despairAlerts,
          soundEffects
        }
      },
      { new: true }
    );
    
    res.json({
      success: true,
      message: 'Notification preferences updated.',
      user
    });
  } catch (error) {
    console.error('Notification update error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to update notification preferences.' 
    });
  }
});

// Change email
router.patch('/email', authMiddleware.authenticateToken, async (req, res) => {
  try {
    const { newEmail, password } = req.body;
    
    if (!newEmail || !password) {
      return res.status(400).json({ 
        success: false, 
        message: 'Email and password are required.' 
      });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(newEmail)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid email format.' 
      });
    }

    const user = await User.findById(req.user.userId);
    if (!user) {
      return res.status(404).json({ 
        success: false, 
        message: 'User not found.' 
      });
    }

    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      return res.status(401).json({ 
        success: false, 
        message: 'Invalid password.' 
      });
    }

    const existingUser = await User.findOne({ email: newEmail });
    if (existingUser) {
      return res.status(409).json({ 
        success: false, 
        message: 'Email already in use.' 
      });
    }

    user.email = newEmail;
    await user.save();

    res.json({
      success: true,
      message: 'Email updated successfully.',
      user
    });

  } catch (error) {
    console.error('Email change error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to change email.' 
    });
  }
});

// Change password
router.patch('/password', authMiddleware.authenticateToken, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ 
        success: false, 
        message: 'Both passwords are required.' 
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ 
        success: false, 
        message: 'New password must be at least 6 characters.' 
      });
    }

    const user = await User.findById(req.user.userId);
    if (!user) {
      return res.status(404).json({ 
        success: false, 
        message: 'User not found.' 
      });
    }

    const isPasswordValid = await user.comparePassword(currentPassword);
    if (!isPasswordValid) {
      return res.status(401).json({ 
        success: false, 
        message: 'Current password is incorrect.' 
      });
    }

    user.password = newPassword;
    await user.save();

    res.json({
      success: true,
      message: 'Password changed successfully.'
    });

  } catch (error) {
    console.error('Password change error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to change password.' 
    });
  }
});

// Delete account
router.delete('/account', authMiddleware.authenticateToken, async (req, res) => {
  try {
    const { password, confirmText } = req.body;
    
    if (!password) {
      return res.status(400).json({ 
        success: false, 
        message: 'Password is required.' 
      });
    }

    if (confirmText !== 'DELETE') {
      return res.status(400).json({ 
        success: false, 
        message: 'Please type DELETE to confirm.' 
      });
    }

    const user = await User.findById(req.user.userId);
    if (!user) {
      return res.status(404).json({ 
        success: false, 
        message: 'User not found.' 
      });
    }

    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      return res.status(401).json({ 
        success: false, 
        message: 'Invalid password.' 
      });
    }

    // Delete user's tasks ( Task model)
    // await Task.deleteMany({ user: user._id });
    
    await User.findByIdAndDelete(user._id);

    res.json({
      success: true,
      message: 'Account deleted successfully.'
    });

  } catch (error) {
    console.error('Account deletion error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to delete account.' 
    });
  }
});

module.exports = router;