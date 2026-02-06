import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Settings, X, Minus } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useSocket } from '../contexts/SocketContext';
import { User } from '../types';
import api from '../api';

const ChatWindow = ({
   friend,
   onClose,
   currentUser
}: {
   friend: User,
   onClose: () => void,
   currentUser: User
}) => {
   const { socket } = useSocket();
   const [messages, setMessages] = useState<any[]>([]);
   const [inputText, setInputText] = useState('');
   const [isFriendTyping, setIsFriendTyping] = useState(false);
   const scrollRef = React.useRef<HTMLDivElement>(null);

   useEffect(() => {
      fetchMessages();

      if (!socket) return;

      const handleNewMessage = (message: any) => {
         // Only add message if it belongs to this chat
         if (message.senderId === friend.id || message.receiverId === friend.id) {
            setMessages(prev => [...prev, message]);
         }
      };

      const handleTyping = (data: { senderId: number }) => {
         if (data.senderId === friend.id) setIsFriendTyping(true);
      };

      const handleStopTyping = (data: { senderId: number }) => {
         if (data.senderId === friend.id) setIsFriendTyping(false);
      };

      socket.on('new_message', handleNewMessage);
      socket.on('message_sent', handleNewMessage);
      socket.on('user_typing', handleTyping);
      socket.on('user_stop_typing', handleStopTyping);

      return () => {
         socket.off('new_message', handleNewMessage);
         socket.off('message_sent', handleNewMessage);
         socket.off('user_typing', handleTyping);
         socket.off('user_stop_typing', handleStopTyping);
      };
   }, [friend.id, socket]);

   useEffect(() => {
      // Scroll to bottom on new messages
      if (scrollRef.current) {
         scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
      }
   }, [messages, isFriendTyping]);

   const fetchMessages = async () => {
      try {
         const res = await api.get(`/messages/${friend.id}`);
         setMessages(res.data.messages);
      } catch (e) {
         console.error(e);
      }
   };

   const handleSend = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!inputText.trim() || !socket) return;

      socket.emit('send_message', {
         senderId: currentUser.id,
         recipientId: friend.id,
         content: inputText
      });
      setInputText('');
      socket.emit('stop_typing', { recipientId: friend.id, senderId: currentUser.id });
   };

   const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      setInputText(e.target.value);
      if (socket) {
         if (e.target.value.length > 0) {
            socket.emit('typing', { recipientId: friend.id, senderId: currentUser.id });
         } else {
            socket.emit('stop_typing', { recipientId: friend.id, senderId: currentUser.id });
         }
      }
   };

   return (
      <div className="fixed bottom-[30px] right-2 md:right-20 w-[calc(100%-16px)] md:w-[260px] bg-white border border-[#999] shadow-lg rounded-t-[4px] z-40 flex flex-col">
         {/* Header */}
         <div
            className="bg-[#005599] text-white p-1.5 px-2 flex justify-between items-center rounded-t-[3px] cursor-pointer"
            onClick={onClose}
         >
            <div className="flex items-center gap-2 font-bold text-[12px]">
               <div className="w-2 h-2 rounded-full bg-[#59B200] border border-white"></div>
               {friend.name}
            </div>
            <div className="flex gap-2">
               <Minus size={14} className="hover:opacity-75" onClick={(e) => { e.stopPropagation(); onClose(); }} />
               <X size={14} className="hover:opacity-75" onClick={(e) => { e.stopPropagation(); onClose(); }} />
            </div>
         </div>

         {/* Body */}
         <div
            className="h-[200px] overflow-y-auto p-2 bg-white text-[12px] flex flex-col gap-2"
            ref={scrollRef}
         >
            {messages.length === 0 && (
               <div className="text-[#999] text-[10px] text-center mt-4">Inicio de la conversación</div>
            )}

            {messages.map((msg, idx) => {
               const isMe = msg.senderId === currentUser.id;
               return (
                  <div key={idx} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                     <div className={`max-w-[85%] rounded-[4px] p-1 px-2 ${isMe ? 'bg-[#e1f0fa]' : 'bg-[#f0f0f0]'}`}>
                        <span className="text-[#333]">{msg.content}</span>
                     </div>
                     <span className="text-[9px] text-[#999] mt-0.5">
                        {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                     </span>
                  </div>
               );
            })}
            {isFriendTyping && (
               <div className="flex items-start">
                  <div className="bg-[#f0f0f0] rounded-[4px] p-1 px-2 flex gap-1 items-baseline">
                     <span className="text-[10px] text-[#005599] italic font-bold">Escribiendo</span>
                     <motion.span animate={{ opacity: [0, 1, 0] }} transition={{ repeat: Infinity, duration: 1.5 }}>.</motion.span>
                     <motion.span animate={{ opacity: [0, 1, 0] }} transition={{ repeat: Infinity, duration: 1.5, delay: 0.3 }}>.</motion.span>
                     <motion.span animate={{ opacity: [0, 1, 0] }} transition={{ repeat: Infinity, duration: 1.5, delay: 0.6 }}>.</motion.span>
                  </div>
               </div>
            )}
         </div>

         {/* Input */}
         <form onSubmit={handleSend} className="p-2 border-t border-[#ccc] bg-[#f2f6f9]">
            <input
               type="text"
               className="w-full border border-[#b2c2d1] rounded-[2px] p-1 text-[11px] focus:outline-none focus:border-[#005599]"
               autoFocus
               value={inputText}
               onChange={handleInputChange}
               onBlur={() => socket?.emit('stop_typing', { recipientId: friend.id, senderId: currentUser.id })}
               placeholder="Escribe un mensaje..."
            />
         </form>
      </div>
   );
};

const ChatBar: React.FC = () => {
   const { user } = useAuth();
   const { socket } = useSocket();
   const [isOpen, setIsOpen] = useState(false);
   const [activeChatUser, setActiveChatUser] = useState<User | null>(null);
   const [friends, setFriends] = useState<User[]>([]);
   const [onlineUserIds, setOnlineUserIds] = useState<number[]>([]);

   useEffect(() => {
      if (user) {
         // Fetch friends list on mount
         api.get(`/users/${user.id}/friends`)
            .then(res => setFriends(res.data.friends))
            .catch(err => console.error(err));
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

   if (!user) return null;

   const onlineFriends = friends.filter(f => onlineUserIds.includes(f.id));

   return (
      <>
         {/* Sticky Bottom Bar */}
         <div className="fixed bottom-0 left-0 w-full h-[30px] bg-[#1a1a1a]/90 border-t border-[#333] flex items-center justify-between px-4 z-50 text-white font-sans">

            {/* Left: Chat Trigger */}
            <div
               className="flex items-center gap-2 h-full px-3 hover:bg-[#333] cursor-pointer border-r border-[#333] select-none"
               onClick={() => setIsOpen(!isOpen)}
            >
               <div className={`w-2 h-2 rounded-full ${onlineFriends.length > 0 ? 'bg-[#59B200] shadow-[0_0_4px_#59B200]' : 'bg-gray-500'}`}></div>
               <span className="font-bold text-[12px]">Chat ({onlineFriends.length})</span>
            </div>

            {/* Right: Settings or minimized chats */}
            <div className="flex items-center gap-4 h-full">
               {activeChatUser && (
                  <div
                     className="h-full px-3 bg-[#005599] flex items-center gap-2 cursor-pointer text-[12px] font-bold"
                     onClick={() => setActiveChatUser(activeChatUser)}
                  >
                     <span className={`w-2 h-2 rounded-full ${onlineUserIds.includes(activeChatUser.id) ? 'bg-[#59B200]' : 'bg-gray-400'}`}></span>
                     {activeChatUser.name}
                  </div>
               )}
               <Settings size={14} className="text-gray-400 hover:text-white cursor-pointer" />
            </div>
         </div>

         {/* Friends List Popup */}
         {isOpen && (
            <div className="fixed bottom-[30px] left-2 w-[200px] bg-white border border-[#999] shadow-lg rounded-t-[4px] z-40 max-h-[400px] flex flex-col">
               <div className="bg-[#f0f0f0] p-2 border-b border-[#ccc] flex justify-between items-center">
                  <span className="text-[11px] font-bold text-[#333]">Amigos {friends.length > 0 && `(${onlineFriends.length}/${friends.length})`}</span>
                  <div className="flex gap-1">
                     <span className="text-[9px] text-[#005599] hover:underline cursor-pointer">Ajustes</span>
                  </div>
               </div>
               <div className="overflow-y-auto p-1 flex-1 h-[300px]">
                  <input type="text" placeholder="Buscar amigo" className="w-full text-[11px] p-1 border border-[#ccc] rounded-[2px] mb-2 focus:outline-none" />
                  {friends.length > 0 ? friends.map(friend => {
                     const isOnline = onlineUserIds.includes(friend.id);
                     return (
                        <div
                           key={friend.id}
                           className="flex items-center gap-2 p-1.5 hover:bg-[#e1f0fa] cursor-pointer rounded-[2px]"
                           onClick={() => {
                              setActiveChatUser(friend);
                           }}
                        >
                           <div className={`w-2 h-2 rounded-full ${isOnline ? 'bg-[#59B200]' : 'bg-gray-300'}`}></div>
                           <img
                              src={friend.avatar || `https://ui-avatars.com/api/?name=${friend.name}`}
                              className={`w-5 h-5 rounded-sm object-cover ${!isOnline ? 'grayscale opacity-70' : ''}`}
                              alt={friend.name}
                           />
                           <span className={`text-[11px] ${isOnline ? 'text-[#333] font-bold' : 'text-gray-500'} truncate`}>{friend.name}</span>
                        </div>
                     );
                  }) : (
                     <div className="text-[10px] text-gray-400 p-2">No tienes amigos todavía</div>
                  )}
               </div>
            </div>
         )}

         {/* Active Chat Window */}
         {activeChatUser && (
            <ChatWindow
               friend={activeChatUser}
               currentUser={user}
               onClose={() => setActiveChatUser(null)}
            />
         )}
      </>
   );
};

export default ChatBar;