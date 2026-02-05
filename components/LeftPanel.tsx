import React from 'react';
import { Mail, MessageSquare, BarChart2, UserPlus, Calendar, Gamepad2, Tag, Image as ImageIcon, Flag, Monitor } from 'lucide-react';
import { MOCK_USER, LEFT_PANEL_DATA } from '../constants';

const MenuItem = ({ icon: Icon, count, text }: { icon: any, count: number, text: string }) => (
  <div className="flex items-center gap-2 mb-1 cursor-pointer group">
    <Icon size={14} className="text-[#59B200] fill-[#59B200]" strokeWidth={2} />
    <span className="text-[11px] font-bold text-[#59B200] group-hover:underline">
      {count} {text}
    </span>
  </div>
);

const LeftPanel: React.FC = () => {
  return (
    <div className="flex flex-col gap-4">
      
      {/* Profile Summary */}
      <div className="flex gap-3">
        <div className="bg-white p-1 border border-[#ccc] shadow-sm">
           <img src={MOCK_USER.avatar} alt="Profile" className="w-[60px] h-[60px] object-cover" />
        </div>
        <div className="flex flex-col pt-1">
           <div className="flex items-center gap-1 mb-1">
             <BarChart2 size={12} className="text-[#005599]" />
             <span className="text-[11px] font-bold text-[#333]">17.200 visitas a tu perfil</span>
           </div>
        </div>
      </div>

      {/* Menu Links */}
      <div>
        <MenuItem icon={Mail} count={LEFT_PANEL_DATA.messages} text="mensajes privados" />
        <MenuItem icon={MessageSquare} count={LEFT_PANEL_DATA.statusComments} text="estado con comentarios" />
        <MenuItem icon={BarChart2} count={LEFT_PANEL_DATA.visits} text="visitas nuevas" />
        <MenuItem icon={UserPlus} count={LEFT_PANEL_DATA.requests} text="peticiones de amistad" />
        <MenuItem icon={MessageSquare} count={LEFT_PANEL_DATA.comments} text="comentarios" />
        <MenuItem icon={Calendar} count={LEFT_PANEL_DATA.eventInvites} text="invitaciones a eventos" />
        <MenuItem icon={Gamepad2} count={LEFT_PANEL_DATA.gameInvites} text="invitación a un juego" />
        
        {/* Tags Section */}
        <div className="mt-2 mb-1">
          <div className="flex items-center gap-2 mb-1 cursor-pointer group">
             <Tag size={14} className="text-[#59B200] fill-[#59B200]" strokeWidth={2} />
             <span className="text-[11px] font-bold text-[#59B200] group-hover:underline">
               {LEFT_PANEL_DATA.tags} etiquetas
             </span>
          </div>
          <div className="flex gap-1 ml-5">
             {[1,2,3,4,5].map(i => (
                <img key={i} src={`https://picsum.photos/seed/tag${i}/30/30`} className="w-[30px] h-[30px] border border-[#ccc] hover:border-[#005599] cursor-pointer" />
             ))}
          </div>
        </div>

        <MenuItem icon={ImageIcon} count={LEFT_PANEL_DATA.photoComments} text="fotos con comentarios" />
        <MenuItem icon={Flag} count={LEFT_PANEL_DATA.pageInvites} text="invitaciones a páginas" />
      </div>

      {/* Invite Friends */}
      <div className="border-t border-[#ddd] pt-3">
         <h4 className="font-bold text-[#333] text-[11px] mb-2">Invita a tus amigos</h4>
         <div className="text-[11px] text-[#666] mb-2">6 invitaciones</div>
         <div className="flex gap-1">
            <input type="text" placeholder="Email" className="w-full border border-[#ccc] rounded-[2px] px-1 py-0.5 text-[11px]" />
            <button className="bg-[#2B7BB9] text-white font-bold text-[11px] px-2 py-0.5 rounded-[2px] border border-[#1e5a8c] hover:bg-[#256ca3]">Invitar</button>
         </div>
      </div>

      {/* Sponsored Events */}
      <div className="border-t border-[#ddd] pt-3">
         <h4 className="font-bold text-[#333] text-[11px] mb-2">Eventos patrocinados</h4>
         <div className="flex flex-col gap-2">
            <div className="flex gap-2 group cursor-pointer">
               <div className="w-8 h-8 bg-black flex items-center justify-center shrink-0">
                  <Gamepad2 size={16} className="text-white" />
               </div>
               <div className="leading-tight">
                  <div className="text-[11px] font-bold text-[#005599] group-hover:underline">Consigue una PSP con un solo click</div>
                  <div className="text-[10px] text-[#999]">10 Feb (10.000+)</div>
               </div>
            </div>
            <div className="flex gap-2 group cursor-pointer">
               <div className="w-8 h-8 bg-black flex items-center justify-center shrink-0">
                  <Monitor size={16} className="text-white" />
               </div>
               <div className="leading-tight">
                  <div className="text-[11px] font-bold text-[#005599] group-hover:underline">Un HP Envy Beats puede ser tuyo</div>
                  <div className="text-[10px] text-[#999]">15 Feb (5.200+)</div>
               </div>
            </div>
         </div>
      </div>

    </div>
  );
};

export default LeftPanel;