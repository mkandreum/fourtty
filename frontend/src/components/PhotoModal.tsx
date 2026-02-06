import React, { useState, useEffect, useRef } from 'react';
import { X, Tag, MessageSquare, ThumbsUp, ChevronLeft, ChevronRight } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../api';
import { useAuth } from '../contexts/AuthContext';
import { usePhotoModal } from '../contexts/PhotoModalContext';
import CommentSection from './CommentSection';
import { Photo } from '../types';

const PhotoModal: React.FC = () => {
    const { activePhoto, playlist, isOpen, closePhoto, openPhoto } = usePhotoModal();
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
        if (!localPhoto) return;
        try {
            const res = await api.post(`/photos/${localPhoto.id}/like`);
            const { liked } = res.data;
            setLocalPhoto(prev => prev ? ({
                ...prev,
                likedByMe: liked,
                _count: {
                    ...prev._count,
                    likes: liked ? (prev._count?.likes || 0) + 1 : Math.max(0, (prev._count?.likes || 0) - 1)
                }
            }) : null);
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
        if (!localPhoto || !showFriendList) return;
        try {
            const res = await api.post(`/photos/${localPhoto.id}/tag`, {
                userId: friendId,
                x: showFriendList.x,
                y: showFriendList.y
            });
            setLocalPhoto(prev => prev ? ({
                ...prev,
                photoTags: [...(prev.photoTags || []), res.data.tag]
            }) : null);
            setShowFriendList(null);
            setIsTagging(false);
        } catch (e) {
            console.error(e);
            alert('Error al etiquetar');
        }
    };

    const goToPrev = () => {
        if (playlist.length <= 1 || !localPhoto) return;
        const idx = playlist.findIndex(p => p.id === localPhoto.id);
        const prevIdx = idx > 0 ? idx - 1 : playlist.length - 1;
        openPhoto(playlist[prevIdx], playlist);
    };

    const goToNext = () => {
        if (playlist.length <= 1 || !localPhoto) return;
        const idx = playlist.findIndex(p => p.id === localPhoto.id);
        const nextIdx = idx < playlist.length - 1 ? idx + 1 : 0;
        openPhoto(playlist[nextIdx], playlist);
    };

    if (!isOpen || !activePhoto) return null;

    const currentIndex = playlist.findIndex(p => p.id === activePhoto.id);
    const userName = activePhoto.user?.name || 'Usuario';

    return (
        <div className="fixed inset-0 bg-[#333] z-[999999] flex flex-col animate-in fade-in duration-200">
            {/* Top Bar */}
            <div className="h-[45px] bg-black text-white flex items-center justify-between px-4 border-b border-[#444]">
                <div className="flex items-center gap-4 text-[13px] font-bold">
                    {playlist.length > 0 && (
                        <span className="text-[#999]">{currentIndex + 1} de {playlist.length}</span>
                    )}
                    <span className="hidden sm:inline border-l border-[#444] pl-4">{userName} » Fotos</span>
                </div>
                <button onClick={closePhoto} className="text-[#999] hover:text-white transition-colors">
                    <X size={24} />
                </button>
            </div>

            {/* Main Content */}
            <div className="flex-1 flex flex-col md:flex-row overflow-y-auto md:overflow-hidden">
                {/* Navigation Left */}
                {playlist.length > 1 && (
                    <div
                        className="hidden md:flex w-[60px] items-center justify-center cursor-pointer hover:bg-black/20 text-white/30 hover:text-white transition-colors"
                        onClick={goToPrev}
                    >
                        <ChevronLeft size={48} />
                    </div>
                )}

                {/* Image Core */}
                <div className="flex-1 bg-black flex flex-col items-center justify-center p-4 relative group">
                    <div className="relative inline-block max-w-full max-h-full">
                        <img
                            ref={imgRef}
                            src={getPhotoUrl(activePhoto.url)}
                            onClick={handleImageClick}
                            className={`max-w-full max-h-[70vh] md:max-h-[85vh] object-contain shadow-2xl ${isTagging ? 'cursor-crosshair' : ''}`}
                            alt="Selected"
                        />
                        {/* Tags */}
                        {activePhoto.photoTags?.map((tag: any) => (
                            <div key={tag.id} className="absolute group/tag" style={{ left: `${tag.x}%`, top: `${tag.y}%` }}>
                                <div className="w-4 h-4 mt-[-8px] ml-[-8px] border-2 border-white shadow-md bg-transparent rounded-sm opacity-0 group-hover:opacity-100 group-hover/tag:opacity-100 transition-opacity"></div>
                                <div className="hidden group-hover/tag:block absolute top-full left-1/2 translate-x-[-50%] mt-1 bg-black/80 text-white text-[9px] px-1.5 py-0.5 rounded-[2px] whitespace-nowrap z-20">
                                    {tag.user.name}
                                </div>
                            </div>
                        ))}

                        {/* Friend List Selector */}
                        {showFriendList && (
                            <div className="absolute bg-white border border-[#ccc] shadow-xl rounded-[2px] w-[180px] z-50 overflow-hidden"
                                style={{ left: `${showFriendList.x}%`, top: `${showFriendList.y}%` }}>
                                <div className="p-2 bg-[#f0f2f5] border-b border-[#ccc] text-[11px] font-bold text-[#333] flex justify-between items-center">
                                    ¿Quién es?
                                    <X size={12} className="cursor-pointer" onClick={() => setShowFriendList(null)} />
                                </div>
                                <div className="max-h-[200px] overflow-y-auto">
                                    {friends.map(f => (
                                        <div key={f.id} onClick={() => handleAddTag(f.id)}
                                            className="p-1.5 border-b border-[#eee] last:border-0 hover:bg-[#2B7BB9] hover:text-white cursor-pointer transition-colors flex items-center gap-2">
                                            <img src={f.avatar || `/api/proxy/avatar?name=${encodeURIComponent(f.name)}`} className="w-5 h-5 rounded-full" />
                                            <span className="text-[10px] truncate">{f.name}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Mobile Controls */}
                    {playlist.length > 1 && (
                        <div className="md:hidden flex gap-8 mt-4">
                            <button onClick={goToPrev} className="text-white p-2 rounded-full border border-white/20"><ChevronLeft size={24} /></button>
                            <button onClick={goToNext} className="text-white p-2 rounded-full border border-white/20"><ChevronRight size={24} /></button>
                        </div>
                    )}
                </div>

                {/* Sidebar */}
                <div className="w-full md:w-[350px] bg-[#f2f6f9] border-l border-[#ddd] flex flex-col overflow-y-auto">
                    <div className="p-4 border-b border-[#ddd] bg-white">
                        <div className="flex items-center gap-3 mb-4">
                            <img src={activePhoto.user?.avatar || `/api/proxy/avatar?name=${encodeURIComponent(userName)}`}
                                className="w-10 h-10 rounded-[2px] border border-[#ccc]" />
                            <div>
                                <h4 className="text-[13px] font-bold text-[#005599]">{userName}</h4>
                                <p className="text-[10px] text-gray-500">Subida el {new Date(activePhoto.createdAt).toLocaleDateString()}</p>
                            </div>
                        </div>

                        <div className="flex flex-wrap gap-2 mb-4">
                            <button onClick={handleToggleLike}
                                className={`flex items-center gap-1.5 px-3 py-1 rounded-[3px] text-[11px] font-bold transition-all ${activePhoto.likedByMe ? 'bg-[#59B200] text-white' : 'bg-white text-[#555] border border-[#ccc]'}`}>
                                <ThumbsUp size={12} fill={activePhoto.likedByMe ? 'white' : 'transparent'} />
                                {activePhoto.likedByMe ? '¡Me mola!' : 'Me mola'}
                            </button>
                            {user?.id === activePhoto.userId && (
                                <button onClick={() => setIsTagging(!isTagging)}
                                    className={`flex items-center gap-1.5 px-3 py-1 rounded-[3px] text-[11px] font-bold transition-all ${isTagging ? 'bg-[#59B200] text-white' : 'bg-white text-[#555] border border-[#ccc]'}`}>
                                    <Tag size={12} /> {isTagging ? 'Haz clic en la foto' : 'Etiquetar'}
                                </button>
                            )}
                        </div>

                        {activePhoto._count?.likes! > 0 && (
                            <div className="mb-4 text-[11px] text-[#59B200] font-bold bg-[#f6fff0] p-2 rounded border border-[#e2efd9] flex items-center gap-2">
                                <ThumbsUp size={14} fill="#59B200" />
                                <span>A {activePhoto._count?.likes} {activePhoto._count?.likes === 1 ? 'persona le mola' : 'personas les mola'}</span>
                            </div>
                        )}

                        {activePhoto.photoTags?.length! > 0 && (
                            <div className="mb-4">
                                <h5 className="text-[10px] font-bold text-[#888] uppercase mb-2">En esta foto:</h5>
                                <div className="flex flex-wrap gap-1.5">
                                    {activePhoto.photoTags?.map((tag: any) => (
                                        <Link to={`/profile/${tag.userId}`} key={tag.id} onClick={closePhoto}
                                            className="bg-white border border-[#ccc] text-[#005599] text-[11px] px-2 py-0.5 rounded-[2px] hover:bg-[#2B7BB9] hover:text-white">
                                            {tag.user.name}
                                        </Link>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="p-4 flex-1">
                        <h5 className="text-[11px] font-bold text-[#333] mb-4 flex items-center gap-1"><MessageSquare size={14} className="text-[#59B200]" /> Comentarios</h5>
                        <CommentSection photoId={activePhoto.id} isPhoto={true} initialCommentsCount={activePhoto._count?.comments || 0} />
                    </div>
                </div>

                {playlist.length > 1 && (
                    <div
                        className="hidden md:flex w-[60px] items-center justify-center cursor-pointer hover:bg-black/20 text-white/30 hover:text-white transition-colors"
                        onClick={goToNext}
                    >
                        <ChevronRight size={48} />
                    </div>
                )}
            </div>
        </div>
    );
};

export default PhotoModal;
