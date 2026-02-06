import React, { useState, useEffect } from 'react';
import { Flag, Users, FileText, PlusCircle } from 'lucide-react';
import api from '../api';
import { useAuth } from '../contexts/AuthContext';
import { Link } from 'react-router-dom';

const Pages: React.FC = () => {
    const [pages, setPages] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const { user } = useAuth();
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

    // Create form state
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [category, setCategory] = useState('Interés general');
    const [image, setImage] = useState<File | null>(null);

    useEffect(() => {
        fetchPages();
    }, []);

    const fetchPages = async () => {
        try {
            const response = await api.get('/pages');
            setPages(response.data.pages);
        } catch (error) {
            console.error('Error fetching pages:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleCreatePage = async (e: React.FormEvent) => {
        e.preventDefault();
        const formData = new FormData();
        formData.append('name', name);
        formData.append('description', description);
        formData.append('category', category);
        if (image) formData.append('image', image);

        try {
            await api.post('/pages', formData);
            setIsCreateModalOpen(false);
            fetchPages();
            // Reset form
            setName('');
            setDescription('');
            setImage(null);
        } catch (error) {
            console.error('Error creating page:', error);
            alert('Error al crear la página');
        }
    };

    return (
        <div className="flex-1 p-4 bg-[#f0f2f5] min-h-screen">
            <div className="max-w-[800px] mx-auto">
                <div className="flex justify-between items-center mb-6 bg-white p-4 rounded-sm border border-[#ccc] shadow-sm">
                    <div className="flex items-center gap-2">
                        <Flag className="text-[#2B7BB9]" size={24} />
                        <h1 className="text-xl font-bold text-[#333]">Páginas</h1>
                    </div>
                    <button
                        onClick={() => setIsCreateModalOpen(true)}
                        className="bg-[#2B7BB9] text-white px-4 py-1 rounded-[3px] text-[12px] font-bold hover:bg-[#256ca3] flex items-center gap-1"
                    >
                        <PlusCircle size={14} /> Crear Página
                    </button>
                </div>

                {isLoading ? (
                    <div className="text-center py-10 opacity-50">Cargando páginas...</div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {pages.map((page) => (
                            <Link
                                to={`/pages/${page.id}`}
                                key={page.id}
                                className="bg-white p-3 rounded-sm border border-[#ccc] shadow-sm hover:border-[#2B7BB9] transition-colors flex gap-4"
                            >
                                <div className="w-16 h-16 bg-[#eee] rounded-md overflow-hidden flex-shrink-0 border border-[#ddd]">
                                    {page.image ? (
                                        <img src={page.image} alt={page.name} className="w-full h-full object-cover" />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center text-[#999]">
                                            <Flag size={24} />
                                        </div>
                                    )}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <h3 className="font-bold text-[#2B7BB9] truncate">{page.name}</h3>
                                    <p className="text-[11px] text-[#888] mb-1">{page.category}</p>
                                    <p className="text-[12px] text-[#555] line-clamp-2 leading-tight">
                                        {page.description || 'Sin descripción'}
                                    </p>
                                    <div className="mt-2 flex items-center gap-1 text-[10px] text-[#999]">
                                        <Users size={12} /> {page._count?.followers || 0} seguidores
                                    </div>
                                </div>
                            </Link>
                        ))}
                    </div>
                )}

                {pages.length === 0 && !isLoading && (
                    <div className="text-center py-20 bg-white border border-dashed border-[#ccc] rounded-sm text-[#999]">
                        Aún no hay páginas creadas. ¡Sé el primero en crear una!
                    </div>
                )}
            </div>

            {/* Create Modal */}
            {isCreateModalOpen && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white w-full max-w-[450px] rounded-sm shadow-xl p-6 border-t-4 border-[#2B7BB9]">
                        <h2 className="text-xl font-bold mb-4">Nueva Página</h2>
                        <form onSubmit={handleCreatePage} className="flex flex-col gap-4">
                            <div>
                                <label className="block text-[12px] font-bold text-[#555] mb-1">Nombre de la página</label>
                                <input
                                    type="text"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    className="w-full border border-[#ccc] p-2 rounded-[3px] text-[13px] outline-none focus:border-[#2B7BB9]"
                                    placeholder="Nombre de la banda, marca o comunidad"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-[12px] font-bold text-[#555] mb-1">Categoría</label>
                                <select
                                    value={category}
                                    onChange={(e) => setCategory(e.target.value)}
                                    className="w-full border border-[#ccc] p-2 rounded-[3px] text-[13px] outline-none focus:border-[#2B7BB9]"
                                >
                                    <option>Interés general</option>
                                    <option>Música / Banda</option>
                                    <option>Deportes</option>
                                    <option>Tecnología</option>
                                    <option>Humor</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-[12px] font-bold text-[#555] mb-1">Descripción</label>
                                <textarea
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                    className="w-full border border-[#ccc] p-2 rounded-[3px] text-[13px] outline-none focus:border-[#2B7BB9] h-24 resize-none"
                                    placeholder="De qué trata tu página..."
                                />
                            </div>
                            <div>
                                <label className="block text-[12px] font-bold text-[#555] mb-1">Imagen de perfil</label>
                                <input
                                    type="file"
                                    onChange={(e) => setImage(e.target.files?.[0] || null)}
                                    className="text-[12px]"
                                    accept="image/*"
                                />
                            </div>
                            <div className="flex justify-end gap-3 mt-4">
                                <button
                                    type="button"
                                    onClick={() => setIsCreateModalOpen(false)}
                                    className="text-[13px] text-[#888] hover:underline"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    className="bg-[#2B7BB9] text-white px-6 py-2 rounded-[3px] font-bold hover:bg-[#256ca3]"
                                >
                                    Crear Página
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Pages;
