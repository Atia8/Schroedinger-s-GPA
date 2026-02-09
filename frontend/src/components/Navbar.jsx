// import { Link, useLocation, useNavigate } from 'react-router-dom';
// import { LayoutDashboard, CheckSquare, MessageSquare, BarChart3, Settings, LogOut, Skull } from 'lucide-react';

// export default function Navbar({ onLogout }) {
//   const location = useLocation();
//   const navigate = useNavigate();
  
//   const navItems = [
//     { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
//     { path: '/tasks', label: 'Tasks', icon: CheckSquare },
//     { path: '/npc', label: 'NPC Commentary', icon: MessageSquare },
//     { path: '/analytics', label: 'Analytics', icon: BarChart3 },
//     { path: '/settings', label: 'Settings', icon: Settings },
//   ];

//   return (
//     <nav className="border-b border-white/10 bg-despair-black/95 backdrop-blur-xl sticky top-0 z-50">
//       <div className="max-w-7xl mx-auto px-6">
//         <div className="flex items-center justify-between h-16">
          
//           {/* Logo Section - The "Unhinged" Brand */}
//           <Link to="/dashboard" className="flex items-center gap-3 group">
//             <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-panic-orange to-red-600 flex items-center justify-center shadow-lg shadow-orange-500/20 group-hover:shadow-orange-500/40 transition-all">
//               <Skull className="text-white w-6 h-6 animate-pulse" />
//             </div>
//             <div className="flex flex-col">
//               <span className="text-xl font-bold bg-gradient-to-r from-panic-orange to-caffeine-yellow bg-clip-text text-transparent">
//                 Schrödinger's GPA
//               </span>
//               <span className="text-[10px] text-gray-500 uppercase tracking-widest leading-none group-hover:text-gray-300 transition-colors">
//                 Academic Victim Unit
//               </span>
//             </div>
//           </Link>
          
//           {/* Navigation Items */}
//           <div className="flex items-center gap-1">
//             {navItems.map((item) => {
//               const Icon = item.icon;
//               const isActive = location.pathname === item.path;
              
//               return (
//                 <Link
//                   key={item.path}
//                   to={item.path}
//                   className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all border border-transparent ${
//                     isActive
//                       ? 'bg-panic-orange/10 text-panic-orange border-panic-orange/20 shadow-[0_0_10px_rgba(255,87,51,0.1)]'
//                       : 'text-gray-400 hover:text-white hover:bg-white/5'
//                   }`}
//                 >
//                   <Icon size={18} />
//                   <span className="hidden md:inline font-medium">{item.label}</span>
//                 </Link>
//               );
//             })}
            
//             {/* Divider */}
//             <div className="w-px h-6 bg-gray-700 mx-2"></div>

//             {/* Logout Button */}
//             <button
//               onClick={onLogout}
//               className="flex items-center gap-2 px-4 py-2 rounded-lg transition-all text-gray-400 hover:text-red-500 hover:bg-red-500/10 group"
//               title="Escape the Void"
//             >
//               <LogOut size={18} className="group-hover:rotate-90 transition-transform" />
//               <span className="hidden md:inline">Escape</span>
//             </button>
//           </div>
//         </div>
//       </div>
//     </nav>
//   );
// }




import { Link, useLocation, useNavigate } from 'react-router';
import { LayoutDashboard, CheckSquare, MessageSquare, BarChart3, Settings, LogOut } from 'lucide-react';

export default function Navbar({ onLogout }) {
  const location = useLocation();
  const navigate = useNavigate();
  
  const navItems = [
    { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { path: '/tasks', label: 'Tasks', icon: CheckSquare },
    { path: '/npc', label: 'NPC Commentary', icon: MessageSquare },
    { path: '/analytics', label: 'Analytics', icon: BarChart3 },
    { path: '/settings', label: 'Settings', icon: Settings },
  ];

  // const handleLogout = () => {
  //   navigate('/');
  // };
  
  return (
    <nav className="border-b border-white/10 bg-[#0f0f18]/80 backdrop-blur-xl sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-6">
        <div className="flex items-center justify-between h-16">
          <Link to="/dashboard" className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#00d4ff] to-[#9d4edd] flex items-center justify-center">
              <span className="text-lg">📊</span>
            </div>
            <span className="text-xl font-bold bg-gradient-to-r from-[#00d4ff] to-[#9d4edd] bg-clip-text text-transparent">
              Schrödinger's GPA
            </span>
          </Link>
          
          <div className="flex items-center gap-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;
              
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${
                    isActive
                      ? 'bg-[#00d4ff]/10 text-[#00d4ff]'
                      : 'text-gray-400 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <Icon size={18} />
                  <span className="hidden md:inline">{item.label}</span>
                </Link>
              );
            })}
            
            <button
              onClick={onLogout}
              className="flex items-center gap-2 px-4 py-2 rounded-lg transition-all text-[#ff6b35] hover:bg-[#ff6b35]/10 ml-2"
              title="Logout"
            >
              <LogOut size={18} />
              <span className="hidden md:inline">Logout</span>
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
}