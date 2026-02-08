import React, { useState, useEffect } from 'react';
import { LoginPage } from './components/LoginPage';
import './App.css'; // Make sure you have Tailwind or your CSS set up

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  // Check if user is already logged in (token exists)
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      // Optionally verify token with backend here
      setIsLoggedIn(true);
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('token');
    setIsLoggedIn(false);
  };

  if (!isLoggedIn) {
    return <LoginPage onLogin={() => setIsLoggedIn(true)} />;
  }

  // Dashboard component (replace with your actual dashboard)
  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <div className="container mx-auto p-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-red-500">
            Academic Victim Dashboard
          </h1>
          <button
            onClick={handleLogout}
            className="px-4 py-2 bg-red-700 hover:bg-red-800 rounded-lg"
          >
            Logout
          </button>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-gray-800 p-6 rounded-lg border border-gray-700">
            <h2 className="text-xl font-bold mb-4">Your Despair Level</h2>
            <div className="text-5xl text-center mb-2">😰</div>
            <div className="text-center text-2xl font-bold">78%</div>
            <p className="text-gray-400 text-center mt-2">"Still procrastinating, I see."</p>
          </div>
          
          <div className="bg-gray-800 p-6 rounded-lg border border-gray-700">
            <h2 className="text-xl font-bold mb-4">Pending Tasks</h2>
            <ul className="space-y-3">
              <li className="flex items-center">
                <span className="w-3 h-3 bg-red-500 rounded-full mr-3"></span>
                <span>Research paper (3 days overdue)</span>
              </li>
              <li className="flex items-center">
                <span className="w-3 h-3 bg-yellow-500 rounded-full mr-3"></span>
                <span>Midterm in 2 hours</span>
              </li>
              <li className="flex items-center">
                <span className="w-3 h-3 bg-gray-500 rounded-full mr-3"></span>
                <span>Email professor back</span>
              </li>
            </ul>
          </div>
          
          <div className="bg-gray-800 p-6 rounded-lg border border-gray-700">
            <h2 className="text-xl font-bold mb-4">NPC Quote</h2>
            <div className="italic text-gray-300 mb-2">
              "At this point, I'm just here for the show."
            </div>
            <div className="text-sm text-gray-500">- Hostile Mentor</div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;