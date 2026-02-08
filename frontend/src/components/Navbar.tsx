import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { Home, Image as ImageIcon, Search, User, Bell, Camera, Sun, Moon, LogOut, Plus } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { useSocket } from '../contexts/SocketContext';
import PhotoUploadModal from './PhotoUploadModal';
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
            <div className="fixed bottom-0 left-0 right-0 z-50 flex justify-center px-2 pb-[calc(1rem+env(safe-area-inset-bottom,0px))] md:pb-6">
                <motion.nav
                    initial={{ y: 100, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    className="glass flex items-center gap-0.5 md:gap-1 p-1.5 md:p-2 rounded-full shadow-[0_8px_32px_rgba(0,0,0,0.15)] ring-1 ring-white/10 max-w-full overflow-hidden"
                >
                    {/* Brand Logo - hidden on small mobile */}
                    <div className="hidden sm:flex pl-4 pr-3 items-center">
                        <span className="brand-font text-[18px] md:text-[20px]">fourtty</span>
                    </div>

                    {/* Desktop/Mobile Nav Items */}
                    <div className="flex items-center gap-1 bg-black/5 dark:bg-white/5 p-1 rounded-full relative">
                        {navItems.map((item) => {
                            const active = currentPath === item.path || (item.path !== '/' && currentPath.startsWith(item.path));
                            return (
                                <Link
                                    key={item.path}
                                    to={item.path}
                                    className={`relative z-10 p-2 md:p-2.5 rounded-full transition-all duration-300 flex items-center justify-center ${active ? 'text-white' : 'text-[var(--text-muted)] hover:text-[var(--text-main)]'}`}
                                >
                                    {item.icon}
                                    {active && (
                                        <motion.div
                                            layoutId="pill"
                                            className="absolute inset-0 bg-[var(--accent)] rounded-full -z-10 shadow-lg"
                                            transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                                        />
                                    )}
                                </Link>
                            );
                        })}
                    </div>

                    <div className="h-6 w-[1px] bg-[var(--border-color)] mx-1" />

                    {/* Action Items */}
                    <div className="flex items-center gap-1 pr-1">
                        {/* Upload */}
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
                            className="p-2.5 bg-[var(--accent)]/10 text-[var(--accent)] rounded-full hover:bg-[var(--accent)] hover:text-white transition-all duration-300"
                        >
                            <Plus size={20} />
                        </button>

                        {/* Theme Toggle */}
                        <button
                            onClick={toggleTheme}
                            className="p-2.5 text-[var(--text-muted)] hover:text-[var(--text-main)] transition-colors"
                        >
                            {theme === 'light' ? <Moon size={20} /> : <Sun size={20} />}
                        </button>

                        {/* Notifications */}
                        <div className="relative">
                            <button
                                onClick={() => navigate('/notifications')}
                                className="p-2 md:p-2.5 text-[var(--text-muted)] hover:text-[var(--text-main)] transition-colors"
                            >
                                <Bell size={20} />
                                {unreadNotifs > 0 && (
                                    <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-[var(--card-bg)]" />
                                )}
                            </button>
                        </div>

                        {/* Logout - hidden on small phone mobile to save space, available in drawer/profile if needed, but keeping for now with reduced padding */}
                        <button
                            onClick={logout}
                            className="p-2 md:p-2.5 text-red-400 hover:text-red-500 transition-colors"
                        >
                            <LogOut size={20} />
                        </button>
                    </div>
                </motion.nav>
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
