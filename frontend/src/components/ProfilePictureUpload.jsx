import React, { useState, useRef } from 'react';
import { Upload, X, User } from 'lucide-react';

const ProfilePictureUpload = ({ currentImage = null, onImageUpdate }) => {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [previewUrl, setPreviewUrl] = useState(currentImage);
  const fileInputRef = useRef(null);

  const handleFileSelect = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    setUploading(true);
    setError('');

    try {
      const formData = new FormData();
      formData.append('image', file);

      const token = localStorage.getItem('token');
      
      const response = await fetch('http://localhost:5000/api/upload/profile-picture', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Upload failed');
      }

      const imageUrl = data.imageUrl;
      // Clean the publicId - remove any file extension
      let publicId = data.publicId;
      if (publicId && publicId.includes('.')) {
        publicId = publicId.split('.')[0];
      }
      
      setPreviewUrl(imageUrl);
      
      // Save to localStorage
      localStorage.setItem('profileImage', imageUrl);
      localStorage.setItem('profilePublicId', publicId);
      
      if (onImageUpdate) {
        onImageUpdate(imageUrl);
      }
      
    } catch (err) {
      setError(err.message);
    } finally {
      setUploading(false);
    }
  };

  const triggerFileInput = () => {
    if (!uploading) {
      fileInputRef.current.click();
    }
  };

const handleRemoveImage = async () => {
  if (window.confirm('Are you sure you want to remove your profile picture?')) {
    setUploading(true);
    setError('');
    
    try {
      const token = localStorage.getItem('token');
      
      if (!token) {
        throw new Error('Not authenticated');
      }

      // Get publicId from localStorage
      let publicId = localStorage.getItem('profilePublicId');
      
      // If not in localStorage, try to extract from currentImage
      if (!publicId && currentImage) {
        // Extract publicId from Cloudinary URL
        // Cloudinary URL format: https://res.cloudinary.com/.../v123456/folder/filename
        const urlParts = currentImage.split('/');
        const filenameWithVersion = urlParts[urlParts.length - 1];
        // Remove version if present (v123456_)
        const filename = filenameWithVersion.replace(/^v\d+_/, '');
        publicId = filename.split('.')[0];
        localStorage.setItem('profilePublicId', publicId);
      }
      
      if (!publicId) {
        throw new Error('Unable to find image ID. Please try uploading again.');
      }

      console.log('Deleting image with publicId:', publicId);
      
      // Use DELETE method with the correct URL structure
      const response = await fetch(`http://localhost:5000/api/upload/profile-picture/${encodeURIComponent(publicId)}`, {
        method: 'DELETE',  // Changed from POST to DELETE
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Delete failed');
      }

      const data = await response.json();
      console.log('Delete successful:', data);

      // Clear local state
      setPreviewUrl(null);
      localStorage.removeItem('profileImage');
      localStorage.removeItem('profilePublicId');
      
      if (onImageUpdate) {
        onImageUpdate(null);
      }
      
    } catch (err) {
      console.error('Delete error:', err);
      setError(err.message);
    } finally {
      setUploading(false);
    }
  }
};

  const displayImage = previewUrl || currentImage;

  return (
    <div className="flex flex-col items-center">
      <div 
        className={`relative w-40 h-40 rounded-full border-2 border-gray-700 overflow-hidden cursor-pointer group ${
          uploading ? 'opacity-50 cursor-not-allowed' : ''
        }`}
        onClick={triggerFileInput}
      >
        {displayImage ? (
          <img 
            src={displayImage} 
            alt="Profile" 
            className="w-full h-full object-cover"
            onError={() => {
              setPreviewUrl(null);
              localStorage.removeItem('profileImage');
            }}
          />
        ) : (
          <div className="w-full h-full bg-gray-900 flex items-center justify-center">
            <User className="w-20 h-20 text-gray-600" />
          </div>
        )}
        
        {uploading && (
          <div className="absolute inset-0 bg-black/70 flex items-center justify-center">
            <div className="w-8 h-8 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
          </div>
        )}
        
        {!uploading && (
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/60 flex items-center justify-center transition-all">
            <div className="opacity-0 group-hover:opacity-100 transition-opacity text-white text-sm font-medium">
              Change Photo
            </div>
          </div>
        )}
      </div>

      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileSelect}
        accept="image/*"
        className="hidden"
        disabled={uploading}
      />

      <div className="flex gap-3 mt-4">
        <button
          onClick={triggerFileInput}
          disabled={uploading}
          className="px-4 py-2 bg-cyan-600 text-gray-900 font-medium rounded-lg hover:bg-cyan-500 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
        >
          <Upload className="w-4 h-4" />
          {displayImage ? 'Change Photo' : 'Upload Photo'}
        </button>
        
        {displayImage && (
          <button
            onClick={handleRemoveImage}
            disabled={uploading}
            className="px-4 py-2 bg-gray-700 text-gray-300 rounded-lg hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            <X className="w-4 h-4" />
            Remove
          </button>
        )}
      </div>

      {error && (
        <div className="mt-3 text-sm text-rose-400 text-center">
          {error}
        </div>
      )}
    </div>
  );
};

export default ProfilePictureUpload;