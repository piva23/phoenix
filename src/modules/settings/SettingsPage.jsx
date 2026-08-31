import React, { useState } from 'react';
import { usePersonaStore } from '../../stores/usePersonaStore';
import { useGameStore, calcXPProgress } from '../../stores/useGameStore';
import { exportData, importData } from '../../shared/utils/DataManagement';
import { useSecurityStore } from '../../stores/useSecurityStore';
import { toast } from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import { PageHeader } from '../../components/layout/PageHeader';
import { useAuthStore } from '../../stores/useAuthStore';
import { db } from '../../shared/config/firebase';
import { doc, setDoc, getDoc } from 'firebase/firestore';

// ── Shared card wrapper ─────────────────────────────────────────────────────
function Card({ children, className = '' }) {
  return (
    <div className={`rounded-2xl border border-white/[0.06] bg-white/[0.03] backdrop-blur-xl p-5 md:p-6 shadow-xl ${className}`}>
      {children}
    </div>
  );
}

function CardHeader({ icon, title, description }) {
  return (
    <div className="mb-4">
      <h3 className="text-sm font-black text-white uppercase tracking-wider flex items-center gap-2">
        <span>{icon}</span> {title}
      </h3>
      {description && (
        <p className="text-xs text-text-muted mt-1 leading-relaxed">{description}</p>
      )}
    </div>
  );
}

// ── Animation variants ──────────────────────────────────────────────────────
const fadeIn = {
  initial: { opacity: 0, y: 15 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0 },
};

const stagger = {
  animate: { transition: { staggerChildren: 0.08 } },
};

const cardVariant = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
};

// ═════════════════════════════════════════════════════════════════════════════
// SettingsPage
// ═════════════════════════════════════════════════════════════════════════════
export function SettingsPage() {
  // ── Stores ──────────────────────────────────────────────────────────────
  const { user, loginWithGoogle } = useAuthStore();
  const xp = useGameStore((s) => s.totalXP);
  const gameName = useGameStore((s) => s.name);
  const xpData = calcXPProgress(xp);

  const { getActivePersona } = usePersonaStore();
  const activePersona = getActivePersona();

  const { pin, setPin, lock, clearPin } = useSecurityStore();

  // ── Local state ─────────────────────────────────────────────────────────
  const [newPinInput, setNewPinInput] = useState('');
  const [isSyncing, setIsSyncing] = useState(false);
  const [showClearAllModal, setShowClearAllModal] = useState(false);
  const [confirmText, setConfirmText] = useState('');

  // ── Derived values ──────────────────────────────────────────────────────
  const canCloudSync = !!user && !!db;
  const displayName = gameName || user?.displayName || 'Estudante';

  // ── Helpers ─────────────────────────────────────────────────────────────
  const getInitials = (name) => {
    if (!name) return '?';
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
    return name.slice(0, 2).toUpperCase();
  };

  // ── Handlers ────────────────────────────────────────────────────────────
  const handleExport = () => {
    try {
      exportData();
      toast.success('Backup exportado com sucesso!');
    } catch {
      toast.error('Erro ao exportar backup.');
    }
  };

  const handleImport = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const ok = await importData(file);
      if (ok) toast.success('Backup restaurado! Recarregando...');
    } catch (err) {
      toast.error(err.message || 'Erro ao importar backup.');
    }
  };

  const handleCloudBackup = async () => {
    if (!user) { toast.error('Usuário não autenticado no Firebase.'); return; }
    setIsSyncing(true);
    const id = toast.loading('Preparando backup na nuvem...');
    try {
      const data = {};
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith('phoenix-')) data[key] = localStorage.getItem(key);
      }
      const backupRef = doc(db, 'users', user.uid, 'backup', 'latest');
      await setDoc(backupRef, { data, updatedAt: new Date().toISOString(), email: user.email, uid: user.uid });
      toast.success('Backup enviado para a nuvem com sucesso!', { id });
    } catch (error) {
      console.error('Erro no backup na nuvem:', error);
      toast.error(`Erro ao fazer backup: ${error.message}`, { id });
    } finally {
      setIsSyncing(false);
    }
  };

  const handleCloudRestore = async () => {
    if (!user) { toast.error('Usuário não autenticado no Firebase.'); return; }
    setIsSyncing(true);
    const id = toast.loading('Buscando backup na nuvem...');
    try {
      const backupRef = doc(db, 'users', user.uid, 'backup', 'latest');
      const docSnap = await getDoc(backupRef);
      if (!docSnap.exists()) {
        toast.error('Nenhum backup encontrado na nuvem para este usuário.', { id });
        setIsSyncing(false);
        return;
      }
      const backupData = docSnap.data()?.data || {};
      const keys = Object.keys(backupData);
      if (keys.length === 0) {
        toast.error('O backup encontrado na nuvem está vazio.', { id });
        setIsSyncing(false);
        return;
      }
      keys.forEach((key) => localStorage.setItem(key, backupData[key]));
      toast.success('Sincronização concluída! Recarregando sistema...', { id });
      setTimeout(() => window.location.reload(), 1500);
    } catch (error) {
      console.error('Erro ao restaurar da nuvem:', error);
      toast.error(`Erro ao sincronizar: ${error.message}`, { id });
    } finally {
      setIsSyncing(false);
    }
  };

  const handleActivatePin = () => {
    if (newPinInput.length !== 4) {
      toast.error('O PIN deve conter exatamente 4 dígitos numéricos.');
      return;
    }
    setPin(newPinInput);
    setNewPinInput('');
    toast.success('Código PIN configurado com sucesso!');
  };

  const handleClearAllData = () => {
    if (confirmText.toLowerCase() !== 'excluir') {
      toast.error('Digite "EXCLUIR" para confirmar.');
      return;
    }
    toast.loading('Limpando dados e recarregando...');
    const keysToRemove = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith('phoenix-')) keysToRemove.push(key);
    }
    keysToRemove.forEach((k) => localStorage.removeItem(k));
    setTimeout(() => window.location.reload(), 1200);
  };

  // ════════════════════════════════════════════════════════════════════════════
  // RENDER
  // ════════════════════════════════════════════════════════════════════════════
  return (
    <motion.div {...fadeIn} className="page-container">
      <PageHeader
        icon="⚙️"
        title="Configurações"
        subtitle="Gerencie seu perfil, dados, sincronização e segurança."
      />

      <motion.div
        variants={stagger}
        initial="initial"
        animate="animate"
        className="space-y-6 max-w-2xl mx-auto"
      >
        {/* ── 1. Profile Card ──────────────────────────────────────────────── */}
        <motion.div variants={cardVariant}>
          <Card>
            <CardHeader icon="👤" title="Perfil" />

            {user ? (
              <div className="flex items-center gap-4">
                {/* Avatar */}
                {user.photoURL ? (
                  <img
                    src={user.photoURL}
                    alt={displayName}
                    className="w-14 h-14 rounded-full object-cover border-2 border-white/10"
                  />
                ) : (
                  <div className="w-14 h-14 rounded-full bg-gradient-to-br from-primary to-purple-500 flex items-center justify-center text-lg font-black text-white flex-shrink-0">
                    {getInitials(displayName)}
                  </div>
                )}

                <div className="min-w-0 flex-1">
                  <p className="text-sm font-bold text-white truncate">{displayName}</p>
                  <p className="text-xs text-text-dim truncate">{user.email}</p>
                  {activePersona && (
                    <p className="text-xs text-text-muted mt-0.5">
                      Persona: <span className="text-white font-semibold">{activePersona.icon} {activePersona.name}</span>
                    </p>
                  )}
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center text-center py-2 gap-3">
                <div className="w-14 h-14 rounded-full bg-white/5 flex items-center justify-center text-2xl">
                  👤
                </div>
                <p className="text-xs text-text-dim">Conecte-se para sincronizar na nuvem</p>
                <button
                  onClick={() => loginWithGoogle()}
                  className="px-4 py-2 text-xs font-bold bg-primary text-black rounded-xl hover:opacity-90 transition-opacity"
                >
                  Entrar com Google
                </button>
              </div>
            )}

            {/* XP Bar */}
            <div className="mt-4 pt-4 border-t border-white/5">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[10px] font-bold text-text-dim uppercase tracking-wider">
                  Nível {xpData.level}
                </span>
                <span className="text-[10px] text-text-dim font-mono">
                  {xpData.currentXP}/{xpData.neededXP} XP
                </span>
              </div>
              <div className="w-full h-2 rounded-full bg-white/5 overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${xpData.progress}%` }}
                  transition={{ duration: 0.8, ease: 'easeOut' }}
                  className="h-full rounded-full bg-gradient-to-r from-primary to-purple-400"
                />
              </div>
            </div>
          </Card>
        </motion.div>

        {/* ── 2. Data Management Card ──────────────────────────────────────── */}
        <motion.div variants={cardVariant}>
          <Card>
            <CardHeader
              icon="🗄️"
              title="Gestão de Dados"
              description="Faça cópias de segurança locais ou restaure um backup existente."
            />

            <div className="grid grid-cols-2 gap-3">
              {/* Export */}
              <button
                onClick={handleExport}
                className="flex flex-col items-center gap-1.5 p-4 rounded-xl border border-white/5 hover:border-primary/20 bg-white/[0.01] hover:bg-white/[0.02] transition-all group"
              >
                <span className="text-2xl group-hover:scale-110 transition-transform">📥</span>
                <span className="text-xs font-bold text-white">Exportar</span>
                <span className="text-[10px] text-text-dim">Backup JSON</span>
              </button>

              {/* Import */}
              <label className="flex flex-col items-center gap-1.5 p-4 rounded-xl border border-white/5 hover:border-primary/20 bg-white/[0.01] hover:bg-white/[0.02] transition-all group cursor-pointer">
                <span className="text-2xl group-hover:scale-110 transition-transform">📤</span>
                <span className="text-xs font-bold text-primary">Importar</span>
                <span className="text-[10px] text-text-dim">Restaurar JSON</span>
                <input
                  type="file"
                  accept=".json"
                  className="hidden"
                  onChange={handleImport}
                />
              </label>
            </div>
          </Card>
        </motion.div>

        {/* ── 3. Cloud Sync Card ───────────────────────────────────────────── */}
        <motion.div variants={cardVariant}>
          <Card>
            <CardHeader
              icon="☁️"
              title="Sincronização Cloud"
              description="Salve ou restaure seus dados pela nuvem do Firebase."
            />

            {canCloudSync ? (
              <>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={handleCloudBackup}
                    disabled={isSyncing}
                    className="flex flex-col items-center gap-1.5 p-4 rounded-xl border border-white/5 hover:border-primary/20 bg-white/[0.01] hover:bg-white/[0.02] transition-all group disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <span className="text-2xl group-hover:scale-110 transition-transform">📤</span>
                    <span className="text-xs font-bold text-white">Upload</span>
                    <span className="text-[10px] text-text-dim">Backup Nuvem</span>
                  </button>

                  <button
                    onClick={handleCloudRestore}
                    disabled={isSyncing}
                    className="flex flex-col items-center gap-1.5 p-4 rounded-xl border border-white/5 hover:border-primary/20 bg-white/[0.01] hover:bg-white/[0.02] transition-all group disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <span className="text-2xl group-hover:scale-110 transition-transform">📥</span>
                    <span className="text-xs font-bold text-primary">Download</span>
                    <span className="text-[10px] text-text-dim">Restore Nuvem</span>
                  </button>
                </div>

                <div className="mt-3 pt-3 border-t border-white/5 flex justify-between items-center">
                  <span className="text-[10px] text-text-dim">Conectado:</span>
                  <span className="text-[10px] font-mono text-white">{user.email}</span>
                </div>
              </>
            ) : (
              <div className="flex flex-col items-center text-center py-4 gap-2">
                <span className="text-2xl opacity-40">☁️</span>
                <p className="text-xs text-text-dim">
                  {user ? 'Firebase não configurado — modo offline' : 'Faça login para usar sincronização na nuvem'}
                </p>
              </div>
            )}
          </Card>
        </motion.div>

        {/* ── 4. Security Card ─────────────────────────────────────────────── */}
        <motion.div variants={cardVariant}>
          <Card>
            <CardHeader
              icon="🛡️"
              title="Segurança & Privacidade"
              description="Proteja seus dados locais com um bloqueio por código PIN."
            />

            {pin ? (
              <div className="p-4 rounded-xl bg-emerald-500/[0.04] border border-emerald-500/15 space-y-3">
                <div className="flex items-center gap-2 text-xs font-bold text-emerald-400">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  Proteção por PIN Ativa
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => { lock(); toast.success('Dispositivo bloqueado!'); }}
                    className="flex-1 py-2.5 rounded-xl text-xs font-bold bg-primary text-black hover:opacity-95 transition-opacity"
                  >
                    🔒 Bloquear Agora
                  </button>
                  <button
                    onClick={() => { clearPin(); toast.success('PIN desativado!'); }}
                    className="flex-1 py-2.5 rounded-xl text-xs font-bold bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/10 transition-colors"
                  >
                    Remover PIN
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <p className="text-xs text-text-dim">
                  Insira 4 dígitos numéricos para trancar o acesso ao aplicativo.
                </p>
                <div className="flex gap-2">
                  <input
                    type="text"
                    inputMode="numeric"
                    maxLength={4}
                    pattern="[0-9]*"
                    placeholder="1234"
                    value={newPinInput}
                    onChange={(e) => setNewPinInput(e.target.value.replace(/\D/g, ''))}
                    className="w-24 text-center bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-sm text-white font-mono placeholder-text-dim focus:outline-none focus:border-primary/40"
                  />
                  <button
                    onClick={handleActivatePin}
                    className="px-4 py-2 bg-white/5 border border-white/5 hover:bg-white/10 text-white rounded-xl text-xs font-bold transition-colors"
                  >
                    Ativar PIN
                  </button>
                </div>
              </div>
            )}
          </Card>
        </motion.div>

        {/* ── 5. Danger Zone Card ──────────────────────────────────────────── */}
        <motion.div variants={cardVariant}>
          <Card className="border-red-500/20">
            <CardHeader
              icon="⚠️"
              title="Zona de Perigo"
              description="Opções destrutivas e irreversíveis que limpam os dados do dispositivo."
            />

            <button
              onClick={() => { setConfirmText(''); setShowClearAllModal(true); }}
              className="w-full py-3 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-red-400 text-xs font-black uppercase tracking-wider rounded-xl transition-colors"
            >
              🗑️ Apagar Todos os Dados
            </button>
          </Card>
        </motion.div>

        {/* ── 6. Footer ────────────────────────────────────────────────────── */}
        <motion.div variants={cardVariant}>
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-5 rounded-2xl border border-white/[0.06] bg-white/[0.03]">
            <div className="flex items-center gap-2">
              <span className="text-xl">⚡</span>
              <div>
                <h4 className="text-xs font-black text-white uppercase">Phoenix OS v5.0.0-alpha</h4>
                <p className="text-[10px] text-text-dim">Ambiente de Operação Local</p>
              </div>
            </div>
            <div className="text-[10px] text-text-dim font-mono bg-black/40 px-3 py-1.5 rounded-xl border border-white/5">
              Level: <span className="text-primary font-bold">{xpData.level}</span> · {xp} XP
            </div>
          </div>
        </motion.div>
      </motion.div>

      {/* ── Danger Zone Modal ─────────────────────────────────────────────── */}
      <AnimatePresence>
        {showClearAllModal && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.6 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowClearAllModal(false)}
              className="absolute inset-0 bg-black cursor-pointer"
            />
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
                  Esta ação irá formatar totalmente seu Phoenix OS, limpando permanentemente todas as personas, finanças, editais, revisões, matérias e rotinas.
                </p>
              </div>

              <div className="space-y-2 bg-red-500/[0.02] border border-red-500/10 p-3 rounded-xl text-[11px] text-red-400">
                ⚠️ <span className="font-bold">Aviso Crítico:</span> Se não possuir um backup (.json), seus dados serão perdidos para sempre.
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
                  className="w-full text-center text-xs bg-black/40 border border-white/10 rounded-xl p-3 text-white font-mono outline-none focus:border-red-500/40"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  onClick={() => setShowClearAllModal(false)}
                  className="flex-1 py-3 bg-white/5 hover:bg-white/10 text-white text-xs font-bold rounded-xl transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleClearAllData}
                  disabled={confirmText.toLowerCase() !== 'excluir'}
                  className="flex-1 py-3 bg-red-500 text-white text-xs font-black rounded-xl hover:bg-red-600 transition-colors disabled:opacity-45 disabled:cursor-not-allowed shadow-lg shadow-red-500/10"
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
