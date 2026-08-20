import React, { useState } from 'react';
import { useDashboardStore } from '../../../stores/useDashboardStore';
import { useVisionStore } from '../../../stores/useVisionStore';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-hot-toast';

export function DashboardSettingsModal({ isOpen, onClose }) {
  const { widgetOrder, visionBoardConfig, importDashboardConfig } = useDashboardStore();
  const [jsonInput, setJsonInput] = useState('');
  const [activeTab, setActiveTab] = useState('import'); // 'import' | 'layout'

  if (!isOpen) return null;

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const raw = event.target.result;
        const parsed = JSON.parse(raw);
        const res = importDashboardConfig(parsed);
        if (res.success) {
          toast.success('Configuração do Dashboard importada com sucesso!', { icon: '🎛️' });
          onClose();
        } else {
          toast.error(`Erro: ${res.error}`);
        }
      } catch (err) {
        toast.error('O ficheiro selecionado não contém um formato JSON válido.');
      }
    };
    reader.readAsText(file);
  };

  const handleVisionBoardImport = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const raw = event.target.result;
        const parsed = JSON.parse(raw);
        const itemsToImport = Array.isArray(parsed) ? parsed : (parsed.items || null);
        
        if (itemsToImport && Array.isArray(itemsToImport)) {
          useVisionStore.setState({ items: itemsToImport });
          toast.success('Vision Board importado com sucesso! 🎯');
          onClose();
        } else {
          toast.error('Erro: O ficheiro não contém um array de itens válido para o Vision Board.');
        }
      } catch (err) {
        toast.error('Erro ao processar o arquivo de Vision Board.');
      }
    };
    reader.readAsText(file);
  };

  const handleTextImport = () => {
    if (!jsonInput.trim()) {
      toast.error('Insira a configuração em formato de texto JSON.');
      return;
    }

    try {
      const parsed = JSON.parse(jsonInput);
      const res = importDashboardConfig(parsed);
      if (res.success) {
        toast.success('Configuração do Dashboard importada com sucesso!', { icon: '🎛️' });
        setJsonInput('');
        onClose();
      } else {
        toast.error(`Erro: ${res.error}`);
      }
    } catch (err) {
      toast.error('Formato JSON inválido. Verifique a sintaxe.');
    }
  };

  const loadSampleConfig = () => {
    const sample = {
      widgetOrder: ['weather', 'media', 'reading', 'habits', 'upcoming'],
      visionBoardConfig: {
        gridCols: 3,
        showCaptions: false
      }
    };
    setJsonInput(JSON.stringify(sample, null, 2));
    toast.success('Exemplo carregado! Clique em Importar para aplicar.');
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-[#0C0C10]/80 backdrop-blur-md"
        />

        {/* Modal Window */}
        <motion.div
          initial={{ scale: 0.95, opacity: 0, y: 15 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.95, opacity: 0, y: 15 }}
          className="relative w-full max-w-lg bg-surface-2 border border-white/10 rounded-3xl overflow-hidden shadow-2xl flex flex-col z-10 max-h-[90vh] select-none"
        >
          {/* Header */}
          <div className="p-5 border-b border-white/5 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-lg">⚙️</span>
              <div>
                <h3 className="text-sm font-bold text-text-main">Configurações do Dashboard</h3>
                <p className="text-[10px] text-text-dim">Gerencie e importe preferências de visualização</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 text-text-dim hover:text-text-main flex items-center justify-center transition-all text-xs outline-none"
            >
              ✕
            </button>
          </div>

          {/* Navigation Tabs */}
          <div className="flex border-b border-white/5 bg-white/[0.01]">
            <button
              onClick={() => setActiveTab('import')}
              className={`flex-1 py-3 text-xs font-semibold border-b-2 transition-all outline-none ${
                activeTab === 'import'
                  ? 'border-primary text-text-main bg-white/[0.02]'
                  : 'border-transparent text-text-dim hover:text-text-main'
              }`}
            >
              Importar JSON 📤
            </button>
            <button
              onClick={() => setActiveTab('layout')}
              className={`flex-1 py-3 text-xs font-semibold border-b-2 transition-all outline-none ${
                activeTab === 'layout'
                  ? 'border-primary text-text-main bg-white/[0.02]'
                  : 'border-transparent text-text-dim hover:text-text-main'
              }`}
            >
              Estrutura Atual 🎛️
            </button>
          </div>

          {/* Content Area */}
          <div className="p-5 overflow-y-auto space-y-4 flex-1">
            {activeTab === 'import' && (
              <div className="space-y-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-text-muted">Importar Configuração do Dashboard (.json)</label>
                  <div className="border border-dashed border-white/10 hover:border-primary/40 rounded-2xl p-4 text-center transition-all cursor-pointer relative bg-white/[0.01]">
                    <input
                      type="file"
                      accept=".json"
                      onChange={handleFileUpload}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    />
                    <div className="space-y-1">
                      <span className="text-xl">📄</span>
                      <p className="text-xs font-semibold text-text-main">Arraste ou clique para selecionar</p>
                      <p className="text-[10px] text-text-dim">Ficheiros de configuração do Phoenix OS</p>
                    </div>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-text-muted">Importar Vision Board (.json)</label>
                  <div className="border border-dashed border-white/10 hover:border-primary/40 rounded-2xl p-4 text-center transition-all cursor-pointer relative bg-white/[0.01]">
                    <input
                      type="file"
                      accept=".json"
                      onChange={handleVisionBoardImport}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    />
                    <div className="space-y-1">
                      <span className="text-xl">🎯</span>
                      <p className="text-xs font-semibold text-text-main">Importar Vision Board (.json)</p>
                      <p className="text-[10px] text-text-dim">Carregue ou arraste o ficheiro de itens do Vision Board</p>
                    </div>
                  </div>
                </div>

                <div className="relative flex items-center py-2 select-none">
                  <div className="flex-grow border-t border-white/5"></div>
                  <span className="flex-shrink mx-3 text-[10px] font-bold text-text-dim uppercase tracking-wider">ou cole abaixo</span>
                  <div className="flex-grow border-t border-white/5"></div>
                </div>

                <div className="space-y-1">
                  <div className="flex justify-between items-center">
                    <label className="text-xs font-bold text-text-muted">Texto de Configuração JSON</label>
                    <button
                      onClick={loadSampleConfig}
                      className="text-[10px] font-bold text-primary hover:underline outline-none"
                    >
                      Carregar Exemplo ⚙️
                    </button>
                  </div>
                  <textarea
                    rows={6}
                    placeholder={`{\n  "widgetOrder": ["weather", "media", "reading"],\n  "visionBoardConfig": {\n    "gridCols": 3,\n    "showCaptions": true\n  }\n}`}
                    value={jsonInput}
                    onChange={(e) => setJsonInput(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-2xl p-3 text-xs text-text-main font-mono focus:outline-none focus:border-primary/50 placeholder-text-dim scrollbar-hide resize-none"
                  />
                </div>

                <button
                  onClick={handleTextImport}
                  className="w-full py-2.5 rounded-2xl text-xs font-bold text-white bg-gradient-to-r from-primary to-secondary hover:opacity-90 transition-all shadow-lg active:scale-95 outline-none"
                >
                  Confirmar Importação de Configuração
                </button>
              </div>
            )}

            {activeTab === 'layout' && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <h4 className="text-xs font-bold text-text-muted">Ordem de Exibição dos Módulos</h4>
                  <p className="text-[11px] text-text-dim leading-relaxed">
                    Atualmente os seus widgets e visão global estão organizados na seguinte preferência:
                  </p>
                  <div className="space-y-1.5 pt-1">
                    {widgetOrder.map((widget, idx) => (
                      <div
                        key={widget}
                        className="flex items-center justify-between p-2.5 rounded-xl border border-white/5 bg-white/[0.02] text-xs font-medium text-text-main"
                      >
                        <span className="capitalize">{widget} Widget</span>
                        <span className="text-[10px] font-mono text-text-dim">Posição #{idx + 1}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="p-3.5 rounded-2xl bg-white/[0.02] border border-white/5 space-y-2">
                  <h5 className="text-[11px] font-bold text-text-main">Vision Board</h5>
                  <div className="grid grid-cols-2 gap-4 text-xs">
                    <div>
                      <span className="text-text-dim">Colunas no Grid:</span>
                      <p className="font-semibold text-text-main mt-0.5">{visionBoardConfig.gridCols} Colunas</p>
                    </div>
                    <div>
                      <span className="text-text-dim">Legendas:</span>
                      <p className="font-semibold text-text-main mt-0.5">{visionBoardConfig.showCaptions ? 'Ativas' : 'Ocultas'}</p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
