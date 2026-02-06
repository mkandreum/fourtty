import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';
import { useAuth } from '../contexts/AuthContext';
import { Mail, MessageCircle, User } from 'lucide-react';

const Inbox: React.FC = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [conversations, setConversations] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchConversations = async () => {
            try {
                const res = await api.get('/messages/conversations');
                setConversations(res.data.conversations);
            } catch (e) {
                console.error("Error fetching conversations:", e);
            } finally {
                setIsLoading(false);
            }
        };
        fetchConversations();
    }, []);

    const getAvatarUrl = (avatar?: string) => {
        if (!avatar) return `/api/proxy/avatar?name=${encodeURIComponent('User')}`;
        if (avatar.startsWith('http')) return avatar;
        return `${import.meta.env.VITE_API_URL?.replace('/api', '')}${avatar}`;
    };

    if (isLoading) return <div className="p-4">Cargando mensajes...</div>;

    return (
        <div className="bg-white rounded-[4px] border border-[#dce5ed] p-4 min-h-[600px]">
            <div className="flex justify-between items-center mb-6 border-b border-[#eee] pb-4">
                <h1 className="text-[20px] font-bold text-[#333] flex items-center gap-2">
                    <Mail size={20} className="text-[#005599]" /> Mensajes
                </h1>
                <div className="text-[12px] text-gray-500">Tienes {conversations.length} conversaciones</div>
            </div>

            {conversations.length === 0 ? (
                <div className="flex flex-col items-center justify-center p-20 text-gray-400 gap-4">
                    <MessageCircle size={48} className="opacity-20" />
                    <p>No tienes mensajes privados todavía.</p>
                </div>
            ) : (
                <div className="flex flex-col">
                    {conversations.map((conv) => {
                        const otherUser = conv.otherUser;
                        const lastMsg = conv.lastMessage;
                        return (
                            <div
                                key={otherUser.id}
                                onClick={() => navigate(`/profile/${otherUser.id}`)} // For now, chat is on profile or ChatBar
                                className="flex items-center gap-4 p-4 border-b border-[#eee] hover:bg-[#f6f9fc] cursor-pointer transition-colors"
                            >
                                <img
                                    src={getAvatarUrl(otherUser.avatar)}
                                    className="w-12 h-12 rounded-[4px] object-cover border border-[#ddd]"
                                    alt={otherUser.name}
                                />
                                <div className="flex-1 min-w-0">
                                    <div className="flex justify-between items-start mb-1">
                                        <h3 className="font-bold text-[#005599] text-[13px] truncate">{otherUser.name}</h3>
                                        <span className="text-[10px] text-gray-400 whitespace-nowrap">
                                            {new Date(lastMsg.createdAt).toLocaleDateString()}
                                        </span>
                                    </div>
                                    <p className="text-[12px] text-gray-600 truncate">
                                        {lastMsg.senderId === user?.id ? 'Tú: ' : ''}{lastMsg.content}
                                    </p>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
};

export default Inbox;
