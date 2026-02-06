import React, { useState, useEffect } from 'react';
import { Search, Filter, User as UserIcon, MapPin, Briefcase } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import api from '../api';
import { User } from '../types';
import { motion, AnimatePresence } from 'framer-motion';

const People: React.FC = () => {
    const navigate = useNavigate();
    const [users, setUsers] = useState<User[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchQ, setSearchQ] = useState('');
    const [filters, setFilters] = useState({
        gender: '',
        location: '',
        ageMin: '',
        ageMax: ''
    });

    const fetchUsers = async () => {
        setIsLoading(true);
        try {
            const params = new URLSearchParams();
            if (searchQ) params.append('q', searchQ);
            if (filters.gender) params.append('gender', filters.gender);
            if (filters.location) params.append('location', filters.location);
            if (filters.ageMin) params.append('ageMin', filters.ageMin);
            if (filters.ageMax) params.append('ageMax', filters.ageMax);

            const res = await api.get(`/users/search?${params.toString()}`);
            setUsers(res.data.users);
        } catch (e) {
            console.error("Fetch users error:", e);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        const timeoutId = setTimeout(fetchUsers, 500);
        return () => clearTimeout(timeoutId);
    }, [searchQ, filters]);

    const handleNavigate = (id: number) => {
        navigate(`/profile/${id}`);
    };

    return (
        <div className="flex flex-col md:flex-row gap-4 p-3 md:p-0">
            {/* Left Column: Filters */}
            <aside className="w-full md:w-[200px] shrink-0">
                <div className="bg-white border border-[#dce5ed] rounded-[4px] shadow-sm overflow-hidden">
                    <div className="bg-[#f2f6f9] border-b border-[#dce5ed] p-2 flex items-center gap-2">
                        <Filter size={14} className="text-[#333]" />
                        <span className="text-[11px] font-bold text-[#333]">Filtros de búsqueda</span>
                    </div>
                    <div className="p-3 flex flex-col gap-4">
                        {/* Gender */}
                        <div>
                            <label className="block text-[10px] font-bold text-[#666] uppercase mb-1">Sexo</label>
                            <select
                                className="w-full border border-[#ccc] rounded-[2px] p-1 text-[11px] bg-white"
                                value={filters.gender}
                                onChange={(e) => setFilters({ ...filters, gender: e.target.value })}
                            >
                                <option value="">Todos</option>
                                <option value="Hombre">Chicos</option>
                                <option value="Mujer">Chicas</option>
                            </select>
                        </div>

                        {/* Location */}
                        <div>
                            <label className="block text-[10px] font-bold text-[#666] uppercase mb-1">Localidad</label>
                            <div className="relative">
                                <MapPin size={10} className="absolute left-1.5 top-2 text-gray-400" />
                                <input
                                    type="text"
                                    className="w-full border border-[#ccc] rounded-[2px] py-1 pl-5 pr-1 text-[11px]"
                                    placeholder="Ej: Madrid"
                                    value={filters.location}
                                    onChange={(e) => setFilters({ ...filters, location: e.target.value })}
                                />
                            </div>
                        </div>

                        {/* Age Range */}
                        <div>
                            <label className="block text-[10px] font-bold text-[#666] uppercase mb-1">Edad</label>
                            <div className="flex items-center gap-1">
                                <input
                                    type="number"
                                    placeholder="Min"
                                    className="w-full border border-[#ccc] rounded-[2px] p-1 text-[11px]"
                                    value={filters.ageMin}
                                    onChange={(e) => setFilters({ ...filters, ageMin: e.target.value })}
                                />
                                <span className="text-gray-400">-</span>
                                <input
                                    type="number"
                                    placeholder="Max"
                                    className="w-full border border-[#ccc] rounded-[2px] p-1 text-[11px]"
                                    value={filters.ageMax}
                                    onChange={(e) => setFilters({ ...filters, ageMax: e.target.value })}
                                />
                            </div>
                        </div>

                        <button
                            onClick={() => {
                                setFilters({ gender: '', location: '', ageMin: '', ageMax: '' });
                                setSearchQ('');
                            }}
                            className="bg-white text-[#cc0000] border border-[#ffcccc] py-1 rounded-[2px] text-[10px] font-bold hover:bg-[#fff5f5] transition-colors"
                        >
                            Limpiar filtros
                        </button>
                    </div>
                </div>
            </aside>

            {/* Main Column: Results */}
            <main className="flex-1 min-w-0">
                <div className="bg-white border border-[#dce5ed] rounded-[4px] shadow-sm">
                    <div className="p-3 border-b border-[#eee] flex items-center justify-between gap-4">
                        <h2 className="text-[#59B200] font-bold text-[14px] flex items-center gap-1 shrink-0">
                            Gente en Twentty
                        </h2>
                        <div className="relative flex-1 max-w-[300px]">
                            <input
                                type="text"
                                className="w-full border border-[#ccc] rounded-[2px] py-1 pl-7 pr-2 text-[12px] placeholder-gray-300"
                                placeholder="Buscar por nombre..."
                                value={searchQ}
                                onChange={(e) => setSearchQ(e.target.value)}
                            />
                            <Search size={14} className="absolute left-2 top-1.5 text-gray-400" />
                        </div>
                    </div>

                    <div className="p-3">
                        {isLoading ? (
                            <div className="p-8 text-center text-[12px] text-gray-400">Buscando personas...</div>
                        ) : users.length === 0 ? (
                            <div className="p-12 text-center">
                                <p className="text-[13px] text-gray-500 mb-2">No hemos encontrado a nadie con esos criterios.</p>
                                <p className="text-[11px] text-[#005599] cursor-pointer hover:underline" onClick={() => { setFilters({ gender: '', location: '', ageMin: '', ageMax: '' }); setSearchQ(''); }}>Mostrar a todo el mundo</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <AnimatePresence mode="popLayout">
                                    {users.map((u, idx) => (
                                        <motion.div
                                            key={u.id}
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: (idx % 20) * 0.03 }}
                                            className="flex gap-3 p-2 border border-transparent hover:border-[#dce5ed] hover:bg-[#f9fbfd] rounded-[3px] cursor-pointer group transition-all"
                                            onClick={() => handleNavigate(u.id)}
                                        >
                                            <div className="w-[60px] h-[60px] shrink-0 bg-white border border-[#ccc] p-[1px] shadow-sm">
                                                <img
                                                    src={u.avatar || `https://ui-avatars.com/api/?name=${u.name}`}
                                                    alt={u.name}
                                                    className="w-full h-full object-cover rounded-[2px]"
                                                />
                                            </div>
                                            <div className="flex-1 min-w-0 flex flex-col justify-center">
                                                <div className="text-[13px] font-bold text-[#005599] group-hover:underline truncate">{u.name}</div>
                                                <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 mt-0.5">
                                                    {u.age && (
                                                        <span className="text-[10px] text-[#333] font-bold">{u.age} años</span>
                                                    )}
                                                    {u.location && (
                                                        <span className="text-[10px] text-gray-500 flex items-center gap-0.5 truncate">
                                                            <MapPin size={8} /> {u.location}
                                                        </span>
                                                    )}
                                                </div>
                                                {u.occupation && (
                                                    <div className="text-[10px] text-gray-400 flex items-center gap-0.5 mt-0.5 truncate italic">
                                                        <Briefcase size={8} /> {u.occupation}
                                                    </div>
                                                )}
                                            </div>
                                            <div className="self-center opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button className="bg-[#59B200] text-white p-1 rounded-full shadow-sm">
                                                    <UserIcon size={12} fill="white" strokeWidth={0} />
                                                </button>
                                            </div>
                                        </motion.div>
                                    ))}
                                </AnimatePresence>
                            </div>
                        )}
                    </div>
                </div>
            </main>
        </div>
    );
};

export default People;
