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

      // Get the publicId without extension
      const publicId = req.file.filename.split('.')[0];

      const user = await User.findByIdAndUpdate(
        req.user.userId,
        { 
          profilePicture: req.file.path,
          profilePublicId: publicId // Store this in your User model
        },
        { new: true }
      );

      res.json({
        success: true,
        message: 'Profile picture uploaded successfully',
        imageUrl: req.file.path,
        publicId: publicId, // Send clean publicId
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

// Delete profile picture - FIXED VERSION
router.delete('/profile-picture/:publicId', 
  authMiddleware.authenticateToken,
  async (req, res) => {
    try {
      const { publicId } = req.params;
      
      // Decode the URL parameter
      const decodedPublicId = decodeURIComponent(publicId);
      
      // Delete from Cloudinary
      const result = await cloudinary.uploader.destroy(decodedPublicId);

      const user = await User.findByIdAndUpdate(
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
        user: user.toJSON()
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