import React, { useState, useEffect, useRef } from 'react';
import { X, Tag, MessageSquare, ThumbsUp, ChevronLeft, ChevronRight, User as UserIcon } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../api';
import { useAuth } from '../contexts/AuthContext';
import { usePhotoModal } from '../contexts/PhotoModalContext';
import CommentSection from './CommentSection';
import { Photo } from '../types';

const PhotoModal: React.FC = () => {
    const { activePhoto, playlist, isOpen, closePhoto, openPhoto, updateActivePhoto } = usePhotoModal();
    const { user } = useAuth();
    const navigate = useNavigate();
    const [isTagging, setIsTagging] = useState(false);
    const [friends, setFriends] = useState<any[]>([]);
    const [showFriendList, setShowFriendList] = useState<{ x: number, y: number } | null>(null);
    const imgRef = useRef<HTMLImageElement>(null);

    useEffect(() => {
        if (activePhoto) {
            fetchFriends();
        }
    }, [activePhoto]);

    const fetchFriends = async () => {
        try {
            const res = await api.get('/friendships');
            setFriends(res.data.friends);
        } catch (e) {
            console.error(e);
        }
    };

    const getPhotoUrl = (url: string) => {
        if (url.startsWith('http')) return url;
        return `${import.meta.env.VITE_API_URL?.replace('/api', '')}${url}`;
    };

    const handleToggleLike = async () => {
        if (!activePhoto) return;
        try {
            const res = await api.post(`/photos/${activePhoto.id}/like`);
            const { liked } = res.data;
            updateActivePhoto({
                ...activePhoto,
                likedByMe: liked,
                _count: {
                    ...activePhoto._count,
                    likes: liked ? (activePhoto._count?.likes || 0) + 1 : Math.max(0, (activePhoto._count?.likes || 0) - 1)
                }
            });
        } catch (e) {
            console.error(e);
        }
    };

    const handleImageClick = (e: React.MouseEvent<HTMLImageElement>) => {
        if (!isTagging || !imgRef.current) return;
        const rect = imgRef.current.getBoundingClientRect();
        const x = ((e.clientX - rect.left) / rect.width) * 100;
        const y = ((e.clientY - rect.top) / rect.height) * 100;
        setShowFriendList({ x, y });
    };

    const handleAddTag = async (friendId: number) => {
        if (!activePhoto || !showFriendList) return;
        try {
            const res = await api.post(`/photos/${activePhoto.id}/tag`, {
                userId: friendId,
                x: showFriendList.x,
                y: showFriendList.y
            });
            updateActivePhoto({
                ...activePhoto,
                photoTags: [...(activePhoto.photoTags || []), res.data.tag]
            });
            setShowFriendList(null);
            setIsTagging(false);
        } catch (e) {
            console.error(e);
            alert('Error al etiquetar');
        }
    };

    const goToPrev = () => {
        if (playlist.length <= 1 || !activePhoto) return;
        const idx = playlist.findIndex(p => p.id === activePhoto.id);
        const prevIdx = idx > 0 ? idx - 1 : playlist.length - 1;
        openPhoto(playlist[prevIdx], playlist);
    };

    const goToNext = () => {
        if (playlist.length <= 1 || !activePhoto) return;
        const idx = playlist.findIndex(p => p.id === activePhoto.id);
        const nextIdx = idx < playlist.length - 1 ? idx + 1 : 0;
        openPhoto(playlist[nextIdx], playlist);
    };

    if (!isOpen || !activePhoto) return null;

    const currentIndex = playlist.findIndex(p => p.id === activePhoto.id);
    const userName = activePhoto.user?.name || 'Usuario';

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black/95 backdrop-blur-2xl z-[999999] flex flex-col"
            >
                {/* Top Bar - Modern Glass */}
                <motion.div
                    initial={{ y: -20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    className="h-[70px] glass border-b border-white/10 flex items-center justify-between px-6"
                >
                    <div className="flex items-center gap-6">
                        {playlist.length > 0 && (
                            <div className="flex items-center gap-3">
                                <span className="text-white/40 text-sm font-bold">{currentIndex + 1}</span>
                                <div className="w-[1px] h-4 bg-white/20" />
                                <span className="text-white/40 text-sm font-bold">{playlist.length}</span>
                            </div>
                        )}
                        <Link
                            to={`/profile/${activePhoto.userId}`}
                            onClick={closePhoto}
                            className="flex items-center gap-3 group"
                        >
                            <img
                                src={activePhoto.user?.avatar || `/api/proxy/avatar?name=${encodeURIComponent(userName)}`}
                                className="w-10 h-10 rounded-full ring-2 ring-white/20 group-hover:ring-[var(--accent)] transition-all"
                                alt={userName}
                            />
                            <div>
                                <h4 className="text-white font-bold text-sm group-hover:text-[var(--accent)] transition-colors">{userName}</h4>
                                <p className="text-white/40 text-xs">{new Date(activePhoto.createdAt).toLocaleDateString()}</p>
                            </div>
                        </Link>
                    </div>
                    <button
                        onClick={closePhoto}
                        className="p-3 text-white/60 hover:text-white hover:bg-white/10 rounded-full transition-all"
                    >
                        <X size={24} />
                    </button>
                </motion.div>

                {/* Main Content */}
                <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
                    {/* Navigation Left */}
                    {playlist.length > 1 && (
                        <button
                            onClick={goToPrev}
                            className="hidden md:flex w-[80px] items-center justify-center hover:bg-white/5 text-white/30 hover:text-white transition-all group"
                        >
                            <div className="p-4 rounded-full group-hover:bg-white/10 transition-all">
                                <ChevronLeft size={32} strokeWidth={2.5} />
                            </div>
                        </button>
                    )}

                    {/* Image Core */}
                    <div className="flex-1 flex flex-col items-center justify-center p-8 relative">
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            className="relative inline-block max-w-full max-h-full"
                        >
                            <img
                                ref={imgRef}
                                src={getPhotoUrl(activePhoto.url)}
                                onClick={handleImageClick}
                                className={`max-w-full max-h-[70vh] md:max-h-[80vh] object-contain rounded-3xl shadow-[0_20px_60px_rgba(0,0,0,0.8)] ${isTagging ? 'cursor-crosshair' : ''}`}
                                alt="Selected"
                            />

                            {/* Tags */}
                            {activePhoto.photoTags?.map((tag: any) => (
                                <div key={tag.id} className="absolute group/tag" style={{ left: `${tag.x}%`, top: `${tag.y}%` }}>
                                    <div className="w-6 h-6 mt-[-12px] ml-[-12px] border-2 border-white shadow-lg bg-[var(--accent)]/20 backdrop-blur-md rounded-full opacity-0 group-hover:opacity-100 group-hover/tag:opacity-100 transition-all">
                                        <UserIcon size={14} className="text-white m-auto mt-[3px]" />
                                    </div>
                                    <div className="hidden group-hover/tag:block absolute top-full left-1/2 translate-x-[-50%] mt-2 bg-black/90 backdrop-blur-xl text-white text-xs px-3 py-1.5 rounded-full whitespace-nowrap z-20 border border-white/20">
                                        {tag.user.name}
                                    </div>
                                </div>
                            ))}

                            {/* Friend List Selector */}
                            {showFriendList && (
                                <motion.div
                                    initial={{ opacity: 0, scale: 0.9 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    className="absolute glass border border-white/20 shadow-2xl rounded-2xl w-[220px] z-50 overflow-hidden"
                                    style={{ left: `${showFriendList.x}%`, top: `${showFriendList.y}%` }}
                                >
                                    <div className="p-3 bg-white/5 border-b border-white/10 text-sm font-bold text-white flex justify-between items-center">
                                        ¿Quién es?
                                        <button onClick={() => setShowFriendList(null)} className="p-1 hover:bg-white/10 rounded-full transition-all">
                                            <X size={14} />
                                        </button>
                                    </div>
                                    <div className="max-h-[250px] overflow-y-auto p-2">
                                        {friends.map(f => (
                                            <button
                                                key={f.id}
                                                onClick={() => handleAddTag(f.id)}
                                                className="w-full p-2.5 rounded-xl hover:bg-[var(--accent)] hover:text-white cursor-pointer transition-all flex items-center gap-3 group"
                                            >
                                                <img
                                                    src={f.avatar || `/api/proxy/avatar?name=${encodeURIComponent(f.name)}`}
                                                    className="w-8 h-8 rounded-full ring-2 ring-white/20 group-hover:ring-white transition-all"
                                                    alt={f.name}
                                                />
                                                <span className="text-sm font-medium text-white/80 group-hover:text-white truncate">{f.name}</span>
                                            </button>
                                        ))}
                                    </div>
                                </motion.div>
                            )}
                        </motion.div>

                        {/* Mobile Controls */}
                        {playlist.length > 1 && (
                            <div className="md:hidden flex gap-4 mt-6">
                                <button
                                    onClick={goToPrev}
                                    className="p-3 text-white bg-white/10 backdrop-blur-md rounded-full border border-white/20 hover:bg-white/20 transition-all"
                                >
                                    <ChevronLeft size={24} />
                                </button>
                                <button
                                    onClick={goToNext}
                                    className="p-3 text-white bg-white/10 backdrop-blur-md rounded-full border border-white/20 hover:bg-white/20 transition-all"
                                >
                                    <ChevronRight size={24} />
                                </button>
                            </div>
                        )}
                    </div>

                    {/* Sidebar - Modern Glass */}
                    <motion.div
                        initial={{ x: 20, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        className="w-full md:w-[420px] glass border-l border-white/10 flex flex-col md:h-full overflow-y-auto"
                    >
                        <div className="p-6 border-b border-white/10">
                            <div className="flex flex-wrap gap-2 mb-6">
                                <button
                                    onClick={handleToggleLike}
                                    className={`flex items-center gap-2 px-4 py-2.5 rounded-full text-sm font-bold transition-all ${activePhoto.likedByMe
                                            ? 'bg-gradient-to-r from-[var(--accent)] to-violet-500 text-white shadow-[0_0_20px_rgba(var(--accent-rgb),0.4)]'
                                            : 'bg-white/5 text-white/80 border border-white/20 hover:bg-white/10'
                                        }`}
                                >
                                    <ThumbsUp size={16} fill={activePhoto.likedByMe ? 'white' : 'transparent'} />
                                    {activePhoto.likedByMe ? '¡Me mola!' : 'Me mola'}
                                </button>
                                {user?.id === activePhoto.userId && (
                                    <button
                                        onClick={() => setIsTagging(!isTagging)}
                                        className={`flex items-center gap-2 px-4 py-2.5 rounded-full text-sm font-bold transition-all ${isTagging
                                                ? 'bg-gradient-to-r from-[var(--accent)] to-violet-500 text-white shadow-[0_0_20px_rgba(var(--accent-rgb),0.4)]'
                                                : 'bg-white/5 text-white/80 border border-white/20 hover:bg-white/10'
                                            }`}
                                    >
                                        <Tag size={16} />
                                        {isTagging ? 'Haz clic en la foto' : 'Etiquetar'}
                                    </button>
                                )}
                            </div>

                            {activePhoto._count?.likes! > 0 && (
                                <div className="mb-4 text-sm text-white/90 font-medium bg-white/5 backdrop-blur-md p-3 rounded-2xl border border-white/10 flex items-center gap-2">
                                    <ThumbsUp size={16} className="text-[var(--accent)]" />
                                    <span>A {activePhoto._count?.likes} {activePhoto._count?.likes === 1 ? 'persona le mola' : 'personas les mola'}</span>
                                </div>
                            )}

                            {activePhoto.photoTags?.length! > 0 && (
                                <div>
                                    <h5 className="text-xs font-bold text-white/40 uppercase mb-3 tracking-wider">En esta foto:</h5>
                                    <div className="flex flex-wrap gap-2">
                                        {activePhoto.photoTags?.map((tag: any) => (
                                            <Link
                                                to={`/profile/${tag.userId}`}
                                                key={tag.id}
                                                onClick={closePhoto}
                                                className="bg-white/5 border border-white/20 text-white/90 text-sm px-3 py-1.5 rounded-full hover:bg-[var(--accent)] hover:border-[var(--accent)] hover:text-white transition-all"
                                            >
                                                {tag.user.name}
                                            </Link>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="p-6 flex-1">
                            <h5 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
                                <MessageSquare size={18} className="text-[var(--accent)]" />
                                Comentarios
                            </h5>
                            <div className="bg-white/5 backdrop-blur-md rounded-2xl border border-white/10 p-4">
                                <CommentSection photoId={activePhoto.id} isPhoto={true} initialCommentsCount={activePhoto._count?.comments || 0} />
                            </div>
                        </div>
                    </motion.div>

                    {/* Navigation Right */}
                    {playlist.length > 1 && (
                        <button
                            onClick={goToNext}
                            className="hidden md:flex w-[80px] items-center justify-center hover:bg-white/5 text-white/30 hover:text-white transition-all group"
                        >
                            <div className="p-4 rounded-full group-hover:bg-white/10 transition-all">
                                <ChevronRight size={32} strokeWidth={2.5} />
                            </div>
                        </button>
                    )}
                </div>
            </motion.div>
        </AnimatePresence>
    );
};

export default PhotoModal;
