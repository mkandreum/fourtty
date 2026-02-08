import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { Home, Image as ImageIcon, Search, User, Bell, Camera, Sun, Moon, LogOut, Plus, UserPlus, MessageSquare, X } from 'lucide-react';
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
    const [showUploadModal, setShowUploadModal] = useState(false);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [showInvitations, setShowInvitations] = useState(false);

    useEffect(() => {
        if (!user) return;

        const fetchNotifs = async () => {
            try {
                const res = await api.get('/notifications');
                setUnreadNotifs(res.data.notifications.filter((n: any) => !n.read).length);
            } catch (e) {
                console.error(e);
            }
        };
        fetchNotifs();

        if (socket) {
            socket.on('notification', () => {
                setUnreadNotifs(prev => prev + 1);
            });
            return () => {
                socket.off('notification');
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
                            onClick={() => setShowInvitations(!showInvitations)}
                            className={`p-2 rounded-full transition-all ${showInvitations ? 'bg-[var(--accent)] text-white' : 'text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-white/5'}`}
                            title="Invitaciones"
                        >
                            <UserPlus size={20} />
                        </button>
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
                    className="glass flex items-center gap-1 md:gap-3 p-1.5 rounded-full shadow-[0_20px_50px_rgba(0,0,0,0.5)] ring-1 ring-white/20 max-w-[95vw] md:max-w-full relative overflow-hidden"
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
                            const active = currentPath === item.path || (item.path !== '/' && currentPath.startsWith(item.path));
                            return (
                                <Link
                                    key={item.path}
                                    to={item.path}
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
                <AnimatePresence>
                    {showInvitations && (
                        <motion.div
                            initial={{ opacity: 0, y: -20, scale: 0.95 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: -20, scale: 0.95 }}
                            className="fixed top-[80px] left-4 right-4 z-[60] flex justify-center"
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
