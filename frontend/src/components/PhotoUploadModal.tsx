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
      <div className="fixed inset-0 bg-black/60 z-[100] flex items-center justify-center p-2 sm:p-4 backdrop-blur-md animate-in fade-in duration-300">
         <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            className="glass w-full max-w-[95vw] sm:max-w-xl md:max-w-3xl lg:max-w-4xl rounded-xl sm:rounded-2xl md:rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col md:flex-row border border-white/20 ring-1 ring-white/10 max-h-[95vh]"
         >
            {/* Image Preview Area */}
            <div className="md:w-1/2 bg-black/20 p-3 sm:p-4 md:p-6 flex flex-col items-center justify-center border-b md:border-b-0 md:border-r border-white/10 relative">
               <div className="absolute inset-0 bg-gradient-to-br from-[var(--accent)]/5 to-violet-500/5 pointer-events-none" />
               {preview ? (
                  <div className="relative group p-1.5 sm:p-2 bg-white/5 rounded-2xl sm:rounded-3xl border border-white/10 shadow-2xl overflow-hidden transition-transform duration-500 hover:scale-[1.02]">
                     <img src={preview} alt="Preview" className="max-w-full max-h-[180px] sm:max-h-[250px] md:max-h-[400px] lg:max-h-[500px] object-contain rounded-xl sm:rounded-2xl" />
                  </div>
               ) : (
                  <div className="p-10 sm:p-20 text-white/10">
                     <ImageIcon size={64} className="mx-auto" />
                  </div>
               )}
               <p className="mt-2 sm:mt-4 text-[8px] sm:text-[10px] font-black text-white/20 uppercase tracking-[0.2em] text-center">Vista previa de publicación</p>
            </div>

            {/* Info Area */}
            <div className="md:w-1/2 flex flex-col h-auto max-h-[60vh] md:max-h-[600px] bg-white/5 backdrop-blur-sm">
               <div className="p-3 sm:p-4 md:p-6 border-b border-white/5 flex justify-between items-center">
                  <div className="flex flex-col">
                     <h3 className="text-white font-black text-[16px] sm:text-[18px] md:text-[20px] tracking-tight flex items-center gap-2">
                        <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-[var(--accent)] neon-glow" />
                        Añadir Detalles
                     </h3>
                     <span className="text-[8px] sm:text-[9px] md:text-[10px] text-white/30 font-bold uppercase tracking-widest mt-0.5">Publicar en tu galería</span>
                  </div>
                  <button onClick={onClose} className="p-1.5 sm:p-2 hover:bg-white/10 rounded-full text-white/30 hover:text-white transition-all">
                     <X className="w-5 h-5 sm:w-6 sm:h-6" />
                  </button>
               </div>

               <div className="flex-1 overflow-y-auto p-3 sm:p-4 md:p-6 space-y-3 sm:space-y-4 md:space-y-6 custom-scrollbar">
                  {/* Caption */}
                  <div className="space-y-1.5 sm:space-y-2">
                     <label className="text-[9px] sm:text-[10px] md:text-[11px] font-black text-white/40 uppercase tracking-wider ml-1">Pie de foto</label>
                     <textarea
                        className="w-full bg-white/5 text-white border border-white/10 rounded-xl sm:rounded-2xl p-2.5 sm:p-3 md:p-4 text-[12px] sm:text-[13px] md:text-[14px] outline-none focus:border-[var(--accent)] focus:ring-1 focus:ring-[var(--accent)]/20 min-h-[70px] sm:min-h-[80px] md:min-h-[100px] resize-none transition-all placeholder:text-white/10"
                        placeholder="Cuenta algo sobre este momento..."
                        value={caption}
                        onChange={(e) => setCaption(e.target.value)}
                     />
                  </div>

                  {/* Initial Comment */}
                  <div className="space-y-1.5 sm:space-y-2">
                     <label className="text-[9px] sm:text-[10px] md:text-[11px] font-black text-white/40 uppercase tracking-wider ml-1">Primer comentario (opcional)</label>
                     <textarea
                        className="w-full bg-white/5 text-white border border-white/10 rounded-xl sm:rounded-2xl p-2.5 sm:p-3 md:p-4 text-[12px] sm:text-[13px] md:text-[14px] outline-none focus:border-[var(--accent)] focus:ring-1 focus:ring-[var(--accent)]/20 min-h-[60px] sm:min-h-[70px] md:min-h-[80px] resize-none transition-all placeholder:text-white/10"
                        placeholder="Inicia la conversación..."
                        value={initialComment}
                        onChange={(e) => setInitialComment(e.target.value)}
                     />
                  </div>

                  {/* Tagging */}
                  <div className="space-y-2 sm:space-y-3">
                     <div className="flex items-center justify-between ml-1">
                        <label className="text-[9px] sm:text-[10px] md:text-[11px] font-black text-white/40 uppercase tracking-wider flex items-center gap-1.5 sm:gap-2">
                           <Tag className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                           ¿Quién sale aquí?
                        </label>
                        {selectedTags.length > 0 && (
                           <span className="text-[8px] sm:text-[9px] md:text-[10px] font-black text-[var(--accent)] uppercase">{selectedTags.length} seleccionados</span>
                        )}
                     </div>
                     <div className="relative group">
                        <input
                           type="text"
                           placeholder="Buscar amigos..."
                           className="w-full bg-white/5 text-white border border-white/10 rounded-full pl-8 sm:pl-10 pr-3 sm:pr-4 py-2 sm:py-2.5 text-[11px] sm:text-[12px] focus:border-[var(--accent)] outline-none transition-all group-hover:border-white/20"
                           value={tagSearch}
                           onChange={(e) => setTagSearch(e.target.value)}
                        />
                        <Search className="absolute left-3 sm:left-4 top-2 sm:top-2.5 w-3.5 h-3.5 sm:w-4 sm:h-4 text-white/20 group-focus-within:text-[var(--accent)] transition-colors" />
                     </div>

                     <div className="grid grid-cols-1 gap-1.5 sm:gap-2 max-h-[120px] sm:max-h-[150px] overflow-y-auto pr-1 sm:pr-2 custom-scrollbar">
                        {filteredFriends.map(friend => (
                           <div
                              key={friend.id}
                              onClick={() => handleToggleTag(friend.id)}
                              className={`flex items-center gap-2 sm:gap-3 p-1.5 sm:p-2 rounded-xl sm:rounded-2xl border transition-all cursor-pointer group/item ${selectedTags.includes(friend.id) ? 'bg-[var(--accent)]/10 border-[var(--accent)]/30' : 'bg-white/5 border-white/5 hover:border-white/10'}`}
                           >
                              <div className="w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8 rounded-full overflow-hidden border border-white/10 flex-shrink-0">
                                 <img
                                    src={friend.avatar || `/api/proxy/avatar?name=${encodeURIComponent(friend.name)}`}
                                    className="w-full h-full object-cover"
                                    alt={friend.name}
                                 />
                              </div>
                              <span className={`text-[11px] sm:text-[12px] flex-1 font-bold truncate ${selectedTags.includes(friend.id) ? 'text-[var(--accent)]' : 'text-white/60 group-hover/item:text-white'}`}>
                                 {friend.name}
                              </span>
                              <div className={`w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0 rounded-full border-2 flex items-center justify-center transition-all ${selectedTags.includes(friend.id) ? 'bg-[var(--accent)] border-[var(--accent)] shadow-[0_0_10px_rgba(var(--accent-rgb),0.5)]' : 'border-white/10'}`}>
                                 {selectedTags.includes(friend.id) && <Send className="w-2 h-2 sm:w-2.5 sm:h-2.5 text-white" />}
                              </div>
                           </div>
                        ))}
                     </div>
                  </div>
               </div>

               <div className="p-3 sm:p-4 md:p-6 bg-white/5 border-t border-white/5 flex items-center justify-between gap-2">
                  <button
                     onClick={onClose}
                     className="text-[10px] sm:text-[11px] md:text-[12px] font-black text-white/30 hover:text-white uppercase tracking-wide sm:tracking-widest transition-colors"
                  >
                     Cancelar
                  </button>
                  <button
                     disabled={isSubmitting}
                     onClick={handleSubmit}
                     className={`relative group h-9 sm:h-10 md:h-12 px-4 sm:px-6 md:px-8 rounded-full font-black text-[10px] sm:text-[11px] md:text-[12px] uppercase tracking-wide sm:tracking-[0.15em] md:tracking-[0.2em] overflow-hidden transition-all active:scale-95 ${isSubmitting ? 'opacity-50 grayscale' : ''}`}
                  >
                     <div className="absolute inset-0 bg-gradient-to-r from-[var(--accent)] to-violet-600 group-hover:scale-105 transition-transform duration-500" />
                     <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity" />
                     <span className="relative z-10 text-white flex items-center gap-1.5 sm:gap-2">
                        <span className="hidden sm:inline">{isSubmitting ? 'Subiendo...' : 'Publicar Ahora'}</span>
                        <span className="sm:hidden">{isSubmitting ? 'Subiendo...' : 'Publicar'}</span>
                        <Send className="w-3 h-3 sm:w-3.5 sm:h-3.5" className={isSubmitting ? 'animate-pulse' : ''} />
                     </span>
                  </button>
               </div>
            </div>
         </motion.div>
      </div>
   );
};

export default PhotoUploadModal;