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

    const navItems = [
        { path: '/', icon: <Home size={20} />, label: 'Inicio' },
        { path: '/profile/photos', icon: <ImageIcon size={20} />, label: 'Fotos' },
        { path: '/people', icon: <Search size={20} />, label: 'Gente' },
        { path: '/profile', icon: <User size={20} />, label: 'Perfil' },
    ];

    const currentPath = location.pathname;

    return (
        <>
            {/* TOP BAR - Utilities & Invitations */}
            <div className="fixed top-4 left-0 right-0 z-50 flex justify-center px-4">
                <motion.nav
                    initial={{ y: -100, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    className="glass flex items-center justify-between gap-4 px-4 py-2 rounded-full shadow-[0_12px_40px_rgba(0,0,0,0.3)] ring-1 ring-white/20 w-full max-w-[980px] relative overflow-hidden"
                >
                    {/* Brand / Notifications Group */}
                    <div className="flex items-center gap-1">
                        <button
                            onClick={() => setShowInvitations(!showInvitations)}
                            className={`p-2 rounded-full transition-all ${showInvitations ? 'bg-[var(--accent)] text-white' : 'text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-white/5'}`}
                            title="Invitaciones"
                        >
                            <UserPlus size={20} />
                        </button>

                        <div className="relative">
                            <button
                                onClick={() => navigate('/notifications')}
                                className="p-2 text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-white/5 rounded-full transition-all"
                                title="Notificaciones"
                            >
                                <Bell size={20} />
                                {unreadNotifs > 0 && (
                                    <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-[var(--card-bg)] shadow-[0_0_8px_rgba(239,68,68,0.4)]" />
                                )}
                            </button>
                        </div>
                    </div>

                    {/* Action Items */}
                    <div className="flex items-center gap-1">
                        {/* Theme Toggle */}
                        <button
                            onClick={toggleTheme}
                            className="p-2 text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-white/5 rounded-full transition-all"
                        >
                            {theme === 'light' ? <Moon size={20} /> : <Sun size={20} />}
                        </button>

                        <div className="h-6 w-[1px] bg-[var(--border-color)] mx-1" />

                        {/* Logout */}
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

            {/* BOTTOM NAV - Core Navigation */}
            <div className="fixed bottom-0 left-0 right-0 z-50 flex justify-center px-2 pb-[calc(1.5rem+env(safe-area-inset-bottom,0px))] md:pb-8">
                <motion.nav
                    initial={{ y: 100, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    className="glass flex items-center gap-2 p-2 rounded-full shadow-[0_20px_50px_rgba(0,0,0,0.5)] ring-1 ring-white/20 max-w-full relative overflow-hidden"
                >
                    {/* Left Links */}
                    <div className="flex items-center gap-1 bg-black/5 dark:bg-white/5 p-1 rounded-full relative">
                        {navItems.slice(0, 2).map((item) => {
                            const active = currentPath === item.path;
                            return (
                                <Link
                                    key={item.path}
                                    to={item.path}
                                    className={`relative z-10 p-3 rounded-full transition-all duration-300 flex items-center justify-center ${active ? 'text-white' : 'text-[var(--text-muted)] hover:text-[var(--text-main)]'}`}
                                >
                                    {item.icon}
                                    {active && (
                                        <motion.div
                                            layoutId="nav-pill"
                                            className="absolute inset-0 bg-[var(--accent)] rounded-full -z-10 shadow-lg shadow-[var(--accent)]/20"
                                            transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                                        />
                                    )}
                                </Link>
                            );
                        })}
                    </div>

                    {/* Center Brand */}
                    <div
                        onClick={() => navigate('/')}
                        className="flex flex-col items-center justify-center px-4 cursor-pointer hover:scale-105 transition-transform"
                    >
                        <span className="brand-font text-[24px] md:text-[28px] leading-none mb-0.5">fourtty</span>
                        <div className="w-8 h-1 bg-[var(--accent)] rounded-full opacity-50" />
                    </div>

                    {/* Right Links & Chat */}
                    <div className="flex items-center gap-1 bg-black/5 dark:bg-white/5 p-1 rounded-full relative">
                        {navItems.slice(2).map((item) => {
                            const active = currentPath === item.path || (item.path !== '/' && currentPath.startsWith(item.path));
                            return (
                                <Link
                                    key={item.path}
                                    to={item.path}
                                    className={`relative z-10 p-3 rounded-full transition-all duration-300 flex items-center justify-center ${active ? 'text-white' : 'text-[var(--text-muted)] hover:text-[var(--text-main)]'}`}
                                >
                                    {item.icon}
                                    {active && (
                                        <motion.div
                                            layoutId="pill"
                                            className="absolute inset-0 bg-gradient-to-tr from-[var(--accent)] to-violet-500 rounded-full -z-10 shadow-[0_0_15px_rgba(var(--accent-rgb),0.5)]"
                                            transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                                        />
                                    )}
                                </Link>
                            );
                        })}

                        {/* Chat Icon - Functional placeholder for now */}
                        <button className="relative z-10 p-3 rounded-full text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-white/5 transition-all">
                            <MessageSquare size={20} />
                            <div className="absolute top-2 right-2 w-2 h-2 bg-fuchsia-500 rounded-full border border-[var(--card-bg)]" />
                        </button>
                    </div>

                    <div className="h-6 w-[1px] bg-[var(--border-color)] mx-1" />

                    {/* Upload button */}
                    <div className="pr-1">
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
                            className="w-12 h-12 bg-gradient-to-tr from-[var(--accent)] to-violet-500 text-white rounded-full hover:shadow-[0_0_20px_rgba(var(--accent-rgb),0.5)] transition-all duration-300 flex items-center justify-center shadow-lg active:scale-90"
                        >
                            <Plus size={24} strokeWidth={3} />
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
