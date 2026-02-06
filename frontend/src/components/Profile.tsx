import React, { useState, useEffect } from 'react';
import { Mail, Edit3, User as UserIcon, MapPin, Briefcase, Heart, Camera } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import api from '../api';
import { User, Post } from '../types';
import CommentSection from './CommentSection';

import { useParams } from 'react-router-dom';

const Profile: React.FC = () => {
   const { user, updateUser } = useAuth();
   const { id } = useParams<{ id: string }>();
   const [profileUser, setProfileUser] = useState<User | null>(null);
   const [friends, setFriends] = useState<User[]>([]);
   const [friendStatus, setFriendStatus] = useState<'none' | 'pending_sent' | 'pending_received' | 'accepted' | 'self'>('self');
   const [friendshipId, setFriendshipId] = useState<number | null>(null);
   const [wallPosts, setWallPosts] = useState<Post[]>([]);
   const [wallInput, setWallInput] = useState('');
   const [isLoading, setIsLoading] = useState(true);
   const [isUploading, setIsUploading] = useState(false);

   const isOwnProfile = !id || (user && user.id === Number(id));

   useEffect(() => {
      const fetchProfile = async () => {
         setIsLoading(true);
         try {
            const targetUserId = id ? Number(id) : user?.id;
            if (!targetUserId) return;

            // Fetch user profile if it's not own profile (or refresh own)
            let userData = user;
            if (id) {
               const userRes = await api.get(`/users/${id}`);
               userData = userRes.data.user;
            }
            setProfileUser(userData || null);

            // Fetch Friendship Status
            if (targetUserId !== user?.id) {
               const statusRes = await api.get(`/friendships/status/${targetUserId}`);
               setFriendStatus(statusRes.data.status);
               setFriendshipId(statusRes.data.friendshipId);
            } else {
               setFriendStatus('self');
            }

            if (userData) {
               const [friendsRes, postsRes] = await Promise.all([
                  api.get(`/users/${userData.id}/friends`),
                  api.get(`/posts/user/${userData.id}`)
               ]);

               setFriends(friendsRes.data.friends);
               setWallPosts(postsRes.data.posts);
            }
         } catch (error) {
            console.error("Error loading profile data:", error);
         } finally {
            setIsLoading(false);
         }
      };

      fetchProfile();
   }, [id, user]);

   const handlePostToWall = async () => {
      if (!wallInput.trim() || !profileUser) return;

      try {
         // Create post. If it's another user's wall, we might need a different endpoint logic 
         // OR currently posts are just generic. 
         // For now, let's assume we are posting TO the user's wall?
         // The current backend POST /api/posts creates a post for the CURRENT user.
         // To post on someone else's wall, we might need 'receiverId' or similar in Post model.
         // If generic 'status', it appears on own wall.
         // If writing on friend's wall, it's complex. 
         // Let's assume for now we only post to OWN wall or ignore cross-posting for MVP unless implemented.

         if (!isOwnProfile) {
            alert("Escribir en el muro de otros aún no está implementado en backend.");
            return;
         }

         const response = await api.post('/posts', {
            content: wallInput,
            type: 'status'
         });

         setWallPosts([response.data.post, ...wallPosts]);
         setWallInput('');
      } catch (error) {
         console.error("Error posting to wall:", error);
      }
   };

   const handleAddFriend = async () => {
      if (!profileUser) return;
      try {
         const res = await api.post('/friendships/request', { friendId: profileUser.id });
         setFriendStatus('pending_sent');
         setFriendshipId(res.data.friendship.id);
      } catch (e) {
         console.error(e);
         alert("Error al enviar solicitud");
      }
   };

   const handleAcceptFriend = async () => {
      if (!friendshipId) return;
      try {
         await api.put(`/friendships/${friendshipId}/accept`);
         setFriendStatus('accepted');
         // Reload friends list?
      } catch (e) {
         console.error(e);
      }
   };

   const handleRemoveFriend = async () => {
      if (!friendshipId || !confirm("¿Seguro que quieres eliminar a este amigo?")) return;
      try {
         await api.delete(`/friendships/${friendshipId}`);
         setFriendStatus('none');
         setFriendshipId(null);
      } catch (e) { console.error(e); }
   };

   // handleAvatarUpload only if isOwnProfile
   const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
      if (!e.target.files || !e.target.files[0] || !isOwnProfile) return;

      setIsUploading(true);
      const formData = new FormData();
      formData.append('avatar', e.target.files[0]);

      try {
         const response = await api.put(`/users/${user!.id}/avatar`, formData, {
            headers: {
               'Content-Type': 'multipart/form-data'
            }
         });

         // Update auth context
         updateUser(response.data.user);
         // Update local state if we are viewing own profile
         setProfileUser(response.data.user);
      } catch (error) {
         console.error("Error uploading avatar:", error);
         alert("Error al subir la foto");
      } finally {
         setIsUploading(false);
      }
   };

   // Render buttons helper
   const renderActionButtons = () => {
      if (friendStatus === 'self') return null;

      switch (friendStatus) {
         case 'none':
            return (
               <button
                  onClick={handleAddFriend}
                  className="flex items-center gap-1 bg-[#59B200] border border-[#4a9600] px-2 py-1 rounded-[3px] text-[11px] text-white font-bold hover:bg-[#4a9600]"
               >
                  <UserIcon size={12} /> Añadir a amigos
               </button>
            );
         case 'pending_sent':
            return (
               <button className="flex items-center gap-1 bg-[#f2f6f9] border border-[#ccc] px-2 py-1 rounded-[3px] text-[11px] text-[#999] cursor-default">
                  Solicitud enviada
               </button>
            );
         case 'pending_received':
            return (
               <div className="flex gap-2">
                  <button
                     onClick={handleAcceptFriend}
                     className="flex items-center gap-1 bg-[#59B200] border border-[#4a9600] px-2 py-1 rounded-[3px] text-[11px] text-white font-bold hover:bg-[#4a9600]"
                  >
                     Aceptar solicitud
                  </button>
               </div>
            );
         case 'accepted':
            return (
               <div className="flex gap-2">
                  <button className="flex items-center gap-1 bg-[#f2f6f9] border border-[#ccc] px-2 py-1 rounded-[3px] text-[11px] text-[#333] hover:bg-[#e1e9f0]">
                     <Mail size={12} /> Enviar mensaje
                  </button>
                  <button className="flex items-center gap-1 bg-[#f2f6f9] border border-[#ccc] px-2 py-1 rounded-[3px] text-[11px] text-[#333] hover:bg-[#e1e9f0] cursor-default">
                     Amigo
                  </button>
                  <button
                     onClick={handleRemoveFriend}
                     className="text-[10px] text-[#cc0000] hover:underline px-1"
                  >
                     (Eliminar)
                  </button>
               </div>
            );
         default:
            return null;
      }
   };

   if (isLoading) return <div className="p-4">Cargando perfil...</div>;
   if (!profileUser) return <div className="p-4">Usuario no encontrado</div>;

   const getAvatarUrl = (avatar?: string) => {
      if (!avatar) return 'https://ui-avatars.com/api/?name=' + profileUser.name;
      if (avatar.startsWith('http')) return avatar;
      return `${import.meta.env.VITE_API_URL?.replace('/api', '')}${avatar}`;
   };

   return (
      <div className="bg-white rounded-[4px] border border-[#dce5ed] p-4 min-h-[600px]">

         {/* Profile Header */}
         <div className="mb-6 relative">
            <h1 className="text-[20px] font-bold text-[#333] mb-1">{profileUser.name}</h1>
            <div className="text-[#555] text-[13px] mb-3 border-b border-[#eee] pb-3">
               {profileUser.bio || 'Sin estado'} <span className="text-[#999] text-[11px] ml-2"></span>
            </div>

            <div className="absolute top-0 right-0 flex gap-2">
               {renderActionButtons()}
            </div>
         </div>

         <div className="flex flex-col md:flex-row gap-6">
            {/* Left Column: Info & Photos */}
            <div className="w-full md:w-[30%] flex flex-col gap-4">

               {/* Profile Photo */}
               <div className="p-1 bg-white border border-[#ccc] shadow-sm inline-block group relative">
                  <img
                     src={getAvatarUrl(profileUser.avatar)}
                     alt="Profile"
                     className="w-full h-auto min-h-[150px] object-cover"
                  />

                  {/* Upload overlay - Only for own profile */}
                  {isOwnProfile && (
                     <label className="absolute inset-0 bg-black/50 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                        <Camera className="text-white mb-1" />
                        <span className="text-white text-xs font-bold">Cambiar foto</span>
                        <input
                           type="file"
                           accept="image/*"
                           className="hidden"
                           onChange={handleAvatarUpload}
                           disabled={isUploading}
                        />
                     </label>
                  )}
               </div>

               {/* Info Box */}
               <div className="bg-[#f9fbfd] border-t border-b border-[#e1e9f0] p-2 text-[11px] text-[#333]">
                  <div className="flex items-center gap-2 mb-1.5">
                     <UserIcon size={12} className="text-[#888]" />
                     <span>{profileUser.gender || 'No especificado'}, {profileUser.age || '?'} años</span>
                  </div>
                  <div className="flex items-center gap-2 mb-1.5">
                     <Heart size={12} className="text-[#888]" />
                     <span>{profileUser.relationshipStatus || 'No especificado'}</span>
                  </div>
                  <div className="flex items-center gap-2 mb-1.5">
                     <MapPin size={12} className="text-[#888]" />
                     <span>{profileUser.location || 'No especificado'}</span>
                  </div>
                  <div className="flex items-center gap-2">
                     <Briefcase size={12} className="text-[#888]" />
                     <span>{profileUser.occupation || 'No especificado'}</span>
                  </div>
               </div>

               {/* Friends Grid */}
               <div>
                  <h3 className="text-[#005599] font-bold text-[12px] mb-2 border-b border-[#eee] pb-1">
                     Amigos <span className="text-[#888] font-normal">({friends.length})</span>
                  </h3>
                  <div className="grid grid-cols-3 gap-1">
                     {friends.slice(0, 9).map(friend => (
                        <div key={friend.id} className="cursor-pointer group">
                           <img
                              src={getAvatarUrl(friend.avatar)}
                              className="w-full aspect-square object-cover"
                              alt={friend.name}
                           />
                           <div className="text-[9px] text-center mt-0.5 truncate text-[#005599] group-hover:underline">
                              {friend.name.split(' ')[0]}
                           </div>
                        </div>
                     ))}
                  </div>
                  {friends.length > 9 && (
                     <div className="text-right mt-2">
                        <a href="#" className="text-[#005599] text-[11px] hover:underline">Ver todos</a>
                     </div>
                  )}
               </div>

            </div>

            {/* Right Column: The Wall */}
            <div className="w-full md:w-[70%]">

               {/* Wall Input - Only if own profile (for now) */}
               {isOwnProfile && (
                  <div className="bg-[#f2f6f9] p-3 rounded-[4px] border border-[#e1e9f0] mb-4">
                     <div className="text-[#005599] font-bold text-[12px] mb-1">Escribe algo...</div>
                     <textarea
                        className="w-full h-16 border border-[#b2c2d1] rounded-[2px] p-1 text-[12px] resize-none focus:border-[#5C95C4] outline-none"
                        value={wallInput}
                        onChange={(e) => setWallInput(e.target.value)}
                     ></textarea>
                     <div className="text-right mt-2">
                        <button
                           onClick={handlePostToWall}
                           className="bg-[#005599] text-white text-[11px] font-bold px-3 py-1 rounded-[3px] hover:bg-[#00447a]"
                        >
                           Publicar
                        </button>
                     </div>
                  </div>
               )}

               {/* Wall Comments */}
               <h3 className="text-[#333] font-bold text-[13px] mb-3 pb-1 border-b border-[#ccc]">Tablón</h3>

               <div className="flex flex-col">
                  {isLoading ? (
                     <div className="p-4 text-center text-xs text-gray-500">Cargando publicaciones...</div>
                  ) : wallPosts.length === 0 ? (
                     <div className="p-4 text-center text-xs text-gray-500">No hay publicaciones en el tablón.</div>
                  ) : (
                     wallPosts.map((post, idx) => (
                        <div key={post.id} className={`flex gap-3 p-3 border-b border-[#eee] ${idx % 2 === 0 ? 'bg-white' : 'bg-[#f9fbfd]'}`}>
                           <div className="w-10 flex-shrink-0">
                              <img
                                 src={getAvatarUrl(post.user.avatar)}
                                 className="w-10 h-10 object-cover border border-[#ddd]"
                                 alt={post.user.name}
                              />
                           </div>
                           <div className="flex-1">
                              <div className="mb-1">
                                 <span className="text-[#005599] font-bold text-[12px] hover:underline cursor-pointer">{post.user.name}</span>
                                 <span className="text-[#333] text-[12px]"> {post.content}</span>
                              </div>
                              <div className="text-[#999] text-[10px] mb-1">
                                 {new Date(post.createdAt).toLocaleDateString()}
                              </div>
                              <CommentSection
                                 postId={post.id}
                                 initialCommentsCount={post._count?.comments || 0}
                              />
                           </div>
                        </div>
                     ))
                  )}
               </div>

            </div>
         </div>
      </div>
   );
};

export default Profile;