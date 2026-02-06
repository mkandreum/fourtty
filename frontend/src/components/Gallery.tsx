import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api';
import { useAuth } from '../contexts/AuthContext';

const Gallery: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const { user } = useAuth();
    const [photos, setPhotos] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [userName, setUserName] = useState('');
    const navigate = useNavigate();

    const targetUserId = id || user?.id;

    useEffect(() => {
        const fetchPhotos = async () => {
            if (!targetUserId) return;
            try {
                const [photosRes, userRes] = await Promise.all([
                    api.get(`/photos/user/${targetUserId}`),
                    api.get(`/users/${targetUserId}`)
                ]);
                setPhotos(photosRes.data.photos);
                setUserName(userRes.data.user.name);
            } catch (e) {
                console.error(e);
            } finally {
                setIsLoading(false);
            }
        };
        fetchPhotos();
    }, [targetUserId]);

    const getPhotoUrl = (url: string) => {
        if (url.startsWith('http')) return url;
        return `${import.meta.env.VITE_API_URL?.replace('/api', '')}${url}`;
    };

    if (isLoading) return <div className="p-4">Cargando galería...</div>;

    return (
        <div className="bg-white rounded-[4px] border border-[#dce5ed] p-4 min-h-[600px]">
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
                    {photos.map(photo => (
                        <div key={photo.id} className="flex flex-col gap-1">
                            <div className="p-1 bg-white border border-[#ccc] shadow-sm hover:shadow-md transition-shadow cursor-pointer">
                                <img
                                    src={getPhotoUrl(photo.url)}
                                    className="w-full aspect-square object-cover"
                                    alt={photo.caption || 'Foto'}
                                />
                            </div>
                            {photo.caption && (
                                <div className="text-[10px] text-gray-600 truncate px-1">{photo.caption}</div>
                            )}
                            <div className="text-[9px] text-gray-400 px-1">{new Date(photo.createdAt).toLocaleDateString()}</div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default Gallery;
