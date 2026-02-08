const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const { upload } = require('../utils/cloudinary');

// Upload profile picture
router.post('/profile-picture', 
  authMiddleware.authenticateToken,
  upload.single('image'),
  (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ 
          success: false, 
          message: 'No image uploaded' 
        });
      }

      res.json({
        success: true,
        message: 'Profile picture uploaded successfully',
        imageUrl: req.file.path,
        publicId: req.file.filename
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

// Delete profile picture
router.delete('/profile-picture/:publicId', 
  authMiddleware.authenticateToken,
  async (req, res) => {
    try {
      const { publicId } = req.params;
      // Delete from Cloudinary
      const result = await cloudinary.uploader.destroy(publicId);
      
      res.json({
        success: true,
        message: 'Profile picture deleted',
        result
      });
    } catch (error) {
      res.status(500).json({ 
        success: false, 
        message: 'Delete failed' 
      });
    }
  }
);

module.exports = router;