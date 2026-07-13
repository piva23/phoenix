import React, { useState } from 'react';
import { useSecurityStore } from '../../stores/useSecurityStore';
import { ShieldAlert, Delete, ArrowRight } from 'lucide-react';
import toast from 'react-hot-toast';

export default function LockScreen() {
  const [pin, setPin] = useState('');
  const { unlock, addLog } = useSecurityStore();

  const handleKeyPress = (num) => {
    if (pin.length < 4) {
      setPin(pin + num);
    }
  };

  const handleDelete = () => {
    setPin(pin.slice(0, -1));
  };

  const handleUnlock = () => {
    if (pin.length === 4) {
      const success = unlock(pin);
      if (success) {
        addLog('Desbloqueio de Sessão', 'Sucesso');
        toast.success('Acesso autorizado!');
      } else {
        addLog('Tentativa de Desbloqueio', 'Falha (PIN Incorreto)');
        toast.error('PIN Incorreto! Acesso negado.');
        setPin('');
      }
    }
  };

  return (
    <div id="lock-screen-container" className="min-h-screen bg-[#09090b] flex flex-col items-center justify-center p-6 relative overflow-hidden">
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-red-600/5 rounded-full blur-[120px]" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-zinc-600/5 rounded-full blur-[120px]" />

      <div id="lock-card" className="w-full max-w-sm bg-zinc-900/60 backdrop-blur-xl border border-zinc-800 p-8 rounded-2xl flex flex-col items-center text-center shadow-2xl relative z-10">
        <div id="shield-icon-lock" className="w-14 h-14 bg-red-500/10 border border-red-500/20 rounded-full flex items-center justify-center mb-4">
          <ShieldAlert className="w-7 h-7 text-red-500" />
        </div>

        <h1 id="lock-card-title" className="text-xl font-bold tracking-tight text-white">Consola Bloqueada</h1>
        <p id="lock-card-subtitle" className="text-zinc-500 text-xs mt-1 uppercase tracking-widest font-semibold">Phoenix OS Security</p>

        {/* PIN Indicators */}
        <div id="pin-indicators" className="flex gap-4 my-8 justify-center">
          {[0, 1, 2, 3].map((index) => (
            <div
              key={index}
              className={`w-4.5 h-4.5 rounded-full border transition-all duration-150 ${
                pin.length > index
                  ? 'bg-orange-500 border-orange-500 shadow-lg shadow-orange-500/40 scale-110'
                  : 'bg-transparent border-zinc-700'
              }`}
            />
          ))}
        </div>

        {/* Numeric Keypad */}
        <div id="keypad-grid" className="grid grid-cols-3 gap-3 w-full max-w-[240px] mb-6">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
            <button
              key={num}
              id={`keypad-${num}`}
              onClick={() => handleKeyPress(num.toString())}
              className="w-16 h-16 rounded-full bg-zinc-800/40 hover:bg-zinc-800 border border-zinc-800/40 text-lg font-bold text-white flex items-center justify-center transition-all cursor-pointer active:scale-95"
            >
              {num}
            </button>
          ))}
          <button
            id="keypad-delete"
            onClick={handleDelete}
            className="w-16 h-16 rounded-full bg-zinc-800/20 hover:bg-zinc-800/40 text-zinc-400 flex items-center justify-center transition-all cursor-pointer"
          >
            <Delete className="w-5 h-5" />
          </button>
          <button
            id="keypad-0"
            onClick={() => handleKeyPress('0')}
            className="w-16 h-16 rounded-full bg-zinc-800/40 hover:bg-zinc-800 border border-zinc-800/40 text-lg font-bold text-white flex items-center justify-center transition-all cursor-pointer active:scale-95"
          >
            0
          </button>
          <button
            id="keypad-unlock"
            onClick={handleUnlock}
            disabled={pin.length !== 4}
            className={`w-16 h-16 rounded-full flex items-center justify-center transition-all cursor-pointer active:scale-95 ${
              pin.length === 4
                ? 'bg-orange-500 hover:bg-orange-600 text-white shadow-lg shadow-orange-500/20'
                : 'bg-zinc-800/20 text-zinc-600 cursor-not-allowed border border-transparent'
            }`}
          >
            <ArrowRight className="w-5 h-5" />
          </button>
        </div>

        <div id="pin-disclaimer" className="text-zinc-500 text-[10px]">
          Insira o seu PIN de 4 dígitos para desbloquear o sistema.
        </div>
      </div>
    </div>
  );
}
