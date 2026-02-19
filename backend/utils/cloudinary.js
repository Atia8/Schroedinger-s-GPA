const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const multer = require('multer');

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

// Create storage engine for Cloudinary
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: process.env.CLOUDINARY_UPLOAD_FOLDER || 'academic-victim/profiles',
    allowed_formats: ['jpg', 'jpeg', 'png', 'gif'],
    transformation: [
      { width: 500, height: 500, crop: 'limit' },
      { quality: 'auto:best' },
      { fetch_format: 'auto' }
    ]
  }
});

const upload = multer({
   storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
   });

module.exports = { cloudinary, upload };