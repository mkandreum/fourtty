import React, { useState, useEffect } from 'react';
import { Settings, X, Minus } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { User } from '../types';
import api from '../api';

const ChatBar: React.FC = () => {
   const { user } = useAuth();
   const [isOpen, setIsOpen] = useState(false);
   const [activeChat, setActiveChat] = useState<string | null>(null);
   const [friends, setFriends] = useState<User[]>([]);

   useEffect(() => {
      // Only fetch if chat is opened or initialized
      if (user && isOpen) {
         api.get(`/users/${user.id}/friends`)
            .then(res => setFriends(res.data.friends))
            .catch(err => console.error(err));
      }
   }, [user, isOpen]);

   return (
      <>
         {/* Sticky Bottom Bar */}
         <div className="fixed bottom-0 left-0 w-full h-[30px] bg-[#1a1a1a]/90 border-t border-[#333] flex items-center justify-between px-4 z-50 text-white font-sans">

            {/* Left: Chat Trigger */}
            <div
               className="flex items-center gap-2 h-full px-3 hover:bg-[#333] cursor-pointer border-r border-[#333] select-none"
               onClick={() => setIsOpen(!isOpen)}
            >
               <div className="w-2 h-2 rounded-full bg-[#59B200] shadow-[0_0_4px_#59B200]"></div>
               <span className="font-bold text-[12px]">Chat ({friends.length > 0 ? friends.length : '0'})</span>
            </div>

            {/* Right: Settings or minimized chats */}
            <div className="flex items-center gap-4 h-full">
               {activeChat && (
                  <div
                     className="h-full px-3 bg-[#005599] flex items-center gap-2 cursor-pointer text-[12px] font-bold"
                     onClick={() => setActiveChat(activeChat)}
                  >
                     <span className="w-2 h-2 rounded-full bg-[#59B200]"></span>
                     {activeChat}
                  </div>
               )}
               <Settings size={14} className="text-gray-400 hover:text-white cursor-pointer" />
            </div>
         </div>

         {/* Friends List Popup */}
         {isOpen && (
            <div className="fixed bottom-[30px] left-2 w-[200px] bg-white border border-[#999] shadow-lg rounded-t-[4px] z-40 max-h-[400px] flex flex-col">
               <div className="bg-[#f0f0f0] p-2 border-b border-[#ccc] flex justify-between items-center">
                  <span className="text-[11px] font-bold text-[#333]">Conectados</span>
                  <div className="flex gap-1">
                     <span className="text-[9px] text-[#005599] hover:underline cursor-pointer">Ajustes</span>
                  </div>
               </div>
               <div className="overflow-y-auto p-1 flex-1 h-[300px]">
                  <input type="text" placeholder="Buscar amigo" className="w-full text-[11px] p-1 border border-[#ccc] rounded-[2px] mb-2" />
                  {friends.length > 0 ? friends.map(friend => (
                     <div
                        key={friend.id}
                        className="flex items-center gap-2 p-1.5 hover:bg-[#e1f0fa] cursor-pointer rounded-[2px]"
                        onClick={() => setActiveChat(friend.name)}
                     >
                        <div className="w-2 h-2 rounded-full bg-[#59B200]"></div>
                        <span className="text-[11px] text-[#333] truncate">{friend.name}</span>
                     </div>
                  )) : (
                     <div className="text-[10px] text-gray-400 p-2">No tienes amigos conectados</div>
                  )}
               </div>
            </div>
         )}

         {/* Active Chat Window */}
         {activeChat && (
            <div className="fixed bottom-[30px] right-20 w-[260px] bg-white border border-[#999] shadow-lg rounded-t-[4px] z-40 flex flex-col">
               {/* Header */}
               <div className="bg-[#005599] text-white p-1.5 px-2 flex justify-between items-center rounded-t-[3px] cursor-pointer">
                  <div className="flex items-center gap-2 font-bold text-[12px]">
                     <div className="w-2 h-2 rounded-full bg-[#59B200] border border-white"></div>
                     {activeChat}
                  </div>
                  <div className="flex gap-2">
                     <Minus size={14} className="hover:opacity-75" onClick={() => setActiveChat(null)} />
                     <X size={14} className="hover:opacity-75" onClick={() => setActiveChat(null)} />
                  </div>
               </div>

               {/* Body */}
               <div className="h-[200px] overflow-y-auto p-2 bg-white text-[12px]">
                  <div className="text-[#999] text-[10px] text-center mb-2">Hoy, 18:34</div>
                  <div className="mb-2">
                     <span className="font-bold text-[#005599]">{activeChat}:</span>
                     <span className="text-[#333]"> Hey! Qué tal? Viste las fotos de ayer?</span>
                  </div>
                  <div className="mb-2">
                     <span className="font-bold text-[#333]">Tú:</span>
                     <span className="text-[#333]"> Siii jajajaja vaya cara salgo en la del bar</span>
                  </div>
               </div>

               {/* Input */}
               <div className="p-2 border-t border-[#ccc] bg-[#f2f6f9]">
                  <input type="text" className="w-full border border-[#b2c2d1] rounded-[2px] p-1 text-[11px]" autoFocus />
               </div>
            </div>
         )}
      </>
   );
};

export default ChatBar;