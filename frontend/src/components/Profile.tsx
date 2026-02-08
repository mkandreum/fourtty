import React, { useState, useEffect } from 'react';
import { Mail, Edit3, User as UserIcon, MapPin, Briefcase, Heart, Camera, Flag, Trash2, UserX, ThumbsUp, MessageCircle, Share2, X } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { usePhotoModal } from '../contexts/PhotoModalContext';
import api from '../api';
import { User, Post } from '../types';
import CommentSection from './CommentSection';
import { useParams, useNavigate } from 'react-router-dom';
import Cropper from 'react-easy-crop';
import { motion, AnimatePresence } from 'framer-motion';

const Profile: React.FC = () => {
   const { user, updateUser, logout } = useAuth();
   const { showToast } = useToast();
   const { id } = useParams<{ id: string }>();
   const navigate = useNavigate();
   const { openPhoto } = usePhotoModal();
   const [profileUser, setProfileUser] = useState<User | null>(null);
   const [friends, setFriends] = useState<User[]>([]);
   const [friendStatus, setFriendStatus] = useState<'none' | 'pending_sent' | 'pending_received' | 'accepted' | 'self'>('self');
   const [friendshipId, setFriendshipId] = useState<number | null>(null);
   const [wallPosts, setWallPosts] = useState<Post[]>([]);
   const [wallInput, setWallInput] = useState('');
   const [isLoading, setIsLoading] = useState(true);
   const [isUploading, setIsUploading] = useState(false);
   const [isEditing, setIsEditing] = useState(false);
   const [isRestricted, setIsRestricted] = useState(false);
   const [editData, setEditData] = useState<Partial<User>>({});
   const [stats, setStats] = useState({ visits: 0 });
   const [recentVisitors, setRecentVisitors] = useState<User[]>([]);
   const [postImage, setPostImage] = useState<File | null>(null);
   const [wallPreviewUrl, setWallPreviewUrl] = useState<string | null>(null);

   const handleWallFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
         setPostImage(file);
         const url = URL.createObjectURL(file);
         setWallPreviewUrl(url);
      }
   };

   const removeWallFile = () => {
      setPostImage(null);
      if (wallPreviewUrl) URL.revokeObjectURL(wallPreviewUrl);
      setWallPreviewUrl(null);
   };
   const [imageToCrop, setImageToCrop] = useState<string | null>(null);
   const [crop, setCrop] = useState({ x: 0, y: 0 });
   const [zoom, setZoom] = useState(1);
   const [croppedAreaPixels, setCroppedAreaPixels] = useState<any>(null);

   const isOwnProfile = !id || (user && user.id === Number(id));

   useEffect(() => {
      const fetchProfile = async () => {
         setIsLoading(true);
         try {
            const targetUserId = id ? Number(id) : user?.id;
            if (!targetUserId) return;

            let userData = user;
            if (id) {
               const userRes = await api.get(`/users/${id}`);
               userData = userRes.data.user;
            }
            setProfileUser(userData || null);
            setEditData(userData || {});

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

               if (!isOwnProfile) {
                  api.post(`/visit/${targetUserId}`).catch(e => console.error("Track visit error:", e));
               } else {
                  // Fetch stats and visitors for own profile
                  const [statsRes, visitorsRes] = await Promise.all([
                     api.get('/stats'),
                     api.get('/visitors')
                  ]);
                  setStats({ visits: statsRes.data.visits });
                  setRecentVisitors(visitorsRes.data.visitors);
               }
            }
         } catch (error) {
            console.error("Error loading profile data:", error);
         } finally {
            setIsLoading(false);
         }
      };

      fetchProfile();
      if (isOwnProfile) {
         // fetchInvitations(); // Removed from profile
      }
   }, [id, user, isOwnProfile]);

   /* Removed fetchInvitations */

   const handleUpdateProfile = async () => {
      if (!profileUser) return;
      try {
         const response = await api.put(`/users/${profileUser.id}`, editData);
         updateUser(response.data.user);
         setProfileUser(response.data.user);
         setIsEditing(false);
         showToast("Cambios guardados correctamente", "success");
      } catch (error) {
         console.error("Error updating profile:", error);
         showToast("Error al actualizar el perfil", "error");
      }
   };


   const handlePostToWall = async () => {
      if (!wallInput.trim() && !postImage) return;

      try {
         let res;
         if (postImage) {
            formData.append('image', postImage);
            formData.append('caption', wallInput);
            res = await api.post('/photos', formData, {
               headers: { 'Content-Type': undefined }
            });
         } else {
            formData.append('content', wallInput);
            formData.append('type', 'status');
            res = await api.post('/posts', formData, {
               headers: { 'Content-Type': undefined }
            });
         }

         setWallPosts(prev => [res.data.post, ...prev]);
         setWallInput('');
         removeWallFile();
         showToast('Publicado con éxito', 'success');
      } catch (error) {
         console.error("Error posting to wall:", error);
         showToast("Error al publicar", "error");
      }
   };

   const handleAddFriend = async () => {
      if (!profileUser) return;
      try {
         const res = await api.post('/friendships/request', { friendId: profileUser.id });
         setFriendStatus('pending_sent');
         setFriendshipId(res.data.friendship.id);
         showToast("Solicitud de amistad enviada", "success");
      } catch (e) {
         console.error(e);
         showToast("Error al enviar solicitud", "error");
      }
   };

   const handleAcceptFriend = async () => {
      if (!friendshipId) return;
      try {
         await api.put(`/friendships/${friendshipId}/accept`);
         setFriendStatus('accepted');
         showToast("Ahora sois amigos", "success");
      } catch (e) {
         console.error(e);
         showToast("Error al aceptar solicitud", "error");
      }
   };

   const handleRemoveFriend = async () => {
      if (!friendshipId || !confirm("¿Seguro que quieres eliminar a este amigo?")) return;
      try {
         await api.delete(`/friendships/${friendshipId}`);
         setFriendStatus('none');
         setFriendshipId(null);
         showToast("Amigo eliminado", "info");
      } catch (e) {
         console.error(e);
         showToast("Error al eliminar amigo", "error");
      }
   };
   const handleDeletePost = async (postId: number) => {
      if (!window.confirm("¿Estás seguro de que quieres borrar esta publicación?")) return;

      try {
         await api.delete(`/posts/${postId}`);
         setWallPosts(prev => prev.filter(p => p.id !== postId));
         showToast("Publicación borrada", "success");
      } catch (error) {
         console.error("Error deleting post:", error);
         showToast("No se pudo borrar la publicación", "error");
      }
   };

   const handleDeleteAccount = async () => {
      if (!profileUser) return;
      if (!window.confirm("¡ATENCIÓN! ¿Estás COMPLETAMENTE seguro de que quieres eliminar tu cuenta? Esta acción no se puede deshacer y perderás todos tus datos.")) return;

      const confirmInput = window.prompt("Para confirmar, escribe 'ELIMINAR' en mayúsculas:");
      if (confirmInput !== 'ELIMINAR') {
         showToast("Confirmación incorrecta", "error");
         return;
      }

      try {
         await api.delete(`/users/${profileUser.id}`);
         showToast("Cuenta eliminada correctamente. Hasta pronto.", "info");
         logout();
         navigate('/');
      } catch (error) {
         console.error("Error deleting account:", error);
         showToast("Error al eliminar la cuenta", "error");
      }
   };

   const onCropComplete = (_croppedArea: any, croppedAreaPixels: any) => {
      setCroppedAreaPixels(croppedAreaPixels);
   };

   const createImage = (url: string): Promise<HTMLImageElement> =>
      new Promise((resolve, reject) => {
         const image = new Image();
         image.addEventListener('load', () => resolve(image));
         image.addEventListener('error', (error) => reject(error));
         image.setAttribute('crossOrigin', 'anonymous');
         image.src = url;
      });

   const getCroppedImg = async (imageSrc: string, pixelCrop: any): Promise<Blob | null> => {
      const image = await createImage(imageSrc);
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');

      if (!ctx) return null;

      canvas.width = pixelCrop.width;
      canvas.height = pixelCrop.height;

      ctx.drawImage(
         image,
         pixelCrop.x,
         pixelCrop.y,
         pixelCrop.width,
         pixelCrop.height,
         0,
         0,
         pixelCrop.width,
         pixelCrop.height
      );

      return new Promise((resolve) => {
         canvas.toBlob((blob) => {
            resolve(blob);
         }, 'image/jpeg');
      });
   };

   const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files && e.target.files.length > 0) {
         const reader = new FileReader();
         reader.readAsDataURL(e.target.files[0]);
         reader.onload = () => {
            setImageToCrop(reader.result as string);
         };
      }
   };

   const handleUploadCroppedAvatar = async () => {
      if (!imageToCrop || !croppedAreaPixels || !isOwnProfile) return;
      setIsUploading(true);

      try {
         const croppedImageBlob = await getCroppedImg(imageToCrop, croppedAreaPixels);
         if (!croppedImageBlob) throw new Error("Could not crop image");

         const formData = new FormData();
         formData.append('avatar', croppedImageBlob, 'avatar.jpg');

         const response = await api.post(`/users/${user!.id}/avatar`, formData, {
            headers: { 'Content-Type': undefined }
         });

         updateUser(response.data.user);
         setProfileUser(response.data.user);
         setImageToCrop(null);
         showToast("Imagen de portada actualizada", "success");
      } catch (error) {
         console.error("Error uploading avatar:", error);
         showToast("Error al subir la foto", "error");
      } finally {
         setIsUploading(false);
      }
   };

   const getAvatarUrl = (avatar?: string, name?: string, lastName?: string) => {
      if (!avatar) return `/api/proxy/avatar?name=${encodeURIComponent(name || profileUser?.name || 'User')}`;
      if (avatar.startsWith('http')) return avatar;
      return `${import.meta.env.VITE_API_URL?.replace('/api', '')}${avatar}`;
   };

   const renderActionButtons = () => {
      if (friendStatus === 'self') {
         return (
            <button
               onClick={() => setIsEditing(!isEditing)}
               className="flex items-center gap-1.5 bg-[var(--border-soft)] border border-[var(--border-color)] px-3 py-1.5 rounded-xl text-[12px] text-[var(--text-main)] font-bold hover:bg-[var(--accent)]/10 hover:border-[var(--accent)]/30 transition-all shadow-sm"
            >
               <Edit3 size={14} /> {isEditing ? 'Cancelar' : 'Editar perfil'}
            </button>
         );
      }

      switch (friendStatus) {
         case 'none':
            return (
               <button
                  onClick={handleAddFriend}
                  className="flex items-center gap-1.5 bg-[var(--accent)] border border-[var(--accent)]/20 px-4 py-1.5 rounded-xl text-[12px] text-white font-bold hover:opacity-90 transition-all shadow-lg shadow-[var(--accent)]/20"
               >
                  <UserIcon size={14} /> Añadir a amigos
               </button>
            );
         case 'pending_sent':
            return (
               <button className="flex items-center gap-1.5 bg-[var(--border-soft)] border border-[var(--border-color)] px-4 py-1.5 rounded-xl text-[12px] text-[var(--text-muted)] cursor-default transition-all">
                  Solicitud enviada
               </button>
            );
         case 'pending_received':
            return (
               <div className="flex gap-2">
                  <button
                     onClick={handleAcceptFriend}
                     className="flex items-center gap-1.5 bg-[var(--accent)] border border-[var(--accent)]/20 px-4 py-1.5 rounded-xl text-[12px] text-white font-bold hover:opacity-90 transition-all shadow-lg shadow-[var(--accent)]/20"
                  >
                     Aceptar solicitud
                  </button>
               </div>
            );
         case 'accepted':
            return (
               <div className="flex gap-2">
                  <button className="flex items-center gap-1.5 bg-[var(--border-soft)] border border-[var(--border-color)] px-3 py-1.5 rounded-xl text-[12px] text-[var(--text-main)] hover:bg-[var(--accent)]/10 transition-all shadow-sm">
                     <Mail size={14} /> Enviar mensaje
                  </button>
                  <button className="flex items-center gap-1.5 bg-[var(--accent)]/10 border border-[var(--accent)]/20 px-3 py-1.5 rounded-xl text-[12px] text-[var(--accent)] font-bold transition-all cursor-default">
                     Amigo
                  </button>
                  <button
                     onClick={handleRemoveFriend}
                     className="text-[10px] text-red-500 hover:text-red-600 hover:underline px-1 font-medium"
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

   return (
      <div className="bg-[var(--bg-color)] md:bg-[var(--card-bg)] md:rounded-2xl md:border border-[var(--border-color)] p-3 md:p-4 min-h-[600px] transition-colors duration-200 overflow-x-hidden">
         <AnimatePresence>
            {imageToCrop && (
               <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
               >
                  <motion.div
                     initial={{ scale: 0.9, opacity: 0 }}
                     animate={{ scale: 1, opacity: 1 }}
                     exit={{ scale: 0.9, opacity: 0 }}
                     className="bg-[var(--card-bg)] rounded-lg overflow-hidden w-full max-w-[95vw] md:max-w-[500px] max-h-[85vh] overflow-y-auto flex flex-col border border-[var(--border-color)] transition-colors duration-200"
                  >
                     <div className="p-4 border-b border-[var(--border-soft)] flex justify-between items-center bg-[var(--card-bg)]">
                        <h3 className="font-bold text-[var(--text-main)]">Ajustar foto de perfil</h3>
                        <button onClick={() => setImageToCrop(null)} className="text-gray-400 hover:text-gray-600 transition-colors">×</button>
                     </div>

                     <div className="relative h-[300px] bg-[var(--bg-color)]">
                        <Cropper
                           image={imageToCrop}
                           crop={crop}
                           zoom={zoom}
                           aspect={1}
                           onCropChange={setCrop}
                           onCropComplete={onCropComplete}
                           onZoomChange={setZoom}
                        />
                     </div>

                     <div className="p-4 bg-[var(--card-bg)] flex flex-col gap-4">
                        <div className="flex items-center gap-4">
                           <span className="text-xs text-gray-500">Zoom</span>
                           <input
                              type="range"
                              value={zoom}
                              min={1}
                              max={3}
                              step={0.1}
                              onChange={(e) => setZoom(Number(e.target.value))}
                              className="flex-1"
                           />
                        </div>
                        <div className="flex justify-end gap-2">
                           <button
                              onClick={() => setImageToCrop(null)}
                              className="px-4 py-2 text-[12px] font-bold text-gray-500 hover:bg-[var(--bg-color)] rounded transition-colors"
                           >
                              Cancelar
                           </button>
                           <button
                              onClick={handleUploadCroppedAvatar}
                              disabled={isUploading}
                              className="px-6 py-2 bg-[var(--accent)] text-white text-[12px] font-bold rounded shadow-sm hover:bg-[#4a9600] disabled:opacity-50"
                           >
                              {isUploading ? 'Guardando...' : 'Guardar foto'}
                           </button>
                        </div>
                     </div>
                  </motion.div>
               </motion.div>
            )}
         </AnimatePresence>

         <div className="mb-4 md:mb-6 relative">
            <h1 className="text-[18px] md:text-[20px] font-bold text-[var(--text-main)] mb-1 transition-colors duration-200">
               {profileUser.name} {profileUser.lastName}
            </h1>
            {/* Status (latest thought) */}
            {profileUser.status && (
               <div className="bg-[var(--accent)]/5 border border-[var(--accent)]/20 rounded-md p-2 mb-3 text-[13px] italic text-[var(--text-main)] transition-colors duration-200">
                  <span className="font-bold text-[var(--accent)] not-italic mr-1">Estado:</span>
                  "{profileUser.status}"
               </div>
            )}

            {/* Bio (permanent description) */}
            {profileUser.bio && (
               <div className="text-[var(--text-main)] opacity-80 text-[12px] md:text-[13px] mb-3 border-b border-[var(--border-soft)] pb-3 pr-[80px] md:pr-0 transition-colors duration-200">
                  {profileUser.bio}
               </div>
            )}

            {!profileUser.bio && isOwnProfile && (
               <div className="text-gray-400 text-[12px] md:text-[13px] mb-3 border-b border-[var(--border-soft)] pb-3 italic transition-colors duration-200">
                  No has escrito una biografía todavía...
               </div>
            )}

            {/* Mobile visits counter */}
            {isOwnProfile && (
               <div className="md:hidden mt-2 mb-4 flex items-center gap-2">
                  <div className="flex items-center gap-1.5 bg-[var(--accent)]/10 px-2 py-0.5 rounded-full border border-[var(--accent)]/20">
                     <div className="w-1.5 h-1.5 bg-[var(--accent)] rounded-full animate-pulse"></div>
                     <span className="text-[11px] font-bold text-[var(--accent)]">
                        {stats.visits} visitas al perfil
                     </span>
                  </div>
               </div>
            )}
            <div className="absolute top-0 right-0 z-10">
               {renderActionButtons()}
            </div>
         </div>

         <div className="flex flex-col md:flex-row gap-8 items-start">
            <div className="w-full md:w-[280px] md:shrink-0 flex flex-col gap-6">
               <div className="bg-[var(--card-bg)] border border-[var(--border-color)] rounded-[2.5rem] p-3 shadow-2xl transition-all duration-300 group relative ring-1 ring-black/5 dark:ring-white/5">
                  <div className="aspect-square rounded-[2rem] overflow-hidden border border-[var(--border-soft)] shadow-inner">
                     <img
                        src={getAvatarUrl(profileUser.avatar)}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
                        alt="Profile"
                     />
                  </div>
                  {isOwnProfile && (
                     <label className="absolute inset-2 bg-black/60 backdrop-blur-sm flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 cursor-pointer rounded-[2rem]">
                        <Camera className="text-white mb-2" size={24} />
                        <span className="text-white text-[10px] font-extrabold uppercase tracking-widest">Cambiar foto</span>
                        <input
                           type="file"
                           accept="image/*"
                           className="hidden"
                           onChange={handleAvatarChange}
                           disabled={isUploading}
                        />
                     </label>
                  )}
               </div>

               {/* Desktop visits counter */}
               {isOwnProfile && (
                  <div className="hidden md:flex items-center justify-center gap-1.5 py-1 bg-[var(--card-bg)] border border-[var(--border-color)] rounded-xl mt-1 transition-colors duration-200">
                     <span className="text-[11px] font-bold text-[var(--accent)]">{stats.visits} visitas al perfil</span>
                  </div>
               )}

               {isEditing ? (
                  <div className="bg-[var(--card-bg)] border border-[var(--border-color)] p-3 text-[11px] flex flex-col gap-2 overflow-hidden animate-in fade-in duration-200">
                     <div>
                        <label className="block font-bold text-gray-400 mb-1">Nombre</label>
                        <input
                           type="text"
                           className="w-full bg-[var(--input-bg)] text-[var(--input-text)] border border-[var(--border-color)] rounded-xl p-1.5 focus:border-[var(--accent)] outline-none transition-colors"
                           value={editData.name || ''}
                           onChange={(e) => setEditData({ ...editData, name: e.target.value })}
                        />
                     </div>
                     <div>
                        <label className="block font-bold text-[#666] mb-1">Apellidos</label>
                        <input
                           type="text"
                           className="w-full bg-[var(--input-bg)] text-[var(--input-text)] border border-[var(--border-color)] rounded-xl p-1.5 focus:border-[var(--accent)] outline-none transition-colors"
                           value={editData.lastName || ''}
                           onChange={(e) => setEditData({ ...editData, lastName: e.target.value })}
                        />
                     </div>
                     <div>
                        <label className="block font-bold text-gray-400 mb-1">Estado actual</label>
                        <input
                           type="text"
                           className="w-full bg-[var(--input-bg)] text-[var(--input-text)] border border-[var(--border-color)] rounded-xl p-1.5 focus:border-[var(--accent)] outline-none transition-colors"
                           value={editData.status || ''}
                           onChange={(e) => setEditData({ ...editData, status: e.target.value })}
                        />
                     </div>
                     <div>
                        <label className="block font-bold text-gray-400 mb-1">Biografía</label>
                        <textarea
                           className="w-full bg-[var(--input-bg)] text-[var(--input-text)] border border-[var(--border-color)] rounded-xl p-1.5 focus:border-[var(--accent)] outline-none transition-colors"
                           rows={3}
                           value={editData.bio || ''}
                           onChange={(e) => setEditData({ ...editData, bio: e.target.value })}
                           placeholder="Cuéntanos algo sobre ti..."
                        />
                     </div>
                     <div className="flex gap-2">
                        <div className="flex-1">
                           <label className="block font-bold text-[#666] mb-1">Sexo</label>
                           <select
                              className="w-full border border-[#ccc] rounded-xl p-1"
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
                              className="w-full border border-[#ccc] rounded-xl p-1"
                              value={editData.age || ''}
                              onChange={(e) => setEditData({ ...editData, age: Number(e.target.value) })}
                           />
                        </div>
                     </div>
                     <div>
                        <label className="block font-bold text-[#666] mb-1">Situación sentimental</label>
                        <input
                           type="text"
                           className="w-full border border-[#ccc] rounded-xl p-1"
                           value={editData.relationshipStatus || ''}
                           onChange={(e) => setEditData({ ...editData, relationshipStatus: e.target.value })}
                           placeholder="Soltero, Casado..."
                        />
                     </div>
                     <div>
                        <label className="block font-bold text-[#666] mb-1">Localidad</label>
                        <input
                           type="text"
                           className="w-full border border-[#ccc] rounded-xl p-1"
                           value={editData.location || ''}
                           onChange={(e) => setEditData({ ...editData, location: e.target.value })}
                        />
                     </div>
                     <div>
                        <label className="block font-bold text-[#666] mb-1">Privacidad del perfil</label>
                        <select
                           className="w-full border border-[var(--border-color)] rounded-xl p-1 bg-[var(--input-bg)] text-[var(--input-text)] outline-none"
                           value={editData.privacy || 'public'}
                           onChange={(e) => setEditData({ ...editData, privacy: e.target.value })}
                        >
                           <option value="public">Público (Todo el mundo)</option>
                           <option value="friends">Solo amigos</option>
                           <option value="private">Privado (Solo yo)</option>
                        </select>
                        <p className="text-[9px] text-gray-400 mt-1 italic">
                           Controla quién puede ver tus fotos y muro.
                        </p>
                     </div>
                     <button
                        onClick={handleUpdateProfile}
                        className="bg-[var(--accent)] text-white font-bold py-1.5 rounded-xl border border-[#4a9600] mt-1 hover:bg-[#4a9600] transition-colors"
                     >
                        Guardar cambios
                     </button>

                     <div className="mt-4 pt-4 border-t border-[var(--border-soft)]">
                        <button
                           onClick={handleDeleteAccount}
                           className="flex items-center justify-center gap-1.5 w-full bg-[var(--card-bg)] text-[#cc0000] border border-[#cc0000] font-bold py-1.5 rounded-xl hover:bg-red-900/10 transition-colors text-[10px]"
                        >
                           <UserX size={12} /> Eliminar mi cuenta permanentemente
                        </button>
                     </div>
                  </div>
               ) : (
                  (profileUser.gender || profileUser.age || profileUser.relationshipStatus || profileUser.location || profileUser.occupation) ? (
                     <div className="bg-[var(--border-soft)] border-t border-b border-[var(--border-color)] p-2 text-[11px] text-[var(--text-main)] transition-colors duration-200">
                        {(profileUser.gender || profileUser.age) && (
                           <div className="flex items-center gap-2 mb-1.5 hover:translate-x-1 transition-transform">
                              <UserIcon size={12} className="text-[#888]" />
                              <span>{profileUser.gender || '?'}{profileUser.age ? `, ${profileUser.age} años` : ''}</span>
                           </div>
                        )}
                        {profileUser.relationshipStatus && (
                           <div className="flex items-center gap-2 mb-1.5 hover:translate-x-1 transition-transform">
                              <Heart size={12} className="text-[#888]" />
                              <span>{profileUser.relationshipStatus}</span>
                           </div>
                        )}
                        {profileUser.location && (
                           <div className="flex items-center gap-2 mb-1.5 hover:translate-x-1 transition-transform">
                              <MapPin size={12} className="text-[#888]" />
                              <span>{profileUser.location}</span>
                           </div>
                        )}
                        {profileUser.occupation && (
                           <div className="flex items-center gap-2 mb-1.5 hover:translate-x-1 transition-transform">
                              <Briefcase size={12} className="text-[#888]" />
                              <span>{profileUser.occupation}</span>
                           </div>
                        )}
                     </div>
                  ) : isOwnProfile ? (
                     <div className="bg-[var(--border-soft)] border-t border-b border-[var(--border-color)] p-2 text-[10px] text-gray-400 italic transition-colors duration-200">
                        Completa tu información personal...
                     </div>
                  ) : null
               )}

               <div>
                  <h3 className="text-[var(--text-secondary)] font-bold text-[12px] mb-2 border-b border-[var(--border-soft)] pb-1 flex justify-between items-center transition-colors duration-200">
                     <span>Amigos <span className="text-gray-500 font-normal">({friends.length})</span></span>
                     <span className="text-[10px] text-[var(--text-secondary)] hover:underline cursor-pointer font-normal transition-colors">Ver todos</span>
                  </h3>
                  <div className="grid grid-cols-3 gap-2 w-full">
                     {friends.slice(0, 9).map(friend => (
                        <div
                           key={friend.id}
                           className="cursor-pointer group relative hover:translate-y-[-2px] transition-transform"
                           onClick={() => navigate(`/profile/${friend.id}`)}
                        >
                           <img
                              src={getAvatarUrl(friend.avatar)}
                              className="w-full aspect-square object-cover border border-[#eee] group-hover:scale-105 transition-transform"
                              alt={friend.name}
                           />
                           <div className="text-[9px] text-center mt-0.5 truncate text-[var(--text-secondary)] group-hover:underline">
                              {friend.name.split(' ')[0]}
                           </div>
                        </div>
                     ))}
                  </div>
               </div>

               {isOwnProfile && recentVisitors.length > 0 && (
                  <div className="mt-2">
                     <h3 className="text-[var(--text-secondary)] font-bold text-[12px] mb-2 border-b border-[var(--border-soft)] pb-1 flex items-center justify-between transition-colors duration-200">
                        <span>Visitantes recientes <span className="text-gray-500 font-normal">({recentVisitors.length})</span></span>
                     </h3>
                     <div className="grid grid-cols-4 gap-1">
                        {recentVisitors.map(visitor => (
                           <div
                              key={visitor.id}
                              className="cursor-pointer group relative hover:translate-y-[-1px] transition-transform"
                              onClick={() => navigate(`/profile/${visitor.id}`)}
                              title={`${visitor.name} ${visitor.lastName}`}
                           >
                              <img
                                 src={getAvatarUrl(visitor.avatar)}
                                 className="w-full aspect-square object-cover border border-[var(--border-color)] group-hover:border-[var(--text-secondary)] transition-colors"
                                 alt={visitor.name}
                              />
                              <div className="text-[8px] text-center mt-0.5 truncate text-[var(--text-muted)]">
                                 {visitor.name}
                              </div>
                           </div>
                        ))}
                     </div>
                  </div>
               )}

               <div>
                  <h3 className="text-[var(--text-secondary)] font-bold text-[12px] mb-2 border-b border-[var(--border-soft)] pb-1 transition-colors duration-200">
                     Galería de fotos
                  </h3>
                  <button
                     onClick={() => navigate(id ? `/profile/photos/${id}` : '/profile/photos')}
                     className="w-full bg-[var(--border-soft)] border border-[var(--border-color)] p-2 text-[11px] text-[var(--text-secondary)] font-bold hover:opacity-80 transition-all flex items-center justify-center gap-2"
                  >
                     <Camera size={14} /> Ver fotos de {profileUser.name.split(' ')[0]}
                  </button>
               </div>
            </div>

            <div className="flex-1">
               {isOwnProfile && (
                  <div className="bg-[var(--border-soft)] p-3 rounded-2xl border border-[var(--border-color)] mb-4 shadow-sm animate-in slide-in-from-right-2 duration-300 transition-colors duration-200">
                     <div className="text-[var(--text-secondary)] font-bold text-[12px] mb-1">Escribe algo en tu tablón...</div>
                     <textarea
                        className="w-full h-16 bg-[var(--input-bg)] text-[var(--input-text)] border border-[var(--border-color)] rounded-xl p-2 text-[12px] resize-none focus:border-[var(--text-secondary)] outline-none transition-colors box-border block"
                        value={wallInput}
                        onChange={(e) => setWallInput(e.target.value)}
                     ></textarea>
                     <div className="flex justify-between items-center mt-2">
                        <div className="flex flex-col gap-2 w-full">
                           <div className="flex items-center gap-2">
                              <input
                                 type="file"
                                 id="post-image"
                                 className="hidden"
                                 accept="image/*"
                                 onChange={handleWallFileChange}
                              />
                              <button
                                 onClick={() => document.getElementById('post-image')?.click()}
                                 className={`flex items-center gap-1 text-[11px] font-bold ${postImage ? 'text-[var(--accent)]' : 'text-[#888]'} hover:text-[#555] transition-colors`}
                              >
                                 <Camera size={14} /> {postImage ? 'Imagen lista' : 'Adjuntar foto'}
                                 {postImage && (
                                    <span className="text-[10px] text-white/30 ml-2">({(postImage.size / 1024).toFixed(0)} KB)</span>
                                 )}
                              </button>
                           </div>

                           <AnimatePresence>
                              {wallPreviewUrl && (
                                 <motion.div
                                    initial={{ opacity: 0, scale: 0.95 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0.95 }}
                                    className="relative inline-block mt-1"
                                 >
                                    <img src={wallPreviewUrl} className="max-h-[150px] rounded-xl border border-white/10 shadow-lg" alt="Preview" />
                                    <button
                                       onClick={removeWallFile}
                                       className="absolute top-2 right-2 bg-black/60 backdrop-blur-md text-white p-1.5 rounded-full hover:bg-red-500 transition-colors shadow-lg"
                                    >
                                       <X size={14} />
                                    </button>
                                 </motion.div>
                              )}
                           </AnimatePresence>
                        </div>

                        <button
                           onClick={handlePostToWall}
                           disabled={!wallInput.trim() && !postImage}
                           className={`bg-[var(--text-secondary)] text-white text-[11px] font-bold px-3 py-1 rounded-lg transition-colors shadow-sm ${(!wallInput.trim() && !postImage) ? 'opacity-50 cursor-not-allowed' : 'hover:bg-[#00447a]'}`}
                        >
                           Publicar
                        </button>
                     </div>
                  </div>
               )}

               <h3 className="text-[var(--text-main)] font-bold text-[13px] mb-3 pb-1 border-b border-[var(--border-soft)] transition-colors duration-200">Tablón</h3>

               <div className="flex flex-col">
                  {isLoading ? (
                     <div className="p-4 text-center text-xs text-gray-500">Cargando publicaciones...</div>
                  ) : wallPosts.length === 0 ? (
                     <div className="p-4 text-center text-xs text-gray-500">No hay publicaciones en el tablón.</div>
                  ) : (
                     <div className="flex flex-col gap-6 p-4">
                        {wallPosts.map((post) => (
                           <motion.div
                              key={post.id}
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
                              className="capsule-card group relative mb-6"
                           >
                              <div className="flex gap-5 p-4">
                                 {/* Avatar Section */}
                                 <div className="w-12 h-12 shrink-0 relative">
                                    <div className="absolute inset-0 bg-gradient-to-tr from-[var(--accent)] to-violet-500 rounded-full opacity-0 group-hover:opacity-20 blur-md transition-opacity duration-500" />
                                    <img
                                       src={getAvatarUrl(post.user.avatar, post.user.name)}
                                       alt={post.user.name}
                                       className="w-full h-full object-cover rounded-full ring-2 ring-[var(--border-color)] shadow-xl relative z-10 cursor-pointer transition-transform duration-500 group-hover:scale-105"
                                       onClick={() => navigate(`/profile/${post.user.id}`)}
                                    />
                                 </div>

                                 {/* Content Section */}
                                 <div className="flex-1 min-w-0 text-left">
                                    <div className="flex justify-between items-start mb-2">
                                       <div>
                                          <button
                                             onClick={() => navigate(`/profile/${post.user.id}`)}
                                             className="text-[16px] font-black text-[var(--text-main)] hover:text-[var(--accent)] transition-colors tracking-tight text-left block"
                                          >
                                             {post.user.name} {post.user.lastName}
                                          </button>
                                          <div className="text-[10px] text-[var(--text-muted)] font-black uppercase tracking-widest mt-0.5">
                                             {new Date(post.createdAt).toLocaleDateString(undefined, { day: 'numeric', month: 'short' })} • {new Date(post.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                          </div>
                                       </div>

                                       {isOwnProfile && (
                                          <button
                                             onClick={(e) => {
                                                e.stopPropagation();
                                                handleDeletePost(post.id);
                                             }}
                                             className="text-[var(--text-muted)] hover:text-red-500 transition-colors p-1"
                                             title="Borrar"
                                          >
                                             <Trash2 size={16} />
                                          </button>
                                       )}
                                    </div>

                                    <div className="text-[15px] md:text-[16px] text-[var(--text-main)] leading-relaxed mb-4 font-medium">
                                       {post.content}
                                    </div>

                                    {post.image && (
                                       <div className="mt-4 rounded-[2rem] overflow-hidden border border-[var(--border-color)] shadow-2xl bg-[var(--card-bg)] p-1">
                                          <img
                                             src={post.image.startsWith('http') || post.image.startsWith('data:') ? post.image : `${import.meta.env.VITE_API_URL?.replace('/api', '')}${post.image.startsWith('/') ? '' : '/'}${post.image}`}
                                             className="w-full h-auto max-h-[600px] object-contain rounded-[1.8rem] cursor-pointer hover:scale-[1.01] transition-transform duration-700"
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
                                             alt="Post"
                                          />
                                       </div>
                                    )}

                                    {/* Post Actions */}
                                    <div className="mt-6 flex items-center justify-between border-t border-[var(--border-color)] pt-4">
                                       <div className="flex items-center gap-6">
                                          <button className="flex items-center gap-2 text-[11px] font-black uppercase tracking-widest text-[var(--text-muted)] hover:text-[var(--accent)] transition-all">
                                             <ThumbsUp size={16} />
                                             <span>Mola</span>
                                             {post._count && post._count.likes > 0 && (
                                                <span className="bg-white/5 px-2 py-0.5 rounded-full text-[10px] ml-1">{post._count.likes}</span>
                                             )}
                                          </button>
                                          <button className="flex items-center gap-2 text-[11px] font-black text-[var(--text-muted)] hover:text-[var(--text-main)] transition-all uppercase tracking-widest">
                                             <MessageCircle size={16} />
                                             <span>Comentar</span>
                                             {post._count && post._count.comments > 0 && (
                                                <span className="bg-white/5 px-2 py-0.5 rounded-full text-[10px] ml-1">{post._count.comments}</span>
                                             )}
                                          </button>
                                       </div>
                                       <button className="text-[var(--text-muted)] hover:text-[var(--text-main)] transition-colors">
                                          <Share2 size={16} />
                                       </button>
                                    </div>

                                    <div className="mt-4">
                                       <CommentSection
                                          postId={post.id}
                                          initialCommentsCount={post._count?.comments || 0}
                                       />
                                    </div>
                                 </div>
                              </div>
                           </motion.div>
                        ))}
                     </div>
                  )}
               </div>
            </div>
         </div>
      </div>
   );
};

export default Profile;