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
        <div className={`${compact ? 'p-2' : 'mb-6 p-2 md:p-3'} bg-[#f9fbfd] border border-[#dce5ed] rounded-[4px] shadow-sm overflow-hidden`}>
            <div
                className={`flex items-center justify-between ${window.innerWidth < 768 ? 'cursor-pointer' : 'md:cursor-default'}`}
                onClick={() => { if (window.innerWidth < 768) setIsInvitesExpanded(!isInvitesExpanded); }}
            >
                <h4 className={`font-bold text-[#333] ${compact ? 'text-[11px]' : 'text-[11px] md:text-[12px]'} flex items-center gap-1.5 uppercase tracking-wide`}>
                    <UserPlus size={compact ? 12 : 14} className="text-[#59B200]" />
                    <span>Invitaciones</span>
                </h4>
                <div className="flex items-center gap-1 md:gap-2">
                    <div className="bg-[#59B200] text-white text-[9px] font-bold px-1 py-0.5 rounded-[2px] whitespace-nowrap">
                        {user?.invitationsCount || 0}
                    </div>
                    {!compact && (
                        <div className="md:hidden text-gray-400">
                            {isInvitesExpanded ? <X size={14} /> : <Plus size={14} />}
                        </div>
                    )}
                </div>
            </div>

            <div className={`${(isInvitesExpanded || compact) ? 'block' : 'hidden'} md:block mt-3 animate-in fade-in slide-in-from-top-2 duration-300`}>
                <div className={`flex ${compact ? 'flex-col' : 'flex-col sm:flex-row'} gap-2`}>
                    <input
                        type="email"
                        placeholder="Email de tu amigo..."
                        className="flex-1 p-1.5 md:p-2 text-[11px] md:text-[12px] border border-[#ccc] rounded-[2px] bg-white outline-none focus:border-[#2B7BB9]"
                        value={inviteEmail}
                        onChange={(e) => setInviteEmail(e.target.value)}
                    />
                    <button
                        disabled={isInviting || !inviteEmail.trim() || (user?.invitationsCount || 0) <= 0}
                        onClick={handleSendInvite}
                        className="bg-[#59B200] text-white font-bold text-[10px] md:text-[11px] px-3 py-1.5 rounded-[2px] border border-[#4a9600] hover:bg-[#4a9600] disabled:opacity-50 transition-all active:scale-95 shadow-sm truncate"
                    >
                        {isInviting ? '...' : (user?.invitationsCount || 0) <= 0 ? 'Sin cupo' : 'Enviar'}
                    </button>
                </div>

                {myInvitations.length > 0 && (
                    <div className="mt-3 flex gap-2 overflow-x-auto no-scrollbar pb-1">
                        {myInvitations.slice(0, compact ? 3 : 5).map(inv => (
                            <div key={inv.id} className="shrink-0 bg-white border border-[#eee] px-2 py-0.5 rounded-[2px] text-[9px] md:text-[10px] flex items-center gap-1.5">
                                <span className={`font-mono font-bold ${inv.used ? 'text-gray-300 line-through' : 'text-[#59B200]'}`}>
                                    {inv.code}
                                </span>
                                {inv.used && <span className="text-[8px] text-gray-400 italic">Usado</span>}
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default Invitations;
