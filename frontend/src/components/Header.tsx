import React, { useState, useEffect } from 'react';
import { Search, ChevronDown, LogOut, Bell } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { ViewState, User } from '../types';
import { useAuth } from '../contexts/AuthContext';
import api from '../api';

interface HeaderProps {
  currentView: ViewState;
  // onChangeView removed, using routing
}

interface Notification {
  id: number;
  content: string;
  read: boolean;
  createdAt: string;
  type: string; // 'friendship', 'message', 'comment'
  relatedId?: number;
}

const Header: React.FC<HeaderProps> = ({ currentView }) => {
  const { logout, user } = useAuth();
  const navigate = useNavigate();
  const [unreadMessages, setUnreadMessages] = useState(0); // For Chat
  const [showAccountMenu, setShowAccountMenu] = useState(false);

  // Search state
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<User[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showResults, setShowResults] = useState(false);

  // Notifications state
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadNotifsCount, setUnreadNotifsCount] = useState(0);
  const [showNotifs, setShowNotifs] = useState(false);

  // Poll for notifications
  useEffect(() => {
    if (!user) return;

    const fetchNotifications = async () => {
      try {
        const res = await api.get('/notifications');
        setNotifications(res.data.notifications);
        setUnreadNotifsCount(res.data.unreadCount);
      } catch (e) {
        console.error(e);
      }
    };

    fetchNotifications();
    const interval = setInterval(fetchNotifications, 10000); // Poll every 10s
    return () => clearInterval(interval);
  }, [user]);

  // Search effect
  useEffect(() => {
    const searchUsers = async () => {
      if (!searchQuery.trim()) {
        setSearchResults([]);
        return;
      }

      setIsSearching(true);
      try {
        const response = await api.get(`/users/search?q=${searchQuery}`);
        setSearchResults(response.data.users);
      } catch (error) {
        console.error("Search error:", error);
      } finally {
        setIsSearching(false);
      }
    };

    const timeoutId = setTimeout(searchUsers, 300);
    return () => clearTimeout(timeoutId);
  }, [searchQuery]);

  const handleNavigate = (path: string) => {
    navigate(path);
  };

  const handleMarkAsRead = async (notifId: number) => {
    try {
      await api.put(`/notifications/${notifId}/read`);
      setNotifications(notifications.map(n => n.id === notifId ? { ...n, read: true } : n));
      setUnreadNotifsCount(prev => Math.max(0, prev - 1));
    } catch (e) { console.error(e); }
  };

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
        <div className="flex items-center gap-2">
          <div
            className="flex items-center cursor-pointer group"
            onClick={() => handleNavigate('/')}
          >
            <span className="text-white text-[22px] font-bold tracking-tighter flex items-center gap-1 mr-2">
              <span className="text-xl">;)</span>
              twenty
              <span className="text-[8px] font-normal align-top ml-0.5 mt-[-12px] opacity-60">TM</span>
            </span>
          </div>
        </div>

        {/* Center: Search */}
        <div className="flex-1 max-w-md px-4 relative">
          <div className="relative">
            <input
              type="text"
              placeholder="Buscar gente, vídeos, juegos..."
              className="w-full h-[26px] pl-2 pr-8 rounded-[4px] border-none text-[12px] text-gray-700 focus:ring-0 placeholder-gray-400 outline-none shadow-inner"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setShowResults(true);
              }}
              onFocus={() => setShowResults(true)}
              onBlur={() => setTimeout(() => setShowResults(false), 200)} // Delay to allow click
            />
            <Search className="absolute right-2 top-1.5 w-3.5 h-3.5 text-gray-400" />

            {/* Search Results Dropdown */}
            {showResults && searchQuery.trim() && (
              <div className="absolute top-full left-0 w-full bg-white shadow-lg rounded-b-[4px] border border-[#ccc] mt-0.5 max-h-[300px] overflow-y-auto">
                {isSearching ? (
                  <div className="p-2 text-[11px] text-[#999]">Buscando...</div>
                ) : searchResults.length > 0 ? (
                  searchResults.map(result => (
                    <div
                      key={result.id}
                      className="flex items-center gap-2 p-2 hover:bg-[#f2f6f9] cursor-pointer border-b border-[#eee] last:border-0"
                      onClick={() => {
                        handleNavigate(`/profile/${result.id}`);
                        setSearchQuery(''); // Optional: clear search on nav
                      }}
                    >
                      <img
                        src={result.avatar || `https://ui-avatars.com/api/?name=${result.name}`}
                        className="w-6 h-6 rounded-[2px] object-cover"
                        alt={result.name}
                      />
                      <div className="flex flex-col">
                        <span className="text-[12px] font-bold text-[#333]">{result.name}</span>
                        {result.location && <span className="text-[10px] text-[#999]">{result.location}</span>}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="p-2 text-[11px] text-[#999]">No se encontraron resultados</div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Right: Navigation */}
        <nav className="flex items-center gap-0.5">
          <button
            className={navItemClass(ViewState.HOME)}
            onClick={() => handleNavigate('/')}
          >
            Inicio
          </button>
          <button
            className={navItemClass(ViewState.PROFILE)}
            onClick={() => handleNavigate('/profile')}
          >
            Perfil
          </button>

          <button className={navLinkClass}>
            Mensajes
            {unreadMessages > 0 &&
              <span className="bg-[#cc0000] text-white text-[9px] font-bold px-1 rounded-sm shadow-sm ml-1">{unreadMessages}</span>
            }
          </button>

          <button className={navLinkClass}>Gente</button>
          <button className={navLinkClass}>Vídeos</button>
          <button className={navLinkClass}>Juegos</button>

          {/* Search Bar - More compact like original */}
          <div className="relative mx-2">
            <input
              type="text"
              placeholder="Buscar..."
              className="w-[120px] h-[24px] pl-2 pr-6 rounded-[2px] border-none text-[11px] text-gray-700 focus:ring-0 placeholder-gray-400 outline-none"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setShowResults(true);
              }}
              onFocus={() => setShowResults(true)}
              onBlur={() => setTimeout(() => setShowResults(false), 200)}
            />
            <Search className="absolute right-1.5 top-1.5 w-3 h-3 text-gray-400" />

            {/* Notifications dot on Search or separate? Original didn't have bell, it was integrated. 
                I'll keep the bell hidden or very subtle. Let's keep it near Mi cuenta. */}

            {showResults && searchQuery.trim() && (
              <div className="absolute top-full left-0 w-[200px] bg-white shadow-lg rounded-b-[2px] border border-[#ccc] mt-0.5 max-h-[300px] overflow-y-auto">
                {isSearching ? (
                  <div className="p-2 text-[10px] text-[#999]">Buscando...</div>
                ) : searchResults.length > 0 ? (
                  searchResults.map(result => (
                    <div
                      key={result.id}
                      className="flex items-center gap-2 p-1.5 hover:bg-[#f2f6f9] cursor-pointer border-b border-[#eee] last:border-0"
                      onClick={() => handleNavigate(`/profile/${result.id}`)}
                    >
                      <img
                        src={result.avatar || `https://ui-avatars.com/api/?name=${result.name}`}
                        className="w-5 h-5 rounded-[2px] object-cover"
                        alt={result.name}
                      />
                      <span className="text-[11px] font-bold text-[#333] truncate">{result.name}</span>
                    </div>
                  ))
                ) : (
                  <div className="p-2 text-[10px] text-[#999]">No hay resultados</div>
                )}
              </div>
            )}
          </div>

          {/* Subir fotos button */}
          <button className="bg-[#2B7BB9] hover:bg-[#256ca3] text-white text-[11px] font-bold px-3 py-1 rounded-[3px] border border-[#1e5a8c] shadow-sm flex items-center gap-1 mr-4">
            Subir fotos <span className="text-[14px] mb-0.5">↑</span>
          </button>

          {/* Right most links */}
          <div className="flex items-center gap-3 text-white text-[10px] whitespace-nowrap">
            {unreadNotifsCount > 0 && (
              <button
                onClick={() => setShowNotifs(!showNotifs)}
                className="bg-[#cc0000] px-1 rounded-sm font-bold hover:scale-110 transition-transform"
              >
                {unreadNotifsCount}
              </button>
            )}
            <button onClick={() => navigate('/profile')} className="hover:underline">Mi cuenta</button>
            <button onClick={logout} className="hover:underline">Salir</button>
          </div>
        </nav>

      </div>
    </header>
  );
};

export default Header;