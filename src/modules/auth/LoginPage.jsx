import React, { useState } from 'react';
import { useAuthStore } from '../../stores/useAuthStore';
import { useUserStore } from '../../stores/useUserStore';
import { Flame, User, Mail, Terminal, ChevronDown, ChevronUp } from 'lucide-react';
import toast from 'react-hot-toast';

export default function LoginPage() {
  const loginWithGoogle = useAuthStore((state) => state.loginWithGoogle);
  const loginAsDemo = useAuthStore((state) => state.loginAsDemo);

  const [isDemoFormOpen, setIsDemoFormOpen] = useState(false);
  
  const [demoName, setDemoName] = useState('Operador Phoenix');
  const [demoEmail, setDemoEmail] = useState('operador@phoenix.os');

  const handleLogin = async () => {
    try {
      const loggedUser = await loginWithGoogle();
      if (loggedUser && loggedUser.displayName) {
        // Sync display name with user store
        const currentProfileName = useUserStore.getState().displayName;
        if (currentProfileName === 'Utilizador Phoenix' || !currentProfileName) {
          useUserStore.getState().updateProfile({ displayName: loggedUser.displayName });
        }
      }
      toast.success('Sessão iniciada com sucesso!');
    } catch (err) {
      console.error('Google login failed:', err);
      toast.error('Falha na autenticação do Google.');
    }
  };

  const handleDemoLogin = async (e) => {
    e.preventDefault();
    if (!demoName.trim()) {
      toast.error('O nome de operador não pode estar vazio!');
      return;
    }
    try {
      const loggedUser = await loginAsDemo(demoName, demoEmail);
      if (loggedUser && loggedUser.displayName) {
        useUserStore.getState().updateProfile({ displayName: loggedUser.displayName });
      }
      toast.success('Sessão iniciada em modo de demonstração local!');
    } catch (err) {
      toast.error('Erro ao iniciar sessão local.');
    }
  };

  return (
    <div id="login-page-container" className="min-h-screen bg-[#09090b] flex flex-col items-center justify-center p-6 relative overflow-hidden">
      {/* Background decorations */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-orange-600/10 rounded-full blur-[120px]" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-600/10 rounded-full blur-[120px]" />

      <div id="login-card" className="w-full max-w-md bg-zinc-900/60 backdrop-blur-xl border border-zinc-800 p-8 rounded-2xl flex flex-col items-center text-center shadow-2xl relative z-10 transition-all">
        <div id="phoenix-glowing-logo" className="w-16 h-16 bg-gradient-to-tr from-orange-500 to-red-600 rounded-2xl flex items-center justify-center shadow-lg shadow-orange-500/20 mb-6">
          <Flame className="w-9 h-9 text-white" />
        </div>

        <h1 id="app-title-login" className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-white via-zinc-200 to-zinc-400 bg-clip-text text-transparent">
          Phoenix OS
        </h1>
        <p id="app-subtitle-login" className="text-orange-500 font-medium tracking-widest text-xs uppercase mt-1">
          Sistema Operativo de Produtividade v3.0
        </p>

        <p id="app-desc-login" className="text-zinc-400 text-sm mt-4 mb-6">
          Sincronize os seus projetos, calendarize tarefas com inteligência e acompanhe a sua progressão em tempo real de forma segura.
        </p>

        {/* Primary Google Login Button */}
        <button
          id="google-login-button"
          onClick={handleLogin}
          className="w-full py-3.5 px-5 bg-white text-black font-semibold rounded-xl flex items-center justify-center gap-3 hover:bg-zinc-200 transition-all duration-200 hover:scale-[1.01] shadow-lg shadow-white/5 cursor-pointer"
        >
          <svg viewBox="0 0 24 24" width="20" height="20" xmlns="http://www.w3.org/2000/svg" className="flex-shrink-0">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05" />
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" fill="#EA4335" />
          </svg>
          <span>Entrar com o Google</span>
        </button>

        {/* Separator */}
        <div className="w-full flex items-center gap-3 my-6">
          <div className="flex-grow h-px bg-zinc-800" />
          <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">ou</span>
          <div className="flex-grow h-px bg-zinc-800" />
        </div>

        {/* Local Demo Form Option */}
        <div className="w-full space-y-3 text-left">
          <button
            id="toggle-demo-form-btn"
            type="button"
            onClick={() => setIsDemoFormOpen(!isDemoFormOpen)}
            className="w-full py-2.5 px-4 bg-zinc-900 hover:bg-zinc-850 text-zinc-400 hover:text-white border border-zinc-800 hover:border-zinc-750 font-bold text-xs rounded-xl flex items-center justify-between cursor-pointer transition-all"
          >
            <div className="flex items-center gap-2">
              <Terminal className="w-4 h-4 text-orange-500" />
              <span>Entrar em Modo Local (Sem Google)</span>
            </div>
            {isDemoFormOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>

          {isDemoFormOpen && (
            <form id="demo-login-form" onSubmit={handleDemoLogin} className="space-y-4 bg-zinc-950/40 p-4 rounded-xl border border-zinc-850 animate-fadeIn">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider block">Nome do Operador</label>
                <div className="relative">
                  <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                  <input
                    id="demo-name-input"
                    type="text"
                    required
                    value={demoName}
                    onChange={(e) => setDemoName(e.target.value)}
                    placeholder="Nome de Exibição"
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-zinc-600 focus:outline-none focus:border-orange-500 transition"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider block">Email Corporativo</label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                  <input
                    id="demo-email-input"
                    type="email"
                    required
                    value={demoEmail}
                    onChange={(e) => setDemoEmail(e.target.value)}
                    placeholder="exemplo@phoenix.os"
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-zinc-600 focus:outline-none focus:border-orange-500 transition"
                  />
                </div>
              </div>

              <button
                id="demo-submit-btn"
                type="submit"
                className="w-full py-2.5 bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700 text-white font-bold text-xs rounded-xl shadow-lg shadow-orange-500/10 cursor-pointer transition-all duration-200"
              >
                Ativar Consola Local
              </button>
            </form>
          )}
        </div>

        <div id="security-disclaimer" className="text-zinc-500 text-[10px] mt-8 border-t border-zinc-800/80 pt-4 w-full">
          Protegido por encriptação local e segurança de autenticação Google.
        </div>
      </div>
    </div>
  );
}
