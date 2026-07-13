import { useState, useEffect, useRef } from 'react';
import { useKnowledgeStore } from '../../../stores/useKnowledgeStore';
import toast from 'react-hot-toast';

const DEFAULT_PDFS = [
  {
    name: 'Guia de Alta Performance - Phoenix.pdf',
    url: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
  },
  {
    name: 'Constituição Federal (Exemplo).pdf',
    url: 'https://www.unfe.org/wp-content/uploads/2017/05/Gender-Concepts-Portuguese.pdf',
  },
];

export function PDFReader() {
  const { notes, addNote, updateNote, collections } = useKnowledgeStore();
  const [pdfUrl, setPdfUrl] = useState(DEFAULT_PDFS[0].url);
  const [customUrl, setCustomUrl] = useState('');
  const [selectedNoteId, setSelectedNoteId] = useState('');
  const [noteTitle, setNoteTitle] = useState('');
  const [noteContent, setNoteContent] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [showMobileNotes, setShowMobileNotes] = useState(false);
  const [previewMode, setPreviewMode] = useState(false);

  // Debounce para salvamento automático
  const saveTimeoutRef = useRef(null);

  // Encontrar ou criar uma nota correspondente ao PDF atual
  useEffect(() => {
    const existingNote = notes.find(n => n.pdfUrl === pdfUrl);
    if (existingNote) {
      setSelectedNoteId(existingNote.id);
      setNoteTitle(existingNote.title || '');
      setNoteContent(existingNote.content || '');
    } else {
      // Se não existe, cria uma nova nota para este PDF na primeira coleção ou coleção geral
      const defaultCol = collections[0]?.id || 'col_misc';
      const pdfName = pdfUrl.split('/').pop() || 'Documento PDF';
      const newNote = {
        title: `Anotações: ${decodeURIComponent(pdfName)}`,
        content: `# Anotações de Estudo\n\nEstudando o PDF: *${pdfUrl}*\n\n## Pontos Importantes:\n- \n- `,
        collectionId: defaultCol,
        pdfUrl: pdfUrl,
        tags: ['PDF', 'Estudos'],
      };
      // Usamos uma ação direta de criação
      const state = useKnowledgeStore.getState();
      const newNoteId = `note_${Date.now()}`;
      
      useKnowledgeStore.setState(s => ({
        notes: [
          {
            ...newNote,
            id: newNoteId,
            favorite: false,
            createdAt: new Date().toISOString().split('T')[0],
            updatedAt: new Date().toISOString().split('T')[0],
          },
          ...s.notes,
        ]
      }));

      setSelectedNoteId(newNoteId);
      setNoteTitle(newNote.title);
      setNoteContent(newNote.content);
    }
  }, [pdfUrl, notes.length]);

  // Função de salvamento automático com debounce de 1 segundo
  const handleContentChange = (e) => {
    const val = e.target.value;
    setNoteContent(val);
    setIsSaving(true);

    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    saveTimeoutRef.current = setTimeout(() => {
      if (selectedNoteId) {
        updateNote(selectedNoteId, {
          content: val,
          updatedAt: new Date().toISOString().split('T')[0]
        });
        setIsSaving(false);
      }
    }, 1000);
  };

  const handleTitleChange = (e) => {
    const val = e.target.value;
    setNoteTitle(val);
    updateNote(selectedNoteId, {
      title: val,
      updatedAt: new Date().toISOString().split('T')[0]
    });
  };

  const handleLoadCustomUrl = (e) => {
    e.preventDefault();
    if (!customUrl.trim()) return;
    let url = customUrl.trim();
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      url = 'https://' + url;
    }
    setPdfUrl(url);
    toast.success('Carregando novo PDF!');
  };

  // Renderizador simplificado de Markdown para visualização no preview
  const renderMarkdown = (text) => {
    if (!text) return '';
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/^###\s+(.+)$/gm, '<h3 class="text-base font-bold mt-4 mb-2 text-white">$1</h3>')
      .replace(/^##\s+(.+)$/gm, '<h2 class="text-lg font-bold mt-5 mb-3 border-b border-white/10 pb-1 text-white">$1</h2>')
      .replace(/^#\s+(.+)$/gm, '<h1 class="text-xl font-extrabold mt-6 mb-4 text-white">$1</h1>')
      .replace(/\*\*(.+?)\*\*/g, '<strong class="font-bold text-white">$1</strong>')
      .replace(/\*(.+?)\*/g, '<em class="italic opacity-80">$1</em>')
      .replace(/`(.+?)`/g, '<code class="bg-white/10 px-1.5 py-0.5 rounded font-mono text-xs border border-white/5">$1</code>')
      .replace(/^>\s+(.+)$/gm, '<blockquote class="border-l-4 border-purple-500 pl-3 my-3 italic opacity-90 bg-white/5 p-2 rounded-r-lg">$1</blockquote>')
      .replace(/^[-*]\s+(.+)$/gm, '<li class="ml-4 list-disc opacity-90">$1</li>')
      .replace(/\n/g, '<br/>');
  };

  return (
    <div className="flex flex-col h-full space-y-4">
      {/* Barra superior de URL */}
      <div
        className="p-4 rounded-2xl border flex flex-col md:flex-row md:items-center justify-between gap-3"
        style={{ background: 'var(--bg-surface)', borderColor: 'var(--border)' }}
      >
        <div className="flex flex-col md:flex-row md:items-center gap-3 flex-1">
          <span className="text-xs font-bold text-text-dim uppercase tracking-wider shrink-0">
            📄 Documento PDF:
          </span>
          <select
            value={pdfUrl}
            onChange={(e) => setPdfUrl(e.target.value)}
            className="px-3 py-2 rounded-xl text-xs outline-none border"
            style={{
              background: 'var(--bg-surface-2)',
              borderColor: 'var(--border)',
              color: 'var(--text-main)',
            }}
          >
            {DEFAULT_PDFS.map((pdf) => (
              <option key={pdf.url} value={pdf.url}>
                {pdf.name}
              </option>
            ))}
            <option value={customUrl || 'custom'}>Outro (URL Customizada)</option>
          </select>

          <form onSubmit={handleLoadCustomUrl} className="flex gap-2 flex-1">
            <input
              type="text"
              placeholder="Cole a URL de qualquer PDF público..."
              value={customUrl}
              onChange={(e) => setCustomUrl(e.target.value)}
              className="flex-1 px-3 py-2 rounded-xl text-xs border outline-none"
              style={{
                background: 'var(--bg-surface-2)',
                borderColor: 'var(--border)',
                color: 'var(--text-main)',
              }}
            />
            <button
              type="submit"
              className="px-4 py-2 rounded-xl text-xs font-bold text-white transition-opacity hover:opacity-90 shrink-0"
              style={{ background: 'var(--primary)' }}
            >
              Abrir
            </button>
          </form>
        </div>

        {/* Botão para celular expandir anotações */}
        <button
          onClick={() => setShowMobileNotes(!showMobileNotes)}
          className="lg:hidden px-4 py-2 rounded-xl text-xs font-bold text-white bg-purple-600 hover:bg-purple-700 flex items-center gap-2 justify-center"
        >
          <span>📝</span> {showMobileNotes ? 'Ocultar Notas' : 'Ver Notas/Anotar'}
        </button>
      </div>

      {/* Split-View principal */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 h-[calc(100vh-230px)] relative overflow-hidden">
        {/* Metade Esquerda: PDF */}
        <div
          className="lg:col-span-7 h-full rounded-2xl border overflow-hidden p-1 relative"
          style={{ background: 'var(--bg-surface)', borderColor: 'var(--border)' }}
        >
          <iframe
            src={pdfUrl}
            title="Visualizador de PDF"
            className="w-full h-full border-none rounded-xl"
            onError={() => {
              toast.error('Erro ao abrir PDF. Verifique se o link permite embed.');
            }}
          />
          {/* Aviso se o PDF não carregar */}
          <div className="absolute bottom-2 left-2 right-2 bg-black/85 backdrop-blur border border-white/10 p-2.5 rounded-xl text-[10px] text-text-dim flex items-center gap-2 pointer-events-none">
            <span>💡</span>
            <span>Se o PDF não renderizar devido a restrições de segurança do link, abra em uma nova aba do navegador para ler e anote ao lado.</span>
          </div>
        </div>

        {/* Metade Direita: Bloco de Notas (Desktop: fixo lado a lado | Mobile: overlay expansível) */}
        <div
          className={`lg:col-span-5 h-full rounded-2xl border flex flex-col overflow-hidden transition-all duration-300 z-10
            ${showMobileNotes ? 'fixed inset-x-4 bottom-20 top-24 lg:relative lg:inset-auto' : 'hidden lg:flex'}`}
          style={{
            background: 'var(--bg-surface)',
            borderColor: 'var(--border)',
            boxShadow: showMobileNotes ? '0 -10px 25px -5px rgba(0,0,0,0.5)' : 'none',
          }}
        >
          {/* Header do Bloco de Notas */}
          <div
            className="px-4 py-3 border-b flex items-center justify-between gap-2 shrink-0"
            style={{ borderColor: 'var(--border)', background: 'var(--bg-surface-2)' }}
          >
            <div className="flex items-center gap-2">
              <span className="text-sm">📝</span>
              <input
                type="text"
                value={noteTitle}
                onChange={handleTitleChange}
                className="font-bold text-xs bg-transparent border-none outline-none text-text-main placeholder-white/30 focus:border-b focus:border-purple-500 pb-0.5"
                placeholder="Título da nota..."
              />
            </div>

            <div className="flex items-center gap-2">
              {isSaving ? (
                <span className="text-[10px] text-purple-400 font-bold animate-pulse">
                  ⚡ Salvando...
                </span>
              ) : (
                <span className="text-[10px] text-emerald-400 font-bold">
                  ✓ Salvo
                </span>
              )}

              {/* Toggle de Preview */}
              <button
                onClick={() => setPreviewMode(!previewMode)}
                className="px-2 py-1 rounded-lg text-[10px] font-bold border transition-all"
                style={{
                  borderColor: 'var(--border)',
                  background: previewMode ? 'rgba(124, 58, 237, 0.2)' : 'transparent',
                  color: previewMode ? '#A855F7' : 'var(--text-dim)',
                }}
              >
                {previewMode ? 'Editar' : 'Visualizar'}
              </button>
            </div>
          </div>

          {/* Área de edição / visualização */}
          <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
            {previewMode ? (
              <div
                className="prose prose-invert text-xs text-text-muted leading-relaxed"
                dangerouslySetInnerHTML={{ __html: renderMarkdown(noteContent) }}
              />
            ) : (
              <textarea
                value={noteContent}
                onChange={handleContentChange}
                className="w-full h-full bg-transparent border-none outline-none resize-none text-xs text-text-main font-sans leading-relaxed focus:ring-0"
                placeholder="Digite suas anotações aqui em Markdown... Use # para Título, ## para subtítulo, * para listas e ** para negrito."
              />
            )}
          </div>

          {/* Rodapé informativo */}
          <div
            className="px-4 py-2 border-t text-[10px] text-text-dim flex justify-between shrink-0"
            style={{ borderColor: 'var(--border)', background: 'var(--bg-surface-2)' }}
          >
            <span>Salva dinamicamente na aba "Notas"</span>
            <span>Markdown Ativo</span>
          </div>
        </div>
      </div>
    </div>
  );
}
