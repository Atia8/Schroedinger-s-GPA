const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const {cloudinary, upload } = require('../utils/cloudinary');
const User = require('../models/User');

// Upload profile picture
router.post('/profile-picture', 
  authMiddleware.authenticateToken,
  upload.single('image'),
  async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ 
          success: false, 
          message: 'No image uploaded' 
        });
      }

      // Get data from Cloudinary
      const imageUrl = req.file.path;           // For displaying
      const publicId = req.file.filename;       // For deleting/updating

      console.log('Saving to database:', {
        profilePicture: imageUrl,
        profilePublicId: publicId
      });

      // Update user with BOTH fields
      const user = await User.findByIdAndUpdate(
        req.user.userId,
        { 
          profilePicture: imageUrl,
          profilePublicId: publicId  // NOW THIS WORKS!
        },
        { new: true }
      );

      if (!user) {
        return res.status(404).json({ 
          success: false, 
          message: 'User not found' 
        });
      }

      res.json({
        success: true,
        message: 'Profile picture uploaded successfully',
        imageUrl: imageUrl,
        publicId: publicId,
        user: user.toJSON()
      });
    } catch (error) {
      console.error('Upload error:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Upload failed' 
      });
    }
  }
);

router.delete('/profile-picture',  // No :publicId param needed
  authMiddleware.authenticateToken,
  async (req, res) => {
    try {
      // 1. Get the user first to find their public_id
      const user = await User.findById(req.user.userId);
      
      if (!user) {
        return res.status(404).json({ 
          success: false, 
          message: 'User not found' 
        });
      }

      if (!user.profilePublicId) {
        return res.status(400).json({ 
          success: false, 
          message: 'No profile picture to delete' 
        });
      }

      console.log('Deleting image with publicId:', user.profilePublicId);

      // 2. Delete from Cloudinary using the stored public_id
      const result = await cloudinary.uploader.destroy(user.profilePublicId);

      // 3. Clear BOTH fields from user document
      const updatedUser = await User.findByIdAndUpdate(
        req.user.userId,
        { 
          profilePicture: null,
          profilePublicId: null 
        },
        { new: true }
      );
      
      res.json({
        success: true,
        message: 'Profile picture deleted',
        result,
        user: updatedUser.toJSON()
      });
    } catch (error) {
      console.error('Delete error:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Delete failed' 
      });
    }
  }
);
module.exports = router;