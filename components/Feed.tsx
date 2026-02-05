import React, { useState } from 'react';
import { MOCK_FEED, MOCK_USER } from '../constants';
import { MessageSquare, Camera, Video, Edit3, Tag } from 'lucide-react';

const Feed: React.FC = () => {
  const [statusText, setStatusText] = useState(MOCK_USER.status || '');
  const [isInputFocused, setIsInputFocused] = useState(false);

  return (
    <div className="bg-white min-h-[500px]">
      
      {/* Status Box */}
      <div className="mb-4">
        <div className="relative border-b border-[#eee] pb-4 mb-4">
          <div className="flex items-center gap-2 mb-1 text-[#ccc] text-[16px]">
             <Edit3 size={16} />
             <span className="font-bold text-[#ccc] text-[14px]">Actualiza tu estado</span>
          </div>
          
          <div className="flex gap-2">
             <input
               className="flex-1 border border-[#b2c2d1] rounded-[2px] p-1.5 text-[12px] text-[#555] focus:border-[#5C95C4] focus:ring-1 focus:ring-[#5C95C4] outline-none"
               value={statusText}
               onChange={(e) => setStatusText(e.target.value)}
             />
             <button className="bg-[#6FA3CD] text-white text-[11px] font-bold px-3 py-1 rounded-[2px] hover:bg-[#5C95C4]">
               Guardar
             </button>
          </div>
          <div className="text-[11px] text-[#888] mt-1">
             Última actualización: <span className="text-[#333]">{MOCK_USER.status}</span> <span className="text-[#999]">... hace más de una semana</span>
          </div>
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

      <div className="flex flex-col gap-4">
        {MOCK_FEED.map((post, index) => (
          <div key={post.id} className="flex gap-2 group">
            {/* Avatar */}
            <div className="w-[50px] shrink-0">
               <img 
                 src={post.user.avatar} 
                 alt={post.user.name} 
                 className="w-[50px] h-[50px] object-cover border border-[#ccc] rounded-[2px] p-[1px] bg-white shadow-sm"
               />
            </div>
            
            {/* Content */}
            <div className="flex-1 border-b border-[#f5f5f5] pb-3">
              <div className="text-[12px] leading-snug mb-1">
                <a href="#" className="text-[#005599] font-bold hover:underline">{post.user.name}</a>
                <span className="text-[#333] font-bold"> {post.content}</span>
              </div>
              
              <div className="text-[10px] text-[#999] mb-1">
                 {post.timestamp} <span className="mx-1">·</span> <span className="text-[#005599] hover:underline cursor-pointer">Comentar</span>
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
                      <img src={post.image} className="h-[80px] w-auto cursor-pointer" alt="attachment" />
                   </div>
                   <div className="border border-[#ddd] p-1 bg-white inline-block shadow-sm">
                      <img src={`https://picsum.photos/seed/${post.id}2/100/100`} className="h-[80px] w-auto cursor-pointer" alt="attachment" />
                   </div>
                   <div className="border border-[#ddd] p-1 bg-white inline-block shadow-sm">
                      <img src={`https://picsum.photos/seed/${post.id}3/100/100`} className="h-[80px] w-auto cursor-pointer" alt="attachment" />
                   </div>
                </div>
              )}

              {/* Interaction Summary */}
              <div className="mt-1 flex flex-col gap-0.5">
                 <div className="flex items-center gap-1 text-[11px]">
                    <span className="w-3 h-3 flex items-center justify-center bg-[#8cb58c] rounded-sm text-white text-[8px] font-bold">5</span>
                    <span className="text-[#59B200] font-bold">amigos</span>
                    <span className="text-[#555]">han comentado esto</span>
                 </div>
                 {post.commentsCount > 0 && (
                     <div className="flex items-center gap-1 text-[11px]">
                        <MessageSquare size={10} className="text-[#59B200] fill-[#59B200]" />
                        <span className="text-[#59B200] font-bold">{post.commentsCount} comentarios</span>
                     </div>
                 )}
                 {post.type === 'photo' && (
                    <div className="flex items-center gap-1 text-[11px]">
                       <Tag size={10} className="text-[#59B200] fill-[#59B200]" />
                       <span className="text-[#59B200] font-bold">8 fotos etiquetadas</span>
                    </div>
                 )}
              </div>
            </div>
          </div>
        ))}
      </div>
       
      <div className="mt-4 text-center">
         <button className="text-[#005599] font-bold text-[12px] hover:underline bg-[#f2f6f9] w-full py-2 rounded border border-[#e1e9f0]">
            Ver más novedades
         </button>
      </div>

    </div>
  );
};

export default Feed;