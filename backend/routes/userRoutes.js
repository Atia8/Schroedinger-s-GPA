const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const User = require('../models/User');
const bcrypt = require('bcryptjs');

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
      user: user.toJSON()
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
      user: user.toJSON()
    });
  } catch (error) {
    console.error('Username update error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to update username. Blame the system.' 
    });
  }
});

// Change email
router.patch('/email', authMiddleware.authenticateToken, async (req, res) => {
  try {
    const { newEmail, password } = req.body;
    
    // Validation
    if (!newEmail || !password) {
      return res.status(400).json({ 
        success: false, 
        message: 'Email and password are required. Did you forget something?' 
      });
    }

    // Email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(newEmail)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid email format. Even your typos are disappointing.' 
      });
    }

    // Get user
    const user = await User.findById(req.user.userId);
    if (!user) {
      return res.status(404).json({ 
        success: false, 
        message: 'User not found. Did you exist in the first place?' 
      });
    }

    // Verify password
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      return res.status(401).json({ 
        success: false, 
        message: 'Invalid password. Security first, memory second.' 
      });
    }

    // Check if new email is already taken
    const existingUser = await User.findOne({ email: newEmail });
    if (existingUser) {
      return res.status(409).json({ 
        success: false, 
        message: 'Email already in use. Be original for once.' 
      });
    }

    // Update email
    user.email = newEmail;
    await user.save();

    res.json({
      success: true,
      message: 'Email updated successfully. Check your new inbox of regrets.',
      user: user.toJSON()
    });

  } catch (error) {
    console.error('Email change error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to change email. The universe is against you.' 
    });
  }
});

// Change password
router.patch('/password', authMiddleware.authenticateToken, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    
    // Validation
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ 
        success: false, 
        message: 'Both passwords are required. Not optional, unlike your assignments.' 
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ 
        success: false, 
        message: 'New password must be at least 6 characters. Make it strong, like your denial.' 
      });
    }

    // Get user
    const user = await User.findById(req.user.userId);
    if (!user) {
      return res.status(404).json({ 
        success: false, 
        message: 'User not found. Did you delete yourself?' 
      });
    }

    // Verify current password
    const isPasswordValid = await user.comparePassword(currentPassword);
    if (!isPasswordValid) {
      return res.status(401).json({ 
        success: false, 
        message: 'Current password is incorrect. Memory issues again?' 
      });
    }

    // Update password (will be hashed by pre-save hook)
    user.password = newPassword;
    await user.save();

    res.json({
      success: true,
      message: 'Password changed successfully. Try not to forget this one.'
    });

  } catch (error) {
    console.error('Password change error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to change password. Blame the encryption.' 
    });
  }
});

// Delete account
router.delete('/account', authMiddleware.authenticateToken, async (req, res) => {
  try {
    const { password, confirmText } = req.body;
    
    // Validation
    if (!password) {
      return res.status(400).json({ 
        success: false, 
        message: 'Password is required. We need to be sure it\'s really you.' 
      });
    }

    if (confirmText !== 'DELETE') {
      return res.status(400).json({ 
        success: false, 
        message: 'Please type DELETE to confirm. Reading is fundamental.' 
      });
    }

    // Get user
    const user = await User.findById(req.user.userId);
    if (!user) {
      return res.status(404).json({ 
        success: false, 
        message: 'User not found. Did you already delete yourself?' 
      });
    }

    // Verify password
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      return res.status(401).json({ 
        success: false, 
        message: 'Invalid password. One last security check.' 
      });
    }

    // TODO: Delete all user-related data (tasks, etc.)
    // await Task.deleteMany({ userId: user._id });
    
    // Delete user
    await User.findByIdAndDelete(user._id);

    res.json({
      success: true,
      message: 'Account deleted successfully. Your suffering has ended... for now.'
    });

  } catch (error) {
    console.error('Account deletion error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to delete account. Even escape is hard.' 
    });
  }
});

module.exports = router;