import React, { useState, useEffect } from 'react';
import { X, Tag, Send, Image as ImageIcon, Search } from 'lucide-react';
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
            headers: { 'Content-Type': 'multipart/form-data' }
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
      <div className="fixed inset-0 bg-black/60 z-[100] flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in duration-200">
         <div className="bg-[var(--card-bg)] w-full max-w-[700px] rounded-[4px] shadow-2xl overflow-hidden flex flex-col md:flex-row border border-[var(--border-color)] transition-colors duration-200">
            {/* Image Preview Area */}
            <div className="md:w-1/2 bg-[var(--bg-color)] p-1 flex items-center justify-center border-b md:border-b-0 md:border-r border-[var(--border-color)] transition-colors duration-200">
               {preview ? (
                  <div className="relative group p-2 bg-[var(--card-bg)] border border-[var(--border-color)] shadow-sm transition-colors duration-200">
                     <img src={preview} alt="Preview" className="max-w-full max-h-[300px] md:max-h-[450px] object-contain" />
                  </div>
               ) : (
                  <div className="p-20 text-gray-400">
                     <ImageIcon size={48} className="mx-auto opacity-20" />
                  </div>
               )}
            </div>

            {/* Info Area */}
            <div className="md:w-1/2 flex flex-col h-[400px] md:h-[500px]">
               <div className="p-3 bg-[var(--bg-color)] border-b border-[var(--border-color)] flex justify-between items-center transition-colors duration-200">
                  <h3 className="text-[#005599] font-bold text-[13px] flex items-center gap-2">
                     Subir nueva foto
                  </h3>
                  <button onClick={onClose} className="text-gray-400 hover:text-[var(--text-main)]">
                     <X size={18} />
                  </button>
               </div>

               <div className="flex-1 overflow-y-auto p-4 space-y-4">
                  {/* Caption */}
                  <div>
                     <label className="text-[11px] font-bold text-[var(--text-main)] mb-1 block transition-colors duration-200">Pie de foto (Caption):</label>
                     <textarea
                        className="w-full bg-[var(--input-bg)] text-[var(--input-text)] border border-[var(--border-color)] rounded-[2px] p-2 text-[12px] outline-none focus:border-[#5C95C4] min-h-[60px] resize-none transition-colors"
                        placeholder="Escribe algo sobre esta foto..."
                        value={caption}
                        onChange={(e) => setCaption(e.target.value)}
                     />
                  </div>

                  {/* Initial Comment */}
                  <div>
                     <label className="text-[11px] font-bold text-[var(--text-main)] mb-1 block transition-colors duration-200">Primer comentario (opcional):</label>
                     <textarea
                        className="w-full bg-[var(--input-bg)] text-[var(--input-text)] border border-[var(--border-color)] rounded-[2px] p-2 text-[12px] outline-none focus:border-[#5C95C4] min-h-[60px] resize-none transition-colors"
                        placeholder="Añade un comentario extra..."
                        value={initialComment}
                        onChange={(e) => setInitialComment(e.target.value)}
                     />
                  </div>

                  {/* Tagging */}
                  <div>
                     <label className="text-[11px] font-bold text-[var(--text-main)] mb-1 block flex items-center gap-1 transition-colors duration-200">
                        <Tag size={12} className="text-[#59B200]" /> ¿Quién sale en esta foto?
                     </label>
                     <div className="relative mb-2">
                        <input
                           type="text"
                           placeholder="Buscar amigos para etiquetar..."
                           className="w-full bg-[var(--input-bg)] text-[var(--input-text)] border border-[var(--border-color)] rounded-[2px] pl-7 pr-2 py-1 text-[11px] focus:border-[#5C95C4] outline-none transition-colors"
                           value={tagSearch}
                           onChange={(e) => setTagSearch(e.target.value)}
                        />
                        <Search size={12} className="absolute left-2 top-1.5 text-gray-500" />
                     </div>

                     <div className="max-h-[120px] overflow-y-auto border border-[var(--border-color)] rounded-[2px] bg-[var(--card-bg)] transition-colors duration-200">
                        {filteredFriends.map(friend => (
                           <div
                              key={friend.id}
                              onClick={() => handleToggleTag(friend.id)}
                              className={`flex items-center gap-2 p-1.5 border-b border-[var(--border-soft)] last:border-0 cursor-pointer hover:bg-[var(--border-soft)] transition-colors ${selectedTags.includes(friend.id) ? 'bg-[#59B200]/10 border-l-2 border-l-[#005599]' : ''}`}
                           >
                              <img src={friend.avatar || `/api/proxy/avatar?name=${encodeURIComponent(friend.name)}`} className="w-5 h-5 rounded-full" />
                              <span className={`text-[11px] flex-1 ${selectedTags.includes(friend.id) ? 'font-bold text-[#005599]' : 'text-gray-400'}`}>{friend.name}</span>
                              {selectedTags.includes(friend.id) && <div className="w-2 h-2 rounded-full bg-[#59B200]"></div>}
                           </div>
                        ))}
                        {filteredFriends.length === 0 && (
                           <div className="p-3 text-center text-[10px] text-gray-400 italic">No se encontraron amigos</div>
                        )}
                     </div>

                     {selectedTags.length > 0 && (
                        <div className="mt-2 flex flex-wrap gap-1">
                           <span className="text-[10px] text-gray-400 w-full mb-1">Etiquetados:</span>
                           {selectedTags.map(id => {
                              const friend = friends.find(f => f.id === id);
                              return (
                                 <span key={id} className="bg-[var(--bg-color)] text-[#005599] text-[9px] font-bold px-2 py-0.5 rounded-full border border-[var(--border-color)] flex items-center gap-1 transition-colors">
                                    {friend?.name}
                                    <X size={8} className="cursor-pointer" onClick={() => handleToggleTag(id)} />
                                 </span>
                              );
                           })}
                        </div>
                     )}
                  </div>
               </div>

               <div className="p-3 bg-[var(--bg-color)] border-t border-[var(--border-color)] flex justify-end gap-2 transition-colors duration-200">
                  <button
                     onClick={onClose}
                     className="px-4 py-1.5 text-[12px] font-bold text-gray-500 hover:underline"
                  >
                     Cancelar
                  </button>
                  <button
                     disabled={isSubmitting}
                     onClick={handleSubmit}
                     className={`bg-[#59B200] text-white text-[12px] font-bold px-6 py-1.5 rounded-[3px] border border-[#4a9400] shadow-sm flex items-center gap-2 transition-all ${isSubmitting ? 'opacity-50' : 'hover:bg-[#4d9a00] active:scale-95'}`}
                  >
                     {isSubmitting ? 'Subiendo...' : 'Subir foto'} <Send size={14} />
                  </button>
               </div>
            </div>
         </div>
      </div>
   );
};

export default PhotoUploadModal;