import React from 'react';
import { Mail, MessageSquare, BarChart2, UserPlus } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import api from '../api';
import { motion } from 'framer-motion';

const MenuItem = ({ icon: Icon, count, text }: { icon: any, count: number, text: string }) => (
   <div className="flex items-center gap-2 mb-1 cursor-pointer group">
      <Icon size={14} className="text-[var(--accent)] fill-[var(--accent)]" strokeWidth={2} />
      <span className="text-[11px] font-bold text-[var(--accent)] group-hover:underline">
         {count} {text}
      </span>
   </div>
);

const LeftPanel: React.FC = () => {
   const { user, updateUser } = useAuth();
   const { showToast } = useToast();
   const [stats, setStats] = React.useState({
      messages: 0,
      statusComments: 0,
      visits: 0,
      requests: 0,
      friends: 0,
      posts: 0,
      photos: 0
   });
   const [recentVisitors, setRecentVisitors] = React.useState<any[]>([]);
   const [events, setEvents] = React.useState<any[]>([]);
   const [isLoading, setIsLoading] = React.useState(true);

   /* fetchInvitations moved to Feed */

   const [pendingRequests, setPendingRequests] = React.useState<any[]>([]);

   const fetchData = async () => {
      try {
         const [statsRes, eventsRes, requestsRes] = await Promise.all([
            api.get('/stats'),
            api.get('/events'),
            api.get('/friendships/requests')
         ]);
         setStats(prev => ({
            ...prev,
            visits: statsRes.data.visits,
            requests: statsRes.data.requests,
            friends: statsRes.data.friends,
            posts: user?._count?.posts || 0,
            photos: user?._count?.photos || 0,
         }));

         setPendingRequests(requestsRes.data.requests);

         const visitorsRes = await api.get('/visitors');
         setRecentVisitors(visitorsRes.data.visitors);

         setEvents(eventsRes.data.events);
      } catch (error) {
         console.error("Error fetching data:", error);
      } finally {
         setIsLoading(false);
      }
   };

   React.useEffect(() => {
      if (user) {
         fetchData();
      }
   }, [user]);

   const handleAcceptFriend = async (friendshipId: number) => {
      try {
         await api.put(`/friendships/${friendshipId}/accept`);
         showToast("Solicitud aceptada", "success");
         fetchData();
      } catch (error) {
         showToast("Error al aceptar", "error");
      }
   };

   const handleRejectFriend = async (friendshipId: number) => {
      try {
         await api.put(`/friendships/${friendshipId}/reject`);
         showToast("Solicitud rechazada", "info");
         fetchData();
      } catch (error) {
         showToast("Error al rechazar", "error");
      }
   };

   const getAvatarUrl = (avatar?: string | null, name?: string, lastName?: string) => {
      if (!avatar) return `https://ui-avatars.com/api/?name=${name || ''}+${lastName || ''}&background=random`;
      if (avatar && avatar.startsWith('http')) return avatar;
      return `${import.meta.env.VITE_API_URL?.replace('/api', '')}${avatar}`;
   };

   return (
      <motion.div
         initial={{ opacity: 0, x: -20 }}
         animate={{ opacity: 1, x: 0 }}
         className="flex flex-col gap-4"
      >
         {/* Profile Summary */}
         <div className="flex gap-3">
            <div className="bg-[var(--card-bg)] p-1 border border-[var(--border-color)] shadow-sm transition-colors duration-200">
               <img
                  src={getAvatarUrl(user?.avatar)}
                  alt="Profile"
                  className="w-[120px] h-[120px] object-cover"
               />
            </div>
         </div>

         <div className="mb-4">
            <div className="flex flex-col gap-1 mb-1">
               <div className="flex items-center gap-2 group cursor-pointer" onClick={() => (window as any).location.href = '/people'}>
                  <UserPlus size={14} className="text-[var(--accent)] fill-[var(--accent)]" strokeWidth={2} />
                  <span className="text-[11px] font-bold text-[var(--accent)] group-hover:underline">
                     {stats.requests > 0 ? `${stats.requests} petición de amistad` : '0 peticiones'}
                  </span>
               </div>

               {/* Pending Requests List in Sidebar */}
               {pendingRequests.length > 0 && (
                  <div className="ml-5 flex flex-col gap-2 mt-1 mb-3">
                     {pendingRequests.map(req => (
                        <div key={req.id} className="bg-[var(--card-bg)] border border-[var(--border-color)] p-1.5 rounded-xl shadow-sm flex flex-col gap-1 transition-colors duration-200">
                           <div className="flex items-center gap-1.5">
                              <img
                                 src={getAvatarUrl(req.user.avatar, req.user.name, req.user.lastName)}
                                 className="w-4 h-4 rounded-full object-cover"
                              />
                              <span className="text-[9px] font-bold text-[var(--text-main)] truncate">{req.user.name}</span>
                           </div>
                           <div className="flex gap-1">
                              <button
                                 onClick={() => handleAcceptFriend(req.id)}
                                 className="flex-1 bg-[var(--accent)] text-white text-[8px] font-bold py-0.5 rounded-lg hover:bg-[#4a9600]"
                              >
                                 Aceptar
                              </button>
                              <button
                                 onClick={() => handleRejectFriend(req.id)}
                                 className="flex-1 bg-[var(--card-bg)] text-[#cc0000] border border-[#ff3333]/30 text-[8px] font-bold py-0.5 rounded-lg hover:bg-red-900/10 transition-colors"
                              >
                                 Rechazar
                              </button>
                           </div>
                        </div>
                     ))}
                  </div>
               )}
            </div>

            <MenuItem icon={MessageSquare} count={stats.statusComments} text="estado con comentarios" />
            <div className="flex flex-col">
               <MenuItem icon={BarChart2} count={stats.visits} text="visitas nuevas" />
               {recentVisitors.length > 0 && (
                  <div className="flex -space-x-1.5 overflow-hidden ml-5 mt-0.5">
                     {recentVisitors.slice(0, 6).map((visitor, idx) => (
                        <img
                           key={visitor.id}
                           src={getAvatarUrl(visitor.avatar, visitor.name, visitor.lastName)}
                           className="inline-block h-6 w-6 rounded-full ring-1 ring-[var(--card-bg)] object-cover shadow-sm cursor-pointer hover:scale-110 transition-transform"
                           alt={visitor.name}
                           style={{ zIndex: 10 - idx }}
                           onClick={() => window.location.href = `/profile/${visitor.id}`}
                           onError={(e) => {
                              (e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${visitor.name}+${visitor.lastName}&background=random`;
                           }}
                        />
                     ))}
                     {recentVisitors.length > 6 && (
                        <div className="flex items-center justify-center h-6 w-6 rounded-full bg-[var(--border-soft)] ring-1 ring-[var(--border-color)] text-[8px] font-bold text-gray-500 z-0 shadow-sm transition-colors duration-200">
                           +{recentVisitors.length - 6}
                        </div>
                     )}
                  </div>
               )}
            </div>
         </div>

         {/* Invite Friends section moved to Feed */}

         {/* Sponsored Events */}
         <div className="mb-6">
            <h4 className="font-bold text-[var(--text-main)] text-[11px] mb-2 border-b border-[var(--border-soft)] pb-1 transition-colors duration-200">Eventos</h4>
            <div className="flex flex-col gap-3">
               {events.length > 0 ? events.map(event => (
                  <div key={event.id} className="flex gap-2">
                     <div className="w-8 h-8 bg-gray-200 rounded-sm shrink-0 flex items-center justify-center text-[8px] font-bold text-gray-500 uppercase overflow-hidden">
                        {event.image ? <img src={event.image} className="w-full h-full object-cover" /> : 'EVENT'}
                     </div>
                     <div>
                        <div className="text-[10px] text-[var(--text-secondary)] font-bold hover:underline cursor-pointer leading-tight">{event.title}</div>
                        <div className="text-[9px] text-[#999]">
                           {new Date(event.date).toLocaleDateString(undefined, { day: 'numeric', month: 'short' })} ({event._count.attendees})
                        </div>
                     </div>
                  </div>
               )) : (
                  <div className="text-[9px] text-gray-400">No hay eventos próximos</div>
               )}
            </div>
         </div>

         {/* Calendar */}
         <div className="mb-4">
            <h4 className="font-bold text-[var(--text-main)] text-[11px] mb-2 border-b border-[var(--border-soft)] pb-1 flex justify-between items-center transition-colors duration-200">
               <span>Calendario</span>
               <span
                  className="text-[var(--text-secondary)] text-[9px] font-normal hover:underline cursor-pointer"
                  onClick={() => alert("Función de crear evento en desarrollo.")}
               >
                  Crear evento
               </span>
            </h4>
            {(() => {
               const today = new Date();
               const tomorrow = new Date(today);
               tomorrow.setDate(today.getDate() + 1);

               const todayEvents = events.filter(e => new Date(e.date).toDateString() === today.toDateString());
               const tomorrowEvents = events.filter(e => new Date(e.date).toDateString() === tomorrow.toDateString());

               return (
                  <>
                     <div className="text-[10px] text-[var(--text-main)] mb-1 transition-colors duration-200">
                        <span className="font-bold">Hoy</span> {todayEvents.length > 0 ? todayEvents[0].title : 'no tienes ningún evento.'}
                     </div>
                     <div className="text-[10px] text-[var(--text-main)] transition-colors duration-200">
                        <span className="font-bold">Mañana</span> {tomorrowEvents.length > 0 ? tomorrowEvents[0].title : 'no tienes ningún evento.'}
                     </div>
                  </>
               );
            })()}
            <div className="mt-2 text-[var(--text-secondary)] text-[10px] hover:underline cursor-pointer">
               Ver todos
            </div>
         </div>
      </motion.div>
   );
};

export default LeftPanel;