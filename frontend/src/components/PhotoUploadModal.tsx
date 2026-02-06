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
         const res = await api.get('/friendships/friends');
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
         <div className="bg-white w-full max-w-[700px] rounded-[4px] shadow-2xl overflow-hidden flex flex-col md:flex-row border border-[#ccc]">
            {/* Image Preview Area */}
            <div className="md:w-1/2 bg-[#f0f2f5] p-1 flex items-center justify-center border-b md:border-b-0 md:border-r border-[#ccc]">
               {preview ? (
                  <div className="relative group p-2 bg-white border border-[#ddd] shadow-sm">
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
               <div className="p-3 bg-[#f2f6f9] border-b border-[#ccc] flex justify-between items-center">
                  <h3 className="text-[#005599] font-bold text-[13px] flex items-center gap-2">
                     Subir nueva foto
                  </h3>
                  <button onClick={onClose} className="text-gray-400 hover:text-black">
                     <X size={18} />
                  </button>
               </div>

               <div className="flex-1 overflow-y-auto p-4 space-y-4">
                  {/* Caption */}
                  <div>
                     <label className="text-[11px] font-bold text-[#333] mb-1 block">Pie de foto (Caption):</label>
                     <textarea
                        className="w-full border border-[#b2c2d1] rounded-[2px] p-2 text-[12px] outline-none focus:border-[#5C95C4] min-h-[60px] resize-none"
                        placeholder="Escribe algo sobre esta foto..."
                        value={caption}
                        onChange={(e) => setCaption(e.target.value)}
                     />
                  </div>

                  {/* Initial Comment */}
                  <div>
                     <label className="text-[11px] font-bold text-[#333] mb-1 block">Primer comentario (opcional):</label>
                     <textarea
                        className="w-full border border-[#b2c2d1] rounded-[2px] p-2 text-[12px] outline-none focus:border-[#5C95C4] min-h-[60px] resize-none"
                        placeholder="Añade un comentario extra..."
                        value={initialComment}
                        onChange={(e) => setInitialComment(e.target.value)}
                     />
                  </div>

                  {/* Tagging */}
                  <div>
                     <label className="text-[11px] font-bold text-[#333] mb-1 block flex items-center gap-1">
                        <Tag size={12} className="text-[#59B200]" /> ¿Quién sale en esta foto?
                     </label>
                     <div className="relative mb-2">
                        <input
                           type="text"
                           placeholder="Buscar amigos para etiquetar..."
                           className="w-full border border-[#ccc] rounded-[2px] pl-7 pr-2 py-1 text-[11px] focus:border-[#5C95C4] outline-none"
                           value={tagSearch}
                           onChange={(e) => setTagSearch(e.target.value)}
                        />
                        <Search size={12} className="absolute left-2 top-1.5 text-gray-400" />
                     </div>

                     <div className="max-h-[120px] overflow-y-auto border border-[#eee] rounded-[2px] bg-white">
                        {filteredFriends.map(friend => (
                           <div
                              key={friend.id}
                              onClick={() => handleToggleTag(friend.id)}
                              className={`flex items-center gap-2 p-1.5 border-b border-[#f5f5f5] last:border-0 cursor-pointer hover:bg-[#f0f7ff] transition-colors ${selectedTags.includes(friend.id) ? 'bg-[#e7f3ff] border-l-2 border-l-[#005599]' : ''}`}
                           >
                              <img src={friend.avatar || `https://ui-avatars.com/api/?name=${friend.name}`} className="w-5 h-5 rounded-full" />
                              <span className={`text-[11px] flex-1 ${selectedTags.includes(friend.id) ? 'font-bold text-[#005599]' : 'text-gray-700'}`}>{friend.name}</span>
                              {selectedTags.includes(friend.id) && <div className="w-2 h-2 rounded-full bg-[#59B200]"></div>}
                           </div>
                        ))}
                        {filteredFriends.length === 0 && (
                           <div className="p-3 text-center text-[10px] text-gray-400 italic">No se encontraron amigos</div>
                        )}
                     </div>

                     {selectedTags.length > 0 && (
                        <div className="mt-2 flex flex-wrap gap-1">
                           <span className="text-[10px] text-gray-500 w-full mb-1">Etiquetados:</span>
                           {selectedTags.map(id => {
                              const friend = friends.find(f => f.id === id);
                              return (
                                 <span key={id} className="bg-[#f0f2f5] text-[#005599] text-[9px] font-bold px-2 py-0.5 rounded-full border border-[#ddd] flex items-center gap-1">
                                    {friend?.name}
                                    <X size={8} className="cursor-pointer" onClick={() => handleToggleTag(id)} />
                                 </span>
                              );
                           })}
                        </div>
                     )}
                  </div>
               </div>

               <div className="p-3 bg-[#f2f6f9] border-t border-[#ccc] flex justify-end gap-2">
                  <button
                     onClick={onClose}
                     className="px-4 py-1.5 text-[12px] font-bold text-[#555] hover:underline"
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