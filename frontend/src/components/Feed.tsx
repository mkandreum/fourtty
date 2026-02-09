import React, { useState, useEffect, useRef, useCallback } from 'react';
import { MessageSquare, MessageCircle, Tag, Bell, Mail, UserPlus, BarChart2, Heart, Share2, MoreHorizontal, Send, X, ThumbsUp, Youtube, Flag, Camera } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Invitations from './Invitations';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { useSocket } from '../contexts/SocketContext';
import api from '../api';
import { Post } from '../types';
import CommentSection from './CommentSection';
import { usePhotoModal } from '../contexts/PhotoModalContext';

const Feed: React.FC = () => {
   const { user, updateUser } = useAuth();
   const { showToast } = useToast();
   const navigate = useNavigate();
   const location = useLocation();
   const { openPhoto } = usePhotoModal();
   const { socket } = useSocket();
   const [statusText, setStatusText] = useState('');
   const [selectedFile, setSelectedFile] = useState<File | null>(null);
   const [previewUrl, setPreviewUrl] = useState<string | null>(null);
   const [posts, setPosts] = useState<Post[]>([]);
   const [isLoading, setIsLoading] = useState(true);
   const [page, setPage] = useState(1);
   const [hasMore, setHasMore] = useState(true);
   const [isLoadingMore, setIsLoadingMore] = useState(false);
   const [limit] = useState(10);
   const observer = useRef<IntersectionObserver | null>(null);
   const lastPostElementRef = useCallback((node: HTMLDivElement | null) => {
      if (isLoading || isLoadingMore) return;
      if (observer.current) observer.current.disconnect();
      observer.current = new IntersectionObserver(entries => {
         if (entries[0].isIntersecting && hasMore) {
            setPage(prev => prev + 1);
         }
      });
      if (node) observer.current.observe(node);
   }, [isLoading, isLoadingMore, hasMore]);

   const getAvatarUrl = (avatar?: string | null, name?: string, lastName?: string) => {
      if (!avatar) return `https://ui-avatars.com/api/?name=${name || ''}+${lastName || ''}&background=random`;
      if (avatar && avatar.startsWith('http')) return avatar;
      return `${import.meta.env.VITE_API_URL?.replace('/api', '')}${avatar}`;
   };

   const [unreadNotifications, setUnreadNotifications] = useState<any[]>([]);
   const [stats, setStats] = useState({ visits: 0 });
   const [recentVisitors, setRecentVisitors] = useState<any[]>([]);

   const fetchFeed = async (pageNum: number, isRefresh = false) => {
      try {
         const response = await api.get(`/posts/feed?page=${pageNum}&limit=${limit}`);

         if (isRefresh) {
            setPosts(response.data.posts);
         } else {
            setPosts(prev => [...prev, ...response.data.posts]);
         }

         const { total, page: currentPage, limit: currentLimit } = response.data.pagination;
         setHasMore(currentPage * currentLimit < total);

      } catch (error) {
         console.error("Error fetching feed:", error);
      }
   };

   useEffect(() => {
      if (socket) {
         const handleNewNotification = (notification: any) => {
            setUnreadNotifications(prev => [notification, ...prev]);
         };

         socket.on('notification', handleNewNotification);
         return () => {
            socket.off('notification', handleNewNotification);
         };
      }
   }, [socket]);

   useEffect(() => {
      fetchUnreadNotifications();
      fetchStats();
      fetchRecentVisitors();
   }, []);

   useEffect(() => {
      const getPosts = async () => {
         if (page === 1) {
            setIsLoading(true);
            await fetchFeed(1, true);
            setIsLoading(false);
         } else {
            setIsLoadingMore(true);
            await fetchFeed(page);
            setIsLoadingMore(false);
         }
      };
      getPosts();
   }, [page]);

   const fetchUnreadNotifications = async () => {
      try {
         const res = await api.get('/notifications');
         setUnreadNotifications(res.data.notifications.filter((n: any) => !n.read));
      } catch (error) {
         console.error("Error fetching notifications:", error);
      }
   };

   const fetchStats = async () => {
      try {
         const res = await api.get('/stats');
         setStats({ visits: res.data.visits });
      } catch (error) {
         console.error("Error fetching stats:", error);
      }
   };

   const fetchRecentVisitors = async () => {
      try {
         const res = await api.get('/visitors');
         setRecentVisitors(res.data.visitors);
      } catch (error) {
         console.error("Error fetching visitors:", error);
      }
   };

   const [isSubmitting, setIsSubmitting] = useState(false);

   const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
         setSelectedFile(file);
         const url = URL.createObjectURL(file);
         setPreviewUrl(url);
      }
   };

   const removeFile = () => {
      setSelectedFile(null);
      if (previewUrl) URL.revokeObjectURL(previewUrl);
      setPreviewUrl(null);
   };

   const handleUpdateStatus = async () => {
      if ((!statusText.trim() && !selectedFile) || !user) return;
      setIsSubmitting(true);

      try {
         if (statusText.trim()) {
            await api.put(`/users/${user.id}`, { status: statusText });
            updateUser({ ...user, status: statusText });
         }

         const formData = new FormData();
         if (selectedFile) {
            // Use /photos endpoint for images so they go to gallery + feed
            formData.append('image', selectedFile);
            formData.append('caption', statusText);

            await api.post('/photos', formData, {
               headers: { 'Content-Type': undefined }
            });
         } else {
            // Use /posts endpoint for text status
            formData.append('content', statusText);
            formData.append('type', 'status');

            await api.post('/posts', formData, {
               headers: { 'Content-Type': undefined }
            });
         }
         setStatusText('');
         removeFile();
         setPage(1);
         await fetchFeed(1, true);
         setHasMore(true);
         showToast("Publicado correctamente", "success");
      } catch (error) {
         console.error("Error updating status:", error);
         showToast("Error al publicar", "error");
      } finally {
         setIsSubmitting(false);
      }
   };

   const handleToggleLike = async (postId: number) => {
      try {
         const response = await api.post(`/posts/${postId}/like`);
         const { liked } = response.data;

         setPosts(prev => prev.map(p => {
            if (p.id === postId) {
               return {
                  ...p,
                  likedByMe: liked,
                  _count: {
                     ...p._count,
                     likes: liked ? (p._count?.likes || 0) + 1 : Math.max(0, (p._count?.likes || 0) - 1)
                  }
               };
            }
            return p;
         }));

         if (liked) {
            showToast("¡Te mola!", "success");
         }
      } catch (error) {
         console.error("Error toggling like:", error);
      }
   };

   const handleDeletePost = async (postId: number) => {
      if (!window.confirm("¿Estás seguro de que quieres borrar esta publicación?")) return;

      try {
         await api.delete(`/posts/${postId}`);
         setPosts(prev => prev.filter(p => p.id !== postId));
         showToast("Publicación borrada", "success");
      } catch (error) {
         console.error("Error deleting post:", error);
         showToast("No se pudo borrar la publicación", "error");
      }
   };

   const handleAcceptFriend = async (friendshipId: number, notificationId: number) => {
      try {
         await api.put(`/friendships/${friendshipId}/accept`);
         showToast("Solicitud aceptada", "success");
         setUnreadNotifications(prev => prev.filter(n => n.id !== notificationId));
         fetchStats();
      } catch (error: any) {
         console.error("Error accepting friend:", error);
         if (error.response?.status === 404) {
            setUnreadNotifications(prev => prev.filter(n => n.id !== notificationId));
         } else {
            showToast("Error al aceptar solicitud", "error");
         }
      }
   };

   const handleRejectFriend = async (friendshipId: number, notificationId: number) => {
      try {
         await api.put(`/friendships/${friendshipId}/reject`);
         showToast("Solicitud rechazada", "info");
         setUnreadNotifications(prev => prev.filter(n => n.id !== notificationId));
         fetchStats();
      } catch (error: any) {
         console.error("Error rejecting friend:", error);
         if (error.response?.status === 404) {
            setUnreadNotifications(prev => prev.filter(n => n.id !== notificationId));
         } else {
            showToast("Error al rechazar solicitud", "error");
         }
      }
   };

   const handleNotificationClick = async (notif: any) => {
      try {
         await api.delete(`/notifications/${notif.id}`);
         setUnreadNotifications(prev => prev.filter(n => n.id !== notif.id));
      } catch (e) {
         console.error(e);
      }

      try {
         if (['comment_photo', 'tag_photo'].includes(notif.type)) {
            const photoRes = await api.get(`/photos/user/${notif.userId}`);
            const photos = photoRes.data.photos;
            const targetPhoto = photos.find((p: any) => p.id === notif.relatedId);
            if (targetPhoto) openPhoto(targetPhoto, photos);
            else navigate(`/profile/${notif.userId}`);
         } else if (['comment_post', 'tag_post', 'status_post', 'video_post', 'photo_post'].includes(notif.type)) {
            if (location.pathname === '/') {
               window.scrollTo({ top: 0, behavior: 'smooth' });
            } else {
               navigate('/');
            }
         } else if (notif.type === 'message') {
            navigate('/messages');
         }
      } catch (error) {
         console.error('Error handling notification click:', error);
         navigate('/');
      }
   };

   return (
      <div className="bg-[var(--bg-color)] min-h-screen px-2 sm:px-3 pb-20 sm:pb-24 pt-0 md:pt-4 md:px-4 transition-colors duration-200">

         {/* Status Box - Capsule Style */}
         <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="mb-6 sm:mb-8"
         >
            <div className="capsule-card neon-glow group">
               <div className="flex gap-2 sm:gap-3 md:gap-4 items-start">
                  {/* Avatar with Neon Ring */}
                  <div className="w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14 shrink-0 relative">
                     <div className="absolute inset-0 bg-gradient-to-tr from-[var(--accent)] to-violet-500 rounded-full animate-pulse opacity-20 blur-md group-hover:opacity-40 transition-opacity" />
                     <img
                        src={getAvatarUrl(user?.avatar, user?.name)}
                        alt={user?.name}
                        className="w-full h-full object-cover rounded-full ring-1 sm:ring-2 ring-white/10 shadow-xl relative z-10"
                     />
                     <div className="absolute bottom-0 right-0 w-3 h-3 sm:w-4 sm:h-4 bg-green-500 rounded-full border-2 border-[var(--card-bg)] shadow-[0_0_10px_rgba(34,197,94,0.4)] z-20" />
                  </div>

                  <div className="flex-1 min-w-0">
                     <div className="flex flex-col gap-1">
                        <textarea
                           className="w-full border-none p-0 text-[14px] sm:text-[16px] md:text-[18px] font-medium text-[var(--text-main)] placeholder:text-[var(--accent)] placeholder:opacity-60 placeholder:drop-shadow-[0_0_5px_rgba(244,114,182,0.4)] outline-none bg-transparent transition-all min-h-[60px] sm:min-h-[70px] md:min-h-[80px] resize-none overflow-hidden touch-manipulation"
                           value={statusText}
                           onChange={(e) => setStatusText(e.target.value.slice(0, 140))}
                           placeholder={`¿Qué tienes en mente, ${user?.name}?`}
                        />

                        <AnimatePresence>
                           {statusText.length > 0 && (
                              <div className="flex justify-end pr-1 sm:pr-2">
                                 <motion.span
                                    initial={{ opacity: 0, scale: 0.8 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0.8 }}
                                    transition={{ duration: 0.2 }}
                                    className="text-[9px] sm:text-[10px] font-bold tracking-widest text-[var(--text-muted)] uppercase"
                                 >
                                    {140 - statusText.length} caracteres
                                 </motion.span>
                              </div>
                           )}
                        </AnimatePresence>
                     </div>

                     <AnimatePresence>
                        {previewUrl && (
                           <motion.div
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={{ opacity: 0, scale: 0.95 }}
                              transition={{ duration: 0.2 }}
                              className="mt-3 sm:mt-4 relative w-full max-w-full"
                           >
                              <img
                                 src={previewUrl}
                                 alt=""
                                 className="w-full h-auto max-h-[200px] sm:max-h-[250px] md:max-h-[300px] object-contain rounded-[1rem] sm:rounded-[1.5rem] border border-[var(--border-color)] sm:border-2 shadow-2xl"
                                 onError={(e) => {
                                    console.error('Image failed to load:', previewUrl);
                                    e.currentTarget.style.display = 'none';
                                 }}
                              />
                              <button
                                 onClick={removeFile}
                                 className="absolute top-2 right-2 sm:top-3 sm:right-3 bg-black/60 backdrop-blur-md text-white p-1.5 sm:p-2 rounded-full hover:bg-red-500 active:bg-red-600 transition-colors shadow-lg touch-manipulation"
                              >
                                 <X size={14} className="sm:w-4 sm:h-4" />
                              </button>
                           </motion.div>
                        )}
                     </AnimatePresence>

                     <div className="flex justify-between items-center mt-4 sm:mt-5 md:mt-6 pt-3 sm:pt-4 border-t border-[var(--border-color)]">
                        <div className="flex items-center gap-2 sm:gap-3 md:gap-4">
                           <input
                              type="file"
                              id="status-photo-upload"
                              className="hidden"
                              accept="image/*"
                              onChange={handleFileChange}
                           />
                           <button
                              onClick={() => document.getElementById('status-photo-upload')?.click()}
                              className="flex items-center gap-1.5 sm:gap-2 text-white/50 hover:text-[var(--accent)] active:text-[var(--accent)] hover:bg-white/5 active:bg-white/10 px-2 sm:px-3 py-1.5 sm:py-2 rounded-lg sm:rounded-xl transition-all font-bold text-xs sm:text-sm touch-manipulation"
                           >
                              <Camera size={18} className="neon-glow sm:w-5 sm:h-5" />
                              <span className="hidden sm:inline">Añadir recuerdo</span>
                              <span className="sm:hidden">Foto</span>
                           </button>

                           {user?.status && (
                              <div className="hidden lg:flex items-center gap-2 text-[11px] text-white/30 font-medium italic overflow-hidden">
                                 <div className="w-1 h-1 bg-white/20 rounded-full" />
                                 <span className="truncate max-w-[200px]">{user.status}</span>
                              </div>
                           )}
                        </div>

                        <motion.button
                           whileHover={!isSubmitting && (statusText.trim() || selectedFile) ? { scale: 1.05, boxShadow: "0 0 20px rgba(var(--accent-rgb), 0.4)" } : {}}
                           whileTap={!isSubmitting && (statusText.trim() || selectedFile) ? { scale: 0.95 } : {}}
                           onClick={handleUpdateStatus}
                           disabled={isSubmitting || (!statusText.trim() && !selectedFile)}
                           className={`px-4 sm:px-6 md:px-8 py-2 sm:py-2.5 md:py-3 rounded-full font-black text-[10px] sm:text-[11px] md:text-[12px] uppercase tracking-widest transition-all touch-manipulation ${isSubmitting || (!statusText.trim() && !selectedFile)
                              ? 'bg-white/5 text-white/20 cursor-not-allowed border border-white/5'
                              : 'bg-gradient-to-tr from-[var(--accent)] to-violet-500 text-white shadow-[0_10px_20px_rgba(var(--accent-rgb),0.3)]'}`}
                        >
                           {isSubmitting ? '...' : 'Publicar'}
                        </motion.button>
                     </div>
                  </div>
               </div>
            </div>
         </motion.div>

         {/* Unread Notifications & Visits */}
         {(unreadNotifications.length > 0 || stats.visits > 0) && (
            <div className="mb-4 sm:mb-5 md:mb-6 flex flex-col gap-2">
               {stats.visits > 0 && (
                  <div
                     className="md:hidden flex items-center gap-2 sm:gap-3 group cursor-pointer hover:bg-white/5 active:bg-white/10 p-2 sm:p-3 rounded-xl sm:rounded-2xl transition-all active:scale-[0.98] border border-white/5 bg-white/5 backdrop-blur-md touch-manipulation"
                     onClick={() => navigate('/profile')}
                  >
                     <div className="text-[var(--accent)] bg-[var(--accent)]/10 p-1.5 sm:p-2 rounded-lg sm:rounded-xl">
                        <BarChart2 size={16} className="sm:w-[18px] sm:h-[18px]" />
                     </div>
                     <div className="flex flex-col flex-1">
                        <span className="text-[14px] font-black text-white/90 group-hover:text-[var(--accent)] leading-tight">
                           {stats.visits} visitas al perfil
                        </span>
                        {recentVisitors.length > 0 && (
                           <div className="flex -space-x-1.5 overflow-hidden mt-1.5">
                              {recentVisitors.slice(0, 6).map((visitor, idx) => (
                                 <img
                                    key={visitor.id}
                                    src={getAvatarUrl(visitor.avatar, visitor.name, visitor.lastName)}
                                    className="inline-block h-6 w-6 rounded-full ring-2 ring-[var(--card-bg)] object-cover shadow-lg"
                                    alt={visitor.name}
                                    style={{ zIndex: 10 - idx }}
                                 />
                              ))}
                              {recentVisitors.length > 6 && (
                                 <div className="flex items-center justify-center h-6 w-6 rounded-full bg-white/5 ring-2 ring-[var(--card-bg)] text-[8px] font-black text-white/40 z-0 shadow-lg backdrop-blur-md">
                                    +{recentVisitors.length - 6}
                                 </div>
                              )}
                           </div>
                        )}
                     </div>
                  </div>
               )}

               {unreadNotifications.map(notif => (
                  <div key={notif.id} className="flex flex-col gap-1 w-full animate-in fade-in slide-in-from-top-1 duration-300">
                     <div
                        className="flex items-center gap-3 group cursor-pointer hover:bg-white/5 p-3 rounded-2xl transition-all border border-white/5 bg-white/5 shadow-lg backdrop-blur-md"
                        onClick={() => {
                           if (notif.type === 'friendship') return;
                           handleNotificationClick(notif);
                        }}
                     >
                        <div className="w-10 h-10 flex items-center justify-center text-[var(--accent)] bg-[var(--accent)]/10 rounded-xl shadow-inner shrink-0 ring-1 ring-white/5">
                           {['comment_photo', 'comment_post'].includes(notif.type) && <MessageCircle size={20} />}
                           {['tag_photo', 'tag_post'].includes(notif.type) && <Tag size={20} />}
                           {['photo_post', 'video_post', 'status_post'].includes(notif.type) && <Bell size={20} />}
                           {notif.type === 'message' && <Mail size={20} />}
                           {notif.type === 'friendship' && <UserPlus size={20} />}
                        </div>
                        <div className="flex-1 min-w-0">
                           <p className="text-[13px] text-white/90 font-bold leading-tight truncate group-hover:text-[var(--accent)] transition-colors">
                              {notif.content}
                           </p>
                           <span className="text-[10px] text-white/30 font-bold uppercase tracking-widest mt-0.5 block">
                              {new Date(notif.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                           </span>
                        </div>
                        <div className="w-2 h-2 bg-[var(--accent)] rounded-full shadow-[0_0_8px_rgba(var(--accent-rgb),0.5)] shrink-0 neon-glow" />
                     </div>

                     {notif.type === 'friendship' && (
                        <div className="ml-8 flex flex-col gap-2 mt-1 mb-2">
                           <div className="bg-white/5 border border-white/10 p-2 rounded-xl flex flex-col gap-2 shadow-sm backdrop-blur-sm">
                              <div className="flex gap-2">
                                 <button
                                    onClick={() => handleAcceptFriend(notif.relatedId, notif.id)}
                                    className="flex-1 bg-[var(--accent)] text-white text-[11px] font-black uppercase tracking-wider py-2 rounded-lg hover:shadow-[0_0_15px_rgba(var(--accent-rgb),0.5)] active:scale-95 transition-all"
                                 >
                                    Aceptar
                                 </button>
                                 <button
                                    onClick={() => handleRejectFriend(notif.relatedId, notif.id)}
                                    className="flex-1 bg-white/5 text-white/40 border border-white/10 text-[11px] font-black uppercase tracking-wider py-2 rounded-lg hover:bg-red-500/10 hover:text-red-400 active:scale-95 transition-all"
                                 >
                                    Rechazar
                                 </button>
                              </div>
                           </div>
                        </div>
                     )}
                  </div>
               ))}
            </div>
         )}

         {/* Infinite Scroll Sentinel */}
         <div className="flex items-center justify-between mb-6 px-1">
            <h3 className="text-white/40 font-black text-[12px] uppercase tracking-[0.2em] flex items-center gap-3">
               <div className="w-1.5 h-1.5 rounded-full bg-[var(--accent)] neon-glow" />
               Novedades
            </h3>
            <div className="flex gap-4">
               <span className="text-[11px] font-black text-[var(--accent)] cursor-pointer hover:underline uppercase tracking-widest">Recientes</span>
               <span className="text-[11px] font-bold text-white/20 cursor-pointer hover:text-white transition-colors uppercase tracking-widest">Amigos</span>
            </div>
         </div>

         {/* Posts Feed */}
         {isLoading ? (
            <div className="flex flex-col items-center justify-center p-12 text-white/20">
               <div className="w-8 h-8 border-2 border-[var(--accent)] border-t-transparent rounded-full animate-spin mb-4" />
               <span className="text-[11px] font-black uppercase tracking-[0.2em]">Cargando novedades...</span>
            </div>
         ) : (
            <div className="flex flex-col gap-4 sm:gap-5 md:gap-6">
               {posts.length === 0 && (
                  <div className="p-8 sm:p-10 md:p-12 text-center capsule-card bg-[var(--card-bg)] border-dashed border-[var(--border-color)]">
                     <p className="text-[var(--text-muted)] text-[12px] sm:text-[13px] font-bold">No hay novedades recientes. ¡Agrega amigos para ver sus publicaciones!</p>
                  </div>
               )}

               {posts.map((post) => (
                  <div
                     key={post.id}
                     className="capsule-card group relative"
                  >
                     <div className="flex gap-2 sm:gap-3 md:gap-5">
                        {/* Avatar Section */}
                        <div className="w-10 h-10 sm:w-11 sm:h-11 md:w-12 md:h-12 shrink-0 relative">
                           <div className="absolute inset-0 bg-gradient-to-tr from-[var(--accent)] to-violet-500 rounded-full opacity-0 group-hover:opacity-20 blur-md transition-opacity duration-500" />
                           <img
                              src={getAvatarUrl(post.user.avatar, post.user.name, post.user.lastName)}
                              alt={post.user.name}
                              loading="lazy"
                              className="w-full h-full object-cover rounded-full ring-1 sm:ring-2 ring-white/5 shadow-xl relative z-10 cursor-pointer transition-transform duration-500 hover:scale-105 active:scale-95 touch-manipulation"
                              onClick={() => navigate(`/profile/${post.user.id}`)}
                           />
                        </div>

                        {/* Content Section */}
                        <div className="flex-1 min-w-0">
                           <div className="flex justify-between items-start mb-1.5 sm:mb-2">
                              <div className="min-w-0 flex-1">
                                 <button
                                    onClick={() => navigate(`/profile/${post.user.id}`)}
                                    className="text-[14px] sm:text-[15px] md:text-[16px] font-black text-[var(--text-main)] hover:text-[var(--accent)] active:text-[var(--accent)] transition-colors tracking-tight text-left block truncate touch-manipulation"
                                 >
                                    {post.user.name} {post.user.lastName}
                                 </button>
                                 <div className="text-[9px] sm:text-[10px] text-[var(--text-muted)] font-black uppercase tracking-widest mt-0.5">
                                    {new Date(post.createdAt).toLocaleDateString(undefined, { day: 'numeric', month: 'short' })} • {new Date(post.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                 </div>
                              </div>

                              {post.userId === user?.id && (
                                 <button
                                    onClick={() => handleDeletePost(post.id)}
                                    className="text-white/10 hover:text-red-500 active:text-red-600 transition-colors p-1 ml-2 touch-manipulation"
                                    title="Borrar"
                                 >
                                    <X size={14} className="sm:w-4 sm:h-4" />
                                 </button>
                              )}
                           </div>

                           <div className="text-[13px] sm:text-[14px] md:text-[15px] text-[var(--text-main)] leading-relaxed mb-3 sm:mb-4 font-medium">
                              {post.content}
                           </div>

                           {/* Media: Video */}
                           {post.type === 'video' && post.videoUrl && (
                              <div className="mt-3 sm:mt-4 rounded-[1rem] sm:rounded-[1.5rem] overflow-hidden border border-white/5 shadow-2xl aspect-video bg-black/40">
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

                           {/* Media: Photo */}
                           {post.type === 'photo' && post.image && (
                              <div className="mt-3 sm:mt-4 rounded-[1.5rem] sm:rounded-[2rem] overflow-hidden border border-[var(--border-color)] shadow-2xl bg-[var(--card-bg)] p-0.5 sm:p-1">
                                 <img
                                    src={post.image.startsWith('http') || post.image.startsWith('data:') ? post.image : `${import.meta.env.VITE_API_URL?.replace('/api', '')}${post.image.startsWith('/') ? '' : '/'}${post.image}`}
                                    loading="lazy"
                                    className="w-full h-auto max-h-[400px] sm:max-h-[500px] md:max-h-[600px] object-contain rounded-[1.3rem] sm:rounded-[1.8rem] cursor-pointer hover:scale-[1.01] active:scale-[0.99] transition-transform duration-700 touch-manipulation"
                                    onClick={() => {
                                       if (post.image) {
                                          const photoUrl = post.image.startsWith('http') || post.image.startsWith('data:') ? post.image : `${import.meta.env.VITE_API_URL?.replace('/api', '')}${post.image.startsWith('/') ? '' : '/'}${post.image}`;
                                          const photoObj = {
                                             id: post.id,
                                             url: photoUrl,
                                             userId: post.userId,
                                             createdAt: post.createdAt,
                                             user: post.user,
                                             _count: post._count,
                                             photoTags: []
                                          } as any;
                                          openPhoto(photoObj, [photoObj]);
                                       }
                                    }}
                                    alt="post attachment"
                                 />
                              </div>
                           )}

                           {/* Post Actions */}
                           <div className="mt-4 sm:mt-5 md:mt-6 flex items-center justify-between border-t border-[var(--border-color)] pt-3 sm:pt-4">
                              <div className="flex items-center gap-3 sm:gap-4 md:gap-6">
                                 <button
                                    onClick={() => handleToggleLike(post.id)}
                                    className={`flex items-center gap-1.5 sm:gap-2 text-[10px] sm:text-[11px] font-black uppercase tracking-widest transition-all touch-manipulation ${post.likedByMe ? 'text-[var(--accent)]' : 'text-[var(--text-muted)] hover:text-[var(--text-main)] active:text-[var(--text-main)]'}`}
                                 >
                                    <ThumbsUp size={14} className={`sm:w-4 sm:h-4 ${post.likedByMe ? 'neon-glow' : ''}`} fill={post.likedByMe ? 'currentColor' : 'none'} />
                                    <span className="hidden sm:inline">{post.likedByMe ? 'Mola' : 'Mola'}</span>
                                    {post._count && post._count.likes > 0 && (
                                       <span className="bg-white/5 px-1.5 sm:px-2 py-0.5 rounded-full text-[9px] sm:text-[10px] ml-0.5 sm:ml-1">{post._count.likes}</span>
                                    )}
                                 </button>


                              </div>

                              <button className="text-[var(--text-muted)] hover:text-[var(--text-main)] active:text-[var(--text-main)] transition-colors touch-manipulation p-1">
                                 <Share2 size={14} className="sm:w-4 sm:h-4" />
                              </button>
                           </div>

                           <div className="mt-3 sm:mt-4">
                              <CommentSection
                                 postId={post.id}
                                 initialCommentsCount={post._count?.comments || 0}
                              />
                           </div>
                        </div>
                     </div>
                  </div>
               ))}
            </div>
         )}

         {/* Infinite Scroll Sentinel */}
         <div ref={lastPostElementRef} className="h-16 sm:h-20 flex items-center justify-center mt-6 sm:mt-8">
            {isLoadingMore && (
               <div className="flex flex-col items-center gap-2 text-[9px] sm:text-[10px] text-white/20 font-black uppercase tracking-[0.2em]">
                  <div className="w-4 h-4 sm:w-5 sm:h-5 border border-[var(--accent)] border-t-transparent rounded-full animate-spin"></div>
                  <span>Cargando más...</span>
               </div>
            )}
            {!hasMore && posts.length > 0 && (
               <div className="flex items-center gap-3 sm:gap-4 text-white/10">
                  <div className="h-px w-6 sm:w-8 bg-white/5" />
                  <span className="text-[9px] sm:text-[10px] font-black uppercase tracking-[0.2em] whitespace-nowrap">
                     No hay más novedades
                  </span>
                  <div className="h-px w-6 sm:w-8 bg-white/5" />
               </div>
            )}
         </div>
      </div>
   );
};

export default Feed;