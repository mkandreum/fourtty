import React, { useState, useEffect } from 'react';
import { MessageSquare } from 'lucide-react';
import api from '../api';
import { Comment, User } from '../types';
import { useAuth } from '../contexts/AuthContext';

interface CommentSectionProps {
    postId?: number;
    photoId?: number;
    initialCommentsCount: number;
    isPhoto?: boolean;
}

import { useNavigate } from 'react-router-dom';
import { ThumbsUp, Send } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const CommentSection: React.FC<CommentSectionProps> = ({ postId, photoId, initialCommentsCount, isPhoto }) => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [comments, setComments] = useState<Comment[]>([]);
    const [commentCount, setCommentCount] = useState(initialCommentsCount);
    const [isExpanded, setIsExpanded] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [newComment, setNewComment] = useState('');

    const fetchComments = async () => {
        setIsLoading(true);
        try {
            const endpoint = isPhoto ? `/comments/photo/${photoId}` : `/comments/post/${postId}`;
            const response = await api.get(endpoint);
            setComments(response.data.comments);
        } catch (error) {
            console.error("Error fetching comments:", error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleToggleComments = () => {
        if (!isExpanded && comments.length === 0 && (commentCount > 0 || isPhoto)) {
            fetchComments();
        }
        setIsExpanded(!isExpanded);
    };

    const handleToggleCommentLike = async (commentId: number) => {
        try {
            const response = await api.post(`/comments/${commentId}/like`);
            const { liked } = response.data;

            setComments(prev => prev.map(c => {
                if (c.id === commentId) {
                    return {
                        ...c,
                        isLiked: liked,
                        likeCount: liked ? (c.likeCount || 0) + 1 : Math.max(0, (c.likeCount || 0) - 1)
                    };
                }
                return c;
            }));
        } catch (error) {
            console.error("Error toggling comment like:", error);
        }
    };

    const handleSubmitComment = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newComment.trim()) return;

        try {
            const endpoint = isPhoto ? `/comments/photo/${photoId}` : `/comments/post/${postId}`;
            const response = await api.post(endpoint, {
                content: newComment
            });

            const postedComment = response.data.comment;
            setComments(prev => [...prev, postedComment]);
            setCommentCount(prev => prev + 1);
            setNewComment('');

            if (!isExpanded) setIsExpanded(true);

        } catch (error) {
            console.error("Error posting comment:", error);
        }
    };

    const renderCommentContent = (content: string) => {
        const parts = content.split(/(@[\w\sáéíóúÁÉÍÓÚñÑ]+)/g);
        return parts.map((part, i) => {
            if (part.startsWith('@')) {
                return (
                    <span
                        key={i}
                        className="text-[var(--accent)] font-bold hover:underline cursor-pointer"
                        onClick={(e) => {
                            e.stopPropagation();
                            // In a real app we'd need the userId for the mention, 
                            // here we'll just try to find it or let navigate handle it
                            // For now just styling it as requested.
                        }}
                    >
                        {part}
                    </span>
                );
            }
            return <span key={i} className="text-white/80">{part}</span>;
        });
    };

    const getAvatarUrl = (avatar?: string, name?: string) => {
        if (!avatar) return `/api/proxy/avatar?name=${encodeURIComponent(name || 'User')}`;
        if (avatar.startsWith('http')) return avatar;
        return `${import.meta.env.VITE_API_URL?.replace('/api', '')}${avatar}`;
    };

    return (
        <div className="mt-2">
            {/* Interaction Summary / Toggle */}
            <div className="flex items-center gap-4 text-[10px] mb-2 px-1">
                {commentCount > 0 && (
                    <button
                        className="flex items-center gap-1.5 cursor-pointer group hover:opacity-100 opacity-60 transition-opacity"
                        onClick={handleToggleComments}
                    >
                        <MessageSquare size={12} className="text-[var(--accent)]" />
                        <span className="text-white font-black uppercase tracking-widest group-hover:text-[var(--accent)]">
                            {commentCount} comentarios
                        </span>
                    </button>
                )}

                <button
                    className="flex items-center gap-1.5 opacity-60 hover:opacity-100 transition-opacity group"
                    onClick={() => setIsExpanded(true)}
                >
                    <div className="text-white font-black uppercase tracking-widest group-hover:text-[var(--accent)] flex items-center gap-1.5">
                        <Send size={12} className="text-[var(--accent)]" />
                        Comentar
                    </div>
                </button>
            </div>

            {/* Comments List & Input */}
            <AnimatePresence>
                {isExpanded && (
                    <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="bg-[var(--card-bg)] p-4 rounded-[1.5rem] mt-2 border border-[var(--border-color)] backdrop-blur-md shadow-sm"
                    >
                        {isLoading && (
                            <div className="text-[10px] text-[var(--text-muted)] font-black uppercase tracking-widest mb-4 flex items-center gap-2">
                                <div className="w-3 h-3 border border-[var(--accent)] border-t-transparent rounded-full animate-spin" />
                                Buscando...
                            </div>
                        )}

                        <div className="flex flex-col gap-4 mb-6">
                            {comments.map(comment => (
                                <div key={comment.id} className="flex gap-3 group/comment">
                                    <img
                                        src={getAvatarUrl(comment.user.avatar, comment.user.name)}
                                        className="w-10 h-10 object-cover rounded-2xl ring-1 ring-[var(--border-color)] shadow-lg cursor-pointer transition-transform duration-300 hover:scale-105"
                                        alt={comment.user.name}
                                        onClick={() => navigate(`/profile/${comment.userId}`)}
                                    />
                                    <div className="flex-1 min-w-0">
                                        <div className="bg-[var(--bg-color)] p-3 rounded-[1.2rem] border border-[var(--border-color)] group-hover/comment:border-[var(--border-color)] transition-colors">
                                            <div
                                                className="text-[14px] font-black text-[var(--text-main)] cursor-pointer hover:text-[var(--accent)] transition-colors mb-0.5"
                                                onClick={() => navigate(`/profile/${comment.userId}`)}
                                            >
                                                {comment.user.name}
                                            </div>
                                            <div className="text-[13px] leading-relaxed text-[var(--text-main)]"> {renderCommentContent(comment.content)}</div>
                                        </div>
                                        <div className="text-[10px] flex items-center gap-3 mt-1.5 ml-1 opacity-40 group-hover/comment:opacity-100 transition-opacity">
                                            <span className="text-[var(--text-muted)] font-bold uppercase tracking-widest">{new Date(comment.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                            <button
                                                onClick={() => handleToggleCommentLike(comment.id)}
                                                className={`font-black uppercase tracking-widest transition-colors ${comment.isLiked ? 'text-[var(--accent)]' : 'text-[var(--text-muted)] hover:text-[var(--text-main)]'}`}
                                            >
                                                Mola
                                            </button>
                                            {comment.likeCount && comment.likeCount > 0 && (
                                                <div className="flex items-center gap-1 text-[var(--accent)] font-black">
                                                    <ThumbsUp size={10} className="neon-glow" fill="currentColor" />
                                                    {comment.likeCount}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Input */}
                        <div className="flex gap-3 items-center">
                            <img
                                src={getAvatarUrl(user?.avatar, user?.name)}
                                className="w-10 h-10 object-cover rounded-full ring-1 ring-[var(--accent)]/30 p-0.5"
                                alt="Me"
                            />
                            <form onSubmit={handleSubmitComment} className="flex-1 relative group">
                                <input
                                    type="text"
                                    className="w-full bg-[var(--bg-color)] text-[var(--text-main)] border border-[var(--border-color)] rounded-full pl-5 pr-12 py-3 text-[13px] focus:outline-none focus:border-[var(--accent)] focus:ring-1 focus:ring-[var(--accent)]/20 transition-all placeholder-[var(--text-muted)]"
                                    placeholder="Añade un comentario..."
                                    value={newComment}
                                    onChange={(e) => setNewComment(e.target.value)}
                                />
                                <button
                                    type="submit"
                                    disabled={!newComment.trim()}
                                    className={`absolute right-2 top-1.5 w-9 h-9 flex items-center justify-center rounded-full transition-all ${newComment.trim() ? 'bg-[var(--accent)] text-white shadow-[0_0_10px_rgba(var(--accent-rgb),0.5)]' : 'bg-[var(--card-bg)] text-[var(--text-muted)]'}`}
                                >
                                    <Send size={16} />
                                </button>
                            </form>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default CommentSection;
