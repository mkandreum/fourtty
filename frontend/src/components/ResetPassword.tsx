import React, { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Lock, ArrowLeft, CheckCircle, ShieldCheck } from 'lucide-react';
import api from '../api';

const ResetPassword: React.FC = () => {
    const { token } = useParams<{ token: string }>();
    const navigate = useNavigate();

    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (password.length < 6) {
            setError('La contraseña debe tener al menos 6 caracteres.');
            return;
        }

        if (password !== confirmPassword) {
            setError('Las contraseñas no coinciden.');
            return;
        }

        setIsLoading(true);

        try {
            await api.post('/auth/reset-password', { token, password });
            setIsSuccess(true);
            // Auto redirect after 3 seconds
            setTimeout(() => {
                navigate('/login');
            }, 3000);
        } catch (err: any) {
            if (err.response && err.response.data && err.response.data.error) {
                setError(err.response.data.error);
            } else {
                setError('El enlace de recuperación es inválido o ha expirado.');
            }
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex flex-col font-sans bg-gradient-to-br from-slate-900 via-violet-900 to-slate-900 relative overflow-hidden">
            <div className="flex-1 flex items-center justify-center p-4">
                <div className="max-w-md w-full bg-[var(--card-bg)] rounded-xl-[2.5rem] shadow-2xl ring-1 ring-white/10 backdrop-blur-2xl overflow-hidden animate-in fade-in zoom-in duration-300 border border-[var(--border-color)] transition-colors duration-200">
                    <div className="bg-gradient-to-r from-violet-600 to-indigo-600 p-6 text-center text-white">
                        <h1 className="text-3xl font-bold tracking-tighter">fourtty</h1>
                        <p className="mt-2 opacity-80 text-sm italic">Seguridad primero</p>
                    </div>

                    <div className="p-8">
                        {!isSuccess ? (
                            <>
                                <h2 className="text-xl font-bold text-[var(--text-main)] mb-6 text-center transition-colors duration-200">Elige tu nueva contraseña</h2>

                                {error && (
                                    <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl mb-6 text-xs">
                                        {error}
                                    </div>
                                )}

                                <form onSubmit={handleSubmit} className="space-y-6">
                                    <div>
                                        <label className="block text-xs font-bold text-gray-400 mb-1 ml-1 uppercase tracking-wider transition-colors duration-200">Nueva Contraseña</label>
                                        <div className="relative">
                                            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 w-4 h-4" />
                                            <input
                                                type="password"
                                                value={password}
                                                onChange={(e) => setPassword(e.target.value)}
                                                className="w-full pl-10 pr-4 py-2 bg-[var(--input-bg)] text-[var(--input-text)] border border-[var(--border-color)] rounded-xl text-sm outline-none focus:ring-2 focus:ring-violet-500/20 transition-all"
                                                placeholder="Mínimo 6 caracteres"
                                                required
                                            />
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-xs font-bold text-gray-400 mb-1 ml-1 uppercase tracking-wider transition-colors duration-200">Repite Contraseña</label>
                                        <div className="relative">
                                            <ShieldCheck className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 w-4 h-4" />
                                            <input
                                                type="password"
                                                value={confirmPassword}
                                                onChange={(e) => setConfirmPassword(e.target.value)}
                                                className="w-full pl-10 pr-4 py-2 bg-[var(--input-bg)] text-[var(--input-text)] border border-[var(--border-color)] rounded-xl text-sm outline-none focus:ring-2 focus:ring-violet-500/20 transition-all"
                                                placeholder="********"
                                                required
                                            />
                                        </div>
                                    </div>

                                    <button
                                        type="submit"
                                        disabled={isLoading}
                                        className="w-full bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-bold py-2 rounded-xl shadow-md transition-colors disabled:opacity-50 text-sm"
                                    >
                                        {isLoading ? 'Actualizando...' : 'Cambiar contraseña'}
                                    </button>
                                </form>
                            </>
                        ) : (
                            <div className="text-center py-4 animate-in fade-in slide-in-from-bottom-2">
                                <CheckCircle className="w-16 h-16 text-[#59B200] mx-auto mb-4" />
                                <h2 className="text-xl font-bold text-[var(--text-main)] mb-2 transition-colors duration-200">¡Contraseña Cambiada!</h2>
                                <p className="text-sm text-gray-400 mb-6 italic transition-colors duration-200">
                                    Tu contraseña ha sido actualizada con éxito.
                                </p>
                                <p className="text-xs text-blue-600 mb-8 animate-pulse">
                                    Redirigiéndote al inicio de sesión...
                                </p>
                                <Link
                                    to="/login"
                                    className="inline-block bg-gradient-to-r from-violet-600 to-indigo-600 text-white font-bold px-6 py-2 rounded-xl text-sm"
                                >
                                    Entrar ahora
                                </Link>
                            </div>
                        )}

                        {!isSuccess && (
                            <div className="mt-8 pt-6 border-t border-[var(--border-soft)] text-center transition-colors duration-200">
                                <Link
                                    to="/login"
                                    className="inline-flex items-center text-sm font-bold text-violet-400 hover:text-violet-300 transition-colors"
                                >
                                    <ArrowLeft className="w-4 h-4 mr-2" />
                                    Volver al inicio de sesión
                                </Link>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <div className="p-4 text-center text-white/60 text-[10px]">
                © Fourtty 2026 • Seguridad avanzada
            </div>
        </div>
    );
};

export default ResetPassword;
