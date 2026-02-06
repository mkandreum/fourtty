import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Search, ChevronDown, LogOut, Bell, Flag, Image as ImageIcon, MessageSquare } from 'lucide-react';
import { ViewState, User } from '../types';
import { useAuth } from '../contexts/AuthContext';
import { useSocket } from '../contexts/SocketContext';
import { useToast } from '../contexts/ToastContext';
import api from '../api';
import PhotoUploadModal from './PhotoUploadModal';

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
  const { socket } = useSocket();
  const { showToast } = useToast();
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

  // Photo Upload Modal
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [showUploadModal, setShowUploadModal] = useState(false);

  // Notifications & Socket logic
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

    if (!socket) return;

    socket.on('notification', (data: any) => {
      console.log('🔔 New real-time notification:', data);
      showToast(data.content, 'info');
      fetchNotifications(); // Refresh list to get the new one
    });

    socket.on('new_message', (message: any) => {
      // Only show toast if not chatting with this user? 
      // For now keep it simple: refresh counts
      fetchNotifications();
    });

    return () => {
      socket.off('notification');
      socket.off('new_message');
    };
  }, [user, socket]);

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
              to="/profile/photos"
              className="flex items-center gap-1 px-1.5 md:px-3 py-1 rounded-md text-white hover:bg-white/10 transition-colors shrink-0"
              title="Mis Fotos"
            >
              <ImageIcon size={16} className="opacity-80" />
              <span className="text-[12px] font-bold hidden md:inline">Fotos</span>
            </Link>

            <Link
              to="/people"
              className="flex items-center gap-1 px-1.5 md:px-3 py-1 rounded-md text-white hover:bg-white/10 transition-colors shrink-0"
              title="Gente"
            >
              <Search size={16} className="opacity-80" />
              <span className="text-[12px] font-bold hidden md:inline">Gente</span>
            </Link>

            <Link
              to="/profile"
              className="flex items-center px-1.5 md:px-3 py-1 rounded-md text-white hover:bg-white/10 transition-colors shrink-0"
              title="Mi Perfil"
            >
              <span className="text-[12px] font-bold hidden sm:inline">Perfil</span>
              <span className="sm:hidden text-[12px] font-bold">P</span>
            </Link>

            {/* Search Bar - Compact */}
            <div className="relative mx-1 shrink-1 min-w-[50px] md:min-w-[100px]">
              <input
                type="text"
                placeholder="Buscar"
                className="w-full h-[22px] md:h-[24px] pl-2 pr-5 rounded-[2px] border-none text-[10px] md:text-[11px] text-gray-700 placeholder-gray-400 outline-none"
                style={{ backgroundColor: 'white' }}
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
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  setSelectedFile(file);
                  setShowUploadModal(true);
                  // Reset input so same file can be selected again
                  e.target.value = '';
                }}
              />
              <button
                onClick={() => document.getElementById('photo-upload')?.click()}
                className="bg-[#2B7BB9] text-white text-[10px] md:text-[11px] font-bold px-1.5 md:px-3 py-1 rounded-[3px] border border-[#1e5a8c] shadow-sm shrink-0 hover:bg-[#256ca3] active:scale-95 transition-all"
              >
                <span className="hidden sm:inline">Subir</span> ↑
              </button>

              {showUploadModal && selectedFile && (
                <PhotoUploadModal
                  file={selectedFile}
                  onClose={() => {
                    setShowUploadModal(false);
                    setSelectedFile(null);
                  }}
                  onSuccess={() => {
                    // Logic to refresh gallery if on gallery page could go here
                    // For now, just a toast is fine (handled in modal)
                  }}
                />
              )}

              {unreadNotifsCount >= 0 && (
                <button
                  onClick={() => setShowNotifs(!showNotifs)}
                  className={`${unreadNotifsCount > 0 ? 'bg-[#cc0000]' : 'bg-white/20'} text-white text-[9px] px-1 rounded-sm font-bold min-w-[20px] h-[18px] flex items-center justify-center hover:scale-110 transition-transform`}
                  title="Notificaciones"
                >
                  <Bell size={10} className="mr-0.5" />
                  {unreadNotifsCount}
                </button>
              )}

              {/* Notifications Dropdown */}
              {showNotifs && (
                <div className="absolute top-[42px] right-0 w-screen sm:w-[300px] bg-white shadow-2xl border-x sm:border border-[#ccc] sm:rounded-b-[4px] z-[100] animate-in fade-in slide-in-from-top-2 duration-200">
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
                            if (notif.type === 'comment' || notif.type === 'message') handleNavigate('/'); // Link to relevant soon
                            setShowNotifs(false);
                          }}
                          className={`p-3 border-b border-[#eee] hover:bg-[#f9fbfd] cursor-pointer flex gap-3 items-start ${!notif.read ? 'bg-[#fff9e6]' : ''}`}
                        >
                          <div className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${!notif.read ? 'bg-[#59B200]' : 'bg-transparent'}`}></div>
                          <div className="flex-1">
                            <p className="text-[12px] text-[#333] leading-tight mb-1">{notif.content}</p>
                            <span className="text-[9px] text-gray-400">{new Date(notif.createdAt).toLocaleString()}</span>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                  <div className="p-2 border-t border-[#eee] text-center">
                    <button
                      onClick={() => handleNavigate('/messages')} // Placeholder for "all notifs"
                      className="text-[10px] text-[#005599] font-bold hover:underline"
                    >
                      Ver todos los mensajes
                    </button>
                  </div>
                </div>
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