import { useState, useEffect } from "react";
import { LoginPage } from "./pages/LoginPage";
import Router from "./router";

export default function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [sarcasmLevel, setSarcasmLevel] = useState(() => {
    return localStorage.getItem("sarcasmLevel") || "brutal";
  });

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) setIsLoggedIn(true);
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

  if (!isLoggedIn) {
    return <LoginPage onLogin={() => setIsLoggedIn(true)} />;
  }

  return (
    <Router
      onLogout={handleLogout}
      sarcasmLevel={sarcasmLevel}
      handleSarcasmChange={handleSarcasmChange}
    />
  );
}
