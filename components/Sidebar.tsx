import React from 'react';
import { Search, Gift, MessageSquare } from 'lucide-react';
import { MOCK_FRIENDS } from '../constants';

const Sidebar: React.FC = () => {
  return (
    <div className="flex flex-col gap-4">
      
      {/* Add Friends */}
      <div className="bg-[#fff] border-b border-[#dce5ed] pb-4">
        <h4 className="text-[#333] font-bold text-[11px] mb-2">Añadir amigos</h4>
        <div className="text-[11px] text-[#888] mb-2">¿Amigos en Hotmail, Gmail o Yahoo!?</div>
        <div className="flex gap-1">
             <button className="flex items-center gap-1 bg-[#f2f6f9] border border-[#ccc] text-[#333] font-bold text-[11px] px-2 py-1 rounded-[2px] hover:bg-[#e1e9f0] w-full justify-center">
               <Search size={12} /> Buscar amigos
             </button>
        </div>
      </div>

      {/* Chat Widget (Right Side Static) */}
      <div className="bg-[#fff]">
         <h4 className="text-[#333] font-bold text-[11px] mb-2 flex items-center justify-between border-b border-[#eee] pb-1">
            <div className="flex items-center gap-1">
              <span className="w-2 h-2 bg-[#59B200] rounded-full"></span>
              Chat (37)
            </div>
            <span className="text-[#005599] hover:underline cursor-pointer text-[10px]">Ajustes</span>
         </h4>
         <div className="relative mb-2">
            <input 
               type="text" 
               placeholder="Buscar amigo" 
               className="w-full border border-[#ccc] rounded-[2px] py-0.5 px-1 text-[11px] pl-5"
            />
            <Search size={10} className="absolute left-1 top-1.5 text-gray-400" />
         </div>
         <div className="flex flex-col gap-0.5 max-h-[300px] overflow-y-auto pr-1">
            {MOCK_FRIENDS.map(friend => (
               <div key={friend.id} className="flex items-center gap-2 p-1 hover:bg-[#e1f0fa] cursor-pointer group">
                  <div className="w-2 h-2 rounded-full bg-[#59B200]"></div>
                  <span className="text-[11px] text-[#333] group-hover:text-black truncate">{friend.name}</span>
               </div>
            ))}
            {/* Fake extra friends to match scrollbar in image */}
            {Array.from({length: 10}).map((_, i) => (
                <div key={i} className="flex items-center gap-2 p-1 hover:bg-[#e1f0fa] cursor-pointer group">
                  <div className="w-2 h-2 rounded-full bg-[#59B200]"></div>
                  <span className="text-[11px] text-[#333] group-hover:text-black truncate">Amigo {i}</span>
               </div>
            ))}
         </div>
      </div>

    </div>
  );
};

export default Sidebar;