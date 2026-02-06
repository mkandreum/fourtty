import React, { useState, useEffect } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { Search, Image as ImageIcon, Bell, LogOut, User, Menu, X, UserPlus } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import api from '../api';
import PhotoUploadModal from './PhotoUploadModal';

const Header: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  // Notifications state
  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadNotifsCount, setUnreadNotifsCount] = useState(0);
  const [showNotifs, setShowNotifs] = useState(false);

  useEffect(() => {
    if (user) {
      fetchNotifications();
      // Setup interval to check notifications every minute
      const interval = setInterval(fetchNotifications, 60000);
      return () => clearInterval(interval);
    }
  }, [user]);

  const fetchNotifications = async () => {
    try {
      const res = await api.get('/notifications');
      setNotifications(res.data.notifications);
      setUnreadNotifsCount(res.data.notifications.filter((n: any) => !n.read).length);
    } catch (e) {
      console.error('Error fetching notifications:', e);
    }
  };

  const handleMarkAsRead = async (id: number) => {
    try {
      await api.put(`/notifications/${id}/read`);
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
      setUnreadNotifsCount(prev => Math.max(0, prev - 1));
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      if (searchQuery.trim()) {
        handleSearch();
      } else {
        setSearchResults([]);
      }
    }, 300);

    return () => clearTimeout(delayDebounceFn);
  }, [searchQuery]);

  const handleSearch = async () => {
    setIsSearching(true);
    try {
      const res = await api.get(`/users/search?q=${searchQuery}`);
      setSearchResults(res.data.users);
    } catch (e) {
      console.error(e);
    } finally {
      setIsSearching(false);
    }
  };

  const handleNavigate = (path: string) => {
    navigate(path);
    setShowResults(false);
    setSearchQuery('');
  };

  if (!user) return null;

  // Active link helper
  const isActive = (path: string) => location.pathname === path;

  return (
    <header className="fixed top-0 left-0 w-full h-[42px] bg-[#005599] z-50 border-b border-[#003366] shadow-sm">
      <div className="max-w-[980px] mx-auto h-full flex items-center justify-between px-2 overflow-hidden">

        {/* Left Side: Logo + Navigation */}
        <div className="flex items-center gap-2 md:gap-4 shrink-0">
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

          <nav className="flex items-center gap-0.5 md:gap-1 border-l border-white/20 pl-2 md:pl-4 overflow-x-auto no-scrollbar">
            <Link
              to="/"
              className={`flex items-center gap-1 px-1.5 md:px-3 py-1 rounded-md text-white transition-colors shrink-0 ${isActive('/') ? 'bg-white/20' : 'hover:bg-white/10'}`}
              title="Inicio"
            >
              <div className="w-5 h-5 flex items-center justify-center bg-white/10 rounded">
                <span className="text-[10px] font-bold">;)</span>
              </div>
              <span className="text-[12px] font-bold hidden md:inline">Inicio</span>
            </Link>

            <Link
              to="/profile/photos"
              className={`flex items-center gap-1 px-1.5 md:px-3 py-1 rounded-md text-white transition-colors shrink-0 ${isActive('/profile/photos') ? 'bg-white/20' : 'hover:bg-white/10'}`}
              title="Mis Fotos"
            >
              <ImageIcon size={16} className="opacity-80" />
              <span className="text-[12px] font-bold hidden lg:inline">Fotos</span>
            </Link>

            <Link
              to="/people"
              className={`flex items-center gap-1 px-1.5 md:px-3 py-1 rounded-md text-white transition-colors shrink-0 ${isActive('/people') ? 'bg-white/20' : 'hover:bg-white/10'}`}
              title="Gente"
            >
              <Search size={16} className="opacity-80" />
              <span className="text-[12px] font-bold hidden lg:inline">Gente</span>
            </Link>

            <Link
              to="/profile"
              className={`flex items-center px-1.5 md:px-3 py-1 rounded-md text-white transition-colors shrink-0 ${isActive('/profile') ? 'bg-white/20' : 'hover:bg-white/10'}`}
              title="Mi Perfil"
            >
              <User size={16} className="sm:hidden opacity-80" />
              <span className="text-[12px] font-bold hidden sm:inline">Perfil</span>
            </Link>
          </nav>
        </div>

        {/* Right Side: Search & Actions */}
        <div className="flex items-center justify-end gap-1 md:gap-2 flex-1 ml-4 overflow-hidden">
          {/* Search Bar - Compact */}
          <div className="relative shrink-1 min-w-[60px] max-w-[180px]">
            <input
              type="text"
              placeholder="Buscar"
              className="w-full h-[22px] md:h-[24px] pl-2 pr-5 rounded-[2px] border-none text-[10px] md:text-[11px] text-gray-700 placeholder-gray-400 outline-none bg-white"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setShowResults(true);
              }}
              onFocus={() => setShowResults(true)}
              onBlur={() => setTimeout(() => setShowResults(false), 200)}
            />
            <Search className="absolute right-1 top-1 md:top-1.5 w-3 h-3 text-gray-400" />

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
                      <span className="text-[11px] font-bold text-[#333] truncate">{result.name}</span>
                    </div>
                  ))
                ) : (
                  <div className="p-2 text-[10px] text-[#999]">Sin resultados</div>
                )}
              </div>
            )}
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            {/* Photo Upload */}
            <input
              type="file"
              id="photo-upload"
              className="hidden"
              accept="image/*"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (!file) return;
                setSelectedFile(file);
                setShowUploadModal(true);
                e.target.value = '';
              }}
            />
            <button
              onClick={() => document.getElementById('photo-upload')?.click()}
              className="bg-[#2B7BB9] text-white text-[10px] md:text-[11px] font-bold px-2 md:px-3 py-1 rounded-[3px] border border-[#1e5a8c] shadow-sm hover:bg-[#256ca3] active:scale-95 transition-all"
            >
              <span className="hidden sm:inline">Subir</span> ↑
            </button>

            {unreadNotifsCount >= 0 && (
              <div className="flex items-center gap-1 relative">
                <Link
                  to="/profile"
                  className="sm:hidden bg-white/20 text-white text-[9px] px-1 rounded-sm font-bold min-w-[20px] h-[18px] flex items-center justify-center"
                  title="Invitaciones"
                >
                  <UserPlus size={10} className="mr-0.5" />
                </Link>

                <button
                  onClick={() => setShowNotifs(!showNotifs)}
                  className={`${unreadNotifsCount > 0 ? 'bg-[#cc0000]' : 'bg-white/20'} text-white text-[9px] px-1 rounded-sm font-bold min-w-[20px] h-[18px] flex items-center justify-center hover:scale-110 transition-transform`}
                  title="Notificaciones"
                >
                  <Bell size={10} className="mr-0.5" />
                  {unreadNotifsCount}
                </button>

                {/* Notifications Dropdown */}
                {showNotifs && (
                  <div className="absolute top-[30px] right-0 w-[280px] bg-white shadow-2xl border border-[#ccc] rounded-b-[4px] z-[100] animate-in fade-in slide-in-from-top-2 duration-200 text-left">
                    <div className="bg-[#f2f6f9] border-b border-[#dce5ed] p-2 flex justify-between items-center">
                      <span className="text-[11px] font-bold text-[#333]">Notificaciones</span>
                      <button
                        onClick={() => setShowNotifs(false)}
                        className="text-[10px] text-[#005599] hover:underline"
                      >
                        Cerrar
                      </button>
                    </div>
                    <div className="max-h-[350px] overflow-y-auto">
                      {notifications.length === 0 ? (
                        <div className="p-8 text-center text-gray-400 text-[11px]">No tienes notificaciones</div>
                      ) : (
                        notifications.map(notif => (
                          <div
                            key={notif.id}
                            onClick={() => {
                              handleMarkAsRead(notif.id);
                              if (notif.type === 'friendship') handleNavigate(`/profile/${notif.relatedId}`);
                              if (notif.type === 'comment' || notif.type === 'message' || notif.type === 'tag') handleNavigate('/');
                              setShowNotifs(false);
                            }}
                            className={`p-2 border-b border-[#eee] hover:bg-[#f9fbfd] cursor-pointer flex gap-2 items-start ${!notif.read ? 'bg-[#fff9e6]' : ''}`}
                          >
                            <div className={`w-1.5 h-1.5 rounded-full mt-1.5 shrink-0 ${!notif.read ? 'bg-[#59B200]' : 'bg-transparent'}`}></div>
                            <div className="flex-1">
                              <p className="text-[11px] text-[#333] leading-tight mb-1">{notif.content}</p>
                              <span className="text-[8px] text-gray-400">{new Date(notif.createdAt).toLocaleString()}</span>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}

            <button
              onClick={logout}
              className="text-white text-[11px] font-bold hover:underline px-1 py-1 shrink-0"
              title="Salir"
            >
              Salir
            </button>
          </div>
        </div>
      </div>

      {showUploadModal && selectedFile && (
        <PhotoUploadModal
          file={selectedFile}
          onClose={() => {
            setShowUploadModal(false);
            setSelectedFile(null);
          }}
          onSuccess={() => { }}
        />
      )}
    </header>
  );
};

export default Header;