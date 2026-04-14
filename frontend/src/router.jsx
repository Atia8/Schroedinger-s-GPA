import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useState, useEffect } from "react";
import Navbar from "./components/Navbar";
import Home from "./pages/HomePage";
import Dashboard from "./pages/Dashboard"; 
import TasksPage from "./pages/TasksPage";
import SettingsPage from "./pages/SettingsPage";
import { AnalyticsPage } from "./pages/AnalyticsPage";
import { LoginPage } from "./pages/LoginPage";
import NPCPortalPage from './pages/NPCPortalPage';

export default function Router() {
  // Initialize isLoggedIn from localStorage immediately, not just in useEffect
  const [isLoggedIn, setIsLoggedIn] = useState(() => {
    const token = localStorage.getItem("token");
    return !!token; // Convert to boolean
  });

  const [sarcasmLevel, setSarcasmLevel] = useState(() => {
    return localStorage.getItem("sarcasmLevel") || "brutal";
  });

  // Optional: Still use useEffect to sync if localStorage changes from another tab
  useEffect(() => {
    const checkAuth = () => {
      const token = localStorage.getItem("token");
      setIsLoggedIn(!!token);
    };

    // Check on mount (though we already did in initial state)
    checkAuth();

    // Listen for storage changes (if user logs in/out in another tab)
    window.addEventListener('storage', checkAuth);
    
    return () => {
      window.removeEventListener('storage', checkAuth);
    };
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setIsLoggedIn(false);
  };

  const handleSarcasmChange = (level) => {
    setSarcasmLevel(level);
    localStorage.setItem("sarcasmLevel", level);
  };

  return (
    <BrowserRouter>
      <Routes>
        {/* Public routes */}
        <Route 
          path="/login" 
          element={
            <LoginPage 
              onLogin={() => {
                // After login, update state
                setIsLoggedIn(true);
              }} 
            />
          } 
        />
        
        {/* Protected routes */}
        <Route
          path="/"
          element={
            isLoggedIn ? (
              <>
                <Navbar onLogout={handleLogout} />
                <Home />
              </>
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />
        
        <Route
          path="/dashboard"
          element={
            isLoggedIn ? (
              <>
                <Navbar onLogout={handleLogout} />
                <Dashboard />
              </>
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />
        
        <Route
          path="/tasks"
          element={
            isLoggedIn ? (
              <>
                <Navbar onLogout={handleLogout} />
                <TasksPage />
              </>
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />
        
        <Route
          path="/analytics"
          element={
            isLoggedIn ? (
              <>
                <Navbar onLogout={handleLogout} />
                <AnalyticsPage sarcasmLevel={sarcasmLevel} />
              </>
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />
        
        <Route
          path="/settings"
          element={
            isLoggedIn ? (
              <>
                <Navbar onLogout={handleLogout} />
                <SettingsPage
                  sarcasmLevel={sarcasmLevel}
                  onSarcasmChange={handleSarcasmChange}
                  onLogout={handleLogout}
                />
              </>
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />

        {/* NEW: NPC Portal Route */}
        <Route
          path="/npc"
          element={
            isLoggedIn ? (
              <>
                <Navbar onLogout={handleLogout} />
                <NPCPortalPage />
              </>
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />

        {/* Catch all - redirect to login or home */}
        <Route 
          path="*" 
          element={
            isLoggedIn ? 
              <Navigate to="/dashboard" replace /> : 
              <Navigate to="/login" replace />
          } 
        />
      </Routes>
    </BrowserRouter>
  );
}