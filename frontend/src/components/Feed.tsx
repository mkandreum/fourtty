import React, { useState, useEffect } from 'react';
import { MessageSquare, MessageCircle, Tag, Bell, Mail, UserPlus, BarChart2, Heart, Share2, MoreHorizontal, Send } from 'lucide-react';
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
   const [posts, setPosts] = useState<Post[]>([]);
   const [isLoading, setIsLoading] = useState(true);
   const [page, setPage] = useState(1);
   const [hasMore, setHasMore] = useState(true);
   const [isLoadingMore, setIsLoadingMore] = useState(false);
   const [limit] = useState(10);

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

   // Initial fetch
   useEffect(() => {
      const init = async () => {
         setIsLoading(true);
         await Promise.all([
            fetchFeed(1, true),
            fetchUnreadNotifications(),
            fetchStats(),
            fetchRecentVisitors()
         ]);
         setIsLoading(false);
      };
      init();
   }, []);


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

   const handleLoadMore = async () => {
      setIsLoadingMore(true);
      const nextPage = page + 1;
      await fetchFeed(nextPage);
      setPage(nextPage);
      setIsLoadingMore(false);
   };

   const [isSubmitting, setIsSubmitting] = useState(false);
   const handleUpdateStatus = async () => {
      if (!statusText.trim() || !user) return;
      setIsSubmitting(true);

      try {
         // Update profile bio (status)
         await api.put(`/users/${user.id}`, { bio: statusText });

         // Create a new post
         const formData = new FormData();
         formData.append('content', statusText);
         formData.append('type', 'status');

         await api.post('/posts', formData);

         // Refresh user data in context
         updateUser({ ...user, bio: statusText });

         // Clear input after success
         setStatusText('');

         // Refresh feed (reset to page 1)
         setPage(1);
         await fetchFeed(1, true);
         setHasMore(true);
         showToast("Estado actualizado correctamente", "success");

      } catch (error) {
         console.error("Error updating status:", error);
         showToast("Error al actualizar el estado", "error");
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
   const fetchRecentVisitors = async () => {
      try {
         const res = await api.get('/visitors');
         setRecentVisitors(res.data.visitors);
      } catch (error) {
         console.error("Error fetching visitors:", error);
      }
   };

   const handleAcceptFriend = async (friendshipId: number, notificationId: number) => {
      try {
         await api.put(`/friendships/${friendshipId}/accept`);
         showToast("Solicitud aceptada", "success");
         setUnreadNotifications(prev => prev.filter(n => n.id !== notificationId));
         fetchStats();
      } catch (error) {
         console.error("Error accepting friend:", error);
         showToast("Error al aceptar solicitud", "error");
      }
   };

   const handleRejectFriend = async (friendshipId: number, notificationId: number) => {
      try {
         await api.put(`/friendships/${friendshipId}/reject`);
         showToast("Solicitud rechazada", "info");
         setUnreadNotifications(prev => prev.filter(n => n.id !== notificationId));
         fetchStats();
      } catch (error) {
         console.error("Error rejecting friend:", error);
         showToast("Error al rechazar solicitud", "error");
      }
   };

   const handleNotificationClick = async (notif: any) => {
      // Mark as read
      try {
         await api.put(`/notifications/${notif.id}/read`);
         setUnreadNotifications(prev => prev.filter(n => n.id !== notif.id));
      } catch (e) {
         console.error(e);
      }

      // Navigation logic
      try {
         if (['comment_photo', 'tag_photo'].includes(notif.type)) {
            const photoRes = await api.get(`/photos/user/${notif.userId}`);
            const photos = photoRes.data.photos;
            const targetPhoto = photos.find((p: any) => p.id === notif.relatedId);
            if (targetPhoto) openPhoto(targetPhoto, photos);
            else navigate(`/profile/${notif.userId}`);
         } else if (['comment_post', 'tag_post', 'status_post', 'video_post', 'photo_post'].includes(notif.type)) {
            // If we are already on home, we might want to scroll to post, but for now just stay/refresh
            if (location.pathname === '/') {
               window.scrollTo({ top: 0, behavior: 'smooth' });
            } else {
               navigate('/');
            }
         } else if (notif.type === 'message') {
            navigate('/');
         }
      } catch (error) {
         console.error('Error handling notification click:', error);
         navigate('/');
      }
   };

   return (
      <div className="bg-white md:bg-transparent min-h-[500px] px-3 pb-3 pt-4 md:px-4">

         {/* Status Box - Speech Bubble Style */}
         <div className="mb-4 md:mb-6 relative pt-0">
            <div className="bg-white border-2 border-[#b2c2d1] rounded-[8px] p-2 relative shadow-sm">
               {/* Speech pulse arrow tip */}
               <div className="absolute top-[-10px] left-8 w-0 h-0 border-l-[10px] border-l-transparent border-r-[10px] border-r-transparent border-b-[10px] border-b-[#b2c2d1]"></div>
               <div className="absolute top-[-7px] left-8 w-0 h-0 border-l-[10px] border-l-transparent border-r-[10px] border-r-transparent border-b-[10px] border-b-white"></div>

               <div className="flex gap-2 items-start">
                  <div className="flex-1 relative">
                     <input
                        className="w-full border-none p-1 md:p-2 text-[15px] md:text-[18px] text-[#333] placeholder-gray-300 outline-none !bg-white"
                        value={statusText}
                        onChange={(e) => setStatusText(e.target.value.slice(0, 140))}
                        placeholder="¿Qué estás pensando?"
                     />
                     {/* Character count bubble */}
                     <AnimatePresence>
                        {statusText.length > 0 && (
                           <motion.div
                              initial={{ scale: 0 }}
                              animate={{ scale: 1 }}
                              exit={{ scale: 0 }}
                              className="absolute top-[-24px] right-0 bg-[#f0f0f0] border border-[#ccc] text-[#999] text-[11px] w-7 h-7 rounded-full flex items-center justify-center font-bold shadow-sm z-10"
                           >
                              {140 - statusText.length}
                           </motion.div>
                        )}
                     </AnimatePresence>
                  </div>
               </div>
            </div>

            <div className="flex justify-between items-center mt-2 px-1 gap-2">
               <div className="text-[13px] md:text-[15px] text-[#888] italic truncate max-w-[70%]">
                  Última: <span className="text-[#333] font-bold not-italic">"{user?.bio || 'Sin estado'}"</span>
               </div>
               <motion.button
                  whileHover={!isSubmitting && statusText.trim() ? { scale: 1.02 } : {}}
                  whileTap={!isSubmitting && statusText.trim() ? { scale: 0.98 } : {}}
                  onClick={handleUpdateStatus}
                  disabled={isSubmitting || !statusText.trim()}
                  className={`bg-[#2B7BB9] text-white text-[11px] md:text-[12px] font-bold px-4 md:px-6 py-1 rounded-[3px] border border-[#1e5a8c] shadow-sm transition-all ${isSubmitting || !statusText.trim() ? 'opacity-50 cursor-not-allowed' : 'hover:bg-[#256ca3]'}`}
               >
                  {isSubmitting ? '...' : 'Publicar'}
               </motion.button>
            </div>
         </div>

         {/* Unread Notifications & Visits - Shown below status box */}
         {(unreadNotifications.length > 0 || stats.visits > 0) && (
            <div className="mb-4">
               <div className="flex flex-col gap-2">
                  {/* Visits - Mobile only - Clean style */}
                  {stats.visits > 0 && (
                     <div
                        className="md:hidden flex items-center gap-3 group cursor-pointer hover:bg-gray-50/80 p-1.5 rounded-md transition-all active:scale-[0.98]"
                        onClick={() => navigate('/profile')}
                     >
                        <div className="text-[#59B200] bg-[#59B200]/10 p-1.5 rounded-sm">
                           <BarChart2 size={16} />
                        </div>
                        <div className="flex flex-col flex-1">
                           <span className="text-[14px] md:text-[16px] font-bold text-[#59B200] group-hover:underline leading-tight">
                              {stats.visits} visitas al perfil
                           </span>
                           {recentVisitors.length > 0 && (
                              <div className="flex -space-x-1 overflow-hidden mt-1">
                                 {recentVisitors.slice(0, 6).map((visitor, idx) => (
                                    <img
                                       key={visitor.id}
                                       src={getAvatarUrl(visitor.avatar, visitor.name, visitor.lastName)}
                                       className="inline-block h-6 w-6 rounded-full ring-1 ring-white object-cover shadow-sm"
                                       alt={visitor.name}
                                       style={{ zIndex: 10 - idx }}
                                    />
                                 ))}
                                 {recentVisitors.length > 6 && (
                                    <div className="flex items-center justify-center h-6 w-6 rounded-full bg-gray-100 ring-1 ring-white text-[8px] font-bold text-gray-500 z-0 shadow-sm">
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
                           className="flex items-center gap-2 group cursor-pointer hover:bg-[#F9FBFE] p-1.5 rounded-sm transition-colors border-l-2 border-[#59B200] bg-white shadow-sm"
                           onClick={() => {
                              if (notif.type === 'friendship') return; // Handled below
                              handleNotificationClick(notif);
                           }}
                        >
                           <div className="text-[#59B200] bg-[#59B200]/10 p-1.5 rounded-sm">
                              {['comment_photo', 'comment_post'].includes(notif.type) && <MessageCircle size={16} />}
                              {['tag_photo', 'tag_post'].includes(notif.type) && <Tag size={16} />}
                              {['photo_post', 'video_post', 'status_post'].includes(notif.type) && <Bell size={16} />}
                              {notif.type === 'message' && <Mail size={16} />}
                              {notif.type === 'friendship' && <UserPlus size={16} />}
                           </div>
                           <div className="flex flex-col flex-1">
                              <span className="text-[14px] md:text-[16px] font-bold text-[#59B200] group-hover:underline leading-tight">
                                 {notif.content}
                              </span>
                              <span className="text-[10px] text-gray-400">
                                 {new Date(notif.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </span>
                           </div>
                        </div>

                        {/* Quick actions for Friendships remains expanded */}
                        {notif.type === 'friendship' && (
                           <div className="ml-8 flex flex-col gap-2 mt-1 mb-2">
                              <div className="bg-[#f0f7e6] border border-[#d4e9bc] p-2 rounded-[4px] flex flex-col gap-2 shadow-sm">
                                 <div className="flex gap-2">
                                    <button
                                       onClick={() => handleAcceptFriend(notif.relatedId, notif.id)}
                                       className="flex-1 bg-[#59B200] text-white text-[10px] font-bold py-1.5 rounded-[2px] hover:bg-[#4a9600] active:scale-95 transition-all"
                                    >
                                       Aceptar
                                    </button>
                                    <button
                                       onClick={() => handleRejectFriend(notif.relatedId, notif.id)}
                                       className="flex-1 bg-white text-[#cc0000] border border-[#ffcccc] text-[10px] font-bold py-1.5 rounded-[2px] hover:bg-[#fff5f5] active:scale-95 transition-all"
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
            </div>
         )}

         {/* Invitations Panel - Shown only on mobile in Feed */}
         <div className="md:hidden">
            <Invitations />
         </div>


         <div className="flex items-center justify-between mb-2 border-b border-[#EEE] pb-1">
            <h3 className="text-[#59B200] font-bold text-[14px] flex items-center gap-1">
               <div className="bg-[#59B200] text-white p-0.5 rounded-[3px] shadow-sm">
                  <MessageSquare size={14} fill="white" strokeWidth={0} />
               </div>
               Novedades
            </h3>
            <div className="text-[11px] flex gap-2">
               <span className="font-bold text-[#333] hover:text-[#005599] cursor-pointer transition-colors">Amigos</span>
               <span className="text-[#005599] hover:underline cursor-pointer transition-colors">Páginas</span>
            </div>
         </div>

         {isLoading ? (
            <div className="p-4 text-center text-gray-500 text-xs">Cargando novedades...</div>
         ) : (
            <div className="flex flex-col gap-4">
               {posts.length === 0 && (
                  <div className="p-4 text-center text-gray-500 text-xs">
                     No hay novedades recientes. ¡Agrega amigos para ver sus posts!
                  </div>
               )}

               {posts.map((post) => (
                  <div
                     key={post.id}
                     className="flex gap-2 hover-lift p-1 rounded-sm"
                  >
                     {/* Avatar */}
                     <div className="w-[50px] shrink-0">
                        {post.user.avatar ? (
                           <img
                              src={post.user.avatar.startsWith('http') ? post.user.avatar : `${import.meta.env.VITE_API_URL?.replace('/api', '')}${post.user.avatar}`}
                              alt={post.user.name}
                              className="w-[50px] h-[50px] object-cover border border-[#ccc] rounded-[2px] p-[1px] bg-white shadow-sm cursor-pointer hover:scale-105 transition-transform"
                           />
                        ) : (
                           <div className="w-[50px] h-[50px] bg-gray-200 border border-[#ccc] rounded-[2px] flex items-center justify-center text-gray-400">
                              No img
                           </div>
                        )}
                     </div>

                     {/* Content */}
                     <div className="flex-1 border-b border-[#f5f5f5] pb-3 relative">
                        {post.userId === user?.id && (
                           <button
                              onClick={() => handleDeletePost(post.id)}
                              className="absolute top-0 right-0 text-gray-300 hover:text-red-500 transition-colors p-1"
                              title="Borrar"
                           >
                              <X size={14} />
                           </button>
                        )}
                        <div className="text-[12px] leading-snug mb-1">
                           <a href="#" className="text-[#005599] font-bold hover:underline">{post.user.name} {post.user.lastName}</a>
                           <span className="text-[#333] font-bold"> {post.content}</span>
                        </div>

                        <div className="text-[10px] text-[#999] mb-1 flex items-center gap-2">
                           {new Date(post.createdAt).toLocaleString()}
                           <span className="mx-1">·</span>
                           <button
                              onClick={() => handleToggleLike(post.id)}
                              className={`font-bold hover:underline ${post.likedByMe ? 'text-[#59B200]' : 'text-[#005599]'}`}
                           >
                              {post.likedByMe ? 'Ya no me mola' : '¡Me mola!'}
                           </button>
                        </div>

                        {post._count && post._count.likes > 0 && (
                           <div className="flex items-center gap-1 text-[10px] text-[#59B200] font-bold mt-1 mb-1">
                              <ThumbsUp size={10} fill="#59B200" /> {post._count.likes} {post._count.likes === 1 ? 'persona le mola esto' : 'personas les mola esto'}
                           </div>
                        )}


                        {/* Video specific */}
                        {post.type === 'video' && post.videoUrl && (
                           <div className="mt-2 w-full max-w-[400px]">
                              <div className="aspect-video bg-black rounded-sm overflow-hidden border border-[#ccc]">
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
                              <div className="flex items-center gap-1.5 mt-1 text-[11px] text-[#59B200] font-bold">
                                 <Youtube size={14} /> Vídeo de YouTube
                              </div>
                           </div>
                        )}

                        {/* Photo specific */}
                        {post.type === 'photo' && post.image && (
                           <div className="mt-2 flex flex-col gap-2">
                              <div className="border border-[#ddd] p-1 bg-white inline-block shadow-sm hover:border-[#2B7BB9] cursor-pointer transition-all hover:scale-[1.01] self-start">
                                 <img
                                    src={post.image.startsWith('http') ? post.image : `${import.meta.env.VITE_API_URL?.replace('/api', '')}${post.image}`}
                                    className="h-[250px] md:h-[450px] w-auto max-w-full object-contain"
                                    onClick={() => {
                                       const photoObj = {
                                          id: post.id,
                                          url: post.image!,
                                          userId: post.userId,
                                          createdAt: post.createdAt,
                                          user: post.user,
                                          _count: post._count,
                                          photoTags: []
                                       } as any;
                                       openPhoto(photoObj, [photoObj]);
                                    }}
                                    alt="attachment"
                                 />
                              </div>
                              <div className="flex justify-start">
                                 <button
                                    onClick={() => handleToggleLike(post.id)}
                                    className={`flex items-center gap-1.5 px-3 py-1 rounded-[3px] text-[11px] font-bold transition-all ${post.likedByMe ? 'bg-[#59B200] text-white' : 'bg-[#f2f6f9] text-[#555] border border-[#ccc] hover:bg-[#e1e9f0]'}`}
                                 >
                                    <ThumbsUp size={12} fill={post.likedByMe ? 'white' : 'transparent'} />
                                    {post.likedByMe ? '¡Me mola!' : 'Me mola'}
                                 </button>
                              </div>
                           </div>
                        )}

                        {/* Interaction Summary */}
                        <div className="mt-1 flex flex-col gap-0.5">
                           <CommentSection
                              postId={post.id}
                              initialCommentsCount={post._count?.comments || 0}
                           />

                           {post.type === 'photo' && (
                              <div className="flex items-center gap-1 text-[11px]">
                                 <Tag size={10} className="text-[#59B200] fill-[#59B200]" />
                                 <span className="text-[#59B200] font-bold">Etiquetas</span>
                              </div>
                           )}
                        </div>
                     </div>
                  </div>
               ))}
            </div>
         )}

         {hasMore && (
            <div className="mt-4 text-center">
               <button
                  onClick={handleLoadMore}
                  disabled={isLoadingMore}
                  className="text-[#005599] font-bold text-[12px] hover:underline bg-[#f2f6f9] w-full py-2 rounded border border-[#e1e9f0] transition-colors"
               >
                  {isLoadingMore ? 'Cargando...' : 'Ver más novedades'}
               </button>
            </div>
         )}

      </div>
   );
};

export default Feed;