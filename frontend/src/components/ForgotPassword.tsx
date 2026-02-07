import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Mail, ArrowLeft, CheckCircle } from 'lucide-react';
import api from '../api';

const ForgotPassword: React.FC = () => {
    const [email, setEmail] = useState('');
    const [error, setError] = useState('');
    const [message, setMessage] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isSent, setIsSent] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setMessage('');
        setIsLoading(true);

        try {
            const response = await api.post('/auth/forgot-password', { email });
            setMessage(response.data.message);
            setIsSent(true);
        } catch (err: any) {
            if (err.response && err.response.data && err.response.data.error) {
                setError(err.response.data.error);
            } else {
                setError('Error al procesar la solicitud. Inténtalo de nuevo.');
            }
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex flex-col font-sans bg-gradient-to-b from-[#5C95C4] via-[#5C95C4] to-[#6FA3CD]">
            <div className="flex-1 flex items-center justify-center p-4">
                <div className="max-w-md w-full bg-[var(--card-bg)] rounded-lg shadow-xl overflow-hidden animate-in fade-in zoom-in duration-300 border border-[var(--border-color)] transition-colors duration-200">
                    <div className="bg-[#005599] p-6 text-center text-white">
                        <h1 className="text-3xl font-bold tracking-tighter">;) twentty</h1>
                        <p className="mt-2 opacity-80 text-sm italic">Recordar es volver a vivir</p>
                    </div>

                    <div className="p-8">
                        {!isSent ? (
                            <>
                                <h2 className="text-xl font-bold text-[var(--text-main)] mb-6 text-center transition-colors duration-200">Recuperar Contraseña</h2>
                                <p className="text-sm text-gray-400 mb-8 text-center italic transition-colors duration-200">
                                    Introduce tu email y te enviaremos un enlace para que puedas elegir una nueva contraseña.
                                </p>

                                {error && (
                                    <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-6 text-xs animate-in slide-in-from-top-1">
                                        {error}
                                    </div>
                                )}

                                <form onSubmit={handleSubmit} className="space-y-6">
                                    <div>
                                        <label className="block text-xs font-bold text-gray-400 mb-1 ml-1 uppercase tracking-wider transition-colors duration-200">Tu Email</label>
                                        <div className="relative">
                                            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 w-4 h-4" />
                                            <input
                                                type="email"
                                                value={email}
                                                onChange={(e) => setEmail(e.target.value)}
                                                className="w-full pl-10 pr-4 py-2 bg-[var(--input-bg)] text-[var(--input-text)] border border-[var(--border-color)] rounded text-sm outline-none focus:ring-2 focus:ring-[#59B200] focus:border-transparent transition-all"
                                                placeholder="ejemplo@twentty.com"
                                                required
                                            />
                                        </div>
                                    </div>

                                    <button
                                        type="submit"
                                        disabled={isLoading}
                                        className="w-full bg-[#59B200] hover:bg-[#4d9a00] text-white font-bold py-2 rounded shadow-md transition-colors disabled:opacity-50 text-sm"
                                    >
                                        {isLoading ? 'Solicitando...' : 'Enviar enlace de recuperación'}
                                    </button>
                                </form>
                            </>
                        ) : (
                            <div className="text-center py-4 animate-in fade-in slide-in-from-bottom-2">
                                <CheckCircle className="w-16 h-16 text-[#59B200] mx-auto mb-4" />
                                <h2 className="text-xl font-bold text-[var(--text-main)] mb-2 transition-colors duration-200">¡Email enviado!</h2>
                                <p className="text-sm text-gray-400 mb-8 leading-relaxed italic transition-colors duration-200">
                                    {message || 'Si el email está registrado, recibirás instrucciones en unos minutos.'}
                                </p>
                                <div className="bg-blue-50 p-4 rounded text-xs text-blue-800 text-left mb-8 border border-blue-100">
                                    <strong>Nota:</strong> Si no lo recibes, revisa tu carpeta de <strong>Correo no deseado</strong> o Spam.
                                </div>
                            </div>
                        )}

                        <div className="mt-8 pt-6 border-t border-[var(--border-soft)] text-center transition-colors duration-200">
                            <Link
                                to="/login"
                                className="inline-flex items-center text-sm font-bold text-[#005599] hover:text-[#59B200] transition-colors"
                            >
                                <ArrowLeft className="w-4 h-4 mr-2" />
                                Volver al inicio de sesión
                            </Link>
                        </div>
                    </div>
                </div>
            </div>

            <div className="p-4 text-center text-white/60 text-[10px]">
                © Twentty 2026 • Todos los derechos reservados
            </div>
        </div>
    );
};

export default ForgotPassword;
