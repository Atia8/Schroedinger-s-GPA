import { BrowserRouter, Routes, Route } from "react-router-dom";
import Navbar from "./components/Navbar";

import Home from "./pages/HomePage";
import TasksPage from "./pages/TasksPage";

export default function Router({ onLogout }) {
  return (
    <BrowserRouter>
      <Navbar onLogout={onLogout} />

      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/tasks" element={<TasksPage />} />
      </Routes>
    </BrowserRouter>
  );
}
