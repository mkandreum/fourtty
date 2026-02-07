import React, { useState, useEffect } from 'react';
import { Search } from 'lucide-react';
import api from '../api';
import { useAuth } from '../contexts/AuthContext';
import { useSocket } from '../contexts/SocketContext';
import { User } from '../types';
import { motion } from 'framer-motion';
import Invitations from './Invitations';

const Sidebar: React.FC = () => {
   const { user } = useAuth();
   const { socket } = useSocket();
   const [friends, setFriends] = useState<User[]>([]);
   const [onlineUserIds, setOnlineUserIds] = useState<number[]>([]);
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

   useEffect(() => {
      if (!socket || !user) return;

      const handleOnlineUsers = (ids: number[]) => {
         setOnlineUserIds(ids);
      };

      socket.on('online_users', handleOnlineUsers);
      socket.emit('get_online_users');

      return () => {
         socket.off('online_users', handleOnlineUsers);
      };
   }, [socket, user]);

   const onlineFriendsCount = friends.filter(f => onlineUserIds.includes(f.id)).length;

   const filteredFriends = friends.filter(friend =>
      friend.name.toLowerCase().includes(filterQuery.toLowerCase())
   );

   return (
      <motion.div
         initial={{ opacity: 0, x: 20 }}
         animate={{ opacity: 1, x: 0 }}
         className="flex flex-col gap-4"
      >
         <Invitations compact />

         {/* Chat Widget */}
         <div className="">
            <h4 className="text-[var(--text-main)] font-bold text-[11px] mb-2 flex items-center justify-between border-b border-[var(--border-soft)] pb-1 transition-colors duration-200">
               <div className="flex items-center gap-1">
                  <span className={`w-2 h-2 rounded-full ${onlineFriendsCount > 0 ? 'bg-[#59B200]' : 'bg-gray-400'}`}></span>
                  Chat ({onlineFriendsCount})
               </div>
               <span className="text-[#005599] hover:underline cursor-pointer text-[10px]">Ajustes</span>
            </h4>
            <div className="relative mb-2">
               <input
                  type="text"
                  placeholder="Buscar amigo"
                  className="w-full bg-[var(--input-bg)] border border-[var(--border-color)] text-[var(--input-text)] rounded-[2px] py-0.5 px-1 text-[11px] pl-5 focus:outline-none transition-colors"
                  value={filterQuery}
                  onChange={(e) => setFilterQuery(e.target.value)}
               />
               <Search size={10} className="absolute left-1 top-1.5 text-gray-400" />
            </div>
            <div className="flex flex-col gap-0.5 max-h-[300px] overflow-y-auto pr-1">
               {isLoading ? (
                  <div className="text-[10px] text-gray-400 p-2">Cargando amigos...</div>
                  <div className="text-[10px] text-[var(--text-muted)] p-2">Cargando amigos...</div>
               ) : filteredFriends.length > 0 ? (
                  filteredFriends.map(friend => {
                     const isOnline = onlineUserIds.includes(friend.id);
                     return (
                        <div key={friend.id} className="flex items-center gap-2 p-1 hover:bg-[#59B200]/10 cursor-pointer group rounded-sm transition-colors duration-200">
                           <div className={`w-2 h-2 rounded-full ${isOnline ? 'bg-[#59B200]' : 'bg-gray-400'}`}></div>
                           <span className={`text-[11px] ${isOnline ? 'text-[var(--text-main)]' : 'text-[var(--text-muted)]'} group-hover:text-[#59B200] truncate transition-colors duration-200`}>{friend.name}</span>
                        </div>
                     );
                  })
               ) : (
                  <div className="text-[10px] text-[var(--text-muted)] p-2">
                     {filterQuery ? 'No se encontraron amigos' : 'No tienes amigos todavía'}
                  </div>
               )}
            </div>
         </div>
      </motion.div>
   );
};

export default Sidebar;