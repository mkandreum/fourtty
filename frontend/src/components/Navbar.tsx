import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { Home, Image as ImageIcon, Search, User, Bell, Camera, Sun, Moon, LogOut, Plus, UserPlus, MessageSquare, X, Tag, Mail, BarChart2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { useSocket } from '../contexts/SocketContext';
import PhotoUploadModal from './PhotoUploadModal';
import Invitations from './Invitations';
import Inbox from './Inbox';
import api from '../api';

const Navbar: React.FC = () => {
    const { user, logout } = useAuth();
    const { theme, toggleTheme } = useTheme();
    const { socket } = useSocket();
    const navigate = useNavigate();
    const location = useLocation();

    const [unreadNotifs, setUnreadNotifs] = useState(0);
    const [notifications, setNotifications] = useState<any[]>([]);
    const [showUploadModal, setShowUploadModal] = useState(false);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [showInvitations, setShowInvitations] = useState(false);
    const [showNotifs, setShowNotifs] = useState(false);
    const [showMessagesModal, setShowMessagesModal] = useState(false);
    const [stats, setStats] = useState({ visits: 0 });

    useEffect(() => {
        if (!user) return;

        const fetchData = async () => {
            try {
                const [notifsRes, statsRes] = await Promise.all([
                    api.get('/notifications'),
                    api.get('/stats')
                ]);
                setNotifications(notifsRes.data.notifications);
                setUnreadNotifs(notifsRes.data.unreadCount || notifsRes.data.notifications.filter((n: any) => !n.read).length);
                setStats({ visits: statsRes.data.visits });
            } catch (e) {
                console.error(e);
            }
        };
        fetchData();

        if (socket) {
            const handleNewNotif = (notification: any) => {
                setNotifications(prev => [notification, ...prev]);
                setUnreadNotifs(prev => prev + 1);
            };
            socket.on('notification', handleNewNotif);
            return () => {
                socket.off('notification', handleNewNotif);
            };
        }
    }, [user, socket]);

    if (!user) return null;

    const bottomNavItemsLeft = [
        { path: '/', icon: <Home size={20} />, label: 'Inicio' },
        { path: '/profile/photos', icon: <ImageIcon size={20} />, label: 'Fotos' },
    ];

    const bottomNavItemsRight = [
        { path: '#', icon: <Bell size={20} />, label: 'Notificaciones' },
        { path: '/profile', icon: <User size={20} />, label: 'Perfil' },
    ];

    const currentPath = location.pathname;

    const handleNotificationClick = async (notif: any) => {
        try {
            await api.delete(`/notifications/${notif.id}`);
            setNotifications(prev => prev.filter(n => n.id !== notif.id));
            setUnreadNotifs(prev => Math.max(0, prev - (notif.read ? 0 : 1)));
        } catch (e) {
            console.error(e);
        }

        setShowNotifs(false);

        try {
            if (['comment_photo', 'tag_photo'].includes(notif.type)) {
                navigate(`/profile/photos/${notif.relatedUserId || ''}`);
            } else if (['comment_post', 'tag_post', 'status_post', 'video_post', 'photo_post'].includes(notif.type)) {
                navigate('/');
            } else if (notif.type === 'message') {
                navigate('/messages');
            } else if (notif.type === 'friendship') {
                navigate('/people');
            } else {
                navigate('/');
            }
        } catch (error) {
            console.error('Error handling notification click:', error);
            navigate('/');
        }
    };

    return (
        <>
            {/* TOP BAR - Compact Utilities */}
            <div className="fixed top-2 sm:top-4 left-0 right-0 z-50 flex justify-center px-2 sm:px-4 pt-[env(safe-area-inset-top,0px)]">
                <nav
                    className="glass flex items-center justify-between gap-1 sm:gap-2 px-2 sm:px-3 py-1.5 rounded-full shadow-[0_12px_40px_rgba(0,0,0,0.1)] ring-1 ring-[var(--border-color)] w-auto min-w-[180px] sm:min-w-[200px] max-w-[calc(100vw-16px)] relative overflow-hidden"
                >
                    <div className="flex items-center gap-0.5 sm:gap-1">
                        {/* Search moved to top utility bar */}
                        <button
                            onClick={() => navigate('/people')}
                            className="p-1.5 sm:p-2 text-[var(--text-muted)] hover:text-[var(--text-main)] active:text-[var(--text-main)] hover:bg-white/5 active:bg-white/10 rounded-full transition-all touch-manipulation"
                            title="Buscar gente"
                        >
                            <Search size={18} className="sm:w-5 sm:h-5" />
                        </button>

                        <button
                            onClick={() => {
                                setShowInvitations(!showInvitations);
                                setShowNotifs(false);
                                setShowMessagesModal(false);
                            }}
                            className={`p-1.5 sm:p-2 rounded-full transition-all touch-manipulation ${showInvitations ? 'bg-[var(--accent)] text-white' : 'text-[var(--text-muted)] hover:text-[var(--text-main)] active:text-[var(--text-main)] hover:bg-white/5 active:bg-white/10'}`}
                            title="Invitaciones"
                        >
                            <UserPlus size={18} className="sm:w-5 sm:h-5" />
                        </button>

                        {/* Mobile Visit Counter */}
                        <div className="md:hidden flex items-center gap-1.5 px-3 py-1 bg-[var(--accent)]/10 rounded-full border border-[var(--accent)]/20 active:scale-95 transition-all" onClick={() => navigate('/profile')}>
                            <BarChart2 size={14} className="text-[var(--accent)]" />
                            <span className="text-[11px] font-black text-[var(--accent)]">
                                {stats.visits}
                            </span>
                        </div>
                    </div>

                    <div className="flex items-center gap-0.5 sm:gap-1">
                        <button
                            onClick={toggleTheme}
                            className="p-1.5 sm:p-2 text-[var(--text-muted)] hover:text-[var(--text-main)] active:text-[var(--text-main)] hover:bg-white/5 active:bg-white/10 rounded-full transition-all touch-manipulation"
                        >
                            {theme === 'light' ? <Moon size={18} className="sm:w-5 sm:h-5" /> : <Sun size={18} className="sm:w-5 sm:h-5" />}
                        </button>

                        <div className="h-3 sm:h-4 w-[1px] bg-[var(--border-color)] mx-0.5 sm:mx-1" />

                        <button
                            onClick={logout}
                            className="p-1.5 sm:p-2 text-red-400 hover:text-red-500 active:text-red-600 transition-colors flex items-center gap-1 sm:gap-1.5 group touch-manipulation"
                        >
                            <LogOut size={18} className="sm:w-5 sm:h-5" />
                            <span className="text-[11px] sm:text-[12px] font-bold hidden md:inline group-hover:block transition-all">Salir</span>
                        </button>
                    </div>
                </nav>
            </div>

            {/* BOTTOM NAV - Balanced Core Navigation (3 + Logo + 3) */}
            <div className="fixed bottom-0 left-0 right-0 z-50 flex justify-center px-1 sm:px-2 pb-[calc(0.5rem+env(safe-area-inset-bottom,0px))] sm:pb-[calc(1.5rem+env(safe-area-inset-bottom,0px))] md:pb-8">
                <nav
                    className="glass flex items-center gap-0.5 sm:gap-1 md:gap-3 p-1 sm:p-1.5 rounded-full shadow-[0_20px_50px_rgba(0,0,0,0.5)] ring-1 ring-white/40 max-w-[98vw] sm:max-w-[95vw] md:max-w-full relative overflow-hidden backdrop-blur-3xl bg-black/20 dark:bg-white/5"
                >
                    {/* LEFT SECTION (3 icons) */}
                    <div className="flex items-center gap-0.5 md:gap-1 bg-black/5 dark:bg-white/5 p-0.5 sm:p-1 rounded-full relative">
                        {bottomNavItemsLeft.map((item) => {
                            const active = currentPath === item.path;
                            return (
                                <Link
                                    key={item.path}
                                    to={item.path}
                                    className={`relative z-10 p-2 sm:p-2.5 md:p-3 rounded-full transition-all duration-300 flex items-center justify-center touch-manipulation ${active ? 'text-white' : 'text-[var(--text-muted)] hover:text-[var(--text-main)] active:text-[var(--text-main)]'}`}
                                >
                                    {React.cloneElement(item.icon as React.ReactElement, { size: 18, className: 'sm:w-5 sm:h-5' })}
                                    {active && (
                                        <div className="absolute inset-0 bg-gradient-to-tr from-[var(--accent)] to-violet-500 rounded-full -z-10 shadow-[0_0_15px_rgba(var(--accent-rgb),0.5)]" />
                                    )}
                                </Link>
                            );
                        })}

                        {/* Upload Button in Left Group */}
                        <div className="relative">
                            <input
                                type="file"
                                id="nav-photo-upload"
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
                                onClick={() => document.getElementById('nav-photo-upload')?.click()}
                                className="w-8 h-8 sm:w-10 sm:h-10 md:w-11 md:h-11 bg-white/5 text-[var(--accent)] rounded-full hover:bg-[var(--accent)] active:bg-[var(--accent)] hover:text-white active:text-white transition-all duration-300 flex items-center justify-center active:scale-90 touch-manipulation"
                            >
                                <Plus size={20} className="sm:w-6 sm:h-6" strokeWidth={3} />
                            </button>
                        </div>
                    </div>

                    {/* CENTER SECTION (Centered Logo) */}
                    <div
                        onClick={() => navigate('/')}
                        className="flex flex-col items-center justify-center px-1 sm:px-2 md:px-5 cursor-pointer hover:scale-105 active:scale-95 transition-transform touch-manipulation"
                    >
                        <span className="brand-font text-[18px] sm:text-[20px] md:text-[28px] leading-none mb-0.5">fourtty</span>
                        <div className="w-5 sm:w-6 md:w-8 h-0.5 sm:h-1 bg-[var(--accent)] rounded-full opacity-50" />
                    </div>

                    {/* RIGHT SECTION (3 icons) */}
                    <div className="flex items-center gap-0.5 md:gap-1 bg-black/5 dark:bg-white/5 p-0.5 sm:p-1 rounded-full relative">
                        {bottomNavItemsRight.map((item) => {
                            const active = item.path === '/profile'
                                ? (currentPath.startsWith('/profile') && !currentPath.startsWith('/profile/photos'))
                                : currentPath === item.path;

                            return (
                                <Link
                                    key={item.path}
                                    to={item.path === '#' ? '#' : item.path}
                                    onClick={item.path === '#' ? (e) => { e.preventDefault(); setShowNotifs(!showNotifs); setShowInvitations(false); setShowMessagesModal(false); } : undefined}
                                    className={`relative z-10 p-2 sm:p-2.5 md:p-3 rounded-full transition-all duration-300 flex items-center justify-center touch-manipulation ${active ? 'text-white' : 'text-[var(--text-muted)] hover:text-[var(--text-main)] active:text-[var(--text-main)]'}`}
                                >
                                    <div className="relative">
                                        {React.cloneElement(item.icon as React.ReactElement, { size: 18, className: 'sm:w-5 sm:h-5' })}
                                        {item.path === '#' && unreadNotifs > 0 && (
                                            <span className="absolute -top-1 -right-1 sm:-top-1.5 sm:-right-1.5 min-w-[14px] sm:min-w-[16px] h-[14px] sm:h-[16px] bg-red-500 rounded-full border border-[var(--card-bg)] shadow-[0_0_8px_rgba(239,68,68,0.4)] flex items-center justify-center text-[8px] sm:text-[9px] font-bold text-white px-0.5 sm:px-1">
                                                {unreadNotifs > 99 ? '99+' : unreadNotifs}
                                            </span>
                                        )}
                                    </div>
                                    {active && (
                                        <div className="absolute inset-0 bg-gradient-to-tr from-[var(--accent)] to-violet-500 rounded-full -z-10 shadow-[0_0_15px_rgba(var(--accent-rgb),0.5)]" />
                                    )}
                                </Link>
                            );
                        })}

                        {/* Chat Icon (Right Group) - Now opens Modal */}
                        <button
                            onClick={() => {
                                setShowMessagesModal(true);
                                setShowNotifs(false);
                                setShowInvitations(false);
                            }}
                            className="relative z-10 p-2 sm:p-2.5 md:p-3 rounded-full text-[var(--text-muted)] hover:text-[var(--text-main)] active:text-[var(--text-main)] transition-all touch-manipulation"
                        >
                            <MessageSquare size={18} className="sm:w-5 sm:h-5" />
                        </button>
                    </div>
                </nav>

                {/* Dropdowns (Invitations & Notifications) */}
                <AnimatePresence>
                    {showInvitations && (
                        <motion.div
                            initial={{ opacity: 0, y: 20, scale: 0.95 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: 20, scale: 0.95 }}
                            transition={{ duration: 0.2 }}
                            className="fixed bottom-[calc(80px+env(safe-area-inset-bottom,0px))] sm:bottom-[calc(100px+env(safe-area-inset-bottom,0px))] left-2 right-2 sm:left-4 sm:right-4 z-[60] flex justify-center"
                        >
                            <div className="glass p-0.5 sm:p-1 rounded-[2rem] sm:rounded-[2.5rem] shadow-2xl ring-1 ring-[var(--border-color)] w-full max-w-[calc(100vw-16px)] sm:max-w-[400px] overflow-hidden">
                                <div className="bg-[var(--card-bg)]/95 backdrop-blur-xl p-4 sm:p-6">
                                    <div className="flex items-center justify-between mb-3 sm:mb-4">
                                        <h3 className="text-lg sm:text-xl font-bold text-[var(--text-main)] flex items-center gap-2">
                                            <UserPlus className="text-[var(--accent)]" size={20} />
                                            <span className="text-base sm:text-xl">Invitaciones</span>
                                        </h3>
                                        <button
                                            onClick={() => setShowInvitations(false)}
                                            className="p-1.5 sm:p-2 hover:bg-[var(--border-soft)] active:bg-[var(--border-color)] rounded-full text-[var(--text-muted)] hover:text-[var(--text-main)] transition-all touch-manipulation"
                                        >
                                            <X size={18} className="sm:w-5 sm:h-5" />
                                        </button>
                                    </div>
                                    <Invitations compact />
                                </div>
                            </div>
                        </motion.div>
                    )}

                    {showNotifs && (
                        <motion.div
                            initial={{ opacity: 0, y: 20, scale: 0.95 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: 20, scale: 0.95 }}
                            transition={{ duration: 0.2 }}
                            className="fixed bottom-[calc(80px+env(safe-area-inset-bottom,0px))] sm:bottom-[calc(100px+env(safe-area-inset-bottom,0px))] left-2 right-2 sm:left-4 sm:right-4 z-[60] flex justify-center"
                        >
                            <div className="glass p-0.5 sm:p-1 rounded-[2rem] sm:rounded-[2.5rem] shadow-2xl ring-1 ring-[var(--border-color)] w-full max-w-[calc(100vw-16px)] sm:max-w-[400px] overflow-hidden">
                                <div className="bg-[var(--card-bg)]/95 backdrop-blur-xl p-4 sm:p-6 flex flex-col max-h-[60vh] sm:max-h-[70vh]">
                                    <div className="flex items-center justify-between mb-3 sm:mb-4">
                                        <h3 className="text-lg sm:text-xl font-bold text-[var(--text-main)] flex items-center gap-2">
                                            <Bell className="text-[var(--accent)]" size={20} />
                                            <span className="text-base sm:text-xl">Notificaciones</span>
                                        </h3>
                                        <button
                                            onClick={() => setShowNotifs(false)}
                                            className="p-1.5 sm:p-2 hover:bg-[var(--border-soft)] active:bg-[var(--border-color)] rounded-full text-[var(--text-muted)] hover:text-[var(--text-main)] transition-all touch-manipulation"
                                        >
                                            <X size={18} className="sm:w-5 sm:h-5" />
                                        </button>
                                    </div>

                                    <div className="overflow-y-auto pr-1 sm:pr-2 custom-scrollbar space-y-2 sm:space-y-3">
                                        {notifications.length === 0 ? (
                                            <div className="py-8 sm:py-10 text-center text-[var(--text-muted)] italic text-xs sm:text-sm">
                                                No tienes notificaciones
                                            </div>
                                        ) : (
                                            notifications.map((notif) => (
                                                <div
                                                    key={notif.id}
                                                    onClick={() => handleNotificationClick(notif)}
                                                    className={`p-3 sm:p-4 rounded-2xl sm:rounded-3xl border border-[var(--border-color)] cursor-pointer transition-all hover:bg-[var(--border-soft)] active:bg-[var(--border-color)] group relative overflow-hidden touch-manipulation ${!notif.read ? 'bg-[var(--border-soft)]' : 'opacity-60'}`}
                                                >
                                                    {!notif.read && (
                                                        <div className="absolute top-0 right-0 w-1.5 h-1.5 bg-[var(--accent)] rounded-full m-2 sm:m-3 shadow-[0_0_8px_rgba(var(--accent-rgb),0.6)]" />
                                                    )}
                                                    <div className="flex gap-2 sm:gap-3">
                                                        <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl sm:rounded-2xl bg-[var(--border-soft)] flex items-center justify-center shrink-0 border border-[var(--border-color)] text-[var(--accent)]">
                                                            {['comment_photo', 'comment_post'].includes(notif.type) && <MessageSquare size={16} className="sm:w-[18px] sm:h-[18px]" />}
                                                            {['tag_photo', 'tag_post'].includes(notif.type) && <Tag size={16} className="sm:w-[18px] sm:h-[18px]" />}
                                                            {['photo_post', 'video_post', 'status_post'].includes(notif.type) && <Bell size={16} className="sm:w-[18px] sm:h-[18px]" />}
                                                            {notif.type === 'message' && <Mail size={16} className="sm:w-[18px] sm:h-[18px]" />}
                                                            {notif.type === 'friendship' && <UserPlus size={16} className="sm:w-[18px] sm:h-[18px]" />}
                                                        </div>
                                                        <div className="flex-1 min-w-0">
                                                            <p className="text-xs sm:text-[13px] text-[var(--text-main)] leading-tight group-hover:text-[var(--accent)] transition-colors">
                                                                {notif.content}
                                                            </p>
                                                            <p className="text-[9px] sm:text-[10px] text-[var(--text-muted)] font-bold uppercase mt-0.5 sm:mt-1 tracking-widest">
                                                                {new Date(notif.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                            </p>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))
                                        )}
                                    </div>

                                    {notifications.length > 0 && (
                                        <button
                                            onClick={async () => {
                                                await api.put('/notifications/read-all');
                                                setNotifications(prev => prev.map(n => ({ ...n, read: true })));
                                                setUnreadNotifs(0);
                                            }}
                                            className="mt-3 sm:mt-4 py-2 text-[10px] sm:text-[11px] font-black text-[var(--text-muted)] hover:text-[var(--accent)] active:text-[var(--accent)] uppercase tracking-widest transition-colors touch-manipulation"
                                        >
                                            Marcar todas como leídas
                                        </button>
                                    )}
                                </div>
                            </div>
                        </motion.div>
                    )}

                    {showMessagesModal && (
                        <motion.div
                            initial={{ opacity: 0, y: 20, scale: 0.95 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: 20, scale: 0.95 }}
                            transition={{ duration: 0.2 }}
                            className="fixed bottom-[calc(80px+env(safe-area-inset-bottom,0px))] sm:bottom-[calc(100px+env(safe-area-inset-bottom,0px))] left-2 right-2 sm:left-4 sm:right-4 z-[60] flex justify-center"
                        >
                            <div className="glass p-0.5 sm:p-1 rounded-[2rem] sm:rounded-[2.5rem] shadow-2xl ring-1 ring-[var(--border-color)] w-full max-w-[calc(100vw-16px)] sm:max-w-[500px] overflow-hidden">
                                <div className="bg-[var(--card-bg)]/95 backdrop-blur-xl p-3 sm:p-4 md:p-6 flex flex-col max-h-[60vh] sm:max-h-[70vh]">
                                    <div className="flex items-center justify-between mb-3 sm:mb-4">
                                        <h3 className="text-base sm:text-lg md:text-xl font-bold text-[var(--text-main)] flex items-center gap-2">
                                            <Mail className="text-[var(--accent)]" size={20} />
                                            <span className="text-base sm:text-lg md:text-xl">Mensajes</span>
                                        </h3>
                                        <button
                                            onClick={() => setShowMessagesModal(false)}
                                            className="p-1.5 sm:p-2 hover:bg-[var(--border-soft)] active:bg-[var(--border-color)] rounded-full text-[var(--text-muted)] hover:text-[var(--text-main)] transition-all touch-manipulation"
                                        >
                                            <X size={18} className="sm:w-5 sm:h-5" />
                                        </button>
                                    </div>
                                    <div className="overflow-y-auto custom-scrollbar pr-1 sm:pr-2">
                                        <Inbox />
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            <AnimatePresence>
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
            </AnimatePresence>
        </>
    );
};

export default Navbar;
