import React, { useState, useEffect } from 'react';
import { usePersonaStore } from '../../stores/usePersonaStore';
import { useUserStore } from '../../stores/useUserStore';
import { calcXPProgress } from '../../shared/utils/xp';
import { exportData, importData } from '../../shared/utils/DataManagement';
import { useSecurityStore } from '../../stores/useSecurityStore';
import { toast } from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';

export function SettingsPage() {
  const { personas, activePersonaId, setActivePersona } = usePersonaStore();
  const { xp, name } = useUserStore();
  const xpData = calcXPProgress(xp);
  
  const { pin, setPin, lock, clearPin } = useSecurityStore();
  const [newPinInput, setNewPinInput] = useState('');

  // Phoenix Intelligence state persisted in localStorage
  const [intelligence, setIntelligence] = useState(() => {
    try {
      const saved = localStorage.getItem('phoenix-intelligence-settings');
      return saved ? JSON.parse(saved) : {
        focusHeuristic: true,
        budgetHeuristic: true,
        spacedRevisionAlert: true,
        projectBottleneckAlert: true,
        dailyPersonaReminders: false,
      };
    } catch {
      return {
        focusHeuristic: true,
        budgetHeuristic: true,
        spacedRevisionAlert: true,
        projectBottleneckAlert: true,
        dailyPersonaReminders: false,
      };
    }
  });

  // Save changes to localstorage on update
  useEffect(() => {
    localStorage.setItem('phoenix-intelligence-settings', JSON.stringify(intelligence));
  }, [intelligence]);

  const handleToggleHeuristic = (key) => {
    setIntelligence(prev => {
      const updated = { ...prev, [key]: !prev[key] };
      toast.success('Configurações de Inteligência salvas!');
      return updated;
    });
  };

  // Danger Zone Modals
  const [showClearAllModal, setShowClearAllModal] = useState(false);
  const [confirmText, setConfirmText] = useState('');

  const handleClearAllData = () => {
    if (confirmText.toLowerCase() !== 'excluir') {
      toast.error('Digite "EXCLUIR" para confirmar.');
      return;
    }

    toast.loading('Limpando dados e recarregando...');
    
    // Clear all localStorage keys starting with phoenix-
    const keysToRemove = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith('phoenix-')) {
        keysToRemove.push(key);
      }
    }
    keysToRemove.forEach(k => localStorage.removeItem(k));

    setTimeout(() => {
      window.location.reload();
    }, 1200);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      className="space-y-6 max-w-4xl pb-24"
    >
      {/* Settings Page Header */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-slate-900 via-slate-950 to-indigo-950 border border-border p-6 md:p-8 shadow-2xl">
        <div className="absolute top-1/2 -left-12 -translate-y-1/2 w-64 h-64 bg-primary/5 rounded-full filter blur-3xl pointer-events-none" />
        <div className="space-y-2 relative">
          <span className="text-[10px] bg-primary/20 text-primary border border-primary/30 px-3 py-1 rounded-full uppercase tracking-widest font-black font-mono">
            Centro de Controle de Operações
          </span>
          <h1 className="text-2xl md:text-3xl font-black text-white tracking-tight uppercase">
            Configurações Globais
          </h1>
          <p className="text-xs text-text-dim max-w-xl">
            Ajuste as diretrizes centrais de inteligência artificial, controle o fluxo e backup de seus dados persistentes, ou gerencie a segurança de sua sessão.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
        {/* Left Column */}
        <div className="space-y-6">
          {/* Card: Gestão de Dados (Backup & Restore) */}
          <div id="data-management-panel" className="bg-surface border border-border rounded-3xl p-6 shadow-xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-24 bg-primary/5 rounded-full filter blur-2xl pointer-events-none" />
            
            <div className="mb-4">
              <h3 className="text-sm font-black text-white uppercase tracking-wider flex items-center gap-2">
                <span>🗄️</span> Gestão de Dados & Salvamento
              </h3>
              <p className="text-xs text-text-muted mt-1 leading-relaxed">
                Faça cópias de segurança locais e evite a perda de seu progresso caso limpe os cookies do navegador. O arquivo gerado conterá todo seu progresso unificado.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              {/* Giant Button 1: Export */}
              <button
                onClick={() => {
                  try {
                    exportData();
                    toast.success('Backup exportado com sucesso!');
                  } catch (e) {
                    toast.error('Erro ao exportar backup.');
                  }
                }}
                className="flex flex-col items-center justify-center p-5 rounded-2xl border border-white/5 hover:border-primary/20 bg-white/[0.01] hover:bg-white/[0.02] text-center transition-all group cursor-pointer"
              >
                <span className="text-3xl mb-2 group-hover:scale-110 transition-transform">📥</span>
                <span className="text-xs font-black text-white uppercase tracking-wider">Exportar Tudo</span>
                <span className="text-[10px] text-text-dim mt-1">(Backup JSON)</span>
              </button>

              {/* Giant Button 2: Import */}
              <label className="flex flex-col items-center justify-center p-5 rounded-2xl border border-white/5 hover:border-primary/20 bg-white/[0.01] hover:bg-white/[0.02] text-center transition-all group cursor-pointer">
                <span className="text-3xl mb-2 group-hover:scale-110 transition-transform">📤</span>
                <span className="text-xs font-black text-primary uppercase tracking-wider">Importar Backup</span>
                <span className="text-[10px] text-text-dim mt-1">(Restaurar JSON)</span>
                <input
                  type="file"
                  accept=".json"
                  className="hidden"
                  onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    try {
                      const ok = await importData(file);
                      if (ok) {
                        toast.success('Backup restaurado! Recarregando...');
                      }
                    } catch (err) {
                      toast.error(err.message || 'Erro ao importar backup.');
                    }
                  }}
                />
              </label>
            </div>
          </div>

          {/* Card: Segurança & Bloqueio Geral */}
          <div className="bg-surface border border-border rounded-3xl p-6 shadow-xl">
            <div className="mb-4">
              <h3 className="text-sm font-black text-white uppercase tracking-wider flex items-center gap-2">
                <span>🛡️</span> Segurança & Privacidade
              </h3>
              <p className="text-xs text-text-muted mt-1 leading-relaxed">
                Proteja seus dados locais de olhares curiosos ativando um bloqueio por código PIN de 4 dígitos.
              </p>
            </div>

            <div className="pt-2">
              {pin ? (
                <div className="p-4 bg-emerald-500/[0.02] border border-emerald-500/20 rounded-2xl space-y-4">
                  <div className="flex items-center gap-2 text-xs font-bold text-emerald-400">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                    Proteção por PIN Ativa
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        lock();
                        toast.success('Dispositivo bloqueado!');
                      }}
                      className="flex-1 py-2.5 rounded-xl text-xs font-bold bg-primary text-black transition-all hover:opacity-95"
                    >
                      Bloquear Agora 🔒
                    </button>
                    <button
                      onClick={() => {
                        clearPin();
                        toast.success('PIN desativado!');
                      }}
                      className="flex-1 py-2.5 rounded-xl text-xs font-bold bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/10 transition-all"
                    >
                      Remover PIN
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  <p className="text-xs text-text-dim leading-relaxed">
                    Insira 4 dígitos numéricos para trancar o acesso inicial ao aplicativo sempre que recarregar.
                  </p>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      maxLength={4}
                      pattern="[0-9]*"
                      placeholder="Ex: 1234"
                      value={newPinInput}
                      onChange={(e) => setNewPinInput(e.target.value.replace(/\D/g, ''))}
                      className="w-24 text-center bg-black/40 border border-border rounded-xl px-3 py-2 text-sm text-white font-mono placeholder-text-dim focus:outline-none focus:border-primary/40"
                    />
                    <button
                      onClick={() => {
                        if (newPinInput.length !== 4) {
                          toast.error('O PIN deve conter exatamente 4 dígitos numéricos.');
                          return;
                        }
                        setPin(newPinInput);
                        setNewPinInput('');
                        toast.success('Código PIN configurado com sucesso!');
                      }}
                      className="px-4 py-2 bg-white/5 border border-white/5 hover:bg-white/10 text-white rounded-xl text-xs font-bold transition-all"
                    >
                      Ativar PIN
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          {/* Card: Phoenix Intelligence (Heuristics Config) */}
          <div id="phoenix-intelligence-panel" className="bg-surface border border-border rounded-3xl p-6 shadow-xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-500/5 rounded-full filter blur-2xl pointer-events-none" />
            
            <div className="mb-4">
              <h3 className="text-sm font-black text-white uppercase tracking-wider flex items-center gap-2">
                <span>🔮</span> Phoenix Intelligence (Heurísticas)
              </h3>
              <p className="text-xs text-text-muted mt-1 leading-relaxed">
                Configure os algoritmos automáticos que alertam sobre gargalos de produtividade, desvios ou riscos em sua rotina diária.
              </p>
            </div>

            <div className="space-y-4 pt-2">
              {[
                {
                  key: 'focusHeuristic',
                  label: 'Heurística de Foco Dinâmico',
                  desc: 'Alerte quando uma sessão contínua ultrapassar 90 minutos de estudo sem pausas ativas.'
                },
                {
                  key: 'budgetHeuristic',
                  label: 'Monitoramento de Orçamento',
                  desc: 'Heurística para notificar se qualquer envelope ultrapassar 90% do limite orçamentário definido.'
                },
                {
                  key: 'spacedRevisionAlert',
                  label: 'Revisões Espaçadas Heurísticas',
                  desc: 'Verificação inteligente diária das matérias e revisões do seu Edital.'
                },
                {
                  key: 'projectBottleneckAlert',
                  label: 'Prevenção de Gargalos de Projetos',
                  desc: 'Notifique se algum objetivo de projeto possuir mais de 5 tarefas com status pendente.'
                },
                {
                  key: 'dailyPersonaReminders',
                  label: 'Heurística de Presença de Persona',
                  desc: 'Ative alertas sobre as missões transversais dependentes do arquétipo de sua Persona ativa.'
                }
              ].map((item) => (
                <div
                  key={item.key}
                  className="flex items-start justify-between gap-4 p-3 rounded-2xl bg-white/[0.01] border border-white/5"
                >
                  <div className="space-y-1">
                    <p className="text-xs font-bold text-white leading-none">{item.label}</p>
                    <p className="text-[10px] text-text-dim leading-normal">{item.desc}</p>
                  </div>

                  <button
                    onClick={() => handleToggleHeuristic(item.key)}
                    className={`w-10 h-6 rounded-full p-1 transition-all flex items-center ${
                      intelligence[item.key] ? 'bg-primary justify-end' : 'bg-white/10 justify-start'
                    }`}
                  >
                    <motion.div
                      layout
                      className="w-4 h-4 rounded-full bg-slate-950"
                      transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                    />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Card: Danger Zone */}
          <div className="bg-surface border border-red-500/20 rounded-3xl p-6 shadow-xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-24 bg-red-500/5 rounded-full filter blur-2xl pointer-events-none" />
            
            <div className="mb-4">
              <h3 className="text-sm font-black text-red-400 uppercase tracking-wider flex items-center gap-2">
                <span>⚠️</span> Zona de Perigo
              </h3>
              <p className="text-xs text-text-muted mt-1 leading-relaxed">
                Opções destrutivas e irreversíveis que limpam as informações estruturadas de seu dispositivo.
              </p>
            </div>

            <div className="pt-2">
              <button
                onClick={() => {
                  setConfirmText('');
                  setShowClearAllModal(true);
                }}
                className="w-full py-3 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-red-400 text-xs font-black uppercase tracking-wider rounded-2xl transition-all text-center cursor-pointer"
              >
                🗑️ Apagar Todos os Dados do Sistema
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Info Card footer */}
      <div className="bg-white/[0.02] border border-white/5 rounded-3xl p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <span className="text-2xl">⚡</span>
          <div>
            <h4 className="text-xs font-black text-white uppercase">Phoenix OS v3.0 Pro</h4>
            <p className="text-[10px] text-text-dim">Ambiente de Operação Local de Alta Performance</p>
          </div>
        </div>
        <div className="text-[10px] text-text-dim font-mono bg-black/40 px-3 py-1.5 rounded-xl border border-white/5">
          Level Global: <span className="text-primary font-bold">{xpData.level}</span> | {xp} XP
        </div>
      </div>

      {/* Danger Zone Modal */}
      <AnimatePresence>
        {showClearAllModal && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.6 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowClearAllModal(false)}
              className="absolute inset-0 bg-black cursor-pointer"
            />

            {/* Modal Box */}
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="relative w-full max-w-md bg-slate-950 border border-red-500/30 rounded-3xl p-6 shadow-2xl z-10 space-y-5"
            >
              <div className="text-center space-y-2">
                <span className="text-4xl inline-block animate-bounce">🚨</span>
                <h4 className="text-base font-black text-white uppercase">Confirmar Destruição de Dados</h4>
                <p className="text-xs text-text-dim leading-relaxed">
                  Esta ação irá formatar totalmente seu Phoenix OS, limpando permanentemente todas as suas personas, faturas de finanças, editais, revisões, matérias e rotinas.
                </p>
              </div>

              <div className="space-y-2 bg-red-500/[0.02] border border-red-500/10 p-3 rounded-2xl text-[11px] text-red-400">
                ⚠️ <span className="font-bold">Aviso Crítico:</span> Se não possuir um backup de segurança (.json), seus dados serão perdidos para sempre sem possibilidade de restauração.
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-text-dim uppercase tracking-wider block">
                  Digite <span className="text-red-400 font-bold font-mono">EXCLUIR</span> para confirmar
                </label>
                <input
                  type="text"
                  value={confirmText}
                  onChange={(e) => setConfirmText(e.target.value)}
                  placeholder="EXCLUIR"
                  className="w-full text-center text-xs bg-black/40 border border-border rounded-xl p-3 text-white font-mono outline-none focus:border-red-500/40"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  onClick={() => setShowClearAllModal(false)}
                  className="flex-1 py-3 bg-white/5 hover:bg-white/10 text-white text-xs font-bold rounded-xl transition-all"
                >
                  Cancelar Operação
                </button>
                <button
                  onClick={handleClearAllData}
                  disabled={confirmText.toLowerCase() !== 'excluir'}
                  className="flex-1 py-3 bg-red-500 text-white text-xs font-black rounded-xl hover:bg-red-600 transition-all disabled:opacity-45 disabled:cursor-not-allowed shadow-lg shadow-red-500/10"
                >
                  Excluir Definitivamente
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
export default SettingsPage;
