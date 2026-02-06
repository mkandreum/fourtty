import React, { useState, useEffect } from 'react';
import { MessageSquare, Edit3, Tag, Youtube, Flag, ThumbsUp, UserPlus, Plus, Bell, X } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import api from '../api';
import { Post } from '../types';
import CommentSection from './CommentSection';
import { motion, AnimatePresence } from 'framer-motion';

const Feed: React.FC = () => {
   const { user, updateUser } = useAuth();
   const { showToast } = useToast();
   const [statusText, setStatusText] = useState('');
   const [posts, setPosts] = useState<Post[]>([]);
   const [isLoading, setIsLoading] = useState(true);
   const [limit] = useState(10);
   const [page, setPage] = useState(1);
   const [hasMore, setHasMore] = useState(true);
   const [isLoadingMore, setIsLoadingMore] = useState(false);

   // Invitations states
   const [inviteEmail, setInviteEmail] = useState('');
   const [isInviting, setIsInviting] = useState(false);
   const [myInvitations, setMyInvitations] = useState<any[]>([]);
   const [isInvitesExpanded, setIsInvitesExpanded] = useState(false); // Collapsed by default on mobile
   const [unreadNotifications, setUnreadNotifications] = useState<any[]>([]);

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

   // Initial fetch
   useEffect(() => {
      const init = async () => {
         setIsLoading(true);
         await Promise.all([
            fetchFeed(1, true),
            fetchInvitations(),
            fetchUnreadNotifications()
         ]);
         setIsLoading(false);
      };
      init();
   }, []);

   const fetchInvitations = async () => {
      try {
         const res = await api.get('/invitations/my');
         setMyInvitations(res.data.invitations);
      } catch (error) {
         console.error("Error fetching invitations:", error);
      }
   };

   const fetchUnreadNotifications = async () => {
      try {
         const res = await api.get('/notifications');
         setUnreadNotifications(res.data.notifications.filter((n: any) => !n.read));
      } catch (error) {
         console.error("Error fetching notifications:", error);
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

   const handleSendInvite = async () => {
      if (!inviteEmail.trim()) return;
      setIsInviting(true);
      try {
         const res = await api.post('/invitations/generate', { email: inviteEmail });
         showToast(res.data.message || "Invitación enviada", "success");

         // Refresh user count (if it exists in auth context)
         const userRes = await api.get('/auth/me');
         updateUser(userRes.data.user);

         setInviteEmail('');
         fetchInvitations();
      } catch (e: any) {
         showToast(e.response?.data?.error || "Error al generar invitación", "error");
      } finally {
         setIsInviting(false);
      }
   };

   return (
      <motion.div
         initial={{ opacity: 0, x: -20 }}
         animate={{ opacity: 1, x: 0 }}
         exit={{ opacity: 0, x: 20 }}
         transition={{ duration: 0.3 }}
         className="bg-white min-h-[500px] p-3 md:p-0"
      >

         {/* Status Box - Speech Bubble Style */}
         <div className="mb-4 md:mb-6 relative pt-2">
            <motion.div
               whileFocus={{ scale: 1.01 }}
               className="bg-white border-2 border-[#b2c2d1] rounded-[8px] p-2 relative shadow-sm"
            >
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
                              className="absolute top-[-20px] right-0 bg-[#f0f0f0] border border-[#ccc] text-[#999] text-[9px] w-6 h-6 rounded-full flex items-center justify-center font-bold shadow-sm z-10"
                           >
                              {140 - statusText.length}
                           </motion.div>
                        )}
                     </AnimatePresence>
                  </div>
               </div>
            </motion.div>

            <div className="flex justify-between items-center mt-2 px-1 gap-2">
               <div className="text-[10px] md:text-[11px] text-[#888] italic truncate max-w-[60%]">
                  Última: <span className="text-[#333] font-bold not-italic">"{user?.bio || 'Sin estado'}"</span>
               </div>
               <button
                  onClick={handleUpdateStatus}
                  disabled={isSubmitting || !statusText.trim()}
                  className={`bg-[#2B7BB9] text-white text-[11px] md:text-[12px] font-bold px-4 md:px-6 py-1 rounded-[3px] border border-[#1e5a8c] shadow-sm transition-all ${isSubmitting || !statusText.trim() ? 'opacity-50 cursor-not-allowed' : 'hover:bg-[#256ca3] active:scale-95'}`}
               >
                  {isSubmitting ? '...' : 'Publicar'}
               </button>
            </div>
         </div>

         {/* Unread Notifications - Shown below status box */}
         {unreadNotifications.length > 0 && (
            <motion.div
               initial={{ opacity: 0, y: -10 }}
               animate={{ opacity: 1, y: 0 }}
               className="mb-4 bg-[#fff9e6] border border-[#ffeaa7] rounded-[4px] p-2 shadow-sm"
            >
               <div className="flex items-center gap-2 mb-1">
                  <Bell size={12} className="text-[#d4a017]" />
                  <span className="text-[11px] font-bold text-[#856404]">Tienes {unreadNotifications.length} notificaciones nuevas:</span>
               </div>
               <div className="flex flex-col gap-1">
                  {unreadNotifications.slice(0, 3).map(notif => (
                     <div key={notif.id} className="text-[10px] text-[#856404] flex items-center gap-1">
                        <div className="w-1 h-1 bg-[#d4a017] rounded-full"></div>
                        <span className="truncate">{notif.content}</span>
                     </div>
                  ))}
                  {unreadNotifications.length > 3 && (
                     <div className="text-[9px] text-[#856404] font-bold mt-1 italic pointer-events-none">
                        Y otras {unreadNotifications.length - 3} más...
                     </div>
                  )}
               </div>
            </motion.div>
         )}

         {/* Invitations Panel - Especially for Mobile */}
         <div className="mb-6 bg-[#f9fbfd] border border-[#dce5ed] rounded-[4px] p-2 md:p-3 shadow-sm overflow-hidden">
            <div
               className="flex items-center justify-between cursor-pointer md:cursor-default"
               onClick={() => { if (window.innerWidth < 768) setIsInvitesExpanded(!isInvitesExpanded); }}
            >
               <h4 className="font-bold text-[#333] text-[11px] md:text-[12px] flex items-center gap-1.5 uppercase tracking-wide">
                  <UserPlus size={14} className="text-[#59B200]" />
                  <span>Invitaciones</span>
               </h4>
               <div className="flex items-center gap-2">
                  <div className="bg-[#59B200] text-white text-[9px] font-bold px-1.5 py-0.5 rounded-[2px]">
                     {user?.invitationsCount || 0} disponibles
                  </div>
                  <div className="md:hidden text-gray-400">
                     {isInvitesExpanded ? <X size={14} /> : <Plus size={14} />}
                  </div>
               </div>
            </div>

            <div className={`${isInvitesExpanded ? 'block' : 'hidden'} md:block mt-3 animate-in fade-in slide-in-from-top-2 duration-300`}>
               <div className="flex flex-col sm:flex-row gap-2">
                  <input
                     type="email"
                     placeholder="Email de tu amigo..."
                     className="flex-1 p-2 text-[12px] border border-[#ccc] rounded-[2px] bg-white outline-none focus:border-[#2B7BB9]"
                     value={inviteEmail}
                     onChange={(e) => setInviteEmail(e.target.value)}
                  />
                  <button
                     disabled={isInviting || !inviteEmail.trim() || (user?.invitationsCount || 0) <= 0}
                     onClick={handleSendInvite}
                     className="bg-[#59B200] text-white font-bold text-[11px] px-4 py-2 sm:py-0 rounded-[2px] border border-[#4a9600] hover:bg-[#4a9600] disabled:opacity-50 transition-all active:scale-95 shadow-sm truncate"
                  >
                     {isInviting ? '...' : (user?.invitationsCount || 0) <= 0 ? 'Sin invitaciones' : 'Enviar'}
                  </button>
               </div>

               {myInvitations.length > 0 && (
                  <div className="mt-3 flex gap-2 overflow-x-auto no-scrollbar pb-1">
                     {myInvitations.slice(0, 5).map(inv => (
                        <div key={inv.id} className="shrink-0 bg-white border border-[#eee] px-2 py-1 rounded-[2px] text-[10px] flex items-center gap-1.5">
                           <span className={`font-mono font-bold ${inv.used ? 'text-gray-300 line-through' : 'text-[#59B200]'}`}>
                              {inv.code}
                           </span>
                           {inv.used && <span className="text-[8px] text-gray-400 italic">Usado</span>}
                        </div>
                     ))}
                  </div>
               )}
            </div>
         </div>

         {/* Feed List */}
         <div className="flex items-center justify-between mb-2 border-b border-[#EEE] pb-1">
            <h3 className="text-[#59B200] font-bold text-[14px] flex items-center gap-1">
               <div className="bg-[#59B200] text-white p-0.5 rounded-[3px] shadow-sm">
                  <MessageSquare size={14} fill="white" strokeWidth={0} />
               </div>
               Novedades
            </h3>
            <div className="text-[11px] flex gap-2">
               <span className="font-bold text-[#333]">Amigos</span>
               <span className="text-[#005599] hover:underline cursor-pointer">Páginas</span>
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

               <AnimatePresence initial={false}>
                  {posts.map((post, idx) => (
                     <motion.div
                        key={post.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: idx % 10 * 0.05 }}
                        className="flex gap-2 group"
                     >
                        {/* Avatar */}
                        <div className="w-[50px] shrink-0">
                           {post.user.avatar ? (
                              <motion.img
                                 whileHover={{ scale: 1.05 }}
                                 src={post.user.avatar.startsWith('http') ? post.user.avatar : `${import.meta.env.VITE_API_URL?.replace('/api', '')}${post.user.avatar}`}
                                 alt={post.user.name}
                                 className="w-[50px] h-[50px] object-cover border border-[#ccc] rounded-[2px] p-[1px] bg-white shadow-sm cursor-pointer"
                              />
                           ) : (
                              <div className="w-[50px] h-[50px] bg-gray-200 border border-[#ccc] rounded-[2px] flex items-center justify-center text-gray-400">
                                 No img
                              </div>
                           )}
                        </div>

                        {/* Content */}
                        <div className="flex-1 border-b border-[#f5f5f5] pb-3">
                           <div className="text-[12px] leading-snug mb-1">
                              <a href="#" className="text-[#005599] font-bold hover:underline">{post.user.name}</a>
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
                              <span className="mx-1">·</span>
                              <span className="text-[#005599] hover:underline cursor-pointer">Comentar</span>
                           </div>

                           {post._count && post._count.likes > 0 && (
                              <div className="flex items-center gap-1 text-[10px] text-[#59B200] font-bold mt-1 mb-1">
                                 <ThumbsUp size={10} fill="#59B200" /> {post._count.likes} {post._count.likes === 1 ? 'persona le mola esto' : 'personas les mola esto'}
                              </div>
                           )}

                           {/* Status specific */}
                           {post.type === 'status' && (
                              <div className="text-[#333] text-[12px] mt-1 mb-2">
                                 "{post.content}"
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
                              <div className="mt-2 flex gap-2">
                                 <motion.div
                                    whileHover={{ scale: 1.01 }}
                                    className="border border-[#ddd] p-1 bg-white inline-block shadow-sm hover:border-[#2B7BB9] cursor-pointer transition-colors"
                                 >
                                    <img
                                       src={post.image.startsWith('http') ? post.image : `${import.meta.env.VITE_API_URL?.replace('/api', '')}${post.image}`}
                                       className="h-[180px] md:h-[300px] w-auto max-w-full object-contain"
                                       alt="attachment"
                                    />
                                 </motion.div>
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
                     </motion.div>
                  ))}
               </AnimatePresence>
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

      </motion.div>
   );
};

export default Feed;