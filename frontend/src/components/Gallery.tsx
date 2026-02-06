import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Tag, X, User as UserIcon, MessageSquare, ThumbsUp, ChevronLeft, ChevronRight, Plus } from 'lucide-react';
import api from '../api';
import { useAuth } from '../contexts/AuthContext';
import { usePhotoModal } from '../contexts/PhotoModalContext';
import CommentSection from './CommentSection';
import { Photo } from '../types';
import { motion, AnimatePresence } from 'framer-motion';

const Gallery: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const { user } = useAuth();
    const { openPhoto } = usePhotoModal();
    const [photos, setPhotos] = useState<Photo[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [userName, setUserName] = useState('');
    const navigate = useNavigate();

    const targetUserId = id || user?.id;

    useEffect(() => {
        fetchPhotos();
    }, [targetUserId]);

    const fetchPhotos = async () => {
        if (!targetUserId) return;
        try {
            const [photosRes, userRes] = await Promise.all([
                api.get(`/photos/user/${targetUserId}`),
                api.get(`/users/${targetUserId}`)
            ]);
            const photosWithUser = photosRes.data.photos.map((p: any) => ({
                ...p,
                user: userRes.data.user
            }));
            setPhotos(photosWithUser);
            setUserName(userRes.data.user.name);
        } catch (e) { console.error(e); }
        finally { setIsLoading(false); }
    };

    const getPhotoUrl = (url: string) => {
        if (url.startsWith('http')) return url;
        return `${import.meta.env.VITE_API_URL?.replace('/api', '')}${url}`;
    };

    if (isLoading) return <div className="p-10 text-center opacity-50">Cargando galería...</div>;

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
                        <motion.div
                            variants={{
                                hidden: { opacity: 0 },
                                show: {
                                    opacity: 1,
                                    transition: {
                                        staggerChildren: 0.05
                                    }
                                }
                            }}
                            initial="hidden"
                            animate="show"
                            className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 md:gap-4"
                        >
                            {photos.map((photo, index) => (
                                <motion.div
                                    key={photo.id}
                                    variants={{
                                        hidden: { opacity: 0, scale: 0.9 },
                                        show: { opacity: 1, scale: 1 }
                                    }}
                                    whileHover={{ y: -5, transition: { type: 'spring', stiffness: 300 } }}
                                    className="flex flex-col gap-1 group"
                                >
                                    <div className="p-1 bg-white border border-[#ccc] shadow-sm hover:shadow-md transition-shadow cursor-pointer">
                                        <img
                                            src={getPhotoUrl(photo.url)}
                                            className="w-full aspect-square object-cover"
                                            onClick={() => openPhoto(photo, photos)}
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
                                </motion.div>
                            ))}
                        </motion.div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Gallery;
