import React, { useState, useEffect } from 'react';
import { UserPlus, Plus, X } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import api from '../api';

interface InvitationsProps {
    compact?: boolean;
}

const Invitations: React.FC<InvitationsProps> = ({ compact = false }) => {
    const { user, updateUser } = useAuth();
    const { showToast } = useToast();
    const [inviteEmail, setInviteEmail] = useState('');
    const [isInviting, setIsInviting] = useState(false);
    const [myInvitations, setMyInvitations] = useState<any[]>([]);
    const [isInvitesExpanded, setIsInvitesExpanded] = useState(false);

    const fetchInvitations = async () => {
        try {
            const res = await api.get('/invitations/my');
            setMyInvitations(res.data.invitations);
        } catch (error) {
            console.error("Error fetching invitations:", error);
        }
    };

    useEffect(() => {
        fetchInvitations();
    }, []);

    const handleSendInvite = async () => {
        if (!inviteEmail.trim()) return;
        setIsInviting(true);
        try {
            const res = await api.post('/invitations/generate', { email: inviteEmail });
            showToast(res.data.message || "Invitación enviada", "success");

            const userRes = await api.get('/auth/me');
            updateUser(userRes.data.user);

            setInviteEmail('');
            fetchInvitations();
        } catch (e: any) {
            showToast(e.response?.data?.error || "Error al generar invitación", "error");
        } finally {
            setIsInviting(false);
        }
    };

    return (
        <div className={`${compact ? 'p-0' : 'mb-6 p-4 md:p-6'} bg-white/5 border border-white/10 rounded-2xl transition-colors duration-200 backdrop-blur-sm`}>
            <div
                className={`flex items-center justify-between ${window.innerWidth < 768 ? 'cursor-pointer' : 'md:cursor-default'}`}
                onClick={() => { if (window.innerWidth < 768) setIsInvitesExpanded(!isInvitesExpanded); }}
            >
                <h4 className={`font-extrabold text-white ${compact ? 'text-[13px]' : 'text-[13px] md:text-[15px]'} flex items-center gap-2 uppercase tracking-wider transition-colors duration-200`}>
                    <UserPlus size={compact ? 16 : 18} className="text-[var(--accent)]" />
                    <span>Invitaciones</span>
                </h4>
                <div className="flex items-center gap-2">
                    <div className="bg-[var(--accent)] text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-lg shadow-[var(--accent)]/20">
                        {user?.invitationsCount || 0}
                    </div>
                    {!compact && (
                        <div className="md:hidden text-gray-400">
                            {isInvitesExpanded ? <X size={18} /> : <Plus size={18} />}
                        </div>
                    )}
                </div>
            </div>

            <div className={`${(isInvitesExpanded || compact) ? 'block' : 'hidden'} md:block mt-3 animate-in fade-in slide-in-from-top-2 duration-300`}>
                <div className={`flex ${compact ? 'flex-col' : 'flex-col sm:flex-row'} gap-2`}>
                    <input
                        type="email"
                        placeholder="Email de tu amigo..."
                        className="flex-1 p-3 text-sm border border-white/10 rounded-xl bg-white/5 text-white outline-none focus:border-[var(--accent)] focus:ring-4 focus:ring-[var(--accent)]/20 transition-all"
                        value={inviteEmail}
                        onChange={(e) => setInviteEmail(e.target.value)}
                    />
                    <button
                        disabled={isInviting || !inviteEmail.trim() || (user?.invitationsCount || 0) <= 0}
                        onClick={handleSendInvite}
                        className="bg-gradient-to-tr from-[var(--accent)] to-violet-500 text-white font-bold text-sm px-6 py-3 rounded-xl hover:shadow-[0_0_15px_rgba(var(--accent-rgb),0.4)] disabled:opacity-50 transition-all active:scale-95 shadow-lg"
                    >
                        {isInviting ? '...' : (user?.invitationsCount || 0) <= 0 ? 'Sin cupo' : 'Enviar'}
                    </button>
                </div>

                {myInvitations.length > 0 && (
                    <div className="mt-4 flex gap-2 overflow-x-auto no-scrollbar pb-1">
                        {myInvitations.slice(0, compact ? 3 : 6).map(inv => (
                            <div key={inv.id} className="shrink-0 bg-white/5 border border-white/10 px-3 py-1 rounded-lg text-[11px] flex items-center gap-2 transition-colors duration-200">
                                <span className={`font-mono font-bold ${inv.used ? 'text-gray-500 line-through' : 'text-[var(--accent)]'}`}>
                                    {inv.code}
                                </span>
                                {inv.used && <span className="text-[9px] text-gray-500 italic">Usado</span>}
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default Invitations;
