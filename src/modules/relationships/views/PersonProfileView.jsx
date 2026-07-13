import { useState } from 'react';
import { useRelationshipStore } from '../../../stores/useRelationshipStore';
import { getLevel, getLevelColor, getBirthdayDaysLeft, daysSince, CATEGORIES, LOVE_LANGUAGES, ATTACHMENT_TYPES, BADGES } from '../algorithms/relationshipAlgorithms';
import { Avatar } from '../components/PersonCard';
import { InteractionModal } from '../components/InteractionModal';
import { PersonFormModal } from '../components/PersonFormModal';
import { MeetingMode } from '../components/MeetingMode';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';

const ACCENT = '#8B5CF6';

export function PersonProfileView({ person, onBack }) {
  const { 
    deleteInteraction, 
    deletePerson, 
    addPsychNote, 
    deletePsychNote,
    addSpiritualAttack, 
    deleteSpiritualAttack,
    updatePerson 
  } = useRelationshipStore();

  // Get freshest, reactive data from store
  const personLive = useRelationshipStore(s => s.people.find(p => p.id === person.id)) || person;

  const [intModal, setIntModal] = useState(false);
  const [editModal, setEditModal] = useState(false);
  const [meetModal, setMeetModal] = useState(false);
  
  // Tabs: overview | history | psych | spiritual
  const [tab, setTab] = useState('overview');

  // Coordinate editing state
  const [isEditingLoc, setIsEditingLoc] = useState(false);
  const [locForm, setLocForm] = useState({
    lat: personLive.lat !== null && personLive.lat !== undefined ? String(personLive.lat) : '',
    lng: personLive.lng !== null && personLive.lng !== undefined ? String(personLive.lng) : '',
    lastKnownLocation: personLive.lastKnownLocation || '',
  });

  // Psychological note form state
  const [psychForm, setPsychForm] = useState({
    text: '',
    responseType: 'desvio_olhar_esquerda',
    trigger: '',
    detectedLie: false,
  });

  // Spiritual attack form state
  const [spiritualForm, setSpiritualForm] = useState({
    intensity: 3,
    type: 'drain',
    note: '',
  });

  // Algorithms data
  const level = getLevel(personLive.relationshipScore);
  const color = getLevelColor(personLive.relationshipScore);
  const cat = CATEGORIES.find(c => c.id === personLive.categoryId);
  const days = daysSince(personLive.lastInteraction);
  const bdayLeft = getBirthdayDaysLeft(personLive.birthday);
  const ll = LOVE_LANGUAGES.find(l => l.id === personLive.loveLanguage);
  const att = ATTACHMENT_TYPES.find(a => a.id === personLive.attachmentType);
  const badgeDefs = BADGES.reduce((m, b) => { m[b.id] = b; return m; }, {});

  // Safe checks for arrays
  const interactions = personLive.interactions || [];
  const psychNotes = personLive.psychNotes || [];
  const spiritualAttacks = personLive.spiritualAttacks || [];

  const handleDelete = () => {
    if (!window.confirm(`Remover definitivamente ${personLive.name}?`)) return;
    deletePerson(personLive.id);
    onBack();
  };

  // Location saving
  const handleSaveLocation = () => {
    const latNum = locForm.lat.trim() === '' ? null : Number(locForm.lat);
    const lngNum = locForm.lng.trim() === '' ? null : Number(locForm.lng);

    if ((latNum !== null && isNaN(latNum)) || (lngNum !== null && isNaN(lngNum))) {
      toast.error('Coordenadas inválidas. Insira números decimais válidos.');
      return;
    }

    updatePerson(personLive.id, {
      lat: latNum,
      lng: lngNum,
      lastKnownLocation: locForm.lastKnownLocation.trim(),
    });

    setIsEditingLoc(false);
    toast.success('Localização atualizada com sucesso!');
  };

  // GPS Pinpoint for contact
  const handleCaptureCurrentGPS = () => {
    if (!navigator.geolocation) {
      toast.error('Geolocalização não é suportada por este browser.');
      return;
    }
    toast.loading('Adquirindo coordenadas GPS...', { id: 'gps_capture' });
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLocForm(f => ({
          ...f,
          lat: String(position.coords.latitude),
          lng: String(position.coords.longitude),
          lastKnownLocation: f.lastKnownLocation || 'Coordenadas Capturadas via GPS',
        }));
        toast.dismiss('gps_capture');
        toast.success('Coordenadas capturadas! Não se esqueça de salvar.');
      },
      (error) => {
        toast.dismiss('gps_capture');
        toast.error('Não foi possível obter a sua localização GPS atual.');
      },
      { timeout: 5000 }
    );
  };

  // Submit lie detector / psych log
  const handleAddPsychNoteSubmit = (e) => {
    e.preventDefault();
    if (!psychForm.text.trim()) {
      toast.error('O depoimento/anotação psicológica é obrigatória.');
      return;
    }

    addPsychNote(personLive.id, {
      text: psychForm.text,
      responseType: psychForm.responseType,
      trigger: psychForm.trigger,
      detectedLie: psychForm.detectedLie,
    });

    setPsychForm({
      text: '',
      responseType: 'desvio_olhar_esquerda',
      trigger: '',
      detectedLie: false,
    });

    toast.success('Análise psicológica registrada!');
  };

  // Submit spiritual attack / drain log
  const handleAddSpiritualAttackSubmit = (e) => {
    e.preventDefault();
    addSpiritualAttack(personLive.id, {
      intensity: Number(spiritualForm.intensity),
      type: spiritualForm.type,
      note: spiritualForm.note,
    });

    setSpiritualForm({
      intensity: 3,
      type: 'drain',
      note: '',
    });

    toast.success('Registo de dreno energético salvo!');
  };

  // Calculate Spiritual Charge Thermometer Sum
  const spiritualChargeSum = spiritualAttacks.reduce((sum, att) => sum + (Number(att.intensity) || 0), 0);

  // Get spiritual danger label
  const getSpiritualVibe = (sum) => {
    if (sum === 0) return { label: 'Luz Estável & Protetora', color: '#10B981', desc: 'Presença espiritualmente segura, sem drenos detectados.', emoji: '🟢' };
    if (sum <= 4) return { label: 'Carga Neutra / Oscilante', color: '#F59E0B', desc: 'Drenos menores esporádicos. Proteção comum recomendada.', emoji: '🟡' };
    if (sum <= 9) return { label: 'Vampirismo Emocional Ativo', color: '#F97316', desc: 'Pessoa drena energia conscientemente ou por hábitos nocivos.', emoji: '🟠' };
    return { label: 'Vampiro Energético Perigoso', color: '#EF4444', desc: 'CRÍTICO: Forte contaminação áurica. Imponha barreiras psíquicas severas!', emoji: '🔴' };
  };

  const vibe = getSpiritualVibe(spiritualChargeSum);

  return (
    <div className="flex flex-col min-h-full">
      {/* ── HEADER ────────────────────────────────────────────────────────── */}
      <div className="sticky top-0 z-10 flex items-center gap-3 px-4 py-3 border-b"
        style={{ background: 'var(--bg-base)', borderColor: 'var(--border)' }}>
        <button onClick={onBack} className="w-9 h-9 flex items-center justify-center rounded-xl text-text-muted hover:text-text-main hover:bg-white/8">←</button>
        <div className="flex-1 min-w-0">
          <div className="font-black text-text-main truncate text-sm">{personLive.nickname || personLive.name}</div>
          {personLive.nickname && <div className="text-[10px] text-text-dim truncate uppercase font-bold">{personLive.name}</div>}
        </div>
        <button onClick={() => setMeetModal(true)}
          className="px-3 py-2 rounded-xl text-xs font-semibold text-white tracking-wider uppercase active:scale-95 transition-all"
          style={{ background: color }}>
          🎯 Encontro
        </button>
        <button onClick={() => setEditModal(true)}
          className="w-9 h-9 flex items-center justify-center rounded-xl text-text-muted hover:text-text-main hover:bg-white/8 text-sm"
          title="Editar perfil">
          ✎
        </button>
        <button onClick={handleDelete}
          className="w-9 h-9 flex items-center justify-center rounded-xl text-text-dim hover:text-red-400 hover:bg-red-500/10 text-sm"
          title="Remover contacto">
          🗑
        </button>
      </div>

      <div className="flex-1 overflow-y-auto">
        <div className="p-5 space-y-5">
          {/* ── PROFILE HERO ────────────────────────────────────────────────── */}
          <div className="flex items-start gap-4">
            <Avatar name={personLive.name} color={color} size={72} />
            <div className="flex-1 min-w-0">
              {cat && (
                <span className="text-[10px] px-2.5 py-1 rounded-full inline-block mb-2 font-black uppercase tracking-wider"
                  style={{ background: cat.color + '22', color: cat.color, border: `1px solid ${cat.color}33` }}>
                  {cat.emoji} {cat.label}
                </span>
              )}
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xl">{level.emoji}</span>
                <span className="font-black tracking-tight" style={{ color }}>{level.label}</span>
              </div>
              {personLive.city && <p className="text-xs text-text-dim font-bold">📍 {personLive.city}</p>}
              {bdayLeft !== null && (
                <p className="text-[11px] font-bold mt-1" style={{ color: bdayLeft <= 7 ? '#F59E0B' : 'var(--text-dim)' }}>
                  🎂 {bdayLeft === 0 ? 'Aniversário HOJE! 🎉' : bdayLeft === 1 ? 'Aniversário amanhã! 🎈' : `Aniversário em ${bdayLeft} dias`}
                </p>
              )}
            </div>
          </div>

          {/* ── RELATIONSHIP SCORE CARD ─────────────────────────────────────── */}
          <div className="rounded-2xl p-4 bg-gray-950/40 border" style={{ borderColor: `${color}25` }}>
            <div className="flex justify-between items-center mb-2">
              <span className="text-xs font-black text-white uppercase tracking-wider">Afinidade de Vínculo</span>
              <span className="text-2xl font-black" style={{ color }}>{personLive.relationshipScore}/100</span>
            </div>
            <div className="h-4 rounded-full overflow-hidden relative mb-2" style={{ background: 'var(--bg-surface-2)' }}>
              <div className="h-full rounded-full transition-all duration-700"
                style={{ width: `${personLive.relationshipScore}%`, background: `linear-gradient(90deg, ${color}88, ${color})` }} />
              {[20, 35, 50, 65, 78, 88, 95, 99].map(mark => (
                <div key={mark} className="absolute top-0 bottom-0 w-px opacity-20"
                  style={{ left: `${mark}%`, background: 'white' }} />
              ))}
            </div>
            <div className="flex justify-between text-[10px] font-bold text-gray-500 uppercase tracking-widest">
              <span>Frieza</span>
              <span>Conexão Cósmica</span>
            </div>
            <div className="flex items-center justify-between mt-4 pt-1">
              <span className="text-xs text-text-dim font-bold">
                {days === null ? 'Sem interações ainda' : days === 0 ? 'Último contato: hoje' : `Último contato: há ${days} dias`}
              </span>
              <button onClick={() => setIntModal(true)}
                className="px-3.5 py-2 rounded-xl text-xs font-black text-white hover:opacity-90 active:scale-95 transition-all uppercase tracking-wider"
                style={{ background: color }}>
                + Registar Interação
              </button>
            </div>
          </div>

          {/* ── TABS NAVIGATION ─────────────────────────────────────────────── */}
          <div className="flex p-1 rounded-xl bg-gray-900/60 border border-gray-800 overflow-x-auto scrollbar-hide">
            {[
              ['overview', '👤 Visão Geral'],
              ['history', '📋 Histórico'],
              ['psych', '🧠 Psicológico'],
              ['spiritual', '🛡️ Espiritual']
            ].map(([id, label]) => (
              <button key={id} onClick={() => setTab(id)}
                className="flex-shrink-0 px-3 py-2 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all whitespace-nowrap"
                style={{
                  background: tab === id ? ACCENT : 'transparent',
                  color: tab === id ? '#fff' : 'var(--text-muted)'
                }}>
                {label}
              </button>
            ))}
          </div>

          {/* ── TAB CONTENT: VISÃO GERAL ────────────────────────────────────── */}
          {tab === 'overview' && (
            <div className="space-y-4">
              
              {/* Geolocation Info and Controller */}
              <div className="rounded-2xl p-4 bg-gray-900/40 border border-gray-800 space-y-4">
                <div className="flex justify-between items-center">
                  <p className="text-xs font-black text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
                    🌐 Geolocalização Social
                  </p>
                  <button
                    onClick={() => {
                      setIsEditingLoc(!isEditingLoc);
                      setLocForm({
                        lat: personLive.lat !== null && personLive.lat !== undefined ? String(personLive.lat) : '',
                        lng: personLive.lng !== null && personLive.lng !== undefined ? String(personLive.lng) : '',
                        lastKnownLocation: personLive.lastKnownLocation || '',
                      });
                    }}
                    className="text-[10px] font-black text-purple-400 hover:underline uppercase tracking-wider"
                  >
                    {isEditingLoc ? 'Cancelar' : 'Alterar Localização'}
                  </button>
                </div>

                {!isEditingLoc ? (
                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div className="p-3 bg-black/20 rounded-xl border border-gray-800/60">
                      <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest block mb-0.5">Último Local</span>
                      <span className="font-black text-white block truncate">{personLive.lastKnownLocation || 'Desconhecido'}</span>
                    </div>
                    <div className="p-3 bg-black/20 rounded-xl border border-gray-800/60">
                      <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest block mb-0.5">Coordenadas</span>
                      <span className="font-mono text-purple-400 font-bold block truncate">
                        {personLive.lat !== null && personLive.lat !== undefined ? `${Number(personLive.lat).toFixed(4)}, ${Number(personLive.lng).toFixed(4)}` : 'Não definido'}
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3 bg-black/20 p-3 rounded-xl border border-gray-850">
                    <div className="space-y-2">
                      <label className="text-[9px] font-black uppercase text-gray-500 tracking-wider">Nome da Localização</label>
                      <input
                        type="text"
                        placeholder="Ex: Escritório central, Lisboa"
                        value={locForm.lastKnownLocation}
                        onChange={(e) => setLocForm({ ...locForm, lastKnownLocation: e.target.value })}
                        className="w-full bg-gray-950 border border-gray-800 rounded-xl px-3 py-2 text-xs text-white"
                      />
                    </div>
                    
                    <div className="grid grid-cols-2 gap-2">
                      <div className="space-y-1">
                        <label className="text-[9px] font-black uppercase text-gray-500 tracking-wider">Latitude</label>
                        <input
                          type="text"
                          placeholder="Ex: -23.55"
                          value={locForm.lat}
                          onChange={(e) => setLocForm({ ...locForm, lat: e.target.value })}
                          className="w-full bg-gray-950 border border-gray-800 rounded-xl px-3 py-1.5 text-xs text-white font-mono"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[9px] font-black uppercase text-gray-500 tracking-wider">Longitude</label>
                        <input
                          type="text"
                          placeholder="Ex: -46.63"
                          value={locForm.lng}
                          onChange={(e) => setLocForm({ ...locForm, lng: e.target.value })}
                          className="w-full bg-gray-950 border border-gray-800 rounded-xl px-3 py-1.5 text-xs text-white font-mono"
                        />
                      </div>
                    </div>

                    <div className="flex gap-2 pt-1.5">
                      <button
                        onClick={handleCaptureCurrentGPS}
                        type="button"
                        className="flex-1 px-2.5 py-1.5 bg-gray-800 hover:bg-gray-700 text-white font-black rounded-lg text-[9px] uppercase tracking-widest transition-all"
                      >
                        📍 Copiar Meu GPS
                      </button>
                      <button
                        onClick={handleSaveLocation}
                        type="button"
                        className="flex-1 px-2.5 py-1.5 bg-purple-600 hover:bg-purple-500 text-white font-black rounded-lg text-[9px] uppercase tracking-widest shadow-lg shadow-purple-600/20 transition-all"
                      >
                        Salvar Posição
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Badges */}
              {personLive.badges?.length > 0 && (
                <div className="rounded-2xl p-4 bg-gray-900/40 border border-gray-800">
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3">🏅 Medalhas de Conexão</p>
                  <div className="flex flex-wrap gap-2">
                    {personLive.badges.map(bId => {
                      const b = badgeDefs[bId];
                      if (!b) return null;
                      return (
                        <span key={bId} className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold"
                          style={{ background: 'var(--bg-surface-2)', border: '1px solid var(--border)', color: 'var(--text-muted)' }}>
                          {b.emoji} {b.label}
                        </span>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Psychological Profile basics */}
              {(ll || att || personLive.mbti) && (
                <div className="rounded-2xl p-4 bg-gray-900/40 border border-gray-800 space-y-3">
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">🧠 Arquétipo Comportamental</p>
                  {ll && (
                    <div className="flex items-start gap-3 p-3 bg-black/20 rounded-xl border border-gray-800/40">
                      <span className="text-xl">{ll.emoji}</span>
                      <div>
                        <div className="text-xs font-black text-text-main">{ll.label}</div>
                        <div className="text-[10px] text-text-dim mt-0.5 leading-normal">{ll.desc}</div>
                      </div>
                    </div>
                  )}
                  {att && (
                    <div className="flex items-start gap-3 p-3 bg-black/20 rounded-xl border border-gray-800/40">
                      <span className="text-xl">{att.emoji}</span>
                      <div>
                        <div className="text-xs font-black text-text-main">Vínculo {att.label}</div>
                        <div className="text-[10px] text-text-dim mt-0.5 leading-normal">{att.desc}</div>
                      </div>
                    </div>
                  )}
                  {personLive.mbti && (
                    <div className="flex items-center gap-3 p-3 bg-black/20 rounded-xl border border-gray-800/40">
                      <span className="text-xl">🧩</span>
                      <div>
                        <div className="text-xs font-black text-text-main">
                          {personLive.mbti}
                          {personLive.introvertExtrovert && ` · ${personLive.introvertExtrovert === 'introvert' ? 'Introvertido' : 'Extrovertido'}`}
                        </div>
                        <div className="text-[10px] text-text-dim mt-0.5 uppercase tracking-wider font-bold">Tipo de Personalidade MBTI</div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Interests */}
              {personLive.interests?.length > 0 && (
                <div className="rounded-2xl p-4 bg-gray-900/40 border border-gray-800">
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3">🏷️ Afinidades e Interesses</p>
                  <div className="flex flex-wrap gap-2">
                    {personLive.interests.map(tag => (
                      <span key={tag} className="px-3 py-1.5 rounded-full text-xs font-black transition-all"
                        style={{ background: color + '15', color, border: `1px solid ${color}33` }}>
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* General notes */}
              {personLive.notes?.trim() && (
                <div className="rounded-2xl p-4 bg-gray-900/40 border border-gray-800">
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">📝 Notas Gerais</p>
                  <p className="text-xs text-text-muted leading-relaxed italic">"{personLive.notes}"</p>
                </div>
              )}
            </div>
          )}

          {/* ── TAB CONTENT: HISTÓRICO ──────────────────────────────────────── */}
          {tab === 'history' && (
            <div className="space-y-3">
              {!interactions.length ? (
                <div className="p-10 text-center bg-gray-900/20 rounded-3xl border border-dashed border-gray-800">
                  <div className="text-4xl mb-3 opacity-30">💬</div>
                  <p className="text-xs font-black text-gray-400 uppercase tracking-widest">Nenhuma Interação Registrada</p>
                  <button onClick={() => setIntModal(true)}
                    className="mt-4 px-5 py-2.5 rounded-xl text-xs font-black text-white uppercase tracking-widest shadow-lg active:scale-95 transition-all"
                    style={{ background: ACCENT }}>
                    + Registrar Primeira Interação
                  </button>
                </div>
              ) : (
                [...interactions].sort((a, b) => b.date?.localeCompare(a.date)).map(int => (
                  <div key={int.id} className="flex items-start gap-3 p-4 bg-gray-900/40 border border-gray-800 rounded-2xl relative overflow-hidden group">
                    <span className="text-2xl flex-shrink-0 bg-black/40 w-10 h-10 rounded-xl flex items-center justify-center">{int.emoji}</span>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs font-black text-white truncate">{int.label}</span>
                        <span className="text-xs font-black flex-shrink-0"
                          style={{ color: int.points < 0 ? '#EF4444' : '#10B981' }}>
                          {int.points > 0 ? '+' : ''}{int.points} pt
                        </span>
                      </div>
                      {int.note && <p className="text-[11px] text-gray-400 mt-1 italic">"{int.note}"</p>}
                      <p className="text-[9px] text-gray-500 font-bold uppercase tracking-wider mt-1.5">
                        {int.date} {int.time && `às ${int.time}`}
                      </p>
                    </div>

                    <button onClick={() => deleteInteraction(personLive.id, int.id)}
                      className="w-7 h-7 flex items-center justify-center rounded-lg text-text-dim hover:text-red-400 hover:bg-red-500/10 text-xs flex-shrink-0 self-center"
                      title="Excluir registo">
                      ✕
                    </button>
                  </div>
                ))
              )}
            </div>
          )}

          {/* ── TAB CONTENT: ANÁLISE PSICOLÓGICA ────────────────────────────── */}
          {tab === 'psych' && (
            <div className="space-y-5">
              
              {/* Form to log physical reactions / lies */}
              <form onSubmit={handleAddPsychNoteSubmit} className="bg-gray-900/40 border border-gray-800 p-4 rounded-2xl space-y-3">
                <p className="text-xs font-black text-gray-300 uppercase tracking-widest flex items-center gap-1">
                  👁️ Registro de Reação Psicológica
                </p>

                <div className="space-y-1">
                  <label className="text-[9px] font-black uppercase text-gray-500 tracking-wider">Pergunta / Assunto Gatilho</label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: Perguntei sobre onde esteve no sábado"
                    value={psychForm.trigger}
                    onChange={(e) => setPsychForm({ ...psychForm, trigger: e.target.value })}
                    className="w-full bg-gray-950 border border-gray-800 rounded-xl px-3 py-2 text-xs text-white"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[9px] font-black uppercase text-gray-500 tracking-wider">Depoimento / O que a pessoa respondeu</label>
                  <textarea
                    rows="2"
                    required
                    placeholder="Ex: Afirmou que estava dormindo cedo em casa sozinho"
                    value={psychForm.text}
                    onChange={(e) => setPsychForm({ ...psychForm, text: e.target.value })}
                    className="w-full bg-gray-950 border border-gray-800 rounded-xl px-3 py-2 text-xs text-white"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[9px] font-black uppercase text-gray-500 tracking-wider">Reação Física/Verbal Dominante</label>
                    <select
                      value={psychForm.responseType}
                      onChange={(e) => setPsychForm({ ...psychForm, responseType: e.target.value })}
                      className="w-full bg-gray-950 border border-gray-800 rounded-xl px-3 py-2 text-xs text-white"
                    >
                      <option value="desvio_olhar_esquerda">Desvio de olhar para a esquerda</option>
                      <option value="hesitacao">Hesitação/Pausa anormal na resposta</option>
                      <option value="defensivo">Postura reativa / Atitude Defensiva</option>
                      <option value="micro_desdem">Microexpressão de desdém / sorriso de lado</option>
                      <option value="coceira_toque">Coceira no nariz / toque frequente na boca</option>
                      <option value="detalhes_excessivos">Saturação de detalhes excessivos irrelevantes</option>
                      <option value="tom_vocal">Alteração súbita de tom vocal</option>
                    </select>
                  </div>

                  <div className="flex items-center gap-2 pt-4 pl-1">
                    <input
                      type="checkbox"
                      id="detectedLie"
                      checked={psychForm.detectedLie}
                      onChange={(e) => setPsychForm({ ...psychForm, detectedLie: e.target.checked })}
                      className="w-4 h-4 rounded text-red-500 bg-gray-950 border-gray-850 accent-red-500 cursor-pointer"
                    />
                    <label htmlFor="detectedLie" className="text-[10px] font-black text-red-400 uppercase tracking-wider cursor-pointer">
                      Suspeita Forte de Mentira ⚠️
                    </label>
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full py-2 bg-gradient-to-r from-purple-700 to-indigo-700 hover:from-purple-600 hover:to-indigo-600 text-white font-black rounded-xl text-xs uppercase tracking-widest shadow-lg transition-all"
                >
                  Gravar Análise Comportamental
                </button>
              </form>

              {/* History list */}
              <div className="space-y-3">
                <h4 className="text-xs font-black text-gray-400 uppercase tracking-widest px-1">Notas Comportamentais ({psychNotes.length})</h4>

                {psychNotes.length === 0 ? (
                  <p className="text-[10px] text-gray-500 italic text-center py-4 uppercase font-bold">Nenhum indício ou mentira registrada ainda.</p>
                ) : (
                  <div className="space-y-3">
                    {psychNotes.map(n => (
                      <div
                        key={n.id}
                        className={`p-4 rounded-2xl border bg-gray-900/30 ${n.detectedLie ? 'border-red-900/50 bg-red-950/5' : 'border-gray-800'}`}
                      >
                        <div className="flex justify-between items-start gap-2">
                          <span className="text-[10px] font-black uppercase text-purple-400 bg-purple-500/10 px-2.5 py-0.5 rounded-md">
                            🎯 Gatilho: {n.trigger}
                          </span>
                          <span className="text-[9px] text-gray-500 font-mono font-bold uppercase">{n.date}</span>
                        </div>

                        <p className="text-xs text-white font-medium mt-2 leading-relaxed">
                          "{n.text}"
                        </p>

                        <div className="mt-3 pt-2.5 border-t border-gray-800/60 flex justify-between items-center text-[10px]">
                          <div>
                            <span className="text-gray-500 font-bold uppercase">Sinal: </span>
                            <span className="text-gray-300 font-black uppercase">
                              {n.responseType === 'desvio_olhar_esquerda' && '👀 Olhar Esquerda'}
                              {n.responseType === 'hesitacao' && '⏳ Hesitação Vocal'}
                              {n.responseType === 'defensivo' && '🛡️ Atitude Defensiva'}
                              {n.responseType === 'micro_desdem' && '😏 Expressão de Desdém'}
                              {n.responseType === 'coceira_toque' && '👃 Toque no Rosto'}
                              {n.responseType === 'detalhes_excessivos' && '📚 Sobre-explicação'}
                              {n.responseType === 'tom_vocal' && '🎙️ Alteração de Voz'}
                            </span>
                          </div>

                          {n.detectedLie && (
                            <span className="font-black text-red-400 uppercase tracking-widest text-[9px] bg-red-900/20 px-2 py-0.5 rounded-full border border-red-500/30 flex items-center gap-1 animate-pulse">
                              ⚠️ Mentira Provável
                            </span>
                          )}
                        </div>

                        <div className="flex justify-end mt-2">
                          <button
                            type="button"
                            onClick={() => deletePsychNote(personLive.id, n.id)}
                            className="text-[9px] font-black text-gray-500 hover:text-red-400 uppercase tracking-widest"
                          >
                            Excluir Nota
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ── TAB CONTENT: ENERGIA/ESPIRITUAL ────────────────────────────── */}
          {tab === 'spiritual' && (
            <div className="space-y-5">
              
              {/* VAMPIRISM / SPIRITUAL THERMOMETER */}
              <div className="bg-gradient-to-b from-[#1a1325] to-black border border-purple-950/50 p-5 rounded-3xl space-y-4">
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="text-xs font-black text-purple-300 uppercase tracking-widest">
                      Termómetro de Carga Energética
                    </h4>
                    <p className="text-[9px] text-gray-500 uppercase tracking-wider font-bold mt-0.5">
                      Dreno Acumulado / Ataques Registados
                    </p>
                  </div>
                  <span className="text-2xl font-black" style={{ color: vibe.color }}>
                    {spiritualChargeSum} pts
                  </span>
                </div>

                {/* Thermometer visualization bar */}
                <div className="space-y-1.5">
                  <div className="h-3 w-full bg-gray-900 rounded-full overflow-hidden relative border border-gray-800">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{
                        width: `${Math.min(100, (spiritualChargeSum / 15) * 100)}%`,
                        background: `linear-gradient(90deg, #10B981, #F59E0B, #EF4444)`,
                      }}
                    />
                    {[25, 50, 75].map(mark => (
                      <div key={mark} className="absolute top-0 bottom-0 w-px bg-black/40" style={{ left: `${mark}%` }} />
                    ))}
                  </div>
                  <div className="flex justify-between text-[8px] font-mono text-gray-500 uppercase tracking-widest">
                    <span>Luz (0)</span>
                    <span>Neutro (4)</span>
                    <span>Vampiro (9)</span>
                    <span>Crítico (15+)</span>
                  </div>
                </div>

                {/* Vibe description */}
                <div className="bg-black/40 p-3 rounded-2xl border border-purple-950/30 flex gap-3 items-center">
                  <span className="text-3xl">{vibe.emoji}</span>
                  <div>
                    <p className="text-xs font-black uppercase tracking-wider" style={{ color: vibe.color }}>
                      {vibe.label}
                    </p>
                    <p className="text-[10px] text-gray-400 leading-normal mt-0.5 font-semibold">
                      {vibe.desc}
                    </p>
                  </div>
                </div>
              </div>

              {/* Form to log spiritual attacks / energy drains */}
              <form onSubmit={handleAddSpiritualAttackSubmit} className="bg-gray-900/40 border border-gray-800 p-4 rounded-2xl space-y-3">
                <p className="text-xs font-black text-gray-300 uppercase tracking-widest flex items-center gap-1">
                  🛡️ Registar Ataque Espiritual / Dreno
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[9px] font-black uppercase text-gray-500 tracking-wider">Tipo de Contaminação</label>
                    <select
                      value={spiritualForm.type}
                      onChange={(e) => setSpiritualForm({ ...spiritualForm, type: e.target.value })}
                      className="w-full bg-gray-950 border border-gray-800 rounded-xl px-3 py-2 text-xs text-white"
                    >
                      <option value="drain">Sugador de Energia Comum (Dreno passivo)</option>
                      <option value="vampirism">Vampirismo Emocional Ativo (Exigência de atenção)</option>
                      <option value="conflict">Espicaçamento de Conflito (Discussão barata)</option>
                      <option value="bad_vibe">Carga Negativa no Ambiente (Ambiente pesado)</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[9px] font-black uppercase text-gray-500 tracking-wider">Intensidade do Dreno (1 a 5)</label>
                    <select
                      value={spiritualForm.intensity}
                      onChange={(e) => setSpiritualForm({ ...spiritualForm, intensity: Number(e.target.value) })}
                      className="w-full bg-gray-950 border border-gray-800 rounded-xl px-3 py-2 text-xs text-white"
                    >
                      <option value="1">1 - Desgaste Mínimo (Quase imperceptível)</option>
                      <option value="2">2 - Incómodo Leve (Cansaço mental pós-conversa)</option>
                      <option value="3">3 - Dreno Médio (Necessidade de repouso isolado)</option>
                      <option value="4">4 - Ataque Agudo (Forte indisposição ou dores físicas)</option>
                      <option value="5">5 - Vampirismo Crítico (Esgotamento áurico total)</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[9px] font-black uppercase text-gray-500 tracking-wider">Anotações Psíquicas / Sintomas</label>
                  <input
                    type="text"
                    placeholder="Ex: Sentimento de peso nos ombros e dor de cabeça imediata"
                    value={spiritualForm.note}
                    onChange={(e) => setSpiritualForm({ ...spiritualForm, note: e.target.value })}
                    className="w-full bg-gray-950 border border-gray-800 rounded-xl px-3 py-2 text-xs text-white"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-2 bg-gradient-to-r from-purple-800 to-red-800 hover:from-purple-700 hover:to-red-700 text-white font-black rounded-xl text-xs uppercase tracking-widest shadow-lg transition-all"
                >
                  Registrar Carga Psíquica
                </button>
              </form>

              {/* Attacks history audit trail */}
              <div className="space-y-3">
                <h4 className="text-xs font-black text-gray-400 uppercase tracking-widest px-1">Registos Espirituais ({spiritualAttacks.length})</h4>

                {spiritualAttacks.length === 0 ? (
                  <p className="text-[10px] text-gray-500 italic text-center py-4 uppercase font-bold">Nenhum ataque ou dreno de energia assinalado. Luz plena! ✨</p>
                ) : (
                  <div className="space-y-2">
                    {spiritualAttacks.map(att => (
                      <div key={att.id} className="p-3 bg-black/40 border border-purple-950/30 rounded-xl flex items-start gap-3">
                        <span className="text-xl px-2.5 py-1.5 bg-purple-950/40 rounded-xl text-purple-400 font-mono font-black border border-purple-900/30">
                          {att.intensity}
                        </span>

                        <div className="flex-1 min-w-0 text-xs">
                          <div className="flex justify-between items-center">
                            <span className="font-black text-white uppercase tracking-wider text-[10px]">
                              {att.type === 'drain' && 'Sugador Comum'}
                              {att.type === 'vampirism' && 'Vampirismo Emocional'}
                              {att.type === 'conflict' && 'Espicaçador'}
                              {att.type === 'bad_vibe' && 'Carga Pesada'}
                            </span>
                            <span className="text-[8px] text-gray-500 font-bold uppercase">{att.date}</span>
                          </div>

                          {att.note && <p className="text-gray-400 italic mt-1 font-semibold">"{att.note}"</p>}

                          <div className="flex justify-end mt-1.5">
                            <button
                              onClick={() => deleteSpiritualAttack(personLive.id, att.id)}
                              className="text-[9px] font-black text-gray-500 hover:text-red-400 uppercase tracking-widest"
                            >
                              Eliminar Registo
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

            </div>
          )}

        </div>
      </div>

      {/* MODALS */}
      {intModal && <InteractionModal person={personLive} onClose={() => setIntModal(false)} />}
      {editModal && <PersonFormModal person={personLive} onClose={() => setEditModal(false)} />}
      {meetModal && <MeetingMode onClose={() => setMeetModal(false)} />}
    </div>
  );
}

export default PersonProfileView;
