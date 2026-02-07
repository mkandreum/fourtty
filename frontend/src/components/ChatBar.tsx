import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Settings, X, Minus, Send, Check, CheckCheck } from 'lucide-react';
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
   const [bottomOffset, setBottomOffset] = useState(30);
   const scrollRef = React.useRef<HTMLDivElement>(null);

   // Handle Visual Viewport for mobile keyboard
   useEffect(() => {
      if (!window.visualViewport) return;

      const handleResize = () => {
         const viewport = window.visualViewport!;
         // On mobile, if the viewport height is significantly less than window height,
         // it usually means the keyboard is open.
         const offset = window.innerHeight - viewport.height;
         setBottomOffset(Math.max(30, offset));
      };

      window.visualViewport.addEventListener('resize', handleResize);
      window.visualViewport.addEventListener('scroll', handleResize);
      return () => {
         window.visualViewport?.removeEventListener('resize', handleResize);
         window.visualViewport?.removeEventListener('scroll', handleResize);
      };
   }, []);

   useEffect(() => {
      fetchMessages();

      if (!socket) return;

      const handleNewMessage = (message: any) => {
         if (message.senderId === friend.id || message.receiverId === friend.id) {
            setMessages(prev => [...prev, message]);
            // If message is from friend, mark as read immediately since chat is open
            if (message.senderId === friend.id) {
               socket.emit('mark_messages_read', { senderId: friend.id });
            }
         }
      };

      const handleMessagesRead = (data: { readerId: number }) => {
         if (data.readerId === friend.id) {
            setMessages(prev => prev.map(msg =>
               msg.senderId === currentUser.id ? { ...msg, read: true } : msg
            ));
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
      socket.on('messages_read', handleMessagesRead);
      socket.on('user_typing', handleTyping);
      socket.on('user_stop_typing', handleStopTyping);

      // Initial mark as read when opening chat
      socket.emit('mark_messages_read', { senderId: friend.id });

      return () => {
         socket.off('new_message', handleNewMessage);
         socket.off('message_sent', handleNewMessage);
         socket.off('messages_read', handleMessagesRead);
         socket.off('user_typing', handleTyping);
         socket.off('user_stop_typing', handleStopTyping);
      };
   }, [friend.id, socket]);

   useEffect(() => {
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

   const handleSend = async (e?: React.FormEvent) => {
      e?.preventDefault();
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
      <div
         className="fixed right-2 md:right-20 w-[calc(100%-16px)] md:w-[280px] bg-[var(--card-bg)] border border-[var(--border-color)] shadow-2xl rounded-t-lg z-40 flex flex-col transition-all duration-300 ease-in-out"
         style={{ bottom: `${bottomOffset}px` }}
      >
         {/* Header */}
         <div
            className="bg-[#005599] text-white p-2.5 px-3 flex justify-between items-center rounded-t-lg cursor-pointer"
            onClick={onClose}
         >
            <div className="flex items-center gap-2 font-bold text-[13px]">
               <div className="w-2.5 h-2.5 rounded-full bg-[#59B200] border border-white shadow-[0_0_4px_rgba(89,178,0,0.5)]"></div>
               {friend.name}
            </div>
            <div className="flex gap-2.5">
               <Minus size={16} className="hover:opacity-75 transition-opacity" onClick={(e) => { e.stopPropagation(); onClose(); }} />
               <X size={16} className="hover:opacity-75 transition-opacity" onClick={(e) => { e.stopPropagation(); onClose(); }} />
            </div>
         </div>

         {/* Body */}
         <div
            className="h-[250px] overflow-y-auto p-3 bg-[var(--card-bg)] text-[12px] flex flex-col gap-3 transition-colors duration-200"
            ref={scrollRef}
         >
            {messages.length === 0 && !isFriendTyping && (
               <div className="text-[#999] text-[10px] text-center mt-6 italic">No hay mensajes anteriores</div>
            )}

            {messages.map((msg, idx) => {
               const isMe = msg.senderId === currentUser.id;
               return (
                  <div key={idx} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'} group`}>
                     <div className={`max-w-[85%] rounded-[12px] p-2 px-3 shadow-sm ${isMe ? 'bg-[#005599] text-white rounded-tr-none' : 'bg-[var(--bg-color)] text-[var(--text-main)] rounded-tl-none border border-[var(--border-soft)]'}`}>
                        <div className="leading-relaxed break-words">{msg.content}</div>
                        <div className={`flex items-center gap-1 mt-1 justify-end ${isMe ? 'text-white/70' : 'text-[#999]'}`}>
                           <span className="text-[9px]">
                              {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                           </span>
                           {isMe && (
                              <span className="flex items-center">
                                 {msg.read ? (
                                    <CheckCheck size={12} className="text-[#40ff40]" />
                                 ) : (
                                    <Check size={12} />
                                 )}
                              </span>
                           )}
                        </div>
                     </div>
                  </div>
               );
            })}
            {isFriendTyping && (
               <div className="flex items-start">
                  <div className="bg-[var(--bg-color)] rounded-[12px] rounded-tl-none p-2 px-3 flex gap-1 items-baseline transition-colors duration-200 border border-[var(--border-soft)]">
                     <span className="text-[10px] text-[#005599] italic font-bold">Escribiendo</span>
                     <motion.span animate={{ opacity: [0, 1, 0] }} transition={{ repeat: Infinity, duration: 1.5 }}>.</motion.span>
                     <motion.span animate={{ opacity: [0, 1, 0] }} transition={{ repeat: Infinity, duration: 1.5, delay: 0.3 }}>.</motion.span>
                     <motion.span animate={{ opacity: [0, 1, 0] }} transition={{ repeat: Infinity, duration: 1.5, delay: 0.6 }}>.</motion.span>
                  </div>
               </div>
            )}
         </div>

         {/* Input area */}
         <div className="p-2 border-t border-[var(--border-soft)] bg-[var(--bg-color)] transition-colors duration-200">
            <form onSubmit={handleSend} className="flex gap-2 items-center">
               <div className="relative flex-1">
                  <input
                     type="text"
                     className="w-full bg-[var(--input-bg)] text-[var(--input-text)] border border-[var(--border-color)] rounded-full py-1.5 px-3 text-[12px] focus:outline-none focus:border-[#005599] focus:ring-1 focus:ring-[#005599]/30 transition-all"
                     autoFocus
                     value={inputText}
                     onChange={handleInputChange}
                     onBlur={() => socket?.emit('stop_typing', { recipientId: friend.id, senderId: currentUser.id })}
                     placeholder="Escribe un mensaje..."
                  />
               </div>
               <button
                  type="submit"
                  disabled={!inputText.trim()}
                  className={`p-1.5 rounded-full transition-all flex items-center justify-center ${inputText.trim() ? 'bg-[#005599] text-white hover:bg-[#004488] shadow-md' : 'bg-gray-200 text-gray-400 cursor-not-allowed'}`}
               >
                  <Send size={16} />
               </button>
            </form>
         </div>
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
   const chatListRef = useRef<HTMLDivElement>(null);
   const chatTriggerRef = useRef<HTMLDivElement>(null);

   useEffect(() => {
      const handleClickOutside = (event: MouseEvent) => {
         // If click is outside both the chat list and the trigger button
         if (
            isOpen &&
            chatListRef.current &&
            !chatListRef.current.contains(event.target as Node) &&
            chatTriggerRef.current &&
            !chatTriggerRef.current.contains(event.target as Node)
         ) {
            setIsOpen(false);
         }
      };

      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
   }, [isOpen]);

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
               ref={chatTriggerRef}
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
            <div ref={chatListRef} className="fixed bottom-[30px] left-2 w-[200px] bg-[var(--card-bg)] border border-[var(--border-color)] shadow-lg rounded-t-[4px] z-40 max-h-[400px] flex flex-col transition-colors duration-200">
               <div className="bg-[var(--bg-color)] p-2 border-b border-[var(--border-soft)] flex justify-between items-center transition-colors duration-200">
                  <span className="text-[11px] font-bold text-[var(--text-main)] transition-colors duration-200">Amigos {friends.length > 0 && `(${onlineFriends.length}/${friends.length})`}</span>
                  <div className="flex gap-1">
                     <span className="text-[9px] text-[#005599] hover:underline cursor-pointer">Ajustes</span>
                  </div>
               </div>
               <div className="overflow-y-auto p-1 flex-1 h-[300px]">
                  <input type="text" placeholder="Buscar amigo" className="w-full text-[11px] p-1 bg-[var(--input-bg)] text-[var(--input-text)] border border-[var(--border-color)] rounded-[2px] mb-2 focus:outline-none transition-colors" />
                  {friends.length > 0 ? friends.map(friend => {
                     const isOnline = onlineUserIds.includes(friend.id);
                     return (
                        <div
                           key={friend.id}
                           className="flex items-center gap-2 p-1.5 hover:bg-[var(--border-soft)] cursor-pointer rounded-[2px] transition-colors duration-200"
                           onClick={() => {
                              setActiveChatUser(friend);
                           }}
                        >
                           <div className={`w-2 h-2 rounded-full ${isOnline ? 'bg-[#59B200]' : 'bg-gray-300'}`}></div>
                           <img
                              src={friend.avatar || `/api/proxy/avatar?name=${encodeURIComponent(friend.name)}`}
                              className={`w-5 h-5 rounded-sm object-cover bg-[var(--bg-color)] ${!isOnline ? 'grayscale opacity-70' : ''}`}
                              alt={friend.name}
                           />
                           <span className={`text-[11px] ${isOnline ? 'text-[var(--text-main)] font-bold' : 'text-gray-500'} truncate transition-colors duration-200`}>{friend.name}</span>
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