import React, { useState, useEffect } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { Search, Image as ImageIcon, Bell, LogOut, User, Menu, X, UserPlus, Mail, MessageCircle, Tag, Camera } from 'lucide-react';
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

  const handleDeleteNotification = async (id: number) => {
    try {
      await api.delete(`/notifications/${id}`);
      setNotifications(prev => prev.filter(n => n.id !== id));
      setUnreadNotifsCount(prev => Math.max(0, prev - 1));
    } catch (e) {
      console.error('Error deleting notification:', e);
    }
  };

  const handleDeleteAllNotifications = async () => {
    if (!confirm('¿Seguro que quieres borrar todas las notificaciones?')) return;
    try {
      await api.delete('/notifications');
      setNotifications([]);
      setUnreadNotifsCount(0);
    } catch (e) {
      console.error('Error deleting all notifications:', e);
    }
  };

  const handleGroupAction = async (type: string) => {
    // Find notification IDs of this type
    const relatedNotifs = notifications.filter(n => {
      if (type === 'friendships') return n.type === 'friendship';
      if (type === 'tags') return ['tag', 'tag_photo'].includes(n.type);
      if (type === 'comments') return ['comment', 'comment_photo', 'comment_post', 'tag'].includes(n.type);
      if (type === 'messages') return n.type === 'message';
      return false;
    });

    // Delete them all
    for (const notif of relatedNotifs) {
      await handleDeleteNotification(notif.id);
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
    <header className="fixed top-0 left-0 w-full h-[60px] glass z-50 border-b border-white/20 transition-smooth">
      <div className="max-w-[980px] mx-auto h-full flex items-center justify-between px-2">

        {/* Left Side: Logo + Navigation */}
        <div className="flex items-center gap-2 md:gap-4 shrink-0">
          <div
            className="flex items-center cursor-pointer group"
            onClick={() => handleNavigate('/')}
          >
            <div className="bg-white/20 p-1.5 rounded-md group-hover:bg-[#59B200] transition-smooth rotate-[-5deg] group-hover:rotate-0 shadow-sm mr-2 transition-all">
              <ImageIcon size={20} className="text-white" />
            </div>
            <span className="text-white text-[18px] md:text-[22px] font-black tracking-tighter drop-shadow-md">
              twentty
              <span className="text-[7px] md:text-[8px] font-normal align-top ml-0.5 mt-[-12px] opacity-60">TM</span>
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
        <div className="flex items-center justify-end gap-1 md:gap-2 flex-1 ml-4">
          {/* Search Bar - Compact - Hidden on mobile */}
          <div className="relative shrink-1 min-w-[60px] max-w-[180px] hidden md:block">
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
                        src={result.avatar || `/api/proxy/avatar?name=${encodeURIComponent(result.name)}`}
                        className="w-5 h-5 rounded-[2px] object-cover"
                        alt={result.name}
                      />
                      <span className="text-[11px] font-bold text-[#333] truncate">{result.name} {result.lastName}</span>
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
              className="bg-[#2B7BB9] text-white text-[10px] md:text-[11px] font-bold px-2 md:px-3 py-1 rounded-[3px] border border-[#1e5a8c] shadow-sm hover:bg-[#256ca3] active:scale-95 transition-all flex items-center gap-1"
            >
              <span>Subir</span>
              <Camera size={14} />
            </button>

            {unreadNotifsCount >= 0 && (
              <div className="flex items-center gap-1 relative">
                {/* Removed UserPlus icon as it is now in Feed/Home */}

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
                  <div className="absolute top-[35px] right-0 w-[300px] md:w-[340px] bg-white/95 backdrop-blur-md shadow-[0_8px_32px_rgba(0,0,0,0.2)] border border-white/20 rounded-[4px] z-[100] animate-in fade-in slide-in-from-top-2 duration-300 text-left overflow-hidden ring-1 ring-black/5">
                    <div className="bg-[#005599] text-white p-3 flex justify-between items-center">
                      <div className="flex items-center gap-2">
                        <Bell size={14} className="animate-pulse" />
                        <span className="text-[12px] font-bold tracking-tight">Centro de Notificaciones</span>
                      </div>
                      <button
                        onClick={() => setShowNotifs(false)}
                        className="text-white/80 hover:text-white transition-colors"
                      >
                        <X size={16} />
                      </button>
                    </div>

                    <div className="max-h-[500px] overflow-y-auto no-scrollbar p-3 bg-white">
                      {unreadNotifsCount === 0 ? (
                        <div className="py-12 px-6 text-center text-gray-400">
                          <Bell size={32} className="opacity-10 mx-auto mb-2" />
                          <p className="text-[11px] font-medium">No tienes notificaciones nuevas</p>
                        </div>
                      ) : (() => {
                        const unread = notifications.filter(n => !n.read);
                        const groups = {
                          messages: unread.filter(n => n.type === 'message'),
                          friendships: unread.filter(n => n.type === 'friendship'),
                          comments: unread.filter(n => ['comment', 'comment_photo', 'comment_post', 'tag'].includes(n.type)),
                          tags: unread.filter(n => ['tag', 'tag_photo'].includes(n.type)),
                        };

                        const items = [
                          { key: 'messages', label: 'mensajes privados', icon: <Mail size={16} />, count: groups.messages.length },
                          { key: 'friendships', label: 'peticiones de amistad', icon: <UserPlus size={16} />, count: groups.friendships.length },
                          { key: 'comments', label: 'comentarios y menciones', icon: <MessageCircle size={16} />, count: groups.comments.length },
                          { key: 'tags', label: 'etiquetas', icon: <Tag size={16} />, count: groups.tags.length, thumbnails: groups.tags.slice(0, 5) },
                        ].filter(item => item.count > 0);

                        return (
                          <div className="flex flex-col gap-3">
                            {items.map(item => (
                              <div key={item.key} className="flex flex-col gap-2">
                                <div
                                  className="flex items-center gap-2 group cursor-pointer"
                                  onClick={() => {
                                    handleGroupAction(item.key);
                                    if (item.key === 'friendships') handleNavigate('/people');
                                    else if (item.key === 'tags') handleNavigate('/profile/photos');
                                    else handleNavigate('/');
                                    setShowNotifs(false);
                                  }}
                                >
                                  <div className="text-[#59B200]">
                                    {item.icon}
                                  </div>
                                  <span className="text-[13px] font-bold text-[#59B200] group-hover:underline">
                                    {item.count} {item.label}
                                  </span>
                                </div>
                                {item.key === 'tags' && item.thumbnails && (
                                  <div className="flex gap-1.5 pl-6">
                                    {item.thumbnails.map(t => (
                                      <div
                                        key={t.id}
                                        className="w-10 h-10 border border-[#ccc] p-[1px] bg-white cursor-pointer hover:border-[#59B200]"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          handleDeleteNotification(t.id);
                                          handleNavigate('/profile/photos');
                                          setShowNotifs(false);
                                        }}
                                      >
                                        <div className="w-full h-full bg-gray-100 flex items-center justify-center overflow-hidden">
                                          <ImageIcon size={14} className="text-gray-300" />
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </div>
                            ))}
                            {notifications.length > 0 && (
                              <button
                                onClick={handleDeleteAllNotifications}
                                className="mt-4 text-[10px] text-red-500 hover:text-red-700 font-bold text-center border-t border-gray-100 pt-3 flex items-center justify-center gap-1 w-full"
                              >
                                <X size={12} /> Borrar todas las notificaciones
                              </button>
                            )}
                          </div>
                        );
                      })()}
                    </div>

                    <div className="bg-gray-50/50 p-2 text-center border-t border-gray-100">
                      <span className="text-[9px] text-gray-400">
                        {notifications.length} notificaciones en total
                      </span>
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