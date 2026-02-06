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
import { ThumbsUp } from 'lucide-react';

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
                        className="text-[#005599] font-bold hover:underline cursor-pointer"
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
            return <span key={i}>{part}</span>;
        });
    };

    const getAvatarUrl = (avatar?: string, name?: string) => {
        if (!avatar) return `/api/proxy/avatar?name=${encodeURIComponent(name || 'User')}`;
        if (avatar.startsWith('http')) return avatar;
        return `${import.meta.env.VITE_API_URL?.replace('/api', '')}${avatar}`;
    };

    return (
        <div className="mt-1">
            {/* Interaction Summary / Toggle */}
            <div className="flex items-center gap-1 text-[11px] mb-1">
                {commentCount > 0 && (
                    <div
                        className="flex items-center gap-1 cursor-pointer group"
                        onClick={handleToggleComments}
                    >
                        <MessageSquare size={10} className="text-[#59B200] fill-[#59B200]" />
                        <span className="text-[#59B200] font-bold group-hover:underline">
                            {commentCount} comentarios
                        </span>
                    </div>
                )}

                {commentCount === 0 && (
                    <div
                        className="text-[#005599] hover:underline cursor-pointer font-bold"
                        onClick={() => setIsExpanded(true)}
                    >
                        Comentar
                    </div>
                )}
            </div>

            {/* Comments List & Input */}
            {isExpanded && (
                <div className="bg-[#f2fbff] p-2 rounded-[2px] mt-1 border border-[#cfe2f3]">
                    {isLoading && <div className="text-[10px] text-gray-500 mb-2">Cargando...</div>}

                    <div className="flex flex-col gap-3 mb-2">
                        {comments.map(comment => (
                            <div key={comment.id} className="flex gap-2">
                                <img
                                    src={getAvatarUrl(comment.user.avatar, comment.user.name)}
                                    className="w-8 h-8 object-cover border border-[#ccc] rounded-[2px] p-[1px] bg-white shadow-sm cursor-pointer"
                                    alt={comment.user.name}
                                    onClick={() => navigate(`/profile/${comment.userId}`)}
                                />
                                <div className="flex-1">
                                    <div className="text-[12px] leading-snug">
                                        <span
                                            className="text-[#005599] font-bold cursor-pointer hover:underline"
                                            onClick={() => navigate(`/profile/${comment.userId}`)}
                                        >
                                            {comment.user.name}
                                        </span>
                                        <span className="text-[#333]"> {renderCommentContent(comment.content)}</span>
                                    </div>
                                    <div className="text-[10px] flex items-center gap-2 mt-0.5">
                                        <span className="text-[#999]">{new Date(comment.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                        <span className="text-[#999]">·</span>
                                        <button
                                            onClick={() => handleToggleCommentLike(comment.id)}
                                            className={`font-bold hover:underline ${comment.isLiked ? 'text-[#59B200]' : 'text-[#005599]'}`}
                                        >
                                            Mola
                                        </button>
                                        {comment.likeCount && comment.likeCount > 0 && (
                                            <div className="flex items-center gap-0.5 text-[#59B200] font-bold">
                                                <ThumbsUp size={10} fill="#59B200" />
                                                {comment.likeCount}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Input */}
                    <div className="flex gap-2 mt-2 pt-2 border-t border-[#dcecf9]">
                        <img
                            src={getAvatarUrl(user?.avatar, user?.name)}
                            className="w-7 h-7 object-cover border border-[#ccc] rounded-[2px]"
                            alt="Me"
                        />
                        <form onSubmit={handleSubmitComment} className="flex-1 flex gap-1">
                            <input
                                type="text"
                                className="flex-1 border border-[#b2c2d1] rounded-[2px] p-1.5 text-[11px] !bg-white focus:outline-none focus:border-[#5C95C4] shadow-inner"
                                placeholder="Escribe un comentario..."
                                value={newComment}
                                onChange={(e) => setNewComment(e.target.value)}
                            />
                            <button
                                type="submit"
                                className="bg-[#005599] text-white text-[11px] font-bold px-3 py-1 rounded-[2px] hover:bg-[#00447a] transition-colors"
                                disabled={!newComment.trim()}
                            >
                                Publicar
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default CommentSection;
