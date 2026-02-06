import React, { useState, useEffect } from 'react';
import { Mail, Edit3, User as UserIcon, MapPin, Briefcase, Heart, Camera, Flag } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import api from '../api';
import { User, Post } from '../types';
import CommentSection from './CommentSection';

import { useParams, useNavigate } from 'react-router-dom';

const Profile: React.FC = () => {
   const { user, updateUser } = useAuth();
   const { id } = useParams<{ id: string }>();
   const navigate = useNavigate();
   const [profileUser, setProfileUser] = useState<User | null>(null);
   const [friends, setFriends] = useState<User[]>([]);
   const [friendStatus, setFriendStatus] = useState<'none' | 'pending_sent' | 'pending_received' | 'accepted' | 'self'>('self');
   const [friendshipId, setFriendshipId] = useState<number | null>(null);
   const [wallPosts, setWallPosts] = useState<Post[]>([]);
   const [wallInput, setWallInput] = useState('');
   const [isLoading, setIsLoading] = useState(true);
   const [isUploading, setIsUploading] = useState(false);
   const [isEditing, setIsEditing] = useState(false);
   const [editData, setEditData] = useState<Partial<User>>({});

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
            setEditData(userData || {});

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

               // Track visit if it's someone else's profile
               if (!isOwnProfile) {
                  api.post(`/visit/${targetUserId}`).catch(e => console.error("Track visit error:", e));
               }
            }
         } catch (error) {
            console.error("Error loading profile data:", error);
         } finally {
            setIsLoading(false);
         }
      };

      fetchProfile();
   }, [id, user]);

   const handleUpdateProfile = async () => {
      if (!profileUser) return;
      try {
         const response = await api.put(`/users/${profileUser.id}`, editData);
         updateUser(response.data.user);
         setProfileUser(response.data.user);
         setIsEditing(false);
      } catch (error) {
         console.error("Error updating profile:", error);
         alert("Error al actualizar el perfil");
      }
   };

   const [postImage, setPostImage] = useState<File | null>(null);

   const handlePostToWall = async () => {
      if (!wallInput.trim() && !postImage) return;

      try {
         const formData = new FormData();
         formData.append('content', wallInput);
         formData.append('type', postImage ? 'photo' : 'status');
         if (postImage) formData.append('image', postImage);

         const response = await api.post('/posts', formData);

         setWallPosts([response.data.post, ...wallPosts]);
         setWallInput('');
         setPostImage(null);
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
         const response = await api.post(`/users/${user!.id}/avatar`, formData, {
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
      if (friendStatus === 'self') {
         return (
            <button
               onClick={() => setIsEditing(!isEditing)}
               className="flex items-center gap-1 bg-[#f2f6f9] border border-[#ccc] px-2 py-1 rounded-[3px] text-[11px] text-[#333] font-bold hover:bg-[#e1e9f0]"
            >
               <Edit3 size={12} /> {isEditing ? 'Cancelar' : 'Editar mi perfil'}
            </button>
         );
      }

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
      <div className="bg-white md:rounded-[4px] md:border border-[#dce5ed] p-3 md:p-4 min-h-[600px]">

         {/* Profile Header */}
         <div className="mb-4 md:mb-6 relative">
            <h1 className="text-[18px] md:text-[20px] font-bold text-[#333] mb-1">{profileUser.name}</h1>
            <div className="text-[#555] text-[12px] md:text-[13px] mb-3 border-b border-[#eee] pb-3 pr-[80px] md:pr-0">
               {profileUser.bio || 'Sin estado'}
            </div>

            <div className="absolute top-0 right-0 gap-2">
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

               {/* Info Box / Edit Mode */}
               {isEditing ? (
                  <div className="bg-[#f2f6f9] border border-[#dce5ed] p-3 text-[11px] flex flex-col gap-2">
                     <div>
                        <label className="block font-bold text-[#666] mb-1">Nombre</label>
                        <input
                           type="text"
                           className="w-full border border-[#ccc] rounded-[2px] p-1"
                           value={editData.name || ''}
                           onChange={(e) => setEditData({ ...editData, name: e.target.value })}
                        />
                     </div>
                     <div>
                        <label className="block font-bold text-[#666] mb-1">Estado / Bio</label>
                        <textarea
                           className="w-full border border-[#ccc] rounded-[2px] p-1 h-12 resize-none"
                           value={editData.bio || ''}
                           onChange={(e) => setEditData({ ...editData, bio: e.target.value })}
                        />
                     </div>
                     <div className="flex gap-2">
                        <div className="flex-1">
                           <label className="block font-bold text-[#666] mb-1">Sexo</label>
                           <select
                              className="w-full border border-[#ccc] rounded-[2px] p-1"
                              value={editData.gender || ''}
                              onChange={(e) => setEditData({ ...editData, gender: e.target.value })}
                           >
                              <option value="">Selecciona</option>
                              <option value="Hombre">Hombre</option>
                              <option value="Mujer">Mujer</option>
                           </select>
                        </div>
                        <div className="w-16">
                           <label className="block font-bold text-[#666] mb-1">Edad</label>
                           <input
                              type="number"
                              className="w-full border border-[#ccc] rounded-[2px] p-1"
                              value={editData.age || ''}
                              onChange={(e) => setEditData({ ...editData, age: Number(e.target.value) })}
                           />
                        </div>
                     </div>
                     <div>
                        <label className="block font-bold text-[#666] mb-1">Situación sentimental</label>
                        <input
                           type="text"
                           className="w-full border border-[#ccc] rounded-[2px] p-1"
                           value={editData.relationshipStatus || ''}
                           onChange={(e) => setEditData({ ...editData, relationshipStatus: e.target.value })}
                           placeholder="Soltero, Casado..."
                        />
                     </div>
                     <div>
                        <label className="block font-bold text-[#666] mb-1">Localidad</label>
                        <input
                           type="text"
                           className="w-full border border-[#ccc] rounded-[2px] p-1"
                           value={editData.location || ''}
                           onChange={(e) => setEditData({ ...editData, location: e.target.value })}
                        />
                     </div>
                     <div>
                        <label className="block font-bold text-[#666] mb-1">Ocupación</label>
                        <input
                           type="text"
                           className="w-full border border-[#ccc] rounded-[2px] p-1"
                           value={editData.occupation || ''}
                           onChange={(e) => setEditData({ ...editData, occupation: e.target.value })}
                        />
                     </div>
                     <div>
                        <label className="block font-bold text-[#666] mb-1">Privacidad del perfil</label>
                        <select
                           className="w-full border border-[#ccc] rounded-[2px] p-1"
                           value={editData.privacy || 'public'}
                           onChange={(e) => setEditData({ ...editData, privacy: e.target.value })}
                        >
                           <option value="public">Público (todo el mundo)</option>
                           <option value="friends">Solo amigos</option>
                           <option value="private">Privado (solo yo)</option>
                        </select>
                     </div>
                     <button
                        onClick={handleUpdateProfile}
                        className="bg-[#59B200] text-white font-bold py-1.5 rounded-[2px] border border-[#4a9600] mt-1"
                     >
                        Guardar cambios
                     </button>
                  </div>
               ) : (
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
                     <div className="flex items-center gap-2 mb-1.5">
                        <Briefcase size={12} className="text-[#888]" />
                        <span>{profileUser.occupation || 'No especificado'}</span>
                     </div>
                     <div className="flex items-center gap-2 border-t border-[#eee] pt-1.5 mt-1.5">
                        <div className={`w-2 h-2 rounded-full ${profileUser.privacy === 'public' ? 'bg-green-500' : (profileUser.privacy === 'friends' ? 'bg-blue-500' : 'bg-red-500')}`}></div>
                        <span className="text-[10px] font-bold text-[#666]">
                           {profileUser.privacy === 'public' ? 'Perfil público' : (profileUser.privacy === 'friends' ? 'Solo amigos' : 'Perfil privado')}
                        </span>
                     </div>
                  </div>
               )}

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
                        <button
                           onClick={() => navigate(`/profile`)} // Should list all friends, but link to gallery instead? 
                           className="text-[#005599] text-[11px] hover:underline"
                        >
                           Ver todos
                        </button>
                     </div>
                  )}
               </div>

               {/* Add Gallery Link Widget */}
               <div>
                  <h3 className="text-[#005599] font-bold text-[12px] mb-2 border-b border-[#eee] pb-1">
                     Galería de fotos
                  </h3>
                  <button
                     onClick={() => navigate(id ? `/profile/photos/${id}` : '/profile/photos')}
                     className="w-full bg-[#f2f6f9] border border-[#dce5ed] p-2 text-[11px] text-[#005599] font-bold hover:bg-[#e1f0fa] flex items-center justify-center gap-2"
                  >
                     <Camera size={14} /> Ver fotos de {profileUser.name.split(' ')[0]}
                  </button>
               </div>

               {/* Pages Widget */}
               <div className="bg-white border border-[#dce5ed] rounded-[4px] p-3">
                  <h3 className="text-[#005599] font-bold text-[12px] mb-2 border-b border-[#eee] pb-1 flex items-center gap-1">
                     <Flag size={14} /> Páginas
                  </h3>
                  <div className="flex flex-col gap-2">
                     <button
                        onClick={() => navigate('/pages')}
                        className="text-[11px] text-[#005599] hover:underline text-left font-medium"
                     >
                        » Explorar todas las páginas
                     </button>
                  </div>
               </div>
            </div>

            {/* Right Column: The Wall */}
            <div className="w-full md:w-[70%]">

               {/* Wall Input - Only if own profile (for now) */}
               {isOwnProfile && (
                  <div className="bg-[#f2f6f9] p-3 rounded-[4px] border border-[#e1e9f0] mb-4">
                     <div className="text-[#005599] font-bold text-[12px] mb-1">Escribe algo en tu tablón...</div>
                     <textarea
                        className="w-full h-16 border border-[#b2c2d1] rounded-[2px] p-1 text-[12px] resize-none focus:border-[#5C95C4] outline-none"
                        value={wallInput}
                        onChange={(e) => setWallInput(e.target.value)}
                     ></textarea>
                     <div className="flex justify-between items-center mt-2">
                        <div className="flex items-center gap-2">
                           <input
                              type="file"
                              id="post-image"
                              className="hidden"
                              accept="image/*"
                              onChange={(e) => setPostImage(e.target.files?.[0] || null)}
                           />
                           <button
                              onClick={() => document.getElementById('post-image')?.click()}
                              className={`flex items-center gap-1 text-[11px] font-bold ${postImage ? 'text-[#59B200]' : 'text-[#888]'} hover:text-[#555]`}
                           >
                              <Camera size={14} /> {postImage ? 'Imagen lista' : 'Adjuntar foto'}
                           </button>
                           {postImage && <span className="text-[10px] text-gray-500 truncate max-w-[100px]">{postImage.name}</span>}
                        </div>
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
                              {post.image && (
                                 <div className="mb-2 mt-1">
                                    <img
                                       src={post.image.startsWith('http') ? post.image : `${import.meta.env.VITE_API_URL?.replace('/api', '')}${post.image}`}
                                       className="max-w-full max-h-[300px] rounded-[2px] border border-[#eee]"
                                       alt="Post"
                                    />
                                 </div>
                              )}
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