import React, { useState, useEffect } from 'react';
import ProfilePictureUpload from './ProfilePictureUpload';
import { Settings, User, Bell, Volume2, LogOut, Mail, Key, Download, Trash2, Sparkles } from 'lucide-react';

const SettingsPage = ({ sarcasmLevel = 'brutal', onSarcasmChange = () => {}, onLogout = () => {} }) => {
  // Load from localStorage or use defaults
  const [notificationsEnabled, setNotificationsEnabled] = useState(() => {
    const saved = localStorage.getItem('notificationsEnabled');
    return saved !== null ? JSON.parse(saved) : true;
  });

  const [soundEnabled, setSoundEnabled] = useState(() => {
    const saved = localStorage.getItem('soundEnabled');
    return saved !== null ? JSON.parse(saved) : false;
  });

  const [username, setUsername] = useState(() => {
    return localStorage.getItem('username') || 'Suffering Student';
  });

  const [email] = useState('your.email@regret.edu');
  const [profileImage, setProfileImage] = useState(() => {
    return localStorage.getItem('profileImage') || null;
  });

  const sarcasmOptions = [
    {
      id: 'mild',
      title: 'Mild Roast',
      description: 'Gentle nudges with a hint of sass',
      preview: '"Consider starting soon. Time is a concept."',
      color: 'text-emerald-400'
    },
    {
      id: 'brutal',
      title: 'Brutal Honesty',
      description: 'Direct and unapologetic truth bombs',
      preview: '"Still procrastinating? Shocking."',
      color: 'text-amber-400'
    },
    {
      id: 'damage',
      title: 'Emotional Damage',
      description: 'Maximum sarcasm. Not for the faint of heart.',
      preview: '"At this point just drop out."',
      color: 'text-rose-400'
    }
  ];

  const currentSarcasm = sarcasmOptions.find(opt => opt.id === sarcasmLevel) || sarcasmOptions[1];

  // Save to localStorage when state changes
  useEffect(() => {
    localStorage.setItem('notificationsEnabled', JSON.stringify(notificationsEnabled));
  }, [notificationsEnabled]);

  useEffect(() => {
    localStorage.setItem('soundEnabled', JSON.stringify(soundEnabled));
  }, [soundEnabled]);

  useEffect(() => {
    localStorage.setItem('username', username);
  }, [username]);

  const handleProfileUpdate = (imageUrl) => {
    setProfileImage(imageUrl);
    if (imageUrl) {
      localStorage.setItem('profileImage', imageUrl);
    } else {
      localStorage.removeItem('profileImage');
    }
  };

  const handleUpdateProfile = () => {
    alert(`Username updated to: ${username}`);
  };

  const handleChangeEmail = () => {
    alert('Change Email clicked - This would open a modal or redirect');
  };

  const handleChangePassword = () => {
    alert('Change Password clicked - This would open a modal or redirect');
  };

  const handleExportData = () => {
    alert('Export Data clicked - This would generate and download a file');
  };

  const handleDeleteAccount = () => {
    const confirmDelete = window.confirm('Are you sure you want to delete your account? This action cannot be undone.');
    if (confirmDelete) {
      alert('Account deletion initiated - This would call an API');
    }
  };

  const handleRefreshPreview = () => {
    alert('Preview refreshed - Settings applied');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-950 to-black text-gray-100 font-sans">
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Header */}
        <header className="mb-10">
          
          <div className="mb-8">
            <p className="text-gray-400">
              Customize your suffering experience.
            </p>
          </div>
          <div className="h-px bg-gradient-to-r from-transparent via-gray-700 to-transparent"></div>
        </header>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Left Column - Profile Section */}
          <div className="lg:col-span-2 space-y-8">
            {/* Profile Section */}
            <section className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-2xl p-6">
              <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
                <User className="w-5 h-5 text-cyan-400" />
                Your Despair Profile
              </h3>
              
              <div className="flex flex-col lg:flex-row gap-8">
                {/* Profile Picture */}
                <div className="lg:w-1/3">
                  <div className="mb-4">
                    <label className="block text-sm text-gray-300 mb-2">
                      Profile Picture
                    </label>
                    <ProfilePictureUpload 
                      currentImage={profileImage}
                      onImageUpdate={handleProfileUpdate}
                    />
                    <p className="text-xs text-gray-500 mt-2 text-center">
                      Click to upload profile picture
                    </p>
                  </div>
                </div>
                
                {/* Profile Info */}
                <div className="lg:w-2/3 space-y-6">
                  <div>
                    <label className="block text-sm text-gray-300 mb-2">
                      Your suffering alias
                    </label>
                    <div className="text-sm text-gray-400 mb-3">
                      Current: <span className="text-cyan-300 font-medium">{username}</span>
                    </div>
                    <div className="flex gap-3">
                      <input
                        type="text"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        placeholder="Enter new suffering alias"
                        className="flex-1 bg-gray-900 border border-gray-700 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/20"
                      />
                      <button 
                        onClick={handleUpdateProfile}
                        className="px-6 bg-gradient-to-r from-cyan-500 to-cyan-600 text-gray-900 font-semibold rounded-xl hover:from-cyan-400 hover:to-cyan-500 transition-all"
                      >
                        Update
                      </button>
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm text-gray-300 mb-4">
                      Current level of academic suffering
                    </label>
                    <div className="flex items-center gap-4">
                      <div className="flex-1 h-3 bg-gray-900 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-gradient-to-r from-cyan-400 to-orange-400 rounded-full"
                          style={{ width: '75%' }}
                        ></div>
                      </div>
                      <span className="text-2xl font-bold text-orange-400 min-w-[4rem]">75%</span>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* Roast Settings */}
            <section className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-2xl p-6">
              <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-amber-400" />
                Roast Settings
              </h3>
              
              <div className="space-y-4 mb-8">
                {sarcasmOptions.map((option) => (
                  <div 
                    key={option.id}
                    onClick={() => onSarcasmChange(option.id)}
                    className={`p-4 rounded-xl border-2 cursor-pointer transition-all hover:scale-[1.02] ${
                      sarcasmLevel === option.id 
                        ? 'border-amber-400 bg-amber-400/10' 
                        : 'border-gray-700 bg-gray-900/50 hover:border-gray-600'
                    }`}
                  >
                    <div className="flex items-start gap-4">
                      <div className={`text-2xl ${sarcasmLevel === option.id ? 'text-amber-400' : 'text-gray-600'}`}>
                        {sarcasmLevel === option.id ? '✓' : '○'}
                      </div>
                      <div className="flex-1">
                        <h4 className={`font-bold text-lg ${option.color} mb-1`}>
                          {option.title}
                        </h4>
                        <p className="text-gray-400 text-sm mb-3">
                          {option.description}
                        </p>
                        <blockquote className="text-gray-300 italic text-sm pl-4 border-l-2 border-gray-600">
                          {option.preview}
                        </blockquote>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Live Preview */}
              <div className="bg-gradient-to-br from-purple-900/30 to-gray-900/50 border border-purple-700/30 rounded-xl p-6">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-3 h-3 bg-cyan-400 rounded-full animate-pulse"></div>
                  <span className="text-sm font-bold text-cyan-300">LIVE PREVIEW</span>
                </div>
                
                <div className="mb-6">
                  <p className="text-gray-400 text-sm mb-3">
                    <span className="font-medium text-gray-300">Current Mode:</span> {currentSarcasm.title}
                  </p>
                  <div className="p-4 bg-black/40 rounded-lg border-l-4 border-cyan-400">
                    <p className="text-gray-300 italic">{currentSarcasm.preview}</p>
                  </div>
                </div>
                
                <div className="text-center">
                  <p className="text-gray-500 text-sm mb-4">
                    To see your latest changes, refresh your preview
                  </p>
                  <button 
                    onClick={handleRefreshPreview}
                    className="px-6 py-2 bg-gray-800 border border-gray-700 rounded-lg hover:bg-gray-700 transition-all"
                  >
                    Refresh
                  </button>
                </div>
              </div>
            </section>
          </div>

          {/* Right Column */}
          <div className="space-y-8">
            {/* Notifications */}
            <section className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-2xl p-6">
              <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
                <Bell className="w-5 h-5 text-emerald-400" />
                Notifications
              </h3>
              
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium text-gray-200 mb-1">Enable Notifications</h4>
                    <p className="text-sm text-gray-400">Get reminded of your failures in real-time</p>
                  </div>
                  <button
                    onClick={() => setNotificationsEnabled(!notificationsEnabled)}
                    className={`w-14 h-7 flex items-center rounded-full p-1 transition-all ${
                      notificationsEnabled ? 'bg-emerald-500 justify-end' : 'bg-gray-700 justify-start'
                    }`}
                  >
                    <div className="w-5 h-5 bg-white rounded-full"></div>
                  </button>
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium text-gray-200 mb-1">Sound Effects</h4>
                    <p className="text-sm text-gray-400">Audible disappointment with each task</p>
                  </div>
                  <button
                    onClick={() => setSoundEnabled(!soundEnabled)}
                    className={`w-14 h-7 flex items-center rounded-full p-1 transition-all ${
                      soundEnabled ? 'bg-emerald-500 justify-end' : 'bg-gray-700 justify-start'
                    }`}
                  >
                    <div className="w-5 h-5 bg-white rounded-full"></div>
                  </button>
                </div>
              </div>
            </section>

            {/* Account & Privacy */}
            <section className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-2xl p-6">
              <h3 className="text-xl font-bold mb-6">Account & Privacy</h3>
              
              <div className="space-y-4">
                <button
                  onClick={handleChangeEmail}
                  className="w-full p-4 text-left bg-gray-900/50 rounded-xl border border-gray-700 hover:border-cyan-400/50 hover:bg-gray-800/50 transition-all group"
                >
                  <div className="flex items-center gap-3 mb-1">
                    <Mail className="w-5 h-5 text-gray-400 group-hover:text-cyan-400" />
                    <h4 className="font-medium">Change Email</h4>
                  </div>
                  <p className="text-sm text-gray-500 pl-8">{email}</p>
                </button>
                
                <button
                  onClick={handleChangePassword}
                  className="w-full p-4 text-left bg-gray-900/50 rounded-xl border border-gray-700 hover:border-amber-400/50 hover:bg-gray-800/50 transition-all group"
                >
                  <div className="flex items-center gap-3 mb-1">
                    <Key className="w-5 h-5 text-gray-400 group-hover:text-amber-400" />
                    <h4 className="font-medium">Change Password</h4>
                  </div>
                  <p className="text-sm text-gray-500 pl-8">Last changed: Never (risky)</p>
                </button>
                
                <button
                  onClick={handleExportData}
                  className="w-full p-4 text-left bg-gray-900/50 rounded-xl border border-gray-700 hover:border-emerald-400/50 hover:bg-gray-800/50 transition-all group"
                >
                  <div className="flex items-center gap-3 mb-1">
                    <Download className="w-5 h-5 text-gray-400 group-hover:text-emerald-400" />
                    <h4 className="font-medium">Export Data</h4>
                  </div>
                  <p className="text-sm text-gray-500 pl-8">Download your history of poor decisions</p>
                </button>
                
                <button
                  onClick={handleDeleteAccount}
                  className="w-full p-4 text-left bg-rose-900/20 rounded-xl border border-rose-800/50 hover:border-rose-600 hover:bg-rose-900/30 transition-all group"
                >
                  <div className="flex items-center gap-3 mb-1">
                    <Trash2 className="w-5 h-5 text-rose-400" />
                    <h4 className="font-medium text-rose-400">Delete Account</h4>
                  </div>
                  <p className="text-sm text-rose-300/80 pl-8">Escape the suffering (you'll be back)</p>
                </button>
              </div>
            </section>

            {/* About */}
            <section className="bg-gradient-to-br from-purple-900/20 to-gray-900/30 border border-purple-700/30 rounded-2xl p-6">
              <h3 className="text-xl font-bold mb-4">About</h3>
              
              <div>
                <h4 className="font-bold text-lg mb-2">Academic Victim Tracker v1.0</h4>
                <p className="text-gray-400 italic">
                  "Helping students quantify their chaos since 2024"
                </p>
              </div>
            </section>

            {/* Logout */}
            <button
              onClick={onLogout}
              className="w-full p-4 bg-gradient-to-r from-rose-600 to-rose-700 text-white font-semibold rounded-xl hover:from-rose-500 hover:to-rose-600 transition-all flex items-center justify-center gap-3"
            >
              <LogOut className="w-5 h-5" />
              Logout
            </button>
            
            <p className="text-xs text-gray-500 text-center italic">
              End your suffering session
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;