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
        <div className="bg-[var(--card-bg)] rounded-2xl border border-[var(--border-color)] p-4 min-h-[400px] transition-colors duration-200">
            <div className="flex justify-between items-center mb-6 border-b border-[var(--border-soft)] pb-4 transition-colors duration-200">
                <h1 className="text-[20px] font-bold text-[var(--text-main)] flex items-center gap-2 transition-colors duration-200">
                    <Mail size={20} className="text-[var(--accent)]" /> Mensajes
                </h1>
                <div className="text-[12px] text-[var(--text-muted)]">Tienes {conversations.length} conversaciones</div>
            </div>

            {conversations.length === 0 ? (
                <div className="flex flex-col items-center justify-center p-20 text-[var(--text-muted)] gap-4">
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
                                className="flex items-center gap-4 p-4 border-b border-[var(--border-soft)] hover:bg-[var(--border-soft)] cursor-pointer transition-colors"
                            >
                                <img
                                    src={getAvatarUrl(otherUser.avatar)}
                                    className="w-12 h-12 rounded-2xl object-cover border border-[var(--border-color)]"
                                    alt={otherUser.name}
                                />
                                <div className="flex-1 min-w-0">
                                    <div className="flex justify-between items-start mb-1">
                                        <h3 className="font-bold text-[var(--accent)] text-[13px] truncate">{otherUser.name}</h3>
                                        <span className="text-[10px] text-[var(--text-muted)] whitespace-nowrap">
                                            {new Date(lastMsg.createdAt).toLocaleDateString()}
                                        </span>
                                    </div>
                                    <p className="text-[12px] text-[var(--text-muted)] truncate transition-colors duration-200">
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
