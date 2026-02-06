import React, { useState, useEffect } from 'react';
import { MessageSquare, Edit3, Tag } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import api from '../api';
import { Post } from '../types';
import CommentSection from './CommentSection';

const Feed: React.FC = () => {
   const { user, updateUser } = useAuth();
   const [statusText, setStatusText] = useState('');
   const [posts, setPosts] = useState<Post[]>([]);
   const [isLoading, setIsLoading] = useState(true);
   const [limit] = useState(10);
   const [page, setPage] = useState(1);
   const [hasMore, setHasMore] = useState(true);
   const [isLoadingMore, setIsLoadingMore] = useState(false);

   // Initialize status text when user data is available
   useEffect(() => {
      if (user && user.bio) {
         setStatusText(user.bio);
      }
   }, [user]);

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
         await fetchFeed(1, true);
         setIsLoading(false);
      };
      init();
   }, []);

   const handleLoadMore = async () => {
      setIsLoadingMore(true);
      const nextPage = page + 1;
      await fetchFeed(nextPage);
      setPage(nextPage);
      setIsLoadingMore(false);
   };

   const handleUpdateStatus = async () => {
      if (!statusText.trim()) return;

      try {
         // Update profile bio (status)
         await api.put('/users/profile', { bio: statusText });

         // Create a new post
         await api.post('/posts', {
            content: statusText,
            type: 'status'
         });

         // Refresh user data
         if (user) {
            updateUser({ ...user, bio: statusText });
         }

         // Refresh feed (reset to page 1)
         setPage(1);
         await fetchFeed(1, true);

      } catch (error) {
         console.error("Error updating status:", error);
      }
   };

   return (
      <div className="bg-white min-h-[500px]">

         {/* Status Box - Speech Bubble Style */}
         <div className="mb-6 relative pt-2">
            <div className="bg-white border-2 border-[#b2c2d1] rounded-[8px] p-2 relative shadow-sm">
               {/* Speech pulse arrow tip */}
               <div className="absolute top-[-10px] left-8 w-0 h-0 border-l-[10px] border-l-transparent border-r-[10px] border-r-transparent border-b-[10px] border-b-[#b2c2d1]"></div>
               <div className="absolute top-[-7px] left-8 w-0 h-0 border-l-[10px] border-l-transparent border-r-[10px] border-r-transparent border-b-[10px] border-b-white"></div>

               <div className="flex gap-2 items-start">
                  <div className="flex-1 relative">
                     <input
                        className="w-full border-none p-2 text-[14px] md:text-[18px] text-[#333] placeholder-gray-300 outline-none"
                        value={statusText}
                        onChange={(e) => setStatusText(e.target.value.slice(0, 140))}
                        placeholder="¡Hola!"
                     />
                     {/* Character count bubble */}
                     <div className="absolute top-[-20px] right-0 bg-[#f0f0f0] border border-[#ccc] text-[#999] text-[9px] w-6 h-6 rounded-full flex items-center justify-center font-bold shadow-sm z-10">
                        {140 - statusText.length}
                     </div>
                  </div>
               </div>
            </div>

            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mt-2 pl-2 gap-2">
               <div className="text-[11px] text-[#888] italic">
                  Última actualización: <span className="text-[#333] font-bold not-italic">"{user?.bio || 'Sin estado'}"</span>
               </div>
               <button
                  onClick={handleUpdateStatus}
                  className="bg-[#2B7BB9] text-white text-[12px] font-bold px-6 py-1 rounded-[3px] border border-[#1e5a8c] hover:bg-[#256ca3] shadow-sm self-end sm:self-auto"
               >
                  Guardar
               </button>
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
               <span className="bg-[#59B200] text-white px-1 rounded-[2px] text-[10px] font-bold">10+</span>
               <span className="text-[#005599] hover:underline cursor-pointer">Sitios</span>
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
                  <div key={post.id} className="flex gap-2 group">
                     {/* Avatar */}
                     <div className="w-[50px] shrink-0">
                        {post.user.avatar ? (
                           <img
                              src={post.user.avatar.startsWith('http') ? post.user.avatar : `${import.meta.env.VITE_API_URL?.replace('/api', '')}${post.user.avatar}`}
                              alt={post.user.name}
                              className="w-[50px] h-[50px] object-cover border border-[#ccc] rounded-[2px] p-[1px] bg-white shadow-sm"
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

                        <div className="text-[10px] text-[#999] mb-1">
                           {new Date(post.createdAt).toLocaleString()} <span className="mx-1">·</span> <span className="text-[#005599] hover:underline cursor-pointer">Comentar</span>
                        </div>

                        {/* Status specific */}
                        {post.type === 'status' && (
                           <div className="text-[#333] text-[12px] mt-1 mb-2">
                              "{post.content}"
                           </div>
                        )}

                        {/* Photo specific */}
                        {post.type === 'photo' && post.image && (
                           <div className="mt-2 flex gap-2">
                              <div className="border border-[#ddd] p-1 bg-white inline-block shadow-sm">
                                 <img
                                    src={post.image.startsWith('http') ? post.image : `${import.meta.env.VITE_API_URL?.replace('/api', '')}${post.image}`}
                                    className="h-[80px] w-auto cursor-pointer"
                                    alt="attachment"
                                 />
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
                  className="text-[#005599] font-bold text-[12px] hover:underline bg-[#f2f6f9] w-full py-2 rounded border border-[#e1e9f0]"
               >
                  {isLoadingMore ? 'Cargando...' : 'Ver más novedades'}
               </button>
            </div>
         )}

      </div>
   );
};

export default Feed;