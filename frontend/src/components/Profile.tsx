import React, { useState, useEffect } from 'react';
import { Mail, Edit3, User as UserIcon, MapPin, Briefcase, Heart, Camera, Flag, Trash2, UserX, X } from 'lucide-react';
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
   const [editData, setEditData] = useState<Partial<User>>({});
   const [stats, setStats] = useState({ visits: 0 });

   // Cropping states
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
               const [friendsRes, postsRes, statsRes] = await Promise.all([
                  api.get(`/users/${userData.id}/friends`),
                  api.get(`/posts/user/${userData.id}`),
                  isOwnProfile ? api.get('/stats') : Promise.resolve({ data: { visits: 0 } })
               ]);

               setFriends(friendsRes.data.friends);
               setWallPosts(postsRes.data.posts);
               if (isOwnProfile) {
                  setStats({ visits: statsRes.data.visits });
               }

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
   }, [id, user, isOwnProfile]);

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

   const [postImage, setPostImage] = useState<File | null>(null);

   const handlePostToWall = async () => {
      if (!wallInput.trim() && !postImage) return;

      try {
         const formData = new FormData();
         formData.append('content', wallInput);
         formData.append('type', postImage ? 'photo' : 'status');
         if (postImage) formData.append('image', postImage);

         const response = await api.post('/posts', formData, {
            headers: {
               'Content-Type': 'multipart/form-data'
            }
         });

         setWallPosts([response.data.post, ...wallPosts]);
         setWallInput('');
         setPostImage(null);
         showToast("Publicado correctamente", "success");
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
         showToast("Cuenta eliminada correctamente.", "info");
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
      ctx.drawImage(image, pixelCrop.x, pixelCrop.y, pixelCrop.width, pixelCrop.height, 0, 0, pixelCrop.width, pixelCrop.height);
      return new Promise((resolve) => {
         canvas.toBlob((blob) => resolve(blob), 'image/jpeg');
      });
   };

   const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files && e.target.files.length > 0) {
         const reader = new FileReader();
         reader.readAsDataURL(e.target.files[0]);
         reader.onload = () => setImageToCrop(reader.result as string);
      }
   };

   const handleUploadCroppedAvatar = async () => {
      if (!imageToCrop || !croppedAreaPixels || !isOwnProfile) return;
      setIsUploading(true);
      try {
         const croppedImageBlob = await getCroppedImg(imageToCrop, croppedAreaPixels);
         if (!croppedImageBlob) throw new Error("Could not crop");
         const formData = new FormData();
         formData.append('avatar', croppedImageBlob, 'avatar.jpg');
         const response = await api.post(`/users/${user!.id}/avatar`, formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
         });
         updateUser(response.data.user);
         setProfileUser(response.data.user);
         setImageToCrop(null);
         showToast("Foto de perfil actualizada", "success");
      } catch (error) {
         showToast("Error al subir la foto", "error");
      } finally {
         setIsUploading(false);
      }
   };

   const getAvatarUrl = (avatar?: string) => {
      if (!avatar) return `/api/proxy/avatar?name=${encodeURIComponent(profileUser?.name || 'User')}`;
      return avatar.startsWith('http') ? avatar : `${import.meta.env.VITE_API_URL?.replace('/api', '')}${avatar}`;
   };

   if (isLoading) return <div className="p-4 bg-[var(--bg-color)] min-h-screen pt-20 text-[var(--text-main)]">Cargando perfil...</div>;
   if (!profileUser) return <div className="p-4 bg-[var(--bg-color)] min-h-screen pt-20 text-[var(--text-main)]">Usuario no encontrado</div>;

   return (
      <div className="bg-[var(--bg-color)] min-h-screen pt-16 pb-12">
         {/* Crop Modal */}
         <AnimatePresence>
            {imageToCrop && (
               <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[300] flex items-center justify-center bg-black/80 p-4">
                  <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} className="bg-[var(--card-bg)] rounded-lg overflow-hidden w-full max-w-[500px] flex flex-col">
                     <div className="p-4 border-b border-[var(--border-soft)] flex justify-between items-center text-[var(--text-main)]">
                        <h3 className="font-bold">Ajustar foto de perfil</h3>
                        <button onClick={() => setImageToCrop(null)}>×</button>
                     </div>
                     <div className="relative h-[300px] bg-black">
                        <Cropper image={imageToCrop} crop={crop} zoom={zoom} aspect={1} onCropChange={setCrop} onCropComplete={onCropComplete} onZoomChange={setZoom} />
                     </div>
                     <div className="p-4 bg-[var(--card-bg)] flex flex-col gap-4">
                        <div className="flex justify-end gap-2">
                           <button onClick={() => setImageToCrop(null)} className="px-4 py-2 text-[12px] font-bold text-[var(--text-muted)] hover:bg-[var(--bg-color)] rounded">Cancelar</button>
                           <button onClick={handleUploadCroppedAvatar} disabled={isUploading} className="px-6 py-2 bg-[var(--accent)] text-white text-[12px] font-bold rounded shadow-sm hover:opacity-90">{isUploading ? 'Guardando...' : 'Guardar foto'}</button>
                        </div>
                     </div>
                  </motion.div>
               </motion.div>
            )}
         </AnimatePresence>

         <div className="max-w-[980px] mx-auto px-2 md:px-4">
            {/* Header Card */}
            <div className="bg-[var(--card-bg)] border border-[var(--border-color)] rounded-[3px] overflow-hidden shadow-sm mb-4">
               <div className="p-4 md:p-6">
                  <div className="flex flex-col md:flex-row gap-6">
                     <div className="relative group mx-auto md:mx-0">
                        <div className="bg-[var(--card-bg)] p-1 border border-[var(--border-color)] shadow-sm cursor-pointer" onClick={() => isOwnProfile && document.getElementById('avatar-input')?.click()}>
                           <img src={getAvatarUrl(profileUser.avatar)} alt="Avatar" className="w-[150px] h-[150px] md:w-[180px] md:h-[180px] object-cover" />
                           {isOwnProfile && <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity"><Camera className="text-white" size={32} /></div>}
                        </div>
                        <input type="file" id="avatar-input" className="hidden" accept="image/*" onChange={handleAvatarChange} />
                     </div>
                     <div className="flex-1 text-center md:text-left">
                        <div className="flex flex-col md:flex-row justify-between gap-4 mb-4">
                           <div>
                              <h1 className="text-[22px] md:text-[26px] font-black text-[var(--text-main)]">{profileUser.name} {profileUser.lastName}</h1>
                              <div className="flex flex-wrap justify-center md:justify-start gap-4 mt-2 text-[var(--text-muted)] text-[12px]">
                                 {profileUser.location && <span className="flex items-center gap-1"><MapPin size={14} /> {profileUser.location}</span>}
                                 {profileUser.bio && <span className="flex items-center gap-1"><Briefcase size={14} /> {profileUser.bio}</span>}
                              </div>
                           </div>
                           <div className="flex justify-center flex-wrap gap-2">
                              {isOwnProfile ? (
                                 <button onClick={() => setIsEditing(!isEditing)} className="flex items-center gap-2 bg-[var(--bg-color)] text-[var(--text-main)] px-4 py-1.5 rounded-[4px] border border-[var(--border-color)] font-bold text-[12px] hover:bg-[var(--header-active)] transition-colors">
                                    <Edit3 size={14} /> Editar Perfil
                                 </button>
                              ) : (
                                 <>
                                    {friendStatus === 'none' && <button onClick={handleAddFriend} className="bg-[var(--accent)] text-white px-4 py-1.5 rounded-[4px] font-bold text-[12px] shadow-sm hover:opacity-90">Añadir como amigo</button>}
                                    {friendStatus === 'pending_sent' && <span className="bg-[var(--bg-color)] text-[var(--text-muted)] px-4 py-1.5 rounded-[4px] font-bold text-[12px] border border-[var(--border-color)]">Solicitud enviada</span>}
                                    {friendStatus === 'accepted' && (
                                       <div className="flex gap-2">
                                          <button className="bg-[var(--accent)] text-white px-4 py-1.5 rounded-[4px] font-bold text-[12px]">Amigos</button>
                                          <button onClick={handleRemoveFriend} className="bg-red-500 text-white px-4 py-1.5 rounded-[4px] font-bold text-[12px]">Eliminar</button>
                                       </div>
                                    )}
                                    <button onClick={() => navigate('/people')} className="bg-[var(--card-bg)] text-[var(--text-link)] px-4 py-1.5 rounded-[4px] border border-[var(--border-color)] font-bold text-[12px] hover:bg-[var(--bg-color)]">Mensaje</button>
                                 </>
                              )}
                           </div>
                        </div>
                        <div className="bg-[var(--bg-color)]/50 p-3 md:p-4 rounded-[4px] border border-[var(--border-soft)] grid grid-cols-2 md:grid-cols-4 gap-4">
                           <div className="text-center">
                              <div className="text-[18px] font-black text-[var(--accent)]">{friends.length}</div>
                              <div className="text-[9px] text-[var(--text-muted)] uppercase font-bold tracking-wider">Amigos</div>
                           </div>
                           <div className="text-center">
                              <div className="text-[18px] font-black text-[var(--accent)]">{wallPosts.length}</div>
                              <div className="text-[9px] text-[var(--text-muted)] uppercase font-bold tracking-wider">Publicaciones</div>
                           </div>
                           <div className="text-center">
                              <div className="text-[18px] font-black text-[var(--accent)]">{stats.visits}</div>
                              <div className="text-[9px] text-[var(--text-muted)] uppercase font-bold tracking-wider">Visitas</div>
                           </div>
                           <div className="text-center">
                              <div className="text-[18px] font-black text-[var(--accent)]">100%</div>
                              <div className="text-[9px] text-[var(--text-muted)] uppercase font-bold tracking-wider">Popular</div>
                           </div>
                        </div>
                     </div>
                  </div>
               </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
               {/* Left Column */}
               <div className="md:col-span-4 flex flex-col gap-4">
                  <div className="bg-[var(--card-bg)] border border-[var(--border-color)] rounded-[3px] p-4 shadow-sm">
                     <h3 className="text-[var(--text-main)] font-black text-[13px] mb-3 uppercase tracking-tight border-b border-[var(--border-soft)] pb-1">Sobre mí</h3>
                     <div className="space-y-4">
                        <div className="flex items-center gap-3 text-[13px] text-[var(--text-main)]">
                           <div className="w-8 h-8 rounded-full bg-[var(--bg-color)] flex items-center justify-center text-[var(--accent)]"><UserIcon size={16} /></div>
                           <div><div className="text-[10px] text-[var(--text-muted)] font-bold uppercase tracking-tight">Nombre</div><div>{profileUser.name} {profileUser.lastName}</div></div>
                        </div>
                        <div className="flex items-center gap-3 text-[13px] text-[var(--text-main)]">
                           <div className="w-8 h-8 rounded-full bg-[var(--bg-color)] flex items-center justify-center text-[var(--accent)]"><MapPin size={16} /></div>
                           <div><div className="text-[10px] text-[var(--text-muted)] font-bold uppercase tracking-tight">Ciudad</div><div>{profileUser.location || 'No especificada'}</div></div>
                        </div>
                     </div>
                  </div>

                  <div className="bg-[var(--card-bg)] border border-[var(--border-color)] rounded-[3px] p-4 shadow-sm">
                     <h3 className="text-[var(--text-main)] font-black text-[13px] mb-3 uppercase tracking-tight border-b border-[var(--border-soft)] pb-1 flex justify-between items-center">
                        <span>Amigos</span>
                        <span className="text-[var(--accent)] font-black">{friends.length}</span>
                     </h3>
                     <div className="grid grid-cols-3 gap-2">
                        {friends.slice(0, 9).map(friend => (
                           <div key={friend.id} className="flex flex-col items-center gap-1 cursor-pointer group" onClick={() => navigate(`/profile/${friend.id}`)}>
                              <img src={friend.avatar ? (friend.avatar.startsWith('http') ? friend.avatar : `${import.meta.env.VITE_API_URL?.replace('/api', '')}${friend.avatar}`) : `/api/proxy/avatar?name=${encodeURIComponent(friend.name)}`} className="w-full aspect-square object-cover border border-[var(--border-soft)] group-hover:border-[var(--accent)] transition-all" alt={friend.name} />
                              <span className="text-[9px] font-bold text-[var(--text-main)] group-hover:text-[var(--text-link)] truncate w-full text-center">{friend.name}</span>
                           </div>
                        ))}
                     </div>
                  </div>
               </div>

               {/* Right Column - Wall */}
               <div className="md:col-span-8 flex flex-col gap-4">
                  <div className="bg-[var(--card-bg)] border border-[var(--border-color)] rounded-[3px] p-4 shadow-sm">
                     <div className="flex gap-3">
                        <img src={getAvatarUrl(user?.avatar)} className="w-10 h-10 object-cover rounded-sm" alt="My Avatar" />
                        <div className="flex-1">
                           <textarea
                              className="w-full h-18 p-2 text-[13px] bg-[var(--input-bg)] text-[var(--input-text)] border border-[var(--border-soft)] rounded-[2px] outline-none focus:border-[var(--accent)] transition-colors resize-none"
                              placeholder={isOwnProfile ? "¿Qué hay de nuevo?" : `Escribe algo en el tablón de ${profileUser.name}...`}
                              value={wallInput}
                              onChange={(e) => setWallInput(e.target.value)}
                           />
                           <div className="flex justify-end mt-2">
                              <button onClick={handlePostToWall} className="bg-[var(--accent)] text-white text-[11px] font-black px-6 py-1.5 rounded-[2px] hover:opacity-90">Publicar</button>
                           </div>
                        </div>
                     </div>
                  </div>

                  <div className="flex flex-col gap-4">
                     {wallPosts.map(post => (
                        <div key={post.id} className="bg-[var(--card-bg)] border border-[var(--border-color)] rounded-[3px] p-4 shadow-sm relative group">
                           <div className="flex justify-between items-start mb-3">
                              <div className="flex gap-2">
                                 <img src={post.user.avatar ? (post.user.avatar.startsWith('http') ? post.user.avatar : `${import.meta.env.VITE_API_URL?.replace('/api', '')}${post.user.avatar}`) : `/api/proxy/avatar?name=${encodeURIComponent(post.user.name)}`} className="w-9 h-9 object-cover rounded-sm" alt={post.user.name} />
                                 <div>
                                    <div className="text-[13px] font-black text-[var(--text-link)] hover:underline cursor-pointer" onClick={() => navigate(`/profile/${post.user.id}`)}>{post.user.name} {post.user.lastName}</div>
                                    <div className="text-[10px] text-[var(--text-muted)]">{new Date(post.createdAt).toLocaleString()}</div>
                                 </div>
                              </div>
                              {isOwnProfile && (
                                 <button
                                    onClick={() => handleDeletePost(post.id)}
                                    className="absolute top-1 right-1 text-gray-300 hover:text-red-500 transition-colors p-1"
                                    title="Borrar"
                                 >
                                    <X size={14} />
                                 </button>
                              )}
                           </div>
                           <p className="text-[13px] text-[var(--text-main)] mb-3 leading-normal whitespace-pre-wrap">{post.content}</p>
                           <div className="pt-3 border-t border-[var(--border-soft)]">
                              <CommentSection postId={post.id} initialCommentsCount={post._count?.comments || 0} />
                           </div>
                        </div>
                     ))}
                  </div>
               </div>
            </div>
         </div>

         {/* Edit Modal */}
         <AnimatePresence>
            {isEditing && (
               <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[400] bg-black/60 flex items-center justify-center p-4 backdrop-blur-sm">
                  <motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} className="bg-[var(--card-bg)] border border-[var(--border-color)] w-full max-w-[500px] rounded-[4px] shadow-2xl overflow-hidden">
                     <div className="bg-[#005599] text-white p-4 flex justify-between items-center"><h2 className="text-[16px] font-black uppercase">Editar perfil</h2><button onClick={() => setIsEditing(false)}><Trash2 size={20} /></button></div>
                     <div className="p-6 space-y-4">
                        <div>
                           <label className="block text-[10px] font-black text-[var(--text-muted)] uppercase mb-1">Nombre</label>
                           <input type="text" className="w-full border border-[var(--border-color)] bg-[var(--input-bg)] text-[var(--input-text)] p-2 rounded-[2px] text-[13px] focus:border-[var(--accent)] outline-none" value={editData.name} onChange={(e) => setEditData({ ...editData, name: e.target.value })} />
                        </div>
                        <div>
                           <label className="block text-[10px] font-black text-[var(--text-muted)] uppercase mb-1">Apellidos</label>
                           <input type="text" className="w-full border border-[var(--border-color)] bg-[var(--input-bg)] text-[var(--input-text)] p-2 rounded-[2px] text-[13px] focus:border-[var(--accent)] outline-none" value={editData.lastName} onChange={(e) => setEditData({ ...editData, lastName: e.target.value })} />
                        </div>
                        <div>
                           <label className="block text-[10px] font-black text-[var(--text-muted)] uppercase mb-1">Ciudad</label>
                           <input type="text" className="w-full border border-[var(--border-color)] bg-[var(--input-bg)] text-[var(--input-text)] p-2 rounded-[2px] text-[13px] focus:border-[var(--accent)] outline-none" value={editData.location || ''} onChange={(e) => setEditData({ ...editData, location: e.target.value })} />
                        </div>
                        <div>
                           <label className="block text-[10px] font-black text-[var(--text-muted)] uppercase mb-1">Bio</label>
                           <textarea className="w-full border border-[var(--border-color)] bg-[var(--input-bg)] text-[var(--input-text)] p-2 rounded-[2px] text-[13px] h-20 outline-none focus:border-[var(--accent)] resize-none" value={editData.bio || ''} onChange={(e) => setEditData({ ...editData, bio: e.target.value })} />
                        </div>
                        <div className="pt-4 border-t border-[var(--border-soft)]"><button onClick={handleDeleteAccount} className="w-full flex items-center justify-center gap-2 bg-red-50 text-red-600 border border-red-200 py-2 rounded-[2px] text-[11px] font-bold hover:bg-red-100 transition-colors"><UserX size={16} /> Eliminar mi cuenta permanentemente</button></div>
                        <div className="flex gap-2 pt-2"><button onClick={handleUpdateProfile} className="flex-1 bg-[var(--accent)] text-white py-2.5 rounded-[2px] font-black text-[14px] shadow-sm hover:opacity-90">Guardar</button><button onClick={() => setIsEditing(false)} className="flex-1 bg-[var(--bg-color)] text-[var(--text-muted)] border border-[var(--border-color)] py-2.5 rounded-[2px] font-black text-[14px]">Cancelar</button></div>
                     </div>
                  </motion.div>
               </motion.div>
            )}
         </AnimatePresence>
      </div>
   );
};

export default Profile;