import React, { useState, useEffect } from 'react';
import { Search, ChevronDown, LogOut } from 'lucide-react';
import { ViewState } from '../types';
import { useAuth } from '../contexts/AuthContext';
import api from '../api';

interface HeaderProps {
  currentView: ViewState;
  onChangeView: (view: ViewState) => void;
}

const Header: React.FC<HeaderProps> = ({ currentView, onChangeView }) => {
  const { logout, user } = useAuth();
  const [unreadMessages, setUnreadMessages] = useState(0);
  const [showAccountMenu, setShowAccountMenu] = useState(false);

  useEffect(() => {
    // Poll for notifications/messages count
    const fetchCounts = async () => {
      try {
        // Simplified: in a real app would likely be one call or websocket
        // For now assuming we might get this later or just mock 0
        // const res = await api.get('/notifications/unread');
        // setUnreadMessages(res.data.count);
      } catch (e) {
        console.error(e);
      }
    }
    fetchCounts();
  }, []);

  const navItemClass = (view: ViewState) => `
    px-3 py-1.5 rounded-[4px] cursor-pointer text-[12px] font-bold transition-colors
    ${currentView === view ? 'bg-[#00447a] text-white shadow-inner' : 'text-white hover:bg-[#004a8c]'}
  `;

  const navLinkClass = `
    px-3 py-1.5 rounded-[4px] cursor-pointer text-[12px] font-bold text-white hover:bg-[#004a8c] transition-colors
  `;

  return (
    <header className="fixed top-0 left-0 w-full h-[42px] bg-[#005599] z-50 border-b border-[#003366] shadow-sm">
      <div className="max-w-[980px] mx-auto h-full flex items-center justify-between px-2">

        {/* Left: Logo */}
        <div className="flex items-center gap-6">
          <div
            className="flex items-center cursor-pointer group"
            onClick={() => onChangeView(ViewState.HOME)}
          >
            <span className="text-white text-2xl font-bold tracking-tighter opacity-90 group-hover:opacity-100 flex items-center gap-1">
              <span className="text-xl">;)</span>
              twenty
              <span className="text-[9px] font-normal align-top ml-0.5 mt-[-10px] opacity-60">TM</span>
            </span>
          </div>
        </div>

        {/* Center: Search */}
        <div className="flex-1 max-w-md px-4">
          <div className="relative">
            <input
              type="text"
              placeholder="Buscar gente, vídeos, juegos..."
              className="w-full h-[26px] pl-2 pr-8 rounded-[4px] border-none text-[12px] text-gray-700 focus:ring-0 placeholder-gray-400 outline-none shadow-inner"
            />
            <Search className="absolute right-2 top-1.5 w-3.5 h-3.5 text-gray-400" />
          </div>
        </div>

        {/* Right: Navigation */}
        <nav className="flex items-center gap-1">
          <button
            className={navItemClass(ViewState.HOME)}
            onClick={() => onChangeView(ViewState.HOME)}
          >
            Inicio
          </button>
          <button
            className={navItemClass(ViewState.PROFILE)}
            onClick={() => onChangeView(ViewState.PROFILE)}
          >
            Perfil
          </button>
          <button className={navLinkClass}>Gente</button>
          <button className={navLinkClass}>Vídeos</button>
          <button className={navLinkClass}>Juegos</button>

          <button className={`${navLinkClass} relative flex items-center gap-1`}>
            Mensajes
            {unreadMessages > 0 &&
              <span className="bg-[#cc0000] text-white text-[9px] font-bold px-1 rounded-sm shadow-sm">{unreadMessages}</span>
            }
          </button>

          <div className="w-[1px] h-4 bg-[#4d86b5] mx-2"></div>

          <div className="relative">
            <button
              className="flex items-center gap-1 text-white text-[11px] font-bold hover:bg-[#004a8c] px-2 py-1 rounded-[4px]"
              onClick={() => setShowAccountMenu(!showAccountMenu)}
            >
              {user?.name || 'Mi cuenta'}
              <ChevronDown size={10} />
            </button>

            {showAccountMenu && (
              <div className="absolute right-0 top-full mt-1 w-40 bg-white shadow-lg border border-gray-200 rounded py-1 z-50">
                <button
                  className="w-full text-left px-4 py-2 text-xs text-gray-700 hover:bg-gray-100 flex items-center gap-2"
                  onClick={logout}
                >
                  <LogOut size={12} /> Cerrar sesión
                </button>
              </div>
            )}
          </div>
        </nav>

      </div>
    </header>
  );
};

export default Header;