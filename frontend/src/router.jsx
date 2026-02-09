import { BrowserRouter, Routes, Route } from "react-router-dom";
import Navbar from "./components/Navbar";
import Home from "./pages/HomePage";
import TasksPage from "./pages/TasksPage";
import SettingsPage from "./components/SettingsPage";

export default function Router({ onLogout, sarcasmLevel, handleSarcasmChange }) {
  return (
    <BrowserRouter>
      <Navbar onLogout={onLogout} />

      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/tasks" element={<TasksPage />} />
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
