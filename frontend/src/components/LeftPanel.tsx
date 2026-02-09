import React from 'react';
import { Mail, MessageSquare, BarChart2, UserPlus } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import api from '../api';
import { motion } from 'framer-motion';

const MenuItem = ({ icon: Icon, count, text }: { icon: any, count: number, text: string }) => (
   <div className="flex items-center gap-3 mb-2 cursor-pointer group hover:bg-[var(--accent)]/5 p-2 rounded-xl transition-all active:scale-95">
      <div className="w-8 h-8 flex items-center justify-center bg-[var(--accent)]/10 rounded-lg group-hover:bg-[var(--accent)] group-hover:text-white transition-all">
         <Icon size={18} strokeWidth={2.5} />
      </div>
      <span className="text-[14px] font-bold text-[var(--accent)] group-hover:translate-x-1 transition-transform">
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
         <div className="flex flex-col gap-4">
            <div className="bg-[var(--card-bg)] p-1.5 border border-[var(--border-color)] shadow-xl transition-all duration-300 rounded-3xl overflow-hidden group">
               <img
                  src={getAvatarUrl(user?.avatar)}
                  alt="Profile"
                  className="w-full aspect-square object-cover rounded-2xl group-hover:scale-105 transition-transform duration-500"
               />
            </div>
            <div className="px-1 text-center md:text-left">
               <h3 className="font-extrabold text-[var(--text-main)] text-[18px] leading-tight mb-1 truncate">{user?.name} {user?.lastName}</h3>
               <p className="text-[12px] text-[var(--text-muted)] italic line-clamp-2">"{user?.status || 'Sin estado'}"</p>
            </div>
         </div>

         <div className="mb-4">
            <div className="flex flex-col gap-1 mb-1">
               <div className="flex items-center gap-3 group cursor-pointer p-2 hover:bg-[var(--accent)]/5 rounded-xl transition-all" onClick={() => (window as any).location.href = '/people'}>
                  <div className="w-8 h-8 flex items-center justify-center bg-[var(--accent)]/10 text-[var(--accent)] rounded-lg group-hover:bg-[var(--accent)] group-hover:text-white transition-all">
                     <UserPlus size={18} strokeWidth={2.5} />
                  </div>
                  <span className="text-[14px] font-bold text-[var(--accent)]">
                     {stats.requests > 0 ? `${stats.requests} peticiones` : '0 peticiones'}
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
         <div className="mb-6 bg-[var(--card-bg)]/50 p-3 rounded-2xl border border-[var(--border-soft)]">
            <h4 className="font-extrabold text-[var(--text-main)] text-[13px] mb-3 border-b border-[var(--border-soft)] pb-2 transition-colors duration-200 uppercase tracking-wider">Eventos</h4>
            <div className="flex flex-col gap-4">
               {events.length > 0 ? events.map(event => (
                  <div key={event.id} className="flex gap-3 group cursor-pointer">
                     <div className="w-10 h-10 bg-[var(--accent)]/10 rounded-xl shrink-0 flex items-center justify-center text-[10px] font-bold text-[var(--accent)] uppercase overflow-hidden group-hover:scale-110 transition-transform">
                        {event.image ? <img src={event.image} className="w-full h-full object-cover" /> : <BarChart2 size={16} />}
                     </div>
                     <div className="flex-1 min-w-0">
                        <div className="text-[12px] text-[var(--text-main)] font-bold group-hover:text-[var(--accent)] transition-colors leading-tight truncate">{event.title}</div>
                        <div className="text-[10px] text-[var(--text-muted)] mt-0.5">
                           {new Date(event.date).toLocaleDateString(undefined, { day: 'numeric', month: 'short' })} • {event._count.attendees} asistiendo
                        </div>
                     </div>
                  </div>
               )) : (
                  <div className="text-[11px] text-[var(--text-muted)] italic py-2">No hay eventos próximos</div>
               )}
            </div>
         </div>

         {/* Calendar */}
         <div className="mb-4 bg-[var(--card-bg)]/50 p-3 rounded-2xl border border-[var(--border-soft)]">
            <h4 className="font-extrabold text-[var(--text-main)] text-[13px] mb-3 border-b border-[var(--border-soft)] pb-2 flex justify-between items-center transition-colors duration-200 uppercase tracking-wider">
               <span>Calendario</span>
               <button
                  className="bg-[var(--accent)]/10 text-[var(--accent)] text-[9px] px-2 py-1 rounded-lg hover:bg-[var(--accent)] hover:text-white transition-all font-bold"
                  onClick={() => showToast("Función de crear evento en desarrollo.", "info")}
               >
                  CREAR
               </button>
            </h4>
            {(() => {
               const today = new Date();
               const tomorrow = new Date(today);
               tomorrow.setDate(today.getDate() + 1);

               const todayEvents = events.filter(e => new Date(e.date).toDateString() === today.toDateString());
               const tomorrowEvents = events.filter(e => new Date(e.date).toDateString() === tomorrow.toDateString());

               return (
                  <div className="flex flex-col gap-2">
                     <div className="text-[11px] text-[var(--text-main)] leading-relaxed">
                        <span className="font-bold text-[var(--accent)] uppercase text-[9px] mr-1">Hoy:</span>
                        {todayEvents.length > 0 ? todayEvents[0].title : <span className="text-[var(--text-muted)]">Sin eventos.</span>}
                     </div>
                     <div className="text-[11px] text-[var(--text-main)] leading-relaxed">
                        <span className="font-bold text-[var(--accent)] uppercase text-[9px] mr-1">Mañana:</span>
                        {tomorrowEvents.length > 0 ? tomorrowEvents[0].title : <span className="text-[var(--text-muted)]">Nada planeado.</span>}
                     </div>
                  </div>
               );
            })()}
            <button className="mt-3 w-full text-center text-[var(--text-secondary)] text-[11px] font-bold hover:underline py-1">
               Ver todos los días
            </button>
         </div>
      </motion.div>
   );
};

export default LeftPanel;