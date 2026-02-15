import React, { useState } from 'react';
import { X, Mail, Lock } from 'lucide-react';

const ChangeEmailModal = ({ isOpen, onClose, onSuccess, currentEmail }) => {
  const [newEmail, setNewEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:5000/api/users/email', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ newEmail, password })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to change email');
      }

      onSuccess(data.message);
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-800 border border-gray-700 rounded-2xl max-w-md w-full">
        <div className="flex justify-between items-center p-6 border-b border-gray-700">
          <h3 className="text-xl font-bold text-white">Change Email</h3>
          <button 
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 bg-rose-900/30 border border-rose-700 rounded-lg text-rose-200 text-sm">
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm text-gray-300 mb-2">
              Current Email
            </label>
            <input
              type="email"
              value={currentEmail}
              disabled
              className="w-full bg-gray-900/50 border border-gray-700 rounded-xl px-4 py-3 text-gray-400 cursor-not-allowed"
            />
          </div>

          <div>
            <label className="block text-sm text-gray-300 mb-2">
              New Email
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-500" />
              <input
                type="email"
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                placeholder="new.email@regret.edu"
                className="w-full bg-gray-900 border border-gray-700 rounded-xl pl-10 pr-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-cyan-400"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm text-gray-300 mb-2">
              Password (to confirm)
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-500" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                className="w-full bg-gray-900 border border-gray-700 rounded-xl pl-10 pr-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-cyan-400"
                required
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-6 bg-gradient-to-r from-cyan-500 to-cyan-600 text-gray-900 font-semibold py-3 rounded-xl hover:from-cyan-400 hover:to-cyan-500 transition-all disabled:opacity-50"
          >
            {loading ? 'Changing...' : 'Change Email'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default ChangeEmailModal;