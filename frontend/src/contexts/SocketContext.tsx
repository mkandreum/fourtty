import React, { createContext, useContext, useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuth } from './AuthContext';

interface SocketContextType {
    socket: Socket | null;
    isConnected: boolean;
}

const SocketContext = createContext<SocketContextType>({ socket: null, isConnected: false });

export const useSocket = () => useContext(SocketContext);

export const SocketProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { user, isAuthenticated } = useAuth();
    const [socket, setSocket] = useState<Socket | null>(null);
    const [isConnected, setIsConnected] = useState(false);

    useEffect(() => {
        if (isAuthenticated && user) {
            // In production, use VITE_API_URL stripped of '/api' or window.location.origin
            const apiUrl = import.meta.env.VITE_API_URL;
            const socketUrl = apiUrl
                ? apiUrl.replace('/api', '')
                : (import.meta.env.MODE === 'production' ? window.location.origin : 'http://localhost:5000');

            console.log('🔌 Connecting to socket at:', socketUrl);

            const newSocket = io(socketUrl, {
                auth: { token: localStorage.getItem('token') },
                withCredentials: true,
                transports: ['websocket', 'polling'],
                path: '/socket.io'
            });

            newSocket.on('connect', () => {
                console.log('✅ Connected to socket server');
                setIsConnected(true);
                newSocket.emit('authenticate', user.id);
            });

            newSocket.on('disconnect', () => {
                console.log('❌ Disconnected from socket server');
                setIsConnected(false);
            });

            setSocket(newSocket);

            return () => {
                newSocket.disconnect();
            };
        } else {
            if (socket) {
                socket.disconnect();
                setSocket(null);
                setIsConnected(false);
            }
        }
    }, [isAuthenticated, user?.id]);

    return (
        <SocketContext.Provider value={{ socket, isConnected }}>
            {children}
        </SocketContext.Provider>
    );
};
