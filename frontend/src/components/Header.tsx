import React, { useState, useEffect } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { Bell, Camera, Image as ImageIcon, Search, User, X, MessageCircle, Tag, Mail, UserPlus, Sun, Moon } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import api from '../api';
import PhotoUploadModal from './PhotoUploadModal';
import { useSocket } from '../contexts/SocketContext';
import { usePhotoModal } from '../contexts/PhotoModalContext';

const Header: React.FC = () => {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
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
  const { socket } = useSocket();

  useEffect(() => {
    if (user) {
      fetchNotifications();
    }
  }, [user]);

  useEffect(() => {
    if (socket) {
      const handleNewNotification = (notification: any) => {
        setNotifications(prev => [notification, ...prev]);
        setUnreadNotifsCount(prev => prev + 1);
      };

      socket.on('notification', handleNewNotification);
      return () => {
        socket.off('notification', handleNewNotification);
      };
    }
  }, [socket]);

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
      await api.put(`/ notifications / ${id}/read`);
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

  const { openPhoto } = usePhotoModal();

  const handleNotificationClick = async (notif: any) => {
    // Mark as read first
    if (!notif.read) {
      await handleMarkAsRead(notif.id);
    }

    setShowNotifs(false);

    // Navigation logic
    try {
      if (['comment_photo', 'tag_photo'].includes(notif.type)) {
        // Fetch photo details to open in modal
        const res = await api.get(`/photos/user/${notif.userId}`); // This gets all user photos, better to have a single photo endpoint
        // However, we don't have a getSinglePhoto by ID in backend routes yet that returns full Photo object for modal
        // Let's check if we can get it from extra.routes.ts... no, let's just navigate to gallery for now if we can't open reliably
        // Actually, we can fetch all photos and find the one with relatedId
        const photoRes = await api.get(`/photos/user/${notif.userId}`);
        const photos = photoRes.data.photos;
        const targetPhoto = photos.find((p: any) => p.id === notif.relatedId);

        if (targetPhoto) {
          openPhoto(targetPhoto, photos);
        } else {
          handleNavigate(`/profile/${notif.userId}`);
        }
      } else if (['comment_post', 'tag_post', 'status_post', 'video_post', 'photo_post'].includes(notif.type)) {
        handleNavigate('/');
      } else if (notif.type === 'message') {
        handleNavigate('/'); // Or inbox if available
      } else if (notif.type === 'friendship') {
        handleNavigate('/'); // Handled in Feed/Home
      } else {
        handleNavigate('/');
      }
    } catch (error) {
      console.error('Error handling notification click:', error);
      handleNavigate('/');
    }
  };

  if (!user) return null;

  // Active link helper
  const isActive = (path: string) => location.pathname === path;

  return (
    <header className="fixed top-0 left-0 right-0 h-[40px] md:h-[42px] bg-[var(--header-bg)] shadow-[0_1px_3px_rgba(0,0,0,0.2)] z-[100] transition-colors duration-200">
      <div className="max-w-[980px] mx-auto h-full flex items-center px-1 md:px-2">
        {/* Logo and Navigation Group */}
        <div className="flex items-center gap-1.5 md:gap-8 shrink-0">
          <Link to="/" className="text-white text-[20px] md:text-[22px] font-black tracking-tighter hover:opacity-90 transition-opacity">
            twentty<span className="text-[#59B200]">.</span>
          </Link>

          <nav className="flex items-center gap-0.5 md:gap-1">
            <Link
              to="/"
              className={`flex items-center gap-1 px-1.5 md:px-3 py-1 rounded-md text-white transition-colors shrink-0 ${isActive('/') ? 'bg-[var(--header-active)]' : 'hover:bg-white/10'}`}
              title="Inicio"
            >
              <div className="w-5 h-5 flex items-center justify-center bg-white/10 rounded">
                <span className="text-[10px] font-bold">;)</span>
              </div>
              <span className="text-[12px] font-bold hidden md:inline">Inicio</span>
            </Link>

            <Link
              to="/profile/photos"
              className={`flex items-center gap-1 px-1.5 md:px-3 py-1 rounded-md text-white transition-colors shrink-0 ${isActive('/profile/photos') ? 'bg-black/10' : 'hover:bg-white/10'}`}
              title="Mis Fotos"
            >
              <ImageIcon size={16} className="opacity-80" />
              <span className="text-[12px] font-bold hidden lg:inline">Fotos</span>
            </Link>

            <Link
              to="/people"
              className={`flex items-center gap-1 px-1.5 md:px-3 py-1 rounded-md text-white transition-colors shrink-0 ${isActive('/people') ? 'bg-black/10' : 'hover:bg-white/10'}`}
              title="Gente"
            >
              <Search size={16} className="opacity-80" />
              <span className="text-[12px] font-bold hidden lg:inline">Gente</span>
            </Link>

            <Link
              to="/profile"
              className={`flex items-center px-1.5 md:px-3 py-1 rounded-md text-white transition-colors shrink-0 ${isActive('/profile') ? 'bg-[var(--header-active)]' : 'hover:bg-white/10'}`}
              title="Mi Perfil"
            >
              <User size={16} className="sm:hidden opacity-80" />
              <span className="text-[12px] font-bold hidden sm:inline">Perfil</span>
            </Link>
          </nav>
        </div>

        {/* Right Side: Search & Actions */}
        <div className="flex items-center justify-end gap-1.5 md:gap-2 flex-1 ml-2 md:ml-4 pr-1 md:pr-0">
          {/* Search Bar - Compact - Hidden on mobile */}
          <div className="relative shrink-1 min-w-[60px] max-w-[150px] hidden md:block">
            <input
              type="text"
              placeholder="Buscar"
              className="w-full h-[22px] md:h-[24px] pl-2 pr-5 rounded-[2px] border-none text-[10px] md:text-[11px] outline-none bg-white text-gray-800"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setShowResults(true);
              }}
              onFocus={() => setShowResults(true)}
              onBlur={() => setTimeout(() => setShowResults(false), 200)}
            />
            <Search className="absolute right-1 top-1 md:top-1.5 w-3 h-3 text-gray-400" />
          </div>

          <div className="flex items-center gap-1.5 md:gap-4 shrink-0">
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
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => document.getElementById('photo-upload')?.click()}
              className="bg-[#2B7BB9] text-white text-[10px] md:text-[11px] font-bold px-1.5 md:px-3 py-1 rounded-[3px] border border-[#1e5a8c] shadow-sm hover:bg-[#256ca3] transition-all flex items-center gap-1 shrink-0 px-2"
            >
              <span>Subir</span>
              <Camera size={14} />
            </motion.button>

            {unreadNotifsCount >= 0 && (
              <div className="flex items-center gap-1 relative shrink-0">
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => setShowNotifs(!showNotifs)}
                  className={`${unreadNotifsCount > 0 ? 'bg-[#cc0000]' : 'bg-black/10'} text-white text-[9px] px-1 rounded-sm font-bold min-w-[20px] h-[18px] flex items-center justify-center transition-transform`}
                  title="Notificaciones"
                >
                  <Bell size={10} className="mr-0.5" />
                  {unreadNotifsCount}
                </motion.button>

                {/* Notifications Dropdown */}
                <AnimatePresence>
                  {showNotifs && (
                    <motion.div
                      initial={{ opacity: 0, y: -20, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -10, scale: 0.95 }}
                      transition={{ type: 'spring', damping: 25, stiffness: 350 }}
                      className="absolute top-[35px] right-0 w-[300px] md:w-[340px] bg-[var(--card-bg)] shadow-[0_8px_32px_rgba(0,0,0,0.2)] border border-[var(--border-color)] rounded-[4px] z-[100] text-left overflow-hidden ring-1 ring-black/5 origin-top-right text-[var(--text-main)]"
                    >
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

                      <div className="max-h-[400px] overflow-y-auto no-scrollbar">
                        {notifications.length === 0 ? (
                          <div className="py-12 px-6 text-center text-[var(--text-muted)]">
                            <Bell size={32} className="opacity-10 mx-auto mb-2" />
                            <p className="text-[11px] font-medium">No tienes notificaciones</p>
                          </div>
                        ) : (
                          <motion.div
                            className="flex flex-col"
                            initial="hidden"
                            animate="visible"
                            variants={{
                              visible: {
                                transition: {
                                  staggerChildren: 0.05
                                }
                              }
                            }}
                          >
                            <div className="flex justify-end p-2 border-b border-[var(--border-soft)]">
                              <button
                                onClick={handleDeleteAllNotifications}
                                className="text-[9px] text-[var(--text-muted)] hover:text-red-500 font-bold uppercase transition-colors"
                              >
                                Borrar todas
                              </button>
                            </div>
                            {notifications.map((notif) => (
                              <motion.div
                                key={notif.id}
                                variants={{
                                  hidden: { opacity: 0, x: -10 },
                                  visible: { opacity: 1, x: 0 }
                                }}
                                onClick={() => handleNotificationClick(notif)}
                                className={`p-3 border-b border-[var(--border-soft)] cursor-pointer transition-colors flex gap-3 items-start group relative ${!notif.read ? 'bg-[var(--header-active)]/20' : 'hover:bg-[var(--header-active)]/10'}`}
                              >
                                <div className={`mt-0.5 p-1.5 rounded-full ${!notif.read ? 'bg-[#59B200] text-white shadow-sm' : 'bg-gray-100 text-gray-400'}`}>
                                  {['comment_photo', 'comment_post'].includes(notif.type) && <MessageCircle size={14} />}
                                  {['tag_photo', 'tag_post'].includes(notif.type) && <Tag size={14} />}
                                  {['photo_post', 'video_post', 'status_post'].includes(notif.type) && <Bell size={14} />}
                                  {notif.type === 'message' && <Mail size={14} />}
                                  {notif.type === 'friendship' && <UserPlus size={14} />}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className={`text-[11px] leading-tight ${!notif.read ? 'text-[var(--text-main)] font-bold' : 'text-[var(--text-muted)]'}`}>
                                    {notif.content}
                                  </p>
                                  <p className="text-[9px] text-[var(--text-muted)] mt-1">
                                    {new Date(notif.createdAt).toLocaleString()}
                                  </p>
                                </div>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleDeleteNotification(notif.id);
                                  }}
                                  className="opacity-0 group-hover:opacity-100 p-1 text-gray-300 hover:text-red-500 transition-all"
                                >
                                  <X size={12} />
                                </button>
                                {!notif.read && (
                                  <div className="absolute left-1 top-1/2 -translate-y-1/2 w-1.5 h-1.5 bg-[#59B200] rounded-full shadow-[0_0_5px_rgba(89,178,0,0.5)]"></div>
                                )}
                              </motion.div>
                            ))}
                          </motion.div>
                        )}
                      </div>

                      <div className="bg-[var(--header-active)]/5 p-2 text-center border-t border-[var(--border-soft)]">
                        <span className="text-[9px] text-[var(--text-muted)] font-medium">
                          Twentty • Conectando personas
                        </span>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )}

            <button
              onClick={toggleTheme}
              className="text-white/80 hover:text-white transition-colors p-1"
              title={theme === 'light' ? 'Modo oscuro' : 'Modo claro'}
            >
              {theme === 'light' ? <Moon size={16} /> : <Sun size={16} />}
            </button>

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