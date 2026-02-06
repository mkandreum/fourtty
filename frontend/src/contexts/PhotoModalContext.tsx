import React, { createContext, useContext, useState, ReactNode } from 'react';
import { Photo } from '../types';

interface PhotoModalContextType {
    activePhoto: Photo | null;
    playlist: Photo[];
    isOpen: boolean;
    openPhoto: (photo: Photo, playlist?: Photo[]) => void;
    updateActivePhoto: (photo: Photo) => void;
    closePhoto: () => void;
}

const PhotoModalContext = createContext<PhotoModalContextType | undefined>(undefined);

export const PhotoModalProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [activePhoto, setActivePhoto] = useState<Photo | null>(null);
    const [playlist, setPlaylist] = useState<Photo[]>([]);
    const [isOpen, setIsOpen] = useState(false);

    const openPhoto = (photo: Photo, photos: Photo[] = []) => {
        setActivePhoto(photo);
        setPlaylist(photos);
        setIsOpen(true);
    };

    const updateActivePhoto = (photo: Photo) => {
        setActivePhoto(photo);
        // Also update in playlist to keep navigation consistent
        setPlaylist(prev => prev.map(p => p.id === photo.id ? photo : p));
    };

    const closePhoto = () => {
        setActivePhoto(null);
        setPlaylist([]);
        setIsOpen(false);
    };

    return (
        <PhotoModalContext.Provider value={{ activePhoto, playlist, isOpen, openPhoto, updateActivePhoto, closePhoto }}>
            {children}
        </PhotoModalContext.Provider>
    );
};

export const usePhotoModal = () => {
    const context = useContext(PhotoModalContext);
    if (!context) {
        throw new Error('usePhotoModal must be used within a PhotoModalProvider');
    }
    return context;
};
