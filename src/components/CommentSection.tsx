import React, { useState, useEffect } from 'react';
import { MessageSquare } from 'lucide-react';
import api from '../api';
import { Comment, User } from '../types';
import { useAuth } from '../contexts/AuthContext';

interface CommentSectionProps {
    postId: number;
    initialCommentsCount: number;
}

const CommentSection: React.FC<CommentSectionProps> = ({ postId, initialCommentsCount }) => {
    const { user } = useAuth();
    const [comments, setComments] = useState<Comment[]>([]);
    const [commentCount, setCommentCount] = useState(initialCommentsCount);
    const [isExpanded, setIsExpanded] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [newComment, setNewComment] = useState('');

    const fetchComments = async () => {
        setIsLoading(true);
        try {
            const response = await api.get(`/comments/post/${postId}`);
            setComments(response.data.comments);
        } catch (error) {
            console.error("Error fetching comments:", error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleToggleComments = () => {
        if (!isExpanded && comments.length === 0 && commentCount > 0) {
            fetchComments();
        }
        setIsExpanded(!isExpanded);
    };

    const handleSubmitComment = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newComment.trim()) return;

        try {
            const response = await api.post('/comments', {
                content: newComment,
                postId
            });

            const postedComment = response.data.comment;
            // Append new comment
            setComments(prev => [...prev, postedComment]);
            setCommentCount(prev => prev + 1);
            setNewComment('');

            // Should auto-expand if not already
            if (!isExpanded) setIsExpanded(true);

        } catch (error) {
            console.error("Error posting comment:", error);
        }
    };

    const getAvatarUrl = (avatar?: string, name?: string) => {
        if (!avatar) return `https://ui-avatars.com/api/?name=${name || 'User'}`;
        if (avatar.startsWith('http')) return avatar;
        return `${import.meta.env.VITE_API_URL?.replace('/api', '')}${avatar}`;
    };

    return (
        <div className="mt-2">
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
                        className="text-[#005599] hover:underline cursor-pointer"
                        onClick={() => setIsExpanded(true)}
                    >
                        Escribir un comentario
                    </div>
                )}
            </div>

            {/* Comments List & Input */}
            {isExpanded && (
                <div className="bg-[#f2f6f9] p-2 rounded-[2px] mt-1 border border-[#e1e9f0]">
                    {isLoading && <div className="text-[10px] text-gray-500 mb-2">Cargando...</div>}

                    <div className="flex flex-col gap-2 mb-2">
                        {comments.map(comment => (
                            <div key={comment.id} className="flex gap-2">
                                <img
                                    src={getAvatarUrl(comment.user.avatar, comment.user.name)}
                                    className="w-8 h-8 object-cover border border-[#ccc]"
                                    alt={comment.user.name}
                                />
                                <div className="flex-1">
                                    <div className="text-[11px] leading-snug">
                                        <span className="text-[#005599] font-bold cursor-pointer hover:underline">
                                            {comment.user.name}
                                        </span>
                                        <span className="text-[#333]"> {comment.content}</span>
                                    </div>
                                    <div className="text-[9px] text-[#999]">
                                        {new Date(comment.createdAt).toLocaleString()}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Input */}
                    <div className="flex gap-2 mt-2">
                        <img
                            src={getAvatarUrl(user?.avatar, user?.name)}
                            className="w-8 h-8 object-cover border border-[#ccc]"
                            alt="Me"
                        />
                        <form onSubmit={handleSubmitComment} className="flex-1 flex gap-1">
                            <input
                                type="text"
                                className="flex-1 border border-[#b2c2d1] rounded-[2px] p-1 text-[11px] focus:outline-none focus:border-[#5C95C4]"
                                placeholder="Escribe un comentario..."
                                value={newComment}
                                onChange={(e) => setNewComment(e.target.value)}
                            />
                            <button
                                type="submit"
                                className="bg-[#005599] text-white text-[10px] font-bold px-2 py-1 rounded-[2px] hover:bg-[#00447a]"
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
