import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Search, ChevronDown, LogOut, Bell, Flag } from 'lucide-react';
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
      <div className="max-w-[980px] mx-auto h-full flex items-center justify-between px-2 overflow-hidden">

        {/* Left: Logo */}
        <div className="flex items-center gap-1 shrink-0">
          <div
            className="flex items-center cursor-pointer group"
            onClick={() => handleNavigate('/')}
          >
            <span className="text-white text-[18px] md:text-[22px] font-bold tracking-tighter flex items-center gap-0.5 mr-1 md:mr-2">
              <span className="text-lg md:text-xl">;)</span>
              twenty
              <span className="text-[7px] md:text-[8px] font-normal align-top ml-0.5 mt-[-8px] md:mt-[-12px] opacity-60">TM</span>
            </span>
          </div>
        </div>

        {/* Center/Right: Nav & Controls */}
        <nav className="flex flex-1 items-center justify-end gap-0.5 md:gap-1 overflow-hidden">
          <div className="flex items-center gap-0.5 md:gap-1">
            <Link
              to="/"
              className="flex items-center gap-1 px-1.5 md:px-3 py-1 rounded-md text-white hover:bg-white/10 transition-colors shrink-0"
              title="Inicio"
            >
              <div className="w-5 h-5 flex items-center justify-center bg-white/10 rounded">
                <span className="text-[10px] font-bold">;)</span>
              </div>
              <span className="text-[12px] font-bold hidden sm:inline">Inicio</span>
            </Link>

            <Link
              to="/pages"
              className="flex items-center gap-1 px-1.5 md:px-3 py-1 rounded-md text-white hover:bg-white/10 transition-colors shrink-0"
              title="Páginas"
            >
              <Flag size={16} className="opacity-80" />
              <span className="text-[12px] font-bold hidden md:inline">Páginas</span>
            </Link>

            <Link
              to="/profile"
              className="flex items-center px-1.5 md:px-3 py-1 rounded-md text-white hover:bg-white/10 transition-colors shrink-0"
              title="Mi Perfil"
            >
              <span className="text-[12px] font-bold hidden sm:inline">Perfil</span>
              <span className="sm:hidden text-[12px] font-bold">P</span>
            </Link>

            <Link
              to="/messages"
              className="flex items-center px-1.5 md:px-3 py-1 rounded-md text-white hover:bg-white/10 transition-colors shrink-0 relative"
              title="Mensajes"
            >
              <span className="text-[12px] font-bold hidden sm:inline">Mensajes</span>
              <span className="sm:hidden text-[12px] font-bold">M</span>
              {unreadMessages > 0 &&
                <span className="absolute top-0 right-0 bg-[#cc0000] text-white text-[8px] font-bold px-1 rounded-full shadow-sm">
                  {unreadMessages}
                </span>
              }
            </Link>

            {/* Search Bar - Compact */}
            <div className="relative mx-1 shrink-1 min-w-[50px] md:min-w-[100px]">
              <input
                type="text"
                placeholder="Buscar"
                className="w-full h-[22px] md:h-[24px] pl-2 pr-5 rounded-[2px] border-none text-[10px] md:text-[11px] text-gray-700 placeholder-gray-400 outline-none"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setShowResults(true);
                }}
                onFocus={() => setShowResults(true)}
                onBlur={() => setTimeout(() => setShowResults(false), 200)}
              />
              <Search className="absolute right-1 top-1.5 w-3 h-3 text-gray-400" />

              {showResults && searchQuery.trim() && (
                <div className="absolute top-full right-0 w-[160px] md:w-[200px] bg-white shadow-xl rounded-b-[2px] border border-[#ccc] mt-0.5 max-h-[250px] overflow-y-auto z-[60]">
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
                        <span className="text-[10px] font-bold text-[#333] truncate">{result.name}</span>
                      </div>
                    ))
                  ) : (
                    <div className="p-2 text-[10px] text-[#999]">Sin resultados</div>
                  )}
                </div>
              )}
            </div>

            <div className="flex items-center gap-1.5 ml-1">
              {/* Photo Upload - Icon only on mobile */}
              <input
                type="file"
                id="photo-upload"
                className="hidden"
                accept="image/*"
                onChange={async (e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  const formData = new FormData();
                  formData.append('image', file);
                  try {
                    await api.post('/photos', formData);
                    alert('¡Foto subida!');
                  } catch (err) {
                    alert('Error al subir');
                  }
                }}
              />
              <button
                onClick={() => document.getElementById('photo-upload')?.click()}
                className="bg-[#2B7BB9] text-white text-[10px] md:text-[11px] font-bold px-1.5 md:px-3 py-1 rounded-[3px] border border-[#1e5a8c] shadow-sm shrink-0"
              >
                <span className="hidden sm:inline">Subir</span> ↑
              </button>

              {unreadNotifsCount > 0 && (
                <button
                  onClick={() => setShowNotifs(!showNotifs)}
                  className="bg-[#cc0000] text-white text-[9px] px-1 rounded-sm font-bold min-w-[16px]"
                >
                  {unreadNotifsCount}
                </button>
              )}

              <button
                onClick={logout}
                className="text-white text-[11px] font-bold hover:underline px-1 py-1"
                title="Salir"
              >
                Salir
              </button>
            </div>
          </div>
        </nav>

      </div>
    </header>
  );
};

export default Header;