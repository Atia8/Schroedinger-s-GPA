import React, { useState, useEffect } from 'react';
import { LoginPage } from './components/LoginPage';
import SettingsPage from './components/SettingsPage';

export default function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [sarcasmLevel, setSarcasmLevel] = useState(() => {
    return localStorage.getItem('sarcasmLevel') || 'brutal';
  });

  // Check if user is already logged in
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      setIsLoggedIn(true);
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setIsLoggedIn(false);
  };

  const handleSarcasmChange = (level) => {
    setSarcasmLevel(level);
    localStorage.setItem('sarcasmLevel', level);
  };

  if (!isLoggedIn) {
    return <LoginPage onLogin={() => setIsLoggedIn(true)} />;
  }

  return (
    <SettingsPage 
      sarcasmLevel={sarcasmLevel} 
      onSarcasmChange={handleSarcasmChange}
      onLogout={handleLogout}
    />
  );
}