import React, { useState, useEffect } from 'react';
import { Search } from 'lucide-react';
import api from '../api';
import { useAuth } from '../contexts/AuthContext';
import { User } from '../types';
import { motion } from 'framer-motion';

const Sidebar: React.FC = () => {
   const { user } = useAuth();
   const [friends, setFriends] = useState<User[]>([]);
   const [filterQuery, setFilterQuery] = useState('');
   const [isLoading, setIsLoading] = useState(true);

   useEffect(() => {
      if (user) {
         const fetchFriends = async () => {
            try {
               const response = await api.get(`/users/${user.id}/friends`);
               setFriends(response.data.friends);
            } catch (error) {
               console.error("Error fetching friends:", error);
            } finally {
               setIsLoading(false);
            }
         };
         fetchFriends();
      }
   }, [user]);

   const filteredFriends = friends.filter(friend =>
      friend.name.toLowerCase().includes(filterQuery.toLowerCase())
   );

   return (
      <motion.div
         initial={{ opacity: 0, x: 20 }}
         animate={{ opacity: 1, x: 0 }}
         className="flex flex-col gap-4"
      >
         {/* Add Friends */}
         <div className="bg-[#fff] border-b border-[#dce5ed] pb-4">
            <h4 className="text-[#333] font-bold text-[11px] mb-2">Añadir amigos</h4>
            <div className="text-[11px] text-[#888] mb-2">¿Amigos en Hotmail, Gmail o Yahoo!?</div>
            <div className="flex gap-1">
               <button className="flex items-center gap-1 bg-[#f2f6f9] border border-[#ccc] text-[#333] font-bold text-[11px] px-2 py-1 rounded-[2px] hover:bg-[#e1e9f0] w-full justify-center underline decoration-[#005599]">
                  <Search size={12} className="text-[#005599]" /> Buscar amigos
               </button>
            </div>
         </div>

         {/* Chat Widget */}
         <div className="bg-[#fff]">
            <h4 className="text-[#333] font-bold text-[11px] mb-2 flex items-center justify-between border-b border-[#eee] pb-1">
               <div className="flex items-center gap-1">
                  <span className="w-2 h-2 bg-[#59B200] rounded-full"></span>
                  Chat ({filteredFriends.length})
               </div>
               <span className="text-[#005599] hover:underline cursor-pointer text-[10px]">Ajustes</span>
            </h4>
            <div className="relative mb-2">
               <input
                  type="text"
                  placeholder="Buscar amigo"
                  className="w-full border border-[#ccc] rounded-[2px] py-0.5 px-1 text-[11px] pl-5"
                  value={filterQuery}
                  onChange={(e) => setFilterQuery(e.target.value)}
               />
               <Search size={10} className="absolute left-1 top-1.5 text-gray-400" />
            </div>
            <div className="flex flex-col gap-0.5 max-h-[300px] overflow-y-auto pr-1">
               {isLoading ? (
                  <div className="text-[10px] text-gray-400 p-2">Cargando amigos...</div>
               ) : filteredFriends.length > 0 ? (
                  filteredFriends.map(friend => (
                     <div key={friend.id} className="flex items-center gap-2 p-1 hover:bg-[#e1f0fa] cursor-pointer group">
                        <div className="w-2 h-2 rounded-full bg-[#59B200]"></div>
                        <span className="text-[11px] text-[#333] group-hover:text-black truncate">{friend.name}</span>
                     </div>
                  ))
               ) : (
                  <div className="text-[10px] text-gray-400 p-2">
                     {filterQuery ? 'No se encontraron amigos' : 'No tienes amigos conectados'}
                  </div>
               )}
            </div>
         </div>
      </motion.div>
   );
};

export default Sidebar;