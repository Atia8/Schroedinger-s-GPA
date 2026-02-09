import React, { useState, useEffect } from 'react';
import { LoginPage } from './components/LoginPage';
import Router from './router';

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) setIsLoggedIn(true);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('token');
    setIsLoggedIn(false);
  };

  // ✅ No Navbar here
  if (!isLoggedIn) {
    return <LoginPage onLogin={() => setIsLoggedIn(true)} />;
  }

  // ✅ Navbar is inside Router
  return <Router onLogout={handleLogout} />;
}

export default App;
