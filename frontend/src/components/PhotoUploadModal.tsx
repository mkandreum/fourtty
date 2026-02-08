import React, { useState, useEffect } from 'react';
import { X, Tag, Send, Image as ImageIcon, Search, MessageSquare } from 'lucide-react';
import { motion } from 'framer-motion';
import api from '../api';
import { useToast } from '../contexts/ToastContext';

interface PhotoUploadModalProps {
   file: File;
   onClose: () => void;
   onSuccess: () => void;
}

const PhotoUploadModal: React.FC<PhotoUploadModalProps> = ({ file, onClose, onSuccess }) => {
   const { showToast } = useToast();
   const [preview, setPreview] = useState<string>('');
   const [caption, setCaption] = useState('');
   const [initialComment, setInitialComment] = useState('');
   const [isSubmitting, setIsSubmitting] = useState(false);

   // Tagging
   const [friends, setFriends] = useState<any[]>([]);
   const [selectedTags, setSelectedTags] = useState<number[]>([]);
   const [tagSearch, setTagSearch] = useState('');

   useEffect(() => {
      const reader = new FileReader();
      reader.onloadend = () => setPreview(reader.result as string);
      reader.readAsDataURL(file);

      fetchFriends();
   }, [file]);

   const fetchFriends = async () => {
      try {
         const res = await api.get('/friendships');
         setFriends(res.data.friends);
      } catch (e) {
         console.error(e);
      }
   };

   const handleToggleTag = (id: number) => {
      if (selectedTags.includes(id)) {
         setSelectedTags(prev => prev.filter(tid => tid !== id));
      } else {
         setSelectedTags(prev => [...prev, id]);
      }
   };

   const handleSubmit = async () => {
      setIsSubmitting(true);
      const formData = new FormData();
      formData.append('image', file);
      formData.append('caption', caption);
      formData.append('tags', JSON.stringify(selectedTags));
      formData.append('initialComment', initialComment);

      try {
         await api.post('/photos', formData, {
            headers: { 'Content-Type': undefined }
         });
         showToast('¡Foto subida correctamente!', 'success');
         onSuccess();
         onClose();
      } catch (error) {
         console.error(error);
         showToast('Error al subir la foto', 'error');
      } finally {
         setIsSubmitting(false);
      }
   };

   const filteredFriends = friends.filter(f =>
      f.name.toLowerCase().includes(tagSearch.toLowerCase())
   );

   return (
      <div className="fixed inset-0 bg-black/60 z-[100] flex items-center justify-center p-4 backdrop-blur-md animate-in fade-in duration-300">
         <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            className="glass w-full max-w-[800px] rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col md:flex-row border border-white/20 ring-1 ring-white/10"
         >
            {/* Image Preview Area */}
            <div className="md:w-1/2 bg-black/20 p-6 flex flex-col items-center justify-center border-b md:border-b-0 md:border-r border-white/10 relative">
               <div className="absolute inset-0 bg-gradient-to-br from-[var(--accent)]/5 to-violet-500/5 pointer-events-none" />
               {preview ? (
                  <div className="relative group p-2 bg-white/5 rounded-3xl border border-white/10 shadow-2xl overflow-hidden transition-transform duration-500 hover:scale-[1.02]">
                     <img src={preview} alt="Preview" className="max-w-full max-h-[300px] md:max-h-[500px] object-contain rounded-2xl" />
                  </div>
               ) : (
                  <div className="p-20 text-white/10">
                     <ImageIcon size={64} className="mx-auto" />
                  </div>
               )}
               <p className="mt-4 text-[10px] font-black text-white/20 uppercase tracking-[0.2em]">Vista previa de publicación</p>
            </div>

            {/* Info Area */}
            <div className="md:w-1/2 flex flex-col h-[500px] md:h-[600px] bg-white/5 backdrop-blur-sm">
               <div className="p-6 border-b border-white/5 flex justify-between items-center">
                  <div className="flex flex-col">
                     <h3 className="text-white font-black text-[20px] tracking-tight flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-[var(--accent)] neon-glow" />
                        Añadir Detalles
                     </h3>
                     <span className="text-[10px] text-white/30 font-bold uppercase tracking-widest mt-0.5">Publicar en tu galería</span>
                  </div>
                  <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full text-white/30 hover:text-white transition-all">
                     <X size={24} />
                  </button>
               </div>

               <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
                  {/* Caption */}
                  <div className="space-y-2">
                     <label className="text-[11px] font-black text-white/40 uppercase tracking-wider ml-1">Pie de foto</label>
                     <textarea
                        className="w-full bg-white/5 text-white border border-white/10 rounded-2xl p-4 text-[14px] outline-none focus:border-[var(--accent)] focus:ring-1 focus:ring-[var(--accent)]/20 min-h-[100px] resize-none transition-all placeholder:text-white/10"
                        placeholder="Cuenta algo sobre este momento..."
                        value={caption}
                        onChange={(e) => setCaption(e.target.value)}
                     />
                  </div>

                  {/* Initial Comment */}
                  <div className="space-y-2">
                     <label className="text-[11px] font-black text-white/40 uppercase tracking-wider ml-1">Primer comentario (opcional)</label>
                     <textarea
                        className="w-full bg-white/5 text-white border border-white/10 rounded-2xl p-4 text-[14px] outline-none focus:border-[var(--accent)] focus:ring-1 focus:ring-[var(--accent)]/20 min-h-[80px] resize-none transition-all placeholder:text-white/10"
                        placeholder="Inicia la conversación..."
                        value={initialComment}
                        onChange={(e) => setInitialComment(e.target.value)}
                     />
                  </div>

                  {/* Tagging */}
                  <div className="space-y-3">
                     <div className="flex items-center justify-between ml-1">
                        <label className="text-[11px] font-black text-white/40 uppercase tracking-wider flex items-center gap-2">
                           <Tag size={14} className="text-[var(--accent)]" />
                           ¿Quién sale aquí?
                        </label>
                        {selectedTags.length > 0 && (
                           <span className="text-[10px] font-black text-[var(--accent)] uppercase">{selectedTags.length} seleccionados</span>
                        )}
                     </div>
                     <div className="relative group">
                        <input
                           type="text"
                           placeholder="Buscar amigos para etiquetar..."
                           className="w-full bg-white/5 text-white border border-white/10 rounded-full pl-10 pr-4 py-2.5 text-[12px] focus:border-[var(--accent)] outline-none transition-all group-hover:border-white/20"
                           value={tagSearch}
                           onChange={(e) => setTagSearch(e.target.value)}
                        />
                        <Search size={16} className="absolute left-4 top-3 text-white/20 group-focus-within:text-[var(--accent)] transition-colors" />
                     </div>

                     <div className="grid grid-cols-1 gap-2 max-h-[150px] overflow-y-auto pr-2 custom-scrollbar">
                        {filteredFriends.map(friend => (
                           <div
                              key={friend.id}
                              onClick={() => handleToggleTag(friend.id)}
                              className={`flex items-center gap-3 p-2 rounded-2xl border transition-all cursor-pointer group/item ${selectedTags.includes(friend.id) ? 'bg-[var(--accent)]/10 border-[var(--accent)]/30' : 'bg-white/5 border-white/5 hover:border-white/10'}`}
                           >
                              <div className="w-8 h-8 rounded-full overflow-hidden border border-white/10">
                                 <img
                                    src={friend.avatar || `/api/proxy/avatar?name=${encodeURIComponent(friend.name)}`}
                                    className="w-full h-full object-cover"
                                    alt={friend.name}
                                 />
                              </div>
                              <span className={`text-[12px] flex-1 font-bold ${selectedTags.includes(friend.id) ? 'text-[var(--accent)]' : 'text-white/60 group-hover/item:text-white'}`}>
                                 {friend.name}
                              </span>
                              <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${selectedTags.includes(friend.id) ? 'bg-[var(--accent)] border-[var(--accent)] shadow-[0_0_10px_rgba(var(--accent-rgb),0.5)]' : 'border-white/10'}`}>
                                 {selectedTags.includes(friend.id) && <Send size={10} className="text-white" />}
                              </div>
                           </div>
                        ))}
                     </div>
                  </div>
               </div>

               <div className="p-6 bg-white/5 border-t border-white/5 flex items-center justify-between">
                  <button
                     onClick={onClose}
                     className="text-[12px] font-black text-white/30 hover:text-white uppercase tracking-widest transition-colors"
                  >
                     Cancelar
                  </button>
                  <button
                     disabled={isSubmitting}
                     onClick={handleSubmit}
                     className={`relative group h-12 px-8 rounded-full font-black text-[12px] uppercase tracking-[0.2em] overflow-hidden transition-all active:scale-95 ${isSubmitting ? 'opacity-50 grayscale' : ''}`}
                  >
                     <div className="absolute inset-0 bg-gradient-to-r from-[var(--accent)] to-violet-600 group-hover:scale-105 transition-transform duration-500" />
                     <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity" />
                     <span className="relative z-10 text-white flex items-center gap-2">
                        {isSubmitting ? 'Subiendo...' : 'Publicar Ahora'}
                        <Send size={14} className={isSubmitting ? 'animate-pulse' : ''} />
                     </span>
                  </button>
               </div>
            </div>
         </motion.div>
      </div>
   );
};

export default PhotoUploadModal;