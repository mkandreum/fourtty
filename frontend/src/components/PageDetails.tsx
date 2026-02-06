import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Flag, Users, FileText, ChevronLeft, Youtube, Image as ImageIcon } from 'lucide-react';
import api from '../api';
import { useAuth } from '../contexts/AuthContext';
import CommentSection from './CommentSection';

const PageDetails: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const { user: currentUser } = useAuth();
    const [page, setPage] = useState<any>(null);
    const [isFollowing, setIsFollowing] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [postContent, setPostContent] = useState('');
    const [videoUrl, setVideoUrl] = useState('');
    const [image, setImage] = useState<File | null>(null);

    useEffect(() => {
        fetchPageDetails();
    }, [id]);

    const fetchPageDetails = async () => {
        try {
            const response = await api.get(`/pages/${id}`);
            setPage(response.data.page);
            setIsFollowing(response.data.isFollowing);
        } catch (error) {
            console.error('Error fetching page details:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleFollowToggle = async () => {
        try {
            if (isFollowing) {
                await api.post(`/pages/${id}/unfollow`);
                setIsFollowing(false);
                setPage((prev: any) => ({
                    ...prev,
                    _count: { ...prev._count, followers: prev._count.followers - 1 }
                }));
            } else {
                await api.post(`/pages/${id}/follow`);
                setIsFollowing(true);
                setPage((prev: any) => ({
                    ...prev,
                    _count: { ...prev._count, followers: prev._count.followers + 1 }
                }));
            }
        } catch (error) {
            console.error('Error toggling follow:', error);
        }
    };

    const handleCreatePost = async (e: React.FormEvent) => {
        e.preventDefault();
        const formData = new FormData();
        formData.append('content', postContent);
        if (videoUrl) formData.append('videoUrl', videoUrl);
        if (image) formData.append('image', image);

        try {
            await api.post(`/pages/${id}/posts`, formData);
            setPostContent('');
            setVideoUrl('');
            setImage(null);
            fetchPageDetails();
        } catch (error) {
            console.error('Error creating page post:', error);
            alert('Solo el creador puede publicar');
        }
    };

    if (isLoading) return <div className="p-10 text-center opacity-50">Cargando página...</div>;
    if (!page) return <div className="p-10 text-center bg-white">Página no encontrada</div>;

    const isCreator = currentUser?.id === page.creatorId;

    return (
        <div className="flex-1 bg-[#f0f2f5] min-h-screen">
            <div className="max-w-[800px] mx-auto p-4 flex flex-col gap-4">

                <Link to="/pages" className="flex items-center gap-1 text-[#2B7BB9] text-[12px] hover:underline mb-2">
                    <ChevronLeft size={14} /> Volver a Páginas
                </Link>

                {/* Page Header */}
                <div className="bg-white rounded-sm border border-[#ccc] shadow-sm overflow-hidden">
                    <div className="h-32 bg-gradient-to-r from-[#2B7BB9] to-[#005599]"></div>
                    <div className="p-4 flex flex-col md:flex-row gap-6 items-start">
                        <div className="w-32 h-32 mt-[-64px] bg-white p-1 rounded-sm shadow-md">
                            <div className="w-full h-full bg-[#eee] border border-[#ddd] overflow-hidden flex items-center justify-center">
                                {page.image ? (
                                    <img src={page.image} alt={page.name} className="w-full h-full object-cover" />
                                ) : (
                                    <Flag size={48} className="text-[#999]" />
                                )}
                            </div>
                        </div>
                        <div className="flex-1">
                            <h1 className="text-2xl font-bold text-[#333]">{page.name}</h1>
                            <p className="text-[12px] text-[#888] mb-2">{page.category}</p>
                            <p className="text-[14px] text-[#555] leading-relaxed mb-4">{page.description}</p>
                            <div className="flex items-center gap-4 text-[13px]">
                                <span className="flex items-center gap-1 text-[#555]">
                                    <Users size={16} className="text-[#2B7BB9]" />
                                    <strong>{page._count?.followers || 0}</strong> seguidores
                                </span>
                                {currentUser?.id !== page.creatorId && (
                                    <button
                                        onClick={handleFollowToggle}
                                        className={`px-6 py-1.5 rounded-[3px] font-bold text-[12px] transition-colors ${isFollowing
                                                ? 'bg-gray-100 text-[#555] border border-[#ccc] hover:bg-gray-200'
                                                : 'bg-[#59B200] text-white border border-[#4a9400] hover:bg-[#4a9400]'
                                            }`}
                                    >
                                        {isFollowing ? 'Siguiendo' : 'Segur página'}
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* Posts Area (Left/Center) */}
                    <div className="md:col-span-2 flex flex-col gap-4">
                        {/* Post Box (Only Creator) */}
                        {isCreator && (
                            <div className="bg-white p-4 rounded-sm border border-[#ccc] shadow-sm">
                                <h3 className="font-bold text-[#333] text-[13px] mb-3 flex items-center gap-1">
                                    <FileText size={16} className="text-[#2B7BB9]" /> Publicar en la página
                                </h3>
                                <form onSubmit={handleCreatePost} className="flex flex-col gap-3">
                                    <textarea
                                        value={postContent}
                                        onChange={(e) => setPostContent(e.target.value)}
                                        className="w-full border border-[#ccc] p-3 text-[13px] outline-none focus:border-[#2B7BB9] min-h-[80px] rounded-[2px]"
                                        placeholder="Escribe algo para tus seguidores..."
                                        required
                                    />
                                    <div className="flex flex-col sm:flex-row gap-3">
                                        <div className="flex-1 flex items-center gap-2 border border-[#eee] p-2 bg-[#fafafa] rounded-[2px]">
                                            <Youtube size={16} className="text-red-600" />
                                            <input
                                                type="text"
                                                value={videoUrl}
                                                onChange={(e) => setVideoUrl(e.target.value)}
                                                placeholder="URL de YouTube (opcional)"
                                                className="bg-transparent border-none text-[11px] w-full outline-none"
                                            />
                                        </div>
                                        <div className="flex-1 flex items-center gap-2 border border-[#eee] p-2 bg-[#fafafa] rounded-[2px]">
                                            <ImageIcon size={16} className="text-[#2B7BB9]" />
                                            <input
                                                type="file"
                                                onChange={(e) => setImage(e.target.files?.[0] || null)}
                                                className="text-[10px] w-full"
                                                accept="image/*"
                                            />
                                        </div>
                                    </div>
                                    <div className="flex justify-end">
                                        <button
                                            type="submit"
                                            className="bg-[#2B7BB9] text-white px-8 py-1.5 rounded-[3px] font-bold text-[12px] hover:bg-[#256ca3]"
                                        >
                                            Publicar
                                        </button>
                                    </div>
                                </form>
                            </div>
                        )}

                        {/* Page Posts Feed */}
                        <div className="flex flex-col gap-4">
                            {page.posts?.length === 0 ? (
                                <div className="text-center py-10 bg-white border border-[#ccc] text-[#999] text-[13px]">
                                    Aún no hay publicaciones en esta página.
                                </div>
                            ) : (
                                page.posts?.map((post: any) => (
                                    <div key={post.id} className="bg-white p-4 rounded-sm border border-[#ccc] shadow-sm">
                                        <div className="flex items-center gap-2 mb-3">
                                            <div className="w-8 h-8 rounded-full bg-[#2B7BB9] flex items-center justify-center text-white font-bold text-[10px]">
                                                {page.name.charAt(0)}
                                            </div>
                                            <div>
                                                <h4 className="text-[12px] font-bold text-[#2B7BB9]">{page.name}</h4>
                                                <span className="text-[10px] text-[#999]">{new Date(post.createdAt).toLocaleString()}</span>
                                            </div>
                                        </div>
                                        <p className="text-[13px] text-[#333] mb-3 leading-relaxed whitespace-pre-wrap">{post.content}</p>

                                        {/* Video if exists */}
                                        {post.videoUrl && (
                                            <div className="mb-3 aspect-video bg-black rounded-sm overflow-hidden border border-[#ccc]">
                                                <iframe
                                                    width="100%"
                                                    height="100%"
                                                    src={`https://www.youtube.com/embed/${post.videoUrl.match(/(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/(?:[^\/\n\s]+\/\S+\/|(?:v|e(?:mbed)?)\/|\S*?[?&]v=)|youtu\.be\/)([a-zA-Z0-9_-]{11})/)?.[1]}`}
                                                    title="YouTube video player"
                                                    frameBorder="0"
                                                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                                    allowFullScreen
                                                ></iframe>
                                            </div>
                                        )}

                                        {/* Image if exists */}
                                        {post.image && (
                                            <div className="mb-3 border border-[#eee] p-1 bg-white inline-block shadow-sm">
                                                <img src={post.image} className="max-w-full h-auto rounded-[1px]" alt="post attachment" />
                                            </div>
                                        )}

                                        <div className="pt-2 border-t border-[#f0f0f0]">
                                            <CommentSection postId={post.id} initialCommentsCount={0} />
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>

                    {/* Sidebar (Right) */}
                    <div className="flex flex-col gap-4">
                        <div className="bg-white p-4 rounded-sm border border-[#ccc] shadow-sm">
                            <h3 className="font-bold text-[12px] text-[#333] border-b border-[#eee] pb-2 mb-3">Información</h3>
                            <div className="flex flex-col gap-2 text-[12px]">
                                <div className="text-[#888]">Creada el: <span className="text-[#333]">{new Date(page.createdAt).toLocaleDateString()}</span></div>
                                <div className="text-[#888]">Categoría: <span className="text-[#333] font-bold">{page.category}</span></div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PageDetails;
