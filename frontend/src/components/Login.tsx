import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { User as UserIcon, MapPin, Smartphone, Info, Mail, Lock, UserPlus, ArrowRight, ShieldCheck } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../api';
import { LoginResponse } from '../types';

const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const [isRegister, setIsRegister] = useState(false);
  const [name, setName] = useState('');
  const [lastName, setLastName] = useState('');
  const [inviteCode, setInviteCode] = useState('');

  const { login } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      if (isRegister) {
        const response = await api.post('/auth/register', {
          name,
          lastName,
          email,
          password,
          inviteCode
        });
        login(response.data.token, response.data.user);
      } else {
        const response = await api.post<LoginResponse>('/auth/login', {
          email,
          password
        });
        login(response.data.token, response.data.user);
      }
    } catch (err: any) {
      if (err.response && err.response.data && err.response.data.error) {
        setError(err.response.data.error);
      } else {
        setError(isRegister ? 'Error al registrarse.' : 'Error al iniciar sesión.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col font-sans transition-colors duration-200">
      {/* Optimized Gradient Background */}
      <div className="flex-1 bg-gradient-to-br from-slate-900 via-violet-900 to-slate-900 relative flex items-center justify-center p-4 overflow-hidden">

        {/* Decorative blobs */}
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-violet-600/20 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-indigo-600/20 rounded-full blur-[120px]" />

        <div className="max-w-[1100px] w-full flex flex-col lg:flex-row items-center justify-between gap-12 relative z-10">

          {/* Left Side: Brand Narrative */}
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            className="w-full lg:w-1/2 text-left"
          >
            <div className="flex items-center gap-3 mb-8">
              <div className="glass p-3 rounded-2xl shadow-xl">
                <ShieldCheck size={48} className="text-violet-400" />
              </div>
              <h1 className="brand-font text-6xl md:text-8xl py-2">fourtty</h1>
            </div>

            <div className="space-y-6 max-w-lg">
              <h2 className="text-3xl md:text-4xl font-extrabold text-white leading-tight">
                Tu mundo social, <span className="text-violet-400">rediseñado.</span>
              </h2>
              <p className="text-slate-300 text-lg leading-relaxed">
                Fourtty es una plataforma social premium y privada. Conecta de forma segura, comparte momentos y descubre qué está pasando en tu mundo con un estilo moderno.
              </p>

              <div className="hidden md:grid grid-cols-2 gap-4 pt-6">
                <div className="glass p-4 rounded-xl flex items-center gap-3">
                  <ShieldCheck className="text-violet-400" />
                  <span className="text-sm font-semibold text-slate-200">Seguridad Total</span>
                </div>
                <div className="glass p-4 rounded-xl flex items-center gap-3">
                  <Smartphone className="text-violet-400" />
                  <span className="text-sm font-semibold text-slate-200">Experiencia PWA</span>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Right Side: Centered Modern Card */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full max-w-[440px]"
          >
            <div className="glass p-8 rounded-[2.5rem] shadow-2xl ring-1 ring-white/10 backdrop-blur-2xl">
              <AnimatePresence mode="wait">
                <motion.div
                  key={isRegister ? 'register' : 'login'}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2 }}
                >
                  <h3 className="text-2xl font-bold text-white mb-2">
                    {isRegister ? 'Crea tu cuenta' : '¡Hola de nuevo!'}
                  </h3>
                  <p className="text-slate-400 text-sm mb-6">
                    {isRegister ? 'Únete a la plataforma más exclusiva.' : 'Nos alegra verte. Introduce tus datos.'}
                  </p>

                  {error && (
                    <div className="bg-red-500/10 border border-red-500/20 text-red-200 p-3 rounded-xl text-xs mb-4 animate-in fade-in zoom-in">
                      {error}
                    </div>
                  )}

                  <form onSubmit={handleSubmit} className="space-y-4">
                    {isRegister && (
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                          <label className="text-xs font-bold text-slate-400 ml-1">Nombre</label>
                          <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="w-full !bg-white/5 !border-white/10 p-3 rounded-xl text-white outline-none focus:!border-violet-500 focus:ring-4 focus:ring-violet-500/20 transition-all text-sm"
                            placeholder="Nombre"
                            required
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-xs font-bold text-slate-400 ml-1">Apellidos</label>
                          <input
                            type="text"
                            value={lastName}
                            onChange={(e) => setLastName(e.target.value)}
                            className="w-full !bg-white/5 !border-white/10 p-3 rounded-xl text-white outline-none focus:!border-violet-500 focus:ring-4 focus:ring-violet-500/20 transition-all text-sm"
                            placeholder="Apellidos"
                            required
                          />
                        </div>
                      </div>
                    )}

                    {isRegister && (
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-400 ml-1">Código de Invitación</label>
                        <div className="relative">
                          <input
                            type="text"
                            value={inviteCode}
                            onChange={(e) => setInviteCode(e.target.value)}
                            className="w-full !bg-white/5 !border-white/10 p-3 pl-10 rounded-xl text-white outline-none focus:!border-violet-500 focus:ring-4 focus:ring-violet-500/20 transition-all text-sm"
                            placeholder="CÓDIGO-INVI"
                            required
                          />
                          <Info size={16} className="absolute left-3 top-3.5 text-slate-500" />
                        </div>
                      </div>
                    )}

                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-400 ml-1">Correo Electrónico</label>
                      <div className="relative">
                        <input
                          type="email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          className="w-full !bg-white/5 !border-white/10 p-3 pl-10 rounded-xl text-white outline-none focus:!border-violet-500 focus:ring-4 focus:ring-violet-500/20 transition-all text-sm"
                          placeholder="gmail@ejemplo.com"
                          required
                        />
                        <Mail size={16} className="absolute left-3 top-3.5 text-slate-500" />
                      </div>
                    </div>

                    <div className="space-y-1">
                      <div className="flex justify-between items-center">
                        <label className="text-xs font-bold text-slate-400 ml-1">Contraseña</label>
                        {!isRegister && (
                          <Link to="/forgot-password" className="text-[10px] text-violet-400 hover:text-violet-300 font-bold transition-colors">
                            ¿La olvidaste?
                          </Link>
                        )}
                      </div>
                      <div className="relative">
                        <input
                          type="password"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          className="w-full !bg-white/5 !border-white/10 p-3 pl-10 rounded-xl text-white outline-none focus:!border-violet-500 focus:ring-4 focus:ring-violet-500/20 transition-all text-sm"
                          placeholder="••••••••"
                          required
                        />
                        <Lock size={16} className="absolute left-3 top-3.5 text-slate-500" />
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={isLoading}
                      className="w-full bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white p-4 rounded-2xl font-bold text-[15px] shadow-lg shadow-violet-500/20 transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2 mt-4"
                    >
                      {isLoading ? (
                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      ) : (
                        <>
                          {isRegister ? 'Unirse ahora' : 'Iniciar Sesión'}
                          <ArrowRight size={18} />
                        </>
                      )}
                    </button>
                  </form>

                  <div className="mt-8 text-center">
                    <button
                      onClick={() => {
                        setIsRegister(!isRegister);
                        setError('');
                      }}
                      className="text-slate-400 text-sm hover:text-white transition-colors flex items-center gap-2 justify-center mx-auto"
                    >
                      {isRegister ? (
                        <>¿Ya tienes cuenta? <span className="text-violet-400 font-bold">Entrar</span></>
                      ) : (
                        <>¿No tienes cuenta? <span className="text-violet-400 font-bold">Registrarse</span></>
                      )}
                    </button>
                  </div>
                </motion.div>
              </AnimatePresence>
            </div>
          </motion.div>
        </div>

        {/* Bottom Footer Area */}
        <div className="absolute bottom-6 w-full px-6 flex flex-col md:flex-row justify-between items-center gap-4 text-slate-500 text-[11px] font-medium opacity-60">
          <div className="flex gap-6 order-2 md:order-1">
            <span className="hover:text-slate-300 cursor-pointer">Seguridad</span>
            <span className="hover:text-slate-300 cursor-pointer">Privacidad</span>
            <span className="hover:text-slate-300 cursor-pointer">Condiciones</span>
          </div>
          <div className="flex gap-4 order-1 md:order-2">
            <span>© Fourtty 2026</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;