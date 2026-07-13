import React, { useState } from 'react';
import { useInboxStore } from '../../stores/useInboxStore';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { motion, AnimatePresence } from 'framer-motion';

export function InboxPage() {
  const { items, addItem, processItem, deleteItem, clearProcessed } = useInboxStore();
  const [newIdea, setNewIdea] = useState('');

  const pendingItems = items.filter(item => item.status === 'pending');
  const processedItems = items.filter(item => item.status === 'processed');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!newIdea.trim()) return;
    addItem(newIdea.trim());
    setNewIdea('');
  };

  const getSourceIcon = (source) => {
    return source === 'app' ? '⚙️' : '💡';
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-16">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/5 pb-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-text-main flex items-center gap-2">
            Inbox <span className="text-sm font-normal px-2.5 py-0.5 rounded-full bg-white/5 border border-white/10 text-text-muted">Brain Dump</span>
          </h1>
          <p className="text-sm text-text-muted mt-1">
            Liberte a sua mente. Deposite aqui ideias, tarefas rápidas ou flashes de inspiração e processe-os mais tarde.
          </p>
        </div>
        {processedItems.length > 0 && (
          <button
            onClick={clearProcessed}
            className="text-xs font-semibold px-4 py-2 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/10 transition-colors self-start md:self-center"
          >
            Limpar Processados
          </button>
        )}
      </div>

      {/* Adicionar Nova Ideia */}
      <form onSubmit={handleSubmit} className="flex gap-2 bg-surface p-2 rounded-2xl border border-white/5 shadow-lg">
        <input
          type="text"
          value={newIdea}
          onChange={(e) => setNewIdea(e.target.value)}
          placeholder="Escreva algo rápido para esvaziar a mente..."
          className="flex-1 bg-transparent px-4 py-3 text-sm text-text-main placeholder-text-dim border-none focus:outline-none focus:ring-0"
        />
        <button
          type="submit"
          className="px-6 py-3 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 shadow-md transition-all flex items-center gap-2 flex-shrink-0"
        >
          Capturar
        </button>
      </form>

      {/* Seção Principal */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Coluna Pendentes (Esquerda e Centro) */}
        <div className="md:col-span-2 space-y-4">
          <h2 className="text-sm font-bold uppercase tracking-wider text-text-muted flex items-center gap-2">
            <span>Inbox Ativo</span>
            <span className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20">
              {pendingItems.length}
            </span>
          </h2>

          <div className="space-y-3">
            <AnimatePresence initial={false}>
              {pendingItems.length === 0 ? (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex flex-col items-center justify-center py-12 px-4 rounded-2xl border border-dashed border-white/5 bg-white/[0.01]"
                >
                  <div className="text-4xl mb-3 opacity-40">✨</div>
                  <h3 className="text-sm font-medium text-text-main">Mente Limpa e Focada</h3>
                  <p className="text-xs text-text-dim text-center mt-1 max-w-xs">
                    Não existem ideias ou pensamentos pendentes. Captura algo sempre que precisares de foco.
                  </p>
                </motion.div>
              ) : (
                pendingItems.map((item) => (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="group flex items-start gap-4 p-4 rounded-xl bg-surface border border-white/5 hover:border-white/10 transition-all shadow-sm"
                  >
                    <div className="text-lg py-1 flex-shrink-0">
                      {getSourceIcon(item.source)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-text-main leading-relaxed break-words">
                        {item.content}
                      </p>
                      <span className="text-[10px] text-text-dim block mt-2">
                        Capturado {formatDistanceToNow(new Date(item.createdAt), { addSuffix: true, locale: ptBR })}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <button
                        onClick={() => processItem(item.id)}
                        className="p-1.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/5 transition-colors"
                        title="Marcar como Processado"
                      >
                        ✓
                      </button>
                      <button
                        onClick={() => deleteItem(item.id)}
                        className="p-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/5 transition-colors"
                        title="Excluir"
                      >
                        ✕
                      </button>
                    </div>
                  </motion.div>
                ))
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Coluna Processados (Direita) */}
        <div className="space-y-4">
          <h2 className="text-sm font-bold uppercase tracking-wider text-text-muted flex items-center gap-2">
            <span>Processados</span>
            <span className="text-xs px-2 py-0.5 rounded-full bg-white/5 text-text-muted border border-white/10">
              {processedItems.length}
            </span>
          </h2>

          <div className="space-y-3 max-h-[450px] overflow-y-auto pr-1">
            <AnimatePresence initial={false}>
              {processedItems.length === 0 ? (
                <div className="text-center py-8 rounded-2xl border border-white/5 bg-white/[0.01]">
                  <p className="text-xs text-text-dim">Histórico de processamento vazio.</p>
                </div>
              ) : (
                processedItems.map((item) => (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="p-3 rounded-lg bg-white/[0.02] border border-white/5 opacity-60 flex items-start gap-3"
                  >
                    <span className="text-sm py-0.5 text-text-dim">✓</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-text-muted line-through break-words">
                        {item.content}
                      </p>
                      <span className="text-[9px] text-text-dim block mt-1">
                        Processado
                      </span>
                    </div>
                    <button
                      onClick={() => deleteItem(item.id)}
                      className="p-1 rounded text-text-dim hover:text-red-400 hover:bg-red-500/10 transition-colors"
                      title="Excluir histórico"
                    >
                      ✕
                    </button>
                  </motion.div>
                ))
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
}
