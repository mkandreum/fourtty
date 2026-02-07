import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { User as UserIcon, MapPin, Smartphone, Info } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
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
        // Register flow
        const response = await api.post('/auth/register', {
          name,
          lastName,
          email,
          password,
          inviteCode
        });
        login(response.data.token, response.data.user);
      } else {
        // Login flow
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
      {/* Background Gradient similar to the original */}
      <div className="flex-1 bg-gradient-to-b from-[#5C95C4] via-[#5C95C4] to-[#6FA3CD] [data-theme='dark']:from-[#000000] [data-theme='dark']:via-[#000000] [data-theme='dark']:to-[#0a0a0a] relative overflow-hidden transition-colors duration-500">

        {/* Top Login Bar */}
        <div className="md:absolute top-0 w-full p-4 flex justify-center z-20 bg-[#5C95C4] [data-theme='dark']:bg-[#000000] md:bg-transparent">
          <div className="max-w-[980px] w-full flex flex-col md:flex-row justify-between md:justify-end gap-4 md:gap-0">
            {/* Logo for mobile in header */}
            <div className="md:hidden flex items-center gap-1 select-none">
              <span className="text-2xl font-bold tracking-tighter text-white">;) twentty</span>
            </div>

            <form onSubmit={handleSubmit} className="flex flex-wrap items-end md:items-start gap-2 md:gap-3 text-white text-[10px] md:text-[11px]">
              {isRegister && (
                <div className="flex flex-col animate-in fade-in slide-in-from-top-2">
                  <label className="mb-1 ml-1 opacity-90">Nombre</label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full md:w-32 p-1 rounded-sm border border-[#4a7aa3] text-black outline-none focus:ring-2 focus:ring-yellow-300 bg-white transition-colors duration-200"
                    placeholder="Tu nombre"
                    required
                  />
                </div>
              )}

              {isRegister && (
                <div className="flex flex-col animate-in fade-in slide-in-from-top-2">
                  <label className="mb-1 ml-1 opacity-90">Apellidos</label>
                  <input
                    type="text"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    className="w-full md:w-32 p-1 rounded-sm border border-[#4a7aa3] text-black outline-none focus:ring-2 focus:ring-yellow-300 bg-white transition-colors duration-200"
                    placeholder="Tus apellidos"
                    required
                  />
                </div>
              )}

              {isRegister && (
                <div className="flex flex-col animate-in fade-in slide-in-from-top-2">
                  <label className="mb-1 ml-1 opacity-90">Código Invitación</label>
                  <input
                    type="text"
                    value={inviteCode}
                    onChange={(e) => setInviteCode(e.target.value)}
                    className="w-full md:w-32 p-1 rounded-sm border border-[#4a7aa3] text-black outline-none focus:ring-2 focus:ring-yellow-300 bg-white transition-colors duration-200"
                    placeholder="ABCD..."
                    required
                  />
                </div>
              )}

              <div className="flex flex-col">
                <label className="mb-1 ml-1 opacity-90">Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full md:w-32 p-1 rounded-sm border border-[#4a7aa3] text-black outline-none focus:ring-2 focus:ring-yellow-300 bg-white transition-colors duration-200"
                  placeholder="laura@twentty.com"
                  required
                />
                {!isRegister && (
                  <div className="flex items-center mt-1">
                    <input type="checkbox" id="remember" className="mr-1 h-3 w-3" />
                    <label htmlFor="remember">Recordarme</label>
                  </div>
                )}
              </div>

              <div className="flex flex-col">
                <label className="mb-1 ml-1 opacity-90">Contraseña</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full md:w-32 p-1 rounded-sm border border-[#4a7aa3] text-black outline-none focus:ring-2 focus:ring-yellow-300 bg-white transition-colors duration-200"
                  placeholder="********"
                  required
                />
                {/* Forgot Password Link */}
                {!isRegister && (
                  <Link to="/forgot-password" data-testid="forgot-password-link" className="mt-1 text-blue-100 hover:underline">
                    ¿Has olvidado tu contraseña?
                  </Link>
                )}
              </div>

              <div className="flex flex-col">
                <button
                  type="submit"
                  disabled={isLoading}
                  className="md:mt-[19px] bg-[#2B7BB9] hover:bg-[#256ca3] text-white border border-[#205e8e] px-3 py-1 rounded-sm font-bold shadow-sm disabled:opacity-50 min-w-20"
                >
                  {isLoading ? '...' : (isRegister ? 'Registrarse' : 'Entrar')}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsRegister(!isRegister);
                    setError('');
                    setName('');
                    setLastName('');
                    setInviteCode('');
                  }}
                  className="mt-1 text-blue-100 hover:underline text-left"
                >
                  {isRegister ? 'Ya tengo cuenta' : '¡Regístrate ahora!'}
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Error Message Toast */}
        {error && (
          <div className="absolute top-20 right-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded z-30 text-xs">
            {error}
          </div>
        )}

        {/* Main Content Area */}
        <div className="max-w-[980px] mx-auto mt-12 md:mt-32 px-4 flex flex-col md:flex-row items-center justify-between text-white relative z-10 pb-40">

          {/* Left Side: Logo & Description */}
          <div className="w-full md:w-1/2 md:pr-12 text-center md:text-left mb-12 md:mb-0">
            <div className="mb-6">
              {/* Recreated Logo */}
              <div className="flex flex-col md:flex-row items-center md:items-start gap-1 mb-8 select-none">
                <div className="bg-white/20 rounded-lg p-2 backdrop-blur-sm hidden md:block">
                  <span className="text-4xl md:text-6xl font-bold tracking-tighter text-white drop-shadow-md">;)</span>
                </div>
                <h1 className="text-6xl md:text-8xl font-bold tracking-tighter text-white drop-shadow-md pb-2 mt-2">twentty</h1>
              </div>

              <h2 className="text-lg md:text-xl font-bold mb-2 md:text-right w-full border-b border-white/30 pb-2">
                ¿Qué es Twentty?
              </h2>
              <p className="text-[13px] leading-relaxed text-justify opacity-90">
                Twentty es una plataforma social privada, a la que se accede únicamente por invitación.
                Cada día la usan millones de personas para comunicarse entre ellas y compartir información
                de forma segura y privada.
              </p>
            </div>
          </div>

          {/* Vertical Separator */}
          <div className="hidden md:block w-[1px] h-64 bg-gradient-to-b from-transparent via-white/30 to-transparent mx-8"></div>

          {/* Right Side: Features */}
          <div className="w-full md:w-1/2 flex flex-col gap-6 md:gap-8 pl-0 md:pl-4">

            <div className="flex items-start gap-4 group cursor-pointer">
              <UserIcon className="w-10 h-10 mt-1 opacity-80 group-hover:opacity-100 transition-opacity" />
              <div>
                <h3 className="font-bold text-lg mb-1">Social</h3>
                <p className="text-[12px] opacity-80 leading-snug">
                  Conéctate, comparte y comunícate con tus amigos, compañeros de trabajo y familia.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4 group cursor-pointer">
              <MapPin className="w-10 h-10 mt-1 opacity-80 group-hover:opacity-100 transition-opacity" />
              <div>
                <h3 className="font-bold text-lg mb-1">Local</h3>
                <p className="text-[12px] opacity-80 leading-snug">
                  Descubre servicios locales y participa con las marcas que realmente te importan.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4 group cursor-pointer">
              <Smartphone className="w-10 h-10 mt-1 opacity-80 group-hover:opacity-100 transition-opacity" />
              <div>
                <h3 className="font-bold text-lg mb-1">Móvil</h3>
                <p className="text-[12px] opacity-80 leading-snug">
                  Accede a Twentty desde tu móvil en tiempo real estés donde estés.
                </p>
              </div>
            </div>

          </div>
        </div>

        {/* Bottom Footer Area in Login */}
        <div className="md:absolute bottom-0 w-full bg-[#5C95C4] [data-theme='dark']:bg-[#000000] border-t border-white/20 p-4 mt-8 transition-colors duration-500">
          <div className="max-w-[980px] mx-auto flex justify-between text-[11px] text-blue-100">
            <div className="flex flex-wrap gap-2 md:gap-4">
              <span>© Twentty 2026</span>
              <span className="hover:underline cursor-pointer">Español</span>
              <span className="hover:underline cursor-pointer hidden sm:inline">Català</span>
              <span className="hover:underline cursor-pointer">English</span>
              <span className="hover:underline cursor-pointer hidden sm:inline">Euskara</span>
              <span className="hover:underline cursor-pointer hidden sm:inline">Galego</span>
            </div>
            <div className="hidden md:flex gap-4">
              <span className="hover:underline cursor-pointer">Acerca de</span>
              <span className="hover:underline cursor-pointer">Empleo</span>
              <span className="hover:underline cursor-pointer">Anúnciate</span>
              <span className="hover:underline cursor-pointer">Prensa</span>
              <span className="hover:underline cursor-pointer">Blog</span>
              <span className="hover:underline cursor-pointer">Ayuda</span>
            </div>
          </div>
          {/* Mock Logos */}
          <div className="max-w-[980px] mx-auto mt-4 flex gap-6 opacity-40 grayscale hover:grayscale-0 transition-all">
            <div className="text-white font-bold text-xs flex items-center gap-1"><Info size={12} /> Páginas Premium {'>'} </div>
            <div className="h-4 w-12 bg-white/50 rounded"></div>
            <div className="h-4 w-8 bg-white/50 rounded"></div>
            <div className="h-4 w-16 bg-white/50 rounded"></div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default Login;