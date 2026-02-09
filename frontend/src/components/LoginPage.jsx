import React, { useState } from 'react';
import { motion } from 'framer-motion';  
import { Skull, Sparkles } from 'lucide-react';

export function LoginPage({ onLogin }) {  // No TypeScript interface
  const [isSignup, setIsSignup] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {  // No "React.FormEvent" type
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const endpoint = isSignup ? '/api/auth/register' : '/api/auth/login';
      const response = await fetch(`http://localhost:5000${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          email, 
          password, 
          ...(isSignup && { name }) 
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Authentication failed');
      }

      if (data.token) {
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));
      }

      onLogin();
    } catch (err) {  // No ": any" type
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left Side - Tagline */}
      <motion.div
        initial={{ opacity: 0, x: -50 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.6 }}
        className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-[#1a0f2e] via-[#2d1b4e] to-[#1c1c24] p-16 flex-col justify-center relative overflow-hidden"
      >
        {/* Floating orbs */}
        <div className="absolute top-20 left-20 w-64 h-64 bg-[#ff006e] opacity-10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-20 right-20 w-80 h-80 bg-[#00d9ff] opacity-10 rounded-full blur-3xl"></div>
        
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-8">
            <Skull className="w-12 h-12 text-[#ff6b35]" />
            <h1 className="text-5xl text-white tracking-tight">
              Schrödinger's <span className="text-[#ff6b35]">GPA</span>
            </h1>
          </div>
          
          <h2 className="text-6xl text-white mb-6 leading-tight">
            Welcome back to your <span className="text-[#ff006e] italic">bad decisions</span>.
          </h2>
          
          <p className="text-2xl text-gray-300 mb-8 italic">
            "Track your suffering. Quantify your despair."
          </p>
          
          <div className="space-y-4 text-gray-400">
            <div className="flex items-start gap-3">
              <Sparkles className="w-5 h-5 text-[#00d9ff] mt-1 flex-shrink-0" />
              <p>Monitor your academic decay in real-time</p>
            </div>
            <div className="flex items-start gap-3">
              <Sparkles className="w-5 h-5 text-[#00d9ff] mt-1 flex-shrink-0" />
              <p>Receive sarcastic encouragement from our NPC mentors</p>
            </div>
            <div className="flex items-start gap-3">
              <Sparkles className="w-5 h-5 text-[#00d9ff] mt-1 flex-shrink-0" />
              <p>Visualize your procrastination patterns beautifully</p>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Right Side - Form */}
      <motion.div
        initial={{ opacity: 0, x: 50 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.6 }}
        className="flex-1 flex items-center justify-center p-8 bg-[#1c1c24]"
      >
        <div className="w-full max-w-md">
          <div className="lg:hidden mb-8">
            <div className="flex items-center gap-2 justify-center mb-4">
              <Skull className="w-8 h-8 text-[#ff6b35]" />
              <h1 className="text-3xl text-white">
                Schrödinger's <span className="text-[#ff6b35]">GPA</span>
              </h1>
            </div>
          </div>

          <div className="bg-[#23232e] border border-white/10 rounded-2xl p-8 shadow-2xl">
            <h2 className="text-3xl text-white mb-2">
              {isSignup ? 'Begin Your Downfall' : 'Return to Chaos'}
            </h2>
            <p className="text-gray-400 mb-8 italic">
              {isSignup 
                ? 'Every journey begins with denial.' 
                : 'Your deadlines missed you.'}
            </p>

            {error && (
              <div className="mb-5 p-4 bg-red-900/30 border border-red-700 rounded-lg text-red-200 text-sm text-center">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              {isSignup && (
                <div>
                  <label className="block text-sm text-gray-300 mb-2">
                    Name
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Who shall we blame?"
                    className="w-full bg-[#2a2a38] border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-[#00d9ff] focus:ring-2 focus:ring-[#00d9ff]/20 transition-all"
                    required={isSignup}
                  />
                </div>
              )}

              <div>
                <label className="block text-sm text-gray-300 mb-2">
                  Email
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your.email@regret.edu"
                  className="w-full bg-[#2a2a38] border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-[#00d9ff] focus:ring-2 focus:ring-[#00d9ff]/20 transition-all"
                  required
                />
              </div>

              <div>
                <label className="block text-sm text-gray-300 mb-2">
                  Password
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Make it strong. Unlike your willpower."
                  className="w-full bg-[#2a2a38] border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-[#00d9ff] focus:ring-2 focus:ring-[#00d9ff]/20 transition-all"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className={`w-full bg-gradient-to-r from-[#00d9ff] to-[#ff6b35] text-[#0a0a0f] py-3 rounded-xl hover:shadow-lg hover:shadow-[#00d9ff]/30 transition-all duration-300 transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed ${
                  loading ? 'animate-pulse' : ''
                }`}
              >
                {loading 
                  ? (isSignup ? 'Embracing Chaos...' : 'Facing Music...')
                  : (isSignup ? 'Embrace the Chaos' : 'Face the Music')}
              </button>
            </form>

            <div className="mt-6 text-center">
              <button
                onClick={() => setIsSignup(!isSignup)}
                className="text-sm text-gray-400 hover:text-[#00d9ff] transition-colors"
              >
                {isSignup 
                  ? 'Already suffering? Log in' 
                  : 'New victim? Sign up'}
              </button>
            </div>

            <p className="text-xs text-gray-500 text-center mt-6 italic">
              "By logging in, you acknowledge your poor life choices."
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}