import React from 'react';
import { Mail, MessageSquare, BarChart2, UserPlus, Calendar, Gamepad2, Tag, Image as ImageIcon, Flag, Monitor } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

const MenuItem = ({ icon: Icon, count, text }: { icon: any, count: number, text: string }) => (
   <div className="flex items-center gap-2 mb-1 cursor-pointer group">
      <Icon size={14} className="text-[#59B200] fill-[#59B200]" strokeWidth={2} />
      <span className="text-[11px] font-bold text-[#59B200] group-hover:underline">
         {count} {text}
      </span>
   </div>
);

const LeftPanel: React.FC = () => {
   const { user } = useAuth();

   const getAvatarUrl = (avatar?: string) => {
      if (!avatar) return 'https://ui-avatars.com/api/?name=User';
      if (avatar.startsWith('http')) return avatar;
      return `${import.meta.env.VITE_API_URL?.replace('/api', '')}${avatar}`;
   };

   // Stats from user object (ensure backend provides these)
   const stats = {
      messages: 0,
      statusComments: 0,
      visits: 0,
      requests: 0, // friend requests not in _count yet
      friends: user?._count?.friendships || 0,
      posts: user?._count?.posts || 0,
      photos: user?._count?.photos || 0,
   };

   return (
      <div className="flex flex-col gap-4">

         {/* Profile Summary */}
         <div className="flex gap-3">
            <div className="bg-white p-1 border border-[#ccc] shadow-sm">
               <img
                  src={getAvatarUrl(user?.avatar)}
                  alt="Profile"
                  className="w-[60px] h-[60px] object-cover"
               />
            </div>
            <div className="flex flex-col pt-1">
               <div className="flex items-center gap-1 mb-1">
                  <BarChart2 size={12} className="text-[#005599]" />
                  <span className="text-[11px] font-bold text-[#333]">
                     {stats.visits > 0 ? `${stats.visits} visitas a tu perfil` : 'Perfil activo'}
                  </span>
               </div>
            </div>
         </div>

         {/* Menu Links */}
         <div className="mb-4">
            {stats.messages > 0 && <MenuItem icon={Mail} count={stats.messages} text="mensajes privados" />}

            {/* Friend request mock logic based on stats.requests */}
            <div className="flex items-center gap-2 mb-1 cursor-pointer group">
               <UserPlus size={14} className="text-[#59B200] fill-[#59B200]" strokeWidth={2} />
               <span className="text-[11px] font-bold text-[#59B200] group-hover:underline">
                  {stats.requests > 0 ? `${stats.requests} petición de amistad` : '0 peticiones'}
               </span>
            </div>

            <MenuItem icon={MessageSquare} count={stats.statusComments} text="estado con comentarios" />
            <MenuItem icon={BarChart2} count={stats.visits} text="visitas nuevas" />
         </div>

         {/* Invite Friends */}
         <div className="mb-6">
            <h4 className="font-bold text-[#333] text-[11px] mb-2">Invita a tus amigos</h4>
            <div className="text-[10px] text-[#999] mb-1">7 invitaciones</div>
            <div className="flex gap-1">
               <input type="text" placeholder="Email" className="w-[110px] border border-[#ccc] rounded-[2px] px-1 py-0.5 text-[11px]" />
               <button className="bg-[#2B7BB9] text-white font-bold text-[11px] px-2 py-0.5 rounded-[2px] border border-[#1e5a8c] hover:bg-[#256ca3]">Invitar</button>
            </div>
         </div>

         {/* Sponsored Events */}
         <div className="mb-6">
            <h4 className="font-bold text-[#333] text-[11px] mb-2 border-b border-[#eee] pb-1">Eventos patrocinados</h4>
            <div className="flex flex-col gap-3">
               <div className="flex gap-2">
                  <div className="w-8 h-8 bg-gray-200 rounded-sm shrink-0 flex items-center justify-center text-[8px] font-bold text-gray-500">PROMO</div>
                  <div>
                     <div className="text-[10px] text-[#005599] font-bold hover:underline cursor-pointer leading-tight">Sumérgete en cuatro mundos únicos con Spiderman</div>
                     <div className="text-[9px] text-[#999]">23 Sep (142)</div>
                  </div>
               </div>
               <div className="flex gap-2">
                  <div className="w-8 h-8 bg-gray-200 rounded-sm shrink-0 flex items-center justify-center text-[8px] font-bold text-gray-500">EVENT</div>
                  <div>
                     <div className="text-[10px] text-[#005599] font-bold hover:underline cursor-pointer leading-tight">Ven al GP A-Style de MotoGP de Aragón</div>
                     <div className="text-[9px] text-[#999]">19 Sep (344)</div>
                  </div>
               </div>
            </div>
         </div>

         {/* Calendar */}
         <div className="mb-4">
            <h4 className="font-bold text-[#333] text-[11px] mb-2 border-b border-[#eee] pb-1 flex justify-between items-center">
               <span>Calendario</span>
               <span className="text-[#005599] text-[9px] font-normal hover:underline cursor-pointer">Crear evento</span>
            </h4>
            <div className="text-[10px] text-[#333] mb-1">
               <span className="font-bold">Hoy</span> no tienes ningún evento.
            </div>
            <div className="text-[10px] text-[#333]">
               <span className="font-bold">Mañana</span> no tienes ningún evento.
            </div>
            <div className="mt-2">
               <span className="text-[#005599] text-[10px] hover:underline cursor-pointer">Ver todos</span>
            </div>
         </div>

      </div>
   );
};

export default LeftPanel;