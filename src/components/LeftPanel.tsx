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
         <div>
            {stats.messages > 0 && <MenuItem icon={Mail} count={stats.messages} text="mensajes privados" />}
            {stats.requests > 0 && <MenuItem icon={UserPlus} count={stats.requests} text="peticiones de amistad" />}

            {/* Show these always or conditional? Keeping commonly used ones */}
            <MenuItem icon={MessageSquare} count={stats.statusComments} text="estado con comentarios" />
            <MenuItem icon={BarChart2} count={stats.visits} text="visitas nuevas" />
         </div>

         {/* Invite Friends - Functional placeholder */}
         <div className="border-t border-[#ddd] pt-3">
            <h4 className="font-bold text-[#333] text-[11px] mb-2">Invita a tus amigos</h4>
            <div className="flex gap-1">
               <input type="text" placeholder="Email" className="w-full border border-[#ccc] rounded-[2px] px-1 py-0.5 text-[11px]" />
               <button className="bg-[#2B7BB9] text-white font-bold text-[11px] px-2 py-0.5 rounded-[2px] border border-[#1e5a8c] hover:bg-[#256ca3]">Invitar</button>
            </div>
         </div>

      </div>
   );
};

export default LeftPanel;