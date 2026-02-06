import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Tag, X, User as UserIcon, MessageSquare, ThumbsUp, ChevronLeft, ChevronRight, Plus } from 'lucide-react';
import api from '../api';
import { useAuth } from '../contexts/AuthContext';
import CommentSection from './CommentSection';
import { Photo } from '../types';

const Gallery: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const { user } = useAuth();
    const [photos, setPhotos] = useState<Photo[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [userName, setUserName] = useState('');
    const [selectedPhotoIndex, setSelectedPhotoIndex] = useState<number | null>(null);
    const [isTagging, setIsTagging] = useState(false);
    const [friends, setFriends] = useState<any[]>([]);
    const [showFriendList, setShowFriendList] = useState<{ x: number, y: number } | null>(null);
    const navigate = useNavigate();
    const imgRef = useRef<HTMLImageElement>(null);

    const targetUserId = id || user?.id;

    useEffect(() => {
        fetchPhotos();
        fetchFriends();
    }, [targetUserId]);

    const fetchPhotos = async () => {
        if (!targetUserId) return;
        try {
            const [photosRes, userRes] = await Promise.all([
                api.get(`/photos/user/${targetUserId}`),
                api.get(`/users/${targetUserId}`)
            ]);
            setPhotos(photosRes.data.photos);
            setUserName(userRes.data.user.name);
        } catch (e) { console.error(e); }
        finally { setIsLoading(false); }
    };

    const fetchFriends = async () => {
        try {
            const res = await api.get(`/friendships`);
            setFriends(res.data.friends);
        } catch (e) { console.error(e); }
    };

    const getPhotoUrl = (url: string) => {
        if (url.startsWith('http')) return url;
        return `${import.meta.env.VITE_API_URL?.replace('/api', '')}${url}`;
    };

    const handleImageClick = (e: React.MouseEvent<HTMLImageElement>) => {
        if (!isTagging || !imgRef.current) return;

        const rect = imgRef.current.getBoundingClientRect();
        const x = ((e.clientX - rect.left) / rect.width) * 100;
        const y = ((e.clientY - rect.top) / rect.height) * 100;

        setShowFriendList({ x, y });
    };

    const handleAddTag = async (friendId: number) => {
        if (selectedPhotoIndex === null || !showFriendList) return;

        const photoId = photos[selectedPhotoIndex].id;
        try {
            const res = await api.post(`/photos/${photoId}/tag`, {
                userId: friendId,
                x: showFriendList.x,
                y: showFriendList.y
            });

            // Update local state
            const updatedPhotos = [...photos];
            updatedPhotos[selectedPhotoIndex].photoTags = [
                ...(updatedPhotos[selectedPhotoIndex].photoTags || []),
                res.data.tag
            ];
            setPhotos(updatedPhotos);
            setShowFriendList(null);
            setIsTagging(false);
        } catch (e) {
            console.error(e);
            alert('Este usuario ya está etiquetado o ha ocurrido un error.');
        }
    };

    const handleToggleLike = async (photoId: number) => {
        try {
            const res = await api.post(`/photos/${photoId}/like`);
            const { liked } = res.data;

            setPhotos(prev => prev.map(p => {
                if (p.id === photoId) {
                    return {
                        ...p,
                        likedByMe: liked,
                        _count: {
                            ...p._count,
                            likes: liked ? (p._count?.likes || 0) + 1 : Math.max(0, (p._count?.likes || 0) - 1)
                        }
                    };
                }
                return p;
            }));
        } catch (e) {
            console.error(e);
        }
    };

    const handleDeletePhoto = async (photoId: number) => {
        if (!window.confirm("¿Estás seguro de que quieres borrar esta foto de tu galería?")) return;

        try {
            await api.delete(`/photos/${photoId}`);
            setPhotos(prev => prev.filter(p => p.id !== photoId));
            setSelectedPhotoIndex(null);
        } catch (error) {
            console.error("Error deleting photo:", error);
            alert("No se pudo borrar la foto");
        }
    };

    if (isLoading) return <div className="p-10 text-center opacity-50">Cargando galería...</div>;

    const currentPhoto = selectedPhotoIndex !== null ? photos[selectedPhotoIndex] : null;

    return (
        <div className="bg-[#f0f2f5] min-h-screen">
            <div className="max-w-[980px] mx-auto p-4 flex flex-col gap-4">

                <div className="bg-white rounded-[4px] border border-[#dce5ed] p-4 shadow-sm">
                    <div className="flex justify-between items-center mb-6 border-b border-[#eee] pb-4">
                        <h1 className="text-[20px] font-bold text-[#333]">
                            Fotos de {userName} <span className="text-[#999] font-normal text-[14px]">({photos.length})</span>
                        </h1>
                        <button
                            onClick={() => navigate(-1)}
                            className="text-[#005599] text-[12px] font-bold hover:underline"
                        >
                            « Volver al perfil
                        </button>
                    </div>

                    {photos.length === 0 ? (
                        <div className="p-10 text-center text-gray-500">
                            Este usuario aún no ha subido ninguna foto a su galería.
                        </div>
                    ) : (
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 md:gap-4">
                            {photos.map((photo, index) => (
                                <div
                                    key={photo.id}
                                    className="flex flex-col gap-1 group"
                                    onClick={() => setSelectedPhotoIndex(index)}
                                >
                                    <div className="p-1 bg-white border border-[#ccc] shadow-sm hover:shadow-md transition-shadow cursor-pointer">
                                        <img
                                            src={getPhotoUrl(photo.url)}
                                            className="w-full aspect-square object-cover"
                                            alt={photo.caption || 'Foto'}
                                        />
                                    </div>
                                    <div className="flex justify-between items-center px-1">
                                        <div className="text-[9px] text-gray-400">{new Date(photo.createdAt).toLocaleDateString()}</div>
                                        {photo.photoTags?.length > 0 && (
                                            <div className="flex items-center gap-0.5 text-[9px] text-[#59B200] font-bold">
                                                <Tag size={8} fill="#59B200" /> {photo.photoTags.length}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Photo Viewer Modal */}
            {selectedPhotoIndex !== null && currentPhoto && (
                <div className="fixed inset-0 bg-[#333] z-[100] flex flex-col">
                    {/* Top Bar */}
                    <div className="h-[45px] bg-black text-white flex items-center justify-between px-4 border-b border-[#444]">
                        <div className="flex items-center gap-4 text-[13px] font-bold">
                            <span className="text-[#999]">{selectedPhotoIndex + 1} de {photos.length}</span>
                            <span className="hidden sm:inline border-l border-[#444] pl-4">{userName} » Galería</span>
                        </div>
                        <button onClick={() => setSelectedPhotoIndex(null)} className="text-[#999] hover:text-white">
                            <X size={24} />
                        </button>
                    </div>

                    {/* Main Content (3 Columns) - Scrollable on mobile */}
                    <div className="flex-1 flex flex-col md:flex-row overflow-y-auto md:overflow-hidden">
                        {/* Navigation Left */}
                        <div
                            className="hidden md:flex w-[60px] items-center justify-center cursor-pointer hover:bg-black/20 text-white/30 hover:text-white transition-colors"
                            onClick={() => setSelectedPhotoIndex(prev => (prev! > 0 ? prev! - 1 : photos.length - 1))}
                        >
                            <ChevronLeft size={48} />
                        </div>

                        {/* Image Core */}
                        <div className="flex-1 bg-black flex flex-col items-center justify-center p-4 relative group">
                            <div className="relative inline-block max-w-full max-h-full">
                                <img
                                    ref={imgRef}
                                    src={getPhotoUrl(currentPhoto.url)}
                                    onClick={handleImageClick}
                                    className={`max-w-full max-h-[70vh] md:max-h-[85vh] object-contain shadow-2xl ${isTagging ? 'cursor-crosshair' : ''}`}
                                    alt="Selected"
                                />

                                {/* Render Tags */}
                                {currentPhoto.photoTags?.map((tag: any) => (
                                    <div
                                        key={tag.id}
                                        className="absolute group/tag"
                                        style={{ left: `${tag.x}%`, top: `${tag.y}%` }}
                                    >
                                        <div className="w-4 h-4 mt-[-8px] ml-[-8px] border-2 border-white shadow-md bg-transparent rounded-sm opacity-0 group-hover:opacity-100 group-hover/tag:opacity-100 transition-opacity"></div>
                                        <div className="hidden group-hover/tag:block absolute top-full left-1/2 translate-x-[-50%] mt-1 bg-black/80 text-white text-[9px] px-1.5 py-0.5 rounded-[2px] whitespace-nowrap z-20">
                                            {tag.user.name}
                                        </div>
                                    </div>
                                ))}

                                {/* Friend List Selector */}
                                {showFriendList && (
                                    <div
                                        className="absolute bg-white border border-[#ccc] shadow-xl rounded-[2px] w-[180px] z-50 overflow-hidden"
                                        style={{ left: `${showFriendList.x}%`, top: `${showFriendList.y}%` }}
                                    >
                                        <div className="p-2 bg-[#f0f2f5] border-b border-[#ccc] text-[11px] font-bold text-[#333] flex justify-between items-center">
                                            ¿Quién es?
                                            <X size={12} className="cursor-pointer" onClick={() => setShowFriendList(null)} />
                                        </div>
                                        <div className="max-h-[200px] overflow-y-auto">
                                            {friends.map(friend => (
                                                <div
                                                    key={friend.id}
                                                    onClick={() => handleAddTag(friend.id)}
                                                    className="p-1.5 border-b border-[#eee] last:border-0 hover:bg-[#2B7BB9] hover:text-white cursor-pointer transition-colors flex items-center gap-2"
                                                >
                                                    <img src={friend.avatar || `https://ui-avatars.com/api/?name=${friend.name}`} className="w-5 h-5 rounded-full" />
                                                    <span className="text-[10px] truncate">{friend.name}</span>
                                                </div>
                                            ))}
                                            {friends.length === 0 && (
                                                <div className="p-4 text-center text-[10px] text-[#999]">No tienes amigos todavía</div>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Mobile Controls */}
                            <div className="md:hidden flex gap-8 mt-4">
                                <button
                                    onClick={() => setSelectedPhotoIndex(prev => (prev! > 0 ? prev! - 1 : photos.length - 1))}
                                    className="text-white p-2 rounded-full border border-white/20"
                                >
                                    <ChevronLeft size={24} />
                                </button>
                                <button
                                    onClick={() => setSelectedPhotoIndex(prev => (prev! < photos.length - 1 ? prev! + 1 : 0))}
                                    className="text-white p-2 rounded-full border border-white/20"
                                >
                                    <ChevronRight size={24} />
                                </button>
                            </div>
                        </div>

                        {/* Info & Comments Sidebar */}
                        <div className="w-full md:w-[350px] bg-[#f2f6f9] border-l border-[#ddd] flex flex-col overflow-y-auto">
                            <div className="p-4 border-b border-[#ddd] bg-white">
                                <div className="flex items-center gap-3 mb-4">
                                    <img
                                        src={currentPhoto.user?.avatar || `https://ui-avatars.com/api/?name=${userName}`}
                                        className="w-10 h-10 rounded-[2px] border border-[#ccc]"
                                    />
                                    <div>
                                        <h4 className="text-[13px] font-bold text-[#005599]">{userName}</h4>
                                        <p className="text-[10px] text-gray-500">Subida el {new Date(currentPhoto.createdAt).toLocaleDateString()}</p>
                                    </div>
                                </div>

                                <div className="flex flex-wrap gap-2 mb-4">
                                    <button
                                        onClick={() => handleToggleLike(currentPhoto.id)}
                                        className={`flex items-center gap-1.5 px-3 py-1 rounded-[3px] text-[11px] font-bold transition-all ${currentPhoto.likedByMe
                                            ? 'bg-[#59B200] text-white border border-[#4a9400]'
                                            : 'bg-white text-[#555] border border-[#ccc] hover:bg-gray-50'
                                            }`}
                                    >
                                        <ThumbsUp size={12} fill={currentPhoto.likedByMe ? 'white' : 'transparent'} />
                                        {currentPhoto.likedByMe ? '¡Me mola!' : 'Me mola'}
                                    </button>

                                    {user?.id === Number(targetUserId) && (
                                        <>
                                            <button
                                                onClick={() => setIsTagging(!isTagging)}
                                                className={`flex items-center gap-1.5 px-3 py-1 rounded-[3px] text-[11px] font-bold transition-all ${isTagging
                                                    ? 'bg-[#59B200] text-white border border-[#4a9400] scale-105'
                                                    : 'bg-white text-[#555] border border-[#ccc] hover:bg-gray-50'
                                                    }`}
                                            >
                                                <Tag size={12} fill={isTagging ? 'white' : 'transparent'} />
                                                {isTagging ? 'Haz clic en la foto' : 'Etiquetar'}
                                            </button>

                                            <button
                                                onClick={() => handleDeletePhoto(currentPhoto.id)}
                                                className="flex items-center gap-1.5 px-3 py-1 rounded-[3px] text-[11px] font-bold bg-white text-red-500 border border-red-200 hover:bg-red-50 transition-all"
                                            >
                                                <X size={12} />
                                                Borrar
                                            </button>
                                        </>
                                    )}
                                </div>

                                {currentPhoto._count?.likes > 0 && (
                                    <div className="mb-4 flex items-center gap-2 text-[11px] text-[#59B200] font-bold bg-[#f6fff0] p-2 rounded border border-[#e2efd9]">
                                        <ThumbsUp size={14} fill="#59B200" />
                                        <span>A {currentPhoto._count.likes} {currentPhoto._count.likes === 1 ? 'persona le mola esto' : 'personas les mola esto'}</span>
                                    </div>
                                )}

                                {currentPhoto.photoTags?.length > 0 && (
                                    <div className="mb-4">
                                        <h5 className="text-[10px] font-bold text-[#888] uppercase mb-2 flex items-center gap-1">
                                            <Tag size={10} className="text-[#59B200]" /> En esta foto aparecéis:
                                        </h5>
                                        <div className="flex flex-wrap gap-1.5">
                                            {currentPhoto.photoTags.map((tag: any) => (
                                                <Link
                                                    to={`/profile/${tag.userId}`}
                                                    key={tag.id}
                                                    className="bg-white border border-[#ccc] text-[#005599] text-[11px] px-2 py-0.5 rounded-[2px] font-medium hover:bg-[#2B7BB9] hover:text-white hover:border-[#2B7BB9] transition-all"
                                                >
                                                    {tag.user.name}
                                                </Link>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>

                            <div className="p-4 flex-1">
                                <h5 className="text-[11px] font-bold text-[#333] mb-4 flex items-center gap-1">
                                    <MessageSquare size={14} className="text-[#59B200]" /> Comentarios
                                </h5>
                                <CommentSection photoId={currentPhoto.id} isPhoto={true} initialCommentsCount={0} />
                            </div>
                        </div>

                        {/* Navigation Right */}
                        <div
                            className="hidden md:flex w-[60px] items-center justify-center cursor-pointer hover:bg-black/20 text-white/30 hover:text-white transition-colors"
                            onClick={() => setSelectedPhotoIndex(prev => (prev! < photos.length - 1 ? prev! + 1 : 0))}
                        >
                            <ChevronRight size={48} />
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Gallery;
