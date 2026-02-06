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
        <div className="flex items-center gap-6">
          <div
            className="flex items-center cursor-pointer group"
            onClick={() => handleNavigate('/')}
          >
            <span className="text-white text-2xl font-bold tracking-tighter opacity-90 group-hover:opacity-100 flex items-center gap-1">
              <span className="text-xl">;)</span>
              twenty
              <span className="text-[9px] font-normal align-top ml-0.5 mt-[-10px] opacity-60">TM</span>
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
        <nav className="flex items-center gap-1">
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

          {/* Notifications Bell */}
          <div className="relative">
            <button
              className={`${navLinkClass} flex items-center gap-1`}
              onClick={() => setShowNotifs(!showNotifs)}
            >
              <Bell size={14} />
              {unreadNotifsCount > 0 &&
                <span className="bg-[#cc0000] text-white text-[9px] font-bold px-1 rounded-sm shadow-sm">{unreadNotifsCount}</span>
              }
            </button>

            {showNotifs && (
              <div className="absolute right-0 top-full mt-1 w-[250px] bg-white shadow-lg border border-[#ccc] rounded-[4px] z-50 max-h-[300px] overflow-y-auto">
                <div className="p-2 border-b border-[#eee] text-[11px] font-bold text-[#666] bg-[#f9f9f9]">
                  Notificaciones
                </div>
                {notifications.length > 0 ? (
                  notifications.map(notif => (
                    <div
                      key={notif.id}
                      className={`p-2 border-b border-[#eee] text-[11px] cursor-pointer ${notif.read ? 'bg-white' : 'bg-[#eef4f9]'}`}
                      onClick={() => handleMarkAsRead(notif.id)}
                    >
                      <div className="text-[#333]">{notif.content}</div>
                      <div className="text-[9px] text-[#999] mt-1">{new Date(notif.createdAt).toLocaleDateString()}</div>
                    </div>
                  ))
                ) : (
                  <div className="p-4 text-center text-[10px] text-[#999]">No hay notificaciones</div>
                )}
              </div>
            )}
          </div>

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