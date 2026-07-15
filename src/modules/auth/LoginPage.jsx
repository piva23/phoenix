import React, { useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuthStore } from '../../stores/useAuthStore';
import { FcGoogle } from 'react-icons/fc';
import toast, { Toaster } from 'react-hot-toast';

export default function LoginPage() {
  const { user, loginWithGoogle, loading } = useAuthStore();
  const navigate = useNavigate();
  const [authError, setAuthError] = useState(null);

  if (user) {
    return <Navigate to="/" replace />;
  }

  const handleLogin = async () => {
    try {
      setAuthError(null);
      await loginWithGoogle();
      toast.success('Bem-vindo ao Phoenix OS!');
      navigate('/', { replace: true });
    } catch (err) {
      console.error(err);
      let errMsg = 'Erro na autenticação com o Google. Verifique o console.';
      if (err.code === 'auth/popup-blocked') {
        errMsg = 'O popup do Google foi bloqueado pelo seu navegador.';
      } else if (err.code === 'auth/network-request-failed') {
        errMsg = 'Erro de rede. Verifique sua conexão com a internet.';
      }
      setAuthError(errMsg);
      toast.error(errMsg);
    }
  };

  return (
    <div 
      id="phoenix-login-page" 
      className="min-h-screen w-full flex items-center justify-center font-sans select-none relative overflow-hidden bg-[#0C0C10]"
    >
      <Toaster position="top-right" />
      
      {/* Decorative ambient background glows */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full bg-[#8B5CF6] opacity-10 blur-[128px] pointer-events-none"></div>
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 rounded-full bg-[#06B6D4] opacity-10 blur-[128px] pointer-events-none"></div>
      
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
        className="w-full max-w-md mx-4 p-8 rounded-2xl glass border border-white/5 relative z-10 flex flex-col items-center bg-[#17171E]"
      >
        {/* Phoenix Logo */}
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.4 }}
          className="w-16 h-16 rounded-2xl flex items-center justify-center text-3xl mb-6 glow"
          style={{
            background: 'linear-gradient(135deg, var(--primary, #8B5CF6), var(--secondary, #06B6D4))',
          }}
        >
          🜁
        </motion.div>
        
        <h1 className="text-2xl font-bold tracking-tight text-[#F0EFF8] text-center mb-1">
          Phoenix OS
        </h1>
        <p className="text-sm text-[#9B9AAB] text-center mb-8">
          Acesse seu espaço de trabalho integrado v3.0 Pro
        </p>

        {authError && (
          <div className="w-full mb-6 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-xs text-center">
            {authError}
          </div>
        )}

        {/* Central Sign In button */}
        <motion.button
          onClick={handleLogin}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className="w-full py-4 px-6 rounded-xl font-medium flex items-center justify-center gap-3 bg-[#1D1D26] hover:bg-[#23232E] border border-white/10 text-[#F0EFF8] transition-colors relative group shadow-lg"
          disabled={loading}
        >
          {loading ? (
            <div className="w-5 h-5 border-2 border-[#9B9AAB] border-t-[#8B5CF6] rounded-full animate-spin"></div>
          ) : (
            <>
              <FcGoogle size={22} />
              <span>Entrar com Google</span>
            </>
          )}
          
          <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-[#8B5CF6] to-[#06B6D4] opacity-0 group-hover:opacity-5 transition-opacity duration-300 pointer-events-none"></div>
        </motion.button>

        <div className="mt-8 text-center">
          <p className="text-[10px] uppercase tracking-widest text-[#6B6A7A]">
            Powered by Firebase Auth
          </p>
        </div>
      </motion.div>
    </div>
  );
}
