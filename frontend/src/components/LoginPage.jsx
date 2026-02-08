import React, { useState } from 'react';
import './LoginPage.css';

export function LoginPage({ onLogin }) {
  const [isSignup, setIsSignup] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
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
        body: JSON.stringify({ email, password, ...(isSignup && { name }) }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Authentication failed');
      }

      // Store token and user data
      if (data.token) {
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));
      }

      onLogin();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      {/* Left Side - Tagline */}
      <div className="login-left-side">
        <div className="floating-orb orb-1"></div>
        <div className="floating-orb orb-2"></div>
        
        <div className="left-content">
          <div className="title-container">
            <div className="skull-icon">💀</div>
            <h1 className="main-title">
              Academic <span className="accent-orange">Victim</span>
            </h1>
          </div>
          
          <h2 className="tagline">
            Welcome back to your <span className="accent-pink italic">bad decisions</span>.
          </h2>
          
          <p className="quote">
            "Track your suffering. Quantify your despair."
          </p>
          
          <div className="features-list">
            <div className="feature-item">
              <div className="feature-icon">✨</div>
              <p className="feature-text">Monitor your academic decay in real-time</p>
            </div>
            <div className="feature-item">
              <div className="feature-icon">✨</div>
              <p className="feature-text">Receive sarcastic encouragement from our NPC mentors</p>
            </div>
            <div className="feature-item">
              <div className="feature-icon">✨</div>
              <p className="feature-text">Visualize your procrastination patterns beautifully</p>
            </div>
          </div>
        </div>
      </div>

      {/* Right Side - Form */}
      <div className="login-right-side">
        <div className="mobile-header">
          <div className="mobile-title-container">
            <div className="mobile-skull">💀</div>
            <h1 className="mobile-title">
              Academic <span className="accent-orange">Victim</span>
            </h1>
          </div>
        </div>

        <div className="form-container">
          <h2 className="form-title">
            {isSignup ? 'Begin Your Downfall' : 'Return to Chaos'}
          </h2>
          <p className="form-subtitle">
            {isSignup 
              ? 'Every journey begins with denial.' 
              : 'Your deadlines missed you.'}
          </p>

          <form onSubmit={handleSubmit} className="login-form">
            {isSignup && (
              <div className="input-group">
                <label className="input-label">
                  Name
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Who shall we blame?"
                  className="form-input"
                  required={isSignup}
                />
              </div>
            )}

            <div className="input-group">
              <label className="input-label">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your.email@regret.edu"
                className="form-input"
                required
              />
            </div>

            <div className="input-group">
              <label className="input-label">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Make it strong. Unlike your willpower."
                className="form-input"
                required
              />
            </div>

            {error && (
              <div className="error-message">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className={`submit-button ${loading ? 'loading' : ''}`}
            >
              {loading 
                ? (isSignup ? 'Embracing Chaos...' : 'Facing Music...')
                : (isSignup ? 'Embrace the Chaos' : 'Face the Music')}
            </button>
          </form>

          <div className="toggle-container">
            <button
              onClick={() => setIsSignup(!isSignup)}
              className="toggle-button"
            >
              {isSignup 
                ? 'Already suffering? Log in' 
                : 'New victim? Sign up'}
            </button>
          </div>

          <p className="form-footer">
            "By logging in, you acknowledge your poor life choices."
          </p>
        </div>
      </div>
    </div>
  );
}