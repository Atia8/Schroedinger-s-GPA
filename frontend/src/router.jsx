import { BrowserRouter, Routes, Route } from "react-router-dom";
import Navbar from "./components/Navbar";
import Home from "./pages/HomePage";
import Dashboard from "./pages/Dashboard"; 
import TasksPage from "./pages/TasksPage";
import SettingsPage from "./components/SettingsPage";
import { AnalyticsPage } from "./pages/AnalyticsPage";


export default function Router({ onLogout, sarcasmLevel, handleSarcasmChange }) {
  return (
    <BrowserRouter>
      {/* Navbar is inside BrowserRouter so it can use Links */}
      <Navbar onLogout={onLogout} />

      <Routes>
        <Route path="/" element={<Home />} />
        
        <Route path="/dashboard" element={<Dashboard />} />
        
        <Route path="/tasks" element={<TasksPage />} />
        
        {/* Add Analytics route */}
        <Route 
          path="/analytics" 
          element={
            <AnalyticsPage 
              sarcasmLevel={sarcasmLevel}
            />
          } 
        />
        
       
     
        <Route
          path="/settings"
          element={
            <SettingsPage
              sarcasmLevel={sarcasmLevel}
              onSarcasmChange={handleSarcasmChange}
              onLogout={onLogout}
            />
          }
        />
      </Routes>
    </BrowserRouter>
  );
}