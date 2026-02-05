import React, { useState } from 'react';
import { User, MapPin, Smartphone, ArrowRight, Gamepad2, Info } from 'lucide-react';

interface LoginProps {
  onLogin: () => void;
}

const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (email && password) {
      onLogin();
    }
  };

  return (
    <div className="min-h-screen flex flex-col font-sans">
      {/* Background Gradient similar to the original */}
      <div className="flex-1 bg-gradient-to-b from-[#5C95C4] via-[#5C95C4] to-[#6FA3CD] relative overflow-hidden">
        
        {/* Top Login Bar */}
        <div className="absolute top-0 right-0 p-4 w-full max-w-4xl mx-auto left-0 right-0 flex justify-end items-start z-20">
          <form onSubmit={handleSubmit} className="flex items-start gap-2 text-white text-[11px]">
            <div className="flex flex-col">
              <label className="mb-1 ml-1 opacity-90">Email</label>
              <input 
                type="text" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-32 p-1 rounded-sm border border-[#4a7aa3] text-black outline-none focus:ring-2 focus:ring-yellow-300"
              />
              <div className="flex items-center mt-1">
                <input type="checkbox" id="remember" className="mr-1 h-3 w-3" />
                <label htmlFor="remember">Recordarme</label>
              </div>
            </div>
            
            <div className="flex flex-col">
              <label className="mb-1 ml-1 opacity-90">Contraseña</label>
              <input 
                type="password" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-32 p-1 rounded-sm border border-[#4a7aa3] text-black outline-none focus:ring-2 focus:ring-yellow-300"
              />
              <a href="#" className="mt-1 text-blue-100 hover:underline">¿Has olvidado tu contraseña?</a>
            </div>

            <button 
              type="submit"
              className="mt-[19px] bg-[#2B7BB9] hover:bg-[#256ca3] text-white border border-[#205e8e] px-3 py-1 rounded-sm font-bold shadow-sm"
            >
              Entrar
            </button>
          </form>
        </div>

        {/* Main Content Area */}
        <div className="max-w-[980px] mx-auto mt-32 px-4 flex items-center justify-between text-white relative z-10">
          
          {/* Left Side: Logo & Description */}
          <div className="w-1/2 pr-12">
            <div className="mb-6">
              {/* Recreated Logo */}
              <div className="flex items-center gap-1 mb-4 select-none">
                <div className="bg-white/20 rounded-lg p-2 backdrop-blur-sm">
                   <span className="text-6xl font-bold tracking-tighter text-white drop-shadow-md">;)</span>
                </div>
                <h1 className="text-8xl font-bold tracking-tighter text-white drop-shadow-md pb-2">twenty</h1>
              </div>
              
              <h2 className="text-xl font-bold mb-2 text-right w-full border-b border-white/30 pb-2">
                ¿Qué es Twenty?
              </h2>
              <p className="text-[13px] leading-relaxed text-justify opacity-90">
                Twenty es una plataforma social privada, a la que se accede únicamente por invitación. 
                Cada día la usan millones de personas para comunicarse entre ellas y compartir información 
                de forma segura y privada.
              </p>
            </div>
          </div>

          {/* Vertical Separator */}
          <div className="w-[1px] h-64 bg-gradient-to-b from-transparent via-white/30 to-transparent mx-8"></div>

          {/* Right Side: Features */}
          <div className="w-1/2 flex flex-col gap-8 pl-4">
            
            <div className="flex items-start gap-4 group cursor-pointer">
              <User className="w-10 h-10 mt-1 opacity-80 group-hover:opacity-100 transition-opacity" />
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
                  Accede a Twenty desde tu móvil en tiempo real estés donde estés.
                </p>
              </div>
            </div>

          </div>
        </div>

        {/* Bottom Footer Area in Login */}
        <div className="absolute bottom-0 w-full bg-[#5C95C4] border-t border-white/20 p-4">
          <div className="max-w-[980px] mx-auto flex justify-between text-[11px] text-blue-100">
            <div className="flex gap-4">
              <span>© Twenty 2010</span>
              <span className="hover:underline cursor-pointer">Castellano</span>
              <span className="hover:underline cursor-pointer">Català</span>
              <span className="hover:underline cursor-pointer">English</span>
              <span className="hover:underline cursor-pointer">Euskara</span>
              <span className="hover:underline cursor-pointer">Galego</span>
            </div>
            <div className="flex gap-4">
               <span className="hover:underline cursor-pointer">Acerca de</span>
               <span className="hover:underline cursor-pointer">Empleo</span>
               <span className="hover:underline cursor-pointer">Anúnciate</span>
               <span className="hover:underline cursor-pointer">Prensa</span>
               <span className="hover:underline cursor-pointer">Blog</span>
               <span className="hover:underline cursor-pointer">Desarrolladores</span>
               <span className="hover:underline cursor-pointer">Ayuda</span>
            </div>
          </div>
          {/* Mock Logos */}
          <div className="max-w-[980px] mx-auto mt-4 flex gap-6 opacity-40 grayscale hover:grayscale-0 transition-all">
             <div className="text-white font-bold text-xs flex items-center gap-1"><Info size={12}/> Páginas Premium > </div>
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