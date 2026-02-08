import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { Home, Image as ImageIcon, Search, User, Bell, Camera, Sun, Moon, LogOut, Plus, UserPlus, MessageSquare, X, Tag, Mail, BarChart2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { useSocket } from '../contexts/SocketContext';
import PhotoUploadModal from './PhotoUploadModal';
import Invitations from './Invitations';
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
        { path: '/notifications', icon: <Bell size={20} />, label: 'Notificaciones' },
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
            <div className="fixed top-4 left-0 right-0 z-50 flex justify-center px-4">
                <motion.nav
                    initial={{ y: -100, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    className="glass flex items-center justify-between gap-2 px-3 py-1.5 rounded-full shadow-[0_12px_40px_rgba(0,0,0,0.3)] ring-1 ring-white/20 w-auto min-w-[200px] relative overflow-hidden"
                >
                    <div className="flex items-center gap-1">
                        {/* Search moved to top utility bar */}
                        <button
                            onClick={() => navigate('/people')}
                            className="p-2 text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-white/5 rounded-full transition-all"
                            title="Buscar gente"
                        >
                            <Search size={20} />
                        </button>

                        <button
                            onClick={() => {
                                setShowInvitations(!showInvitations);
                                setShowNotifs(false);
                            }}
                            className={`p - 2 rounded - full transition - all ${showInvitations ? 'bg-[var(--accent)] text-white' : 'text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-white/5'} `}
                            title="Invitaciones"
                        >
                            <UserPlus size={20} />
                        </button>

                        {/* Mobile Visit Counter */}
                        <div className="md:hidden flex items-center gap-1.5 px-3 py-1 bg-[var(--accent)]/10 rounded-full border border-[var(--accent)]/20 active:scale-95 transition-all" onClick={() => navigate('/profile')}>
                            <BarChart2 size={14} className="text-[var(--accent)]" />
                            <span className="text-[11px] font-black text-[var(--accent)]">
                                {stats.visits}
                            </span>
                        </div>
                    </div>

                    <div className="flex items-center gap-1">
                        <button
                            onClick={toggleTheme}
                            className="p-2 text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-white/5 rounded-full transition-all"
                        >
                            {theme === 'light' ? <Moon size={20} /> : <Sun size={20} />}
                        </button>

                        <div className="h-4 w-[1px] bg-[var(--border-color)] mx-1" />

                        <button
                            onClick={logout}
                            className="p-2 text-red-400 hover:text-red-500 transition-colors flex items-center gap-1.5 group"
                        >
                            <LogOut size={20} />
                            <span className="text-[12px] font-bold hidden md:inline group-hover:block transition-all">Salir</span>
                        </button>
                    </div>
                </motion.nav>
            </div>

            {/* BOTTOM NAV - Balanced Core Navigation (3 + Logo + 3) */}
            <div className="fixed bottom-0 left-0 right-0 z-50 flex justify-center px-2 pb-[calc(1.5rem+env(safe-area-inset-bottom,0px))] md:pb-8">
                <motion.nav
                    initial={{ y: 100, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    className="glass flex items-center gap-1 md:gap-3 p-1.5 rounded-full shadow-[0_20px_50px_rgba(0,0,0,0.5)] ring-1 ring-white/40 max-w-[95vw] md:max-w-full relative overflow-hidden backdrop-blur-3xl bg-black/20 dark:bg-white/5"
                >
                    {/* LEFT SECTION (3 icons) */}
                    <div className="flex items-center gap-0.5 md:gap-1 bg-black/5 dark:bg-white/5 p-1 rounded-full relative">
                        {bottomNavItemsLeft.map((item) => {
                            const active = currentPath === item.path;
                            return (
                                <Link
                                    key={item.path}
                                    to={item.path}
                                    className={`relative z-10 p-2.5 md:p-3 rounded-full transition-all duration-300 flex items-center justify-center ${active ? 'text-white' : 'text-[var(--text-muted)] hover:text-[var(--text-main)]'}`}
                                >
                                    {item.icon}
                                    {active && (
                                        <motion.div
                                            layoutId="nav-glow-pill"
                                            className="absolute inset-0 bg-gradient-to-tr from-[var(--accent)] to-violet-500 rounded-full -z-10 shadow-[0_0_15px_rgba(var(--accent-rgb),0.5)]"
                                            transition={{ type: "spring", bounce: 0.15, duration: 0.5 }}
                                        />
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
                                className="w-10 h-10 md:w-11 md:h-11 bg-white/5 text-[var(--accent)] rounded-full hover:bg-[var(--accent)] hover:text-white transition-all duration-300 flex items-center justify-center active:scale-90"
                            >
                                <Plus size={22} strokeWidth={3} />
                            </button>
                        </div>
                    </div>

                    {/* CENTER SECTION (Centered Logo) */}
                    <div
                        onClick={() => navigate('/')}
                        className="flex flex-col items-center justify-center px-2 md:px-5 cursor-pointer hover:scale-105 transition-transform"
                    >
                        <span className="brand-font text-[20px] md:text-[28px] leading-none mb-0.5">fourtty</span>
                        <div className="w-6 md:w-8 h-1 bg-[var(--accent)] rounded-full opacity-50" />
                    </div>

                    {/* RIGHT SECTION (3 icons) */}
                    <div className="flex items-center gap-0.5 md:gap-1 bg-black/5 dark:bg-white/5 p-1 rounded-full relative">
                        {bottomNavItemsRight.map((item) => {
                            const active = item.path === '/profile'
                                ? (currentPath.startsWith('/profile') && !currentPath.startsWith('/profile/photos'))
                                : currentPath === item.path;

                            return (
                                <Link
                                    key={item.path}
                                    to={item.path === '#' ? '#' : item.path}
                                    onClick={item.path === '#' ? (e) => { e.preventDefault(); setShowNotifs(!showNotifs); } : undefined}
                                    className={`relative z-10 p-2.5 md:p-3 rounded-full transition-all duration-300 flex items-center justify-center ${active ? 'text-white' : 'text-[var(--text-muted)] hover:text-[var(--text-main)]'}`}
                                >
                                    <div className="relative">
                                        {item.icon}
                                        {item.path === '/notifications' && unreadNotifs > 0 && (
                                            <span className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full border border-[var(--card-bg)] shadow-[0_0_8px_rgba(239,68,68,0.4)]" />
                                        )}
                                    </div>
                                    {active && (
                                        <motion.div
                                            layoutId="nav-glow-pill"
                                            className="absolute inset-0 bg-gradient-to-tr from-[var(--accent)] to-violet-500 rounded-full -z-10 shadow-[0_0_15px_rgba(var(--accent-rgb),0.5)]"
                                            transition={{ type: "spring", bounce: 0.15, duration: 0.5 }}
                                        />
                                    )}
                                </Link>
                            );
                        })}

                        {/* Notifications (Bell - Toggles Dropdown) */}
                        <button
                            onClick={(e) => {
                                e.preventDefault();
                                setShowNotifs(!showNotifs);
                                setShowInvitations(false);
                            }}
                            className={`relative z - 10 p - 2.5 md: p - 3 rounded - full transition - all duration - 300 flex items - center justify - center ${showNotifs ? 'text-white' : 'text-[var(--text-muted)] hover:text-[var(--text-main)]'} `}
                        >
                            <div className="relative">
                                <Bell size={20} />
                                {unreadNotifs > 0 && (
                                    <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-[var(--card-bg)] shadow-[0_0_8px_rgba(239,68,68,0.4)]" />
                                )}
                            </div>
                            {showNotifs && (
                                <motion.div
                                    layoutId="nav-glow-pill"
                                    className="absolute inset-0 bg-gradient-to-tr from-[var(--accent)] to-violet-500 rounded-full -z-10 shadow-[0_0_15px_rgba(var(--accent-rgb),0.5)]"
                                    transition={{ type: "spring", bounce: 0.15, duration: 0.5 }}
                                />
                            )}
                        </button>

                        {/* Chat Icon (Right Group) */}
                        <button
                            onClick={() => navigate('/messages')}
                            className="relative z-10 p-2.5 md:p-3 rounded-full text-[var(--text-muted)] hover:text-[var(--text-main)] transition-all"
                        >
                            <MessageSquare size={20} />
                        </button>
                    </div>
                </motion.nav>

                {/* Invitations Dropdown (Portal-like) */}
                {/* Dropdowns (Invitations & Notifications) */}
                <AnimatePresence>
                    {showInvitations && (
                        <motion.div
                            initial={{ opacity: 0, y: 20, scale: 0.95 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: 20, scale: 0.95 }}
                            className="fixed bottom-[100px] left-4 right-4 z-[60] flex justify-center"
                        >
                            <div className="glass p-1 rounded-[2.5rem] shadow-2xl ring-1 ring-white/10 w-full max-w-[400px] overflow-hidden">
                                <div className="bg-gradient-to-br from-violet-600/20 to-indigo-600/20 p-6">
                                    <div className="flex items-center justify-between mb-4">
                                        <h3 className="text-xl font-bold text-white flex items-center gap-2">
                                            <UserPlus className="text-[var(--accent)]" size={24} />
                                            Invitaciones
                                        </h3>
                                        <button
                                            onClick={() => setShowInvitations(false)}
                                            className="p-2 hover:bg-white/10 rounded-full text-white/50 hover:text-white transition-all"
                                        >
                                            <X size={20} />
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
                            className="fixed bottom-[100px] left-4 right-4 z-[60] flex justify-center"
                        >
                            <div className="glass p-1 rounded-[2.5rem] shadow-2xl ring-1 ring-white/10 w-full max-w-[400px] overflow-hidden">
                                <div className="bg-gradient-to-br from-[var(--accent)]/20 to-violet-600/20 p-6 flex flex-col max-h-[70vh]">
                                    <div className="flex items-center justify-between mb-4">
                                        <h3 className="text-xl font-bold text-white flex items-center gap-2">
                                            <Bell className="text-[var(--accent)]" size={24} />
                                            Notificaciones
                                        </h3>
                                        <button
                                            onClick={() => setShowNotifs(false)}
                                            className="p-2 hover:bg-white/10 rounded-full text-white/50 hover:text-white transition-all"
                                        >
                                            <X size={20} />
                                        </button>
                                    </div>

                                    <div className="overflow-y-auto pr-2 custom-scrollbar space-y-3">
                                        {notifications.length === 0 ? (
                                            <div className="py-10 text-center text-white/30 italic text-sm">
                                                No tienes notificaciones
                                            </div>
                                        ) : (
                                            notifications.map((notif) => (
                                                <div
                                                    key={notif.id}
                                                    onClick={() => handleNotificationClick(notif)}
                                                    className={`p - 4 rounded - 3xl border border - white / 5 cursor - pointer transition - all hover: bg - white / 5 group relative overflow - hidden ${!notif.read ? 'bg-white/5' : 'opacity-60'} `}
                                                >
                                                    {!notif.read && (
                                                        <div className="absolute top-0 right-0 w-1.5 h-1.5 bg-[var(--accent)] rounded-full m-3 shadow-[0_0_8px_rgba(var(--accent-rgb),0.6)]" />
                                                    )}
                                                    <div className="flex gap-3">
                                                        <div className="w-10 h-10 rounded-2xl bg-white/5 flex items-center justify-center shrink-0 border border-white/10 text-[var(--accent)]">
                                                            {['comment_photo', 'comment_post'].includes(notif.type) && <MessageSquare size={18} />}
                                                            {['tag_photo', 'tag_post'].includes(notif.type) && <Tag size={18} />}
                                                            {['photo_post', 'video_post', 'status_post'].includes(notif.type) && <Bell size={18} />}
                                                            {notif.type === 'message' && <Mail size={18} />}
                                                            {notif.type === 'friendship' && <UserPlus size={18} />}
                                                        </div>
                                                        <div className="flex-1 min-w-0">
                                                            <p className="text-[13px] text-white/90 leading-tight group-hover:text-[var(--accent)] transition-colors">
                                                                {notif.content}
                                                            </p>
                                                            <p className="text-[10px] text-white/30 font-bold uppercase mt-1 tracking-widest">
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
                                            className="mt-4 py-2 text-[11px] font-black text-white/30 hover:text-[var(--accent)] uppercase tracking-widest transition-colors"
                                        >
                                            Marcar todas como leídas
                                        </button>
                                    )}
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
