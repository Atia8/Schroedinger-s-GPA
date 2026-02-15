import React, { useState } from 'react';
import { X, Lock, AlertTriangle } from 'lucide-react';

const DeleteAccountModal = ({ isOpen, onClose, onSuccess }) => {
  const [password, setPassword] = useState('');
  const [confirmText, setConfirmText] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (confirmText !== 'DELETE') {
      setError('Please type DELETE to confirm. Reading is fundamental.');
      return;
    }

    setLoading(true);

    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:5000/api/users/account', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ password, confirmText })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to delete account');
      }

      onSuccess(data.message);
      
      // Clear local storage and logout
      localStorage.clear();
      
      // Redirect to login page
      window.location.href = '/login';
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-800 border border-rose-800/50 rounded-2xl max-w-md w-full">
        <div className="flex justify-between items-center p-6 border-b border-rose-800/30">
          <h3 className="text-xl font-bold text-rose-400 flex items-center gap-2">
            <AlertTriangle className="w-5 h-5" />
            Delete Account
          </h3>
          <button 
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="p-4 bg-rose-900/20 border border-rose-800/30 rounded-lg">
            <p className="text-rose-300 text-sm">
              This action is permanent. All your data, tasks, and suffering history will be erased. 
              There's no coming back from this.
            </p>
          </div>

          {error && (
            <div className="p-3 bg-rose-900/30 border border-rose-700 rounded-lg text-rose-200 text-sm">
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm text-gray-300 mb-2">
              Type DELETE to confirm
            </label>
            <input
              type="text"
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              placeholder="DELETE"
              className="w-full bg-gray-900 border border-gray-700 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-rose-400"
              required
            />
          </div>

          <div>
            <label className="block text-sm text-gray-300 mb-2">
              Password
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-500" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                className="w-full bg-gray-900 border border-gray-700 rounded-xl pl-10 pr-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-rose-400"
                required
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading || confirmText !== 'DELETE'}
            className="w-full mt-6 bg-gradient-to-r from-rose-600 to-rose-700 text-white font-semibold py-3 rounded-xl hover:from-rose-500 hover:to-rose-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Deleting...' : 'Permanently Delete Account'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default DeleteAccountModal;