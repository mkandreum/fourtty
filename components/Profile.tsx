import React from 'react';
import { MOCK_USER, MOCK_FRIENDS } from '../constants';
import { Mail, Edit3, User, MapPin, Briefcase, Heart } from 'lucide-react';

const Profile: React.FC = () => {
  return (
    <div className="bg-white rounded-[4px] border border-[#dce5ed] p-4 min-h-[600px]">
      
      {/* Profile Header */}
      <div className="mb-6 relative">
         <h1 className="text-[20px] font-bold text-[#333] mb-1">{MOCK_USER.name}</h1>
         <div className="text-[#555] text-[13px] mb-3 border-b border-[#eee] pb-3">
            {MOCK_USER.status} <span className="text-[#999] text-[11px] ml-2">(hace 10 minutos)</span>
         </div>
         
         <div className="absolute top-0 right-0 flex gap-2">
            <button className="flex items-center gap-1 bg-[#f2f6f9] border border-[#ccc] px-2 py-1 rounded-[3px] text-[11px] text-[#333] hover:bg-[#e1e9f0]">
               <Mail size={12}/> Enviar mensaje
            </button>
            <button className="flex items-center gap-1 bg-[#f2f6f9] border border-[#ccc] px-2 py-1 rounded-[3px] text-[11px] text-[#333] hover:bg-[#e1e9f0]">
               <Edit3 size={12}/> Escribir en tablón
            </button>
         </div>
      </div>

      <div className="flex gap-6">
         {/* Left Column: Info & Photos */}
         <div className="w-[30%] flex flex-col gap-4">
            
            {/* Profile Photo */}
            <div className="p-1 bg-white border border-[#ccc] shadow-sm inline-block">
               <img src={MOCK_USER.avatar.replace('100/100', '200/250')} alt="Profile" className="w-full h-auto" />
            </div>

            {/* Info Box */}
            <div className="bg-[#f9fbfd] border-t border-b border-[#e1e9f0] p-2 text-[11px] text-[#333]">
               <div className="flex items-center gap-2 mb-1.5">
                  <User size={12} className="text-[#888]"/> 
                  <span>Hombre, 22 años</span>
               </div>
               <div className="flex items-center gap-2 mb-1.5">
                  <Heart size={12} className="text-[#888]"/> 
                  <span>Soltero</span>
               </div>
               <div className="flex items-center gap-2 mb-1.5">
                  <MapPin size={12} className="text-[#888]"/> 
                  <span>Madrid, España</span>
               </div>
               <div className="flex items-center gap-2">
                  <Briefcase size={12} className="text-[#888]"/> 
                  <span>Estudiante en URJC</span>
               </div>
            </div>

            {/* Friends Grid */}
            <div>
               <h3 className="text-[#005599] font-bold text-[12px] mb-2 border-b border-[#eee] pb-1">
                  Amigos <span className="text-[#888] font-normal">(342)</span>
               </h3>
               <div className="grid grid-cols-3 gap-1">
                  {MOCK_FRIENDS.map(friend => (
                     <div key={friend.id} className="cursor-pointer group">
                        <img src={friend.avatar} className="w-full aspect-square object-cover" />
                        <div className="text-[9px] text-center mt-0.5 truncate text-[#005599] group-hover:underline">
                           {friend.name.split(' ')[0]}
                        </div>
                     </div>
                  ))}
               </div>
               <div className="text-right mt-2">
                  <a href="#" className="text-[#005599] text-[11px] hover:underline">Ver todos</a>
               </div>
            </div>

         </div>

         {/* Right Column: The Wall */}
         <div className="w-[70%]">
             
            {/* Wall Input */}
            <div className="bg-[#f2f6f9] p-3 rounded-[4px] border border-[#e1e9f0] mb-4">
               <div className="text-[#005599] font-bold text-[12px] mb-1">Escribe algo a {MOCK_USER.name.split(' ')[0]}...</div>
               <textarea className="w-full h-16 border border-[#b2c2d1] rounded-[2px] p-1 text-[12px] resize-none focus:border-[#5C95C4] outline-none"></textarea>
               <div className="text-right mt-2">
                  <button className="bg-[#005599] text-white text-[11px] font-bold px-3 py-1 rounded-[3px] hover:bg-[#00447a]">Publicar</button>
               </div>
            </div>

            {/* Wall Comments */}
            <h3 className="text-[#333] font-bold text-[13px] mb-3 pb-1 border-b border-[#ccc]">Tablón</h3>
            
            <div className="flex flex-col">
               {[1, 2, 3, 4].map((item, idx) => (
                  <div key={idx} className={`flex gap-3 p-3 border-b border-[#eee] ${idx % 2 === 0 ? 'bg-white' : 'bg-[#f9fbfd]'}`}>
                     <div className="w-10 flex-shrink-0">
                        <img src={`https://picsum.photos/seed/${item + 20}/50/50`} className="w-10 h-10 object-cover border border-[#ddd]" />
                     </div>
                     <div className="flex-1">
                        <div className="mb-1">
                           <a href="#" className="text-[#005599] font-bold text-[12px] hover:underline">Amigo {item}</a>
                           <span className="text-[#333] text-[12px]"> Hola Alex! Qué tal todo? A ver si nos vemos pronto que hace mil que no quedamos. Un abrazo!</span>
                        </div>
                        <div className="text-[#999] text-[10px]">
                           Hace {item * 2} horas · <span className="text-[#005599] hover:underline cursor-pointer">Comentar</span>
                        </div>
                     </div>
                  </div>
               ))}
            </div>

         </div>
      </div>
    </div>
  );
};

export default Profile;