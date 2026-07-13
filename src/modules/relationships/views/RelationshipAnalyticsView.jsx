import { useMemo } from 'react';
import { useRelationshipStore } from '../../../stores/useRelationshipStore';
import { getDunbarCircles, getAlerts, getSocialHealth, getBirthdayDaysLeft, daysSince, getLevel, getLevelColor, CATEGORIES } from '../algorithms/relationshipAlgorithms';
import { Avatar } from '../components/PersonCard';

const ACCENT = '#8B5CF6';

function MiniPersonRow({ person, onClick, extra }) {
  const color = getLevelColor(person.relationshipScore);
  const level = getLevel(person.relationshipScore);
  return (
    <button onClick={() => onClick(person)}
      className="flex items-center gap-3 p-3 rounded-xl w-full text-left hover:bg-white/5 transition-all">
      <Avatar name={person.name} color={color} size={36} />
      <div className="flex-1 min-w-0">
        <div className="text-sm font-semibold text-text-main truncate">{person.nickname || person.name}</div>
        <div className="text-xs text-text-dim">{level.emoji} {level.label}</div>
      </div>
      {extra && <span className="text-xs text-text-dim flex-shrink-0 font-bold">{extra}</span>}
    </button>
  );
}

// Literature intelligence database and resolver
function getLiteratureRecommendation(person) {
  const name = person.nickname || person.name;
  const recommendations = [];

  // 1. Resolve by Interest Tags
  const tags = person.interests || [];
  const lowercaseTags = tags.map(t => t.toLowerCase());

  if (lowercaseTags.some(t => t.includes('game') || t.includes('jogos'))) {
    recommendations.push({
      title: 'Jogador Número 1',
      author: 'Ernest Cline',
      reason: `Como o(a) ${name} adora videojogos, este livro oferece o assunto perfeito sobre mundos virtuais e cultura geek para reatar a conversa com entusiasmo.`
    });
  }
  if (lowercaseTags.some(t => t.includes('leitura') || t.includes('livros') || t.includes('escrita'))) {
    recommendations.push({
      title: 'Sapiens: Uma Breve História da Humanidade',
      author: 'Yuval Noah Harari',
      reason: `Como o(a) ${name} adora ler, discutir grandes conceitos antropológicos e ideias abstratas presentes neste best-seller irá proporcionar debates intelectuais profundos.`
    });
  }
  if (lowercaseTags.some(t => t.includes('academia') || t.includes('corrida') || t.includes('esporte') || t.includes('exerc'))) {
    recommendations.push({
      title: 'Can\'t Hurt Me (Nada Pode Me Ferir)',
      author: 'David Goggins',
      reason: `Por ser alguém focado em superação física e treinos, a mentalidade ultra-resiliente de Goggins vai ressoar perfeitamente com o estilo de vida de ${name}.`
    });
  }
  if (lowercaseTags.some(t => t.includes('tec') || t.includes('program') || t.includes('comput'))) {
    recommendations.push({
      title: 'Steve Jobs',
      author: 'Walter Isaacson',
      reason: `Uma biografia icónica sobre obsessão por design e inovação que fascina mentes ligadas à tecnologia e engenharia como ${name}.`
    });
  }
  if (lowercaseTags.some(t => t.includes('medita') || t.includes('yoga') || t.includes('natureza') || t.includes('zen'))) {
    recommendations.push({
      title: 'O Poder do Agora',
      author: 'Eckhart Tolle',
      reason: `Uma leitura voltada ao minimalismo mental e espiritualidade laica, sintonizada com os gostos contemplativos e relaxantes do(a) ${name}.`
    });
  }
  if (lowercaseTags.some(t => t.includes('finan') || t.includes('empreend') || t.includes('negócio'))) {
    recommendations.push({
      title: 'Pai Rico, Pai Pobre',
      author: 'Robert Kiyosaki',
      reason: `Excelente para quem se interessa por desenvolvimento financeiro e negócios, abrindo caminho para debaterem investimentos juntos.`
    });
  }

  // 2. Resolve by Love Language
  if (person.loveLanguage === 'words') {
    recommendations.push({
      title: 'As 5 Linguagens do Amor',
      author: 'Gary Chapman',
      reason: `Visto que a principal linguagem de ${name} são Palavras de Afirmação, este clássico ensina a arte de usar elogios sinceros e validação verbal para aproximá-los.`
    });
  } else if (person.loveLanguage === 'time') {
    recommendations.push({
      title: 'Essencialismo: A Disciplina do Menos',
      author: 'Greg McKeown',
      reason: `${name} valoriza o Tempo de Qualidade acima de tudo. Este livro ajuda a eliminar ruídos da sua rotina para que possa planejar encontros focados em presença absoluta.`
    });
  } else if (person.loveLanguage === 'gifts') {
    recommendations.push({
      title: 'A Arte da Generosidade (The Art of Giving)',
      author: 'Vários Autores',
      reason: `Ajuda a entender como o ato de presentear expressa gratidão emocional, sintonizando com a linguagem receptora do(a) ${name}.`
    });
  } else if (person.loveLanguage === 'service') {
    recommendations.push({
      title: 'Dar e Receber (Give and Take)',
      author: 'Adam Grant',
      reason: `Como o(a) ${name} valoriza Atos de Serviço, este livro sobre cooperação e sucesso demonstra como apoiar o outro constrói parcerias inabaláveis.`
    });
  } else if (person.loveLanguage === 'touch') {
    recommendations.push({
      title: 'O Poder do Toque Humano',
      author: 'Dacher Keltner',
      reason: `Explica a ciência neurológica e os impactos profundos da proximidade e presença física nas conexões emocionais de quem prefere o Toque Físico.`
    });
  }

  // 3. Resolve by MBTI Personality
  const mbti = person.mbti || '';
  if (mbti.includes('INT') || mbti.includes('IST')) {
    recommendations.push({
      title: 'Rápido e Devagar: Duas Formas de Pensar',
      author: 'Daniel Kahneman',
      reason: `Esta obra de economia comportamental e psicologia lógica é um deleite absoluto para a mente analítica e ultra-racional de um perfil ${mbti} como ${name}.`
    });
  } else if (mbti.includes('INF') || mbti.includes('ISF')) {
    recommendations.push({
      title: 'Quiet: O Poder dos Introvertidos',
      author: 'Susan Cain',
      reason: `Sendo um temperamento introvertido e guiado por valores sentimentais, esta obra vai fazer o(a) ${name} sentir-se incrivelmente compreendido(a) e valorizado(a).`
    });
  } else if (mbti.includes('ENF') || mbti.includes('ENT')) {
    recommendations.push({
      title: 'Como Fazer Amigos e Influenciar Pessoas',
      author: 'Dale Carnegie',
      reason: `O manual lendário de inteligência social. Encaixa perfeitamente na liderança carismática e no perfil empático do(a) ${name}.`
    });
  }

  // Fallback default recommendation
  if (recommendations.length === 0) {
    recommendations.push({
      title: 'O Pequeno Príncipe',
      author: 'Antoine de Saint-Exupéry',
      reason: `Um livro universal e atemporal sobre a responsabilidade de cultivar laços e 'cativar' os outros. Um excelente ponto de partida neutro de conexão.`
    });
  }

  // Limit to max 2 unique recommendations
  const seen = new Set();
  const uniqueRecs = [];
  for (const r of recommendations) {
    const key = `${r.title}-${r.author}`;
    if (!seen.has(key)) {
      seen.add(key);
      uniqueRecs.push(r);
    }
    if (uniqueRecs.length >= 2) break;
  }

  return uniqueRecs;
}

export function RelationshipAnalyticsView({ onSelectPerson }) {
  const people = useRelationshipStore(s => s.people);

  const circles = useMemo(() => getDunbarCircles(people), [people]);
  const alerts  = useMemo(() => getAlerts(people), [people]);
  const health  = useMemo(() => getSocialHealth(people), [people]);

  // Dist por categoria
  const catDist = useMemo(() => {
    const map = {};
    people.forEach(p => {
      map[p.categoryId] = (map[p.categoryId] || 0) + 1;
    });
    return map;
  }, [people]);

  // Most neglected contacts (Intimate or Close circles + highest days without contact)
  const neglectedPeople = useMemo(() => {
    return [...people]
      .filter(p => p.relationshipScore >= 36 && p.lastInteraction)
      .sort((a, b) => (daysSince(b.lastInteraction) || 0) - (daysSince(a.lastInteraction) || 0))
      .slice(0, 3);
  }, [people]);

  // Resolve literature advice for all neglected people
  const neglectedRecommendations = useMemo(() => {
    return neglectedPeople.map(p => {
      return {
        person: p,
        days: daysSince(p.lastInteraction),
        recs: getLiteratureRecommendation(p),
      };
    });
  }, [neglectedPeople]);

  const healthScore = health.score;

  if (people.length === 0) {
    return (
      <div className="rounded-3xl p-12 text-center bg-gray-900/20 border border-gray-800">
        <div className="text-5xl mb-4 opacity-30">🌐</div>
        <p className="font-black text-text-muted mb-1 uppercase tracking-wider text-xs">Aguardando Massa de Dados</p>
        <p className="text-xs text-text-dim max-w-xs mx-auto leading-relaxed uppercase font-bold mt-2">
          Cadastre contactos e registe as suas primeiras interações para gerar os diagnósticos de saúde social.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">

      {/* ── SAÚDE SOCIAL GERAL ────────────────────────────────────────────── */}
      <div className="rounded-3xl p-6 bg-gradient-to-b from-[#111827] to-[#030712] border border-gray-800 shadow-xl relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:24px_24px] opacity-10" />
        
        <div className="flex items-center justify-between mb-4 z-10 relative">
          <p className="text-xs font-black text-gray-400 uppercase tracking-widest">
            🌡️ Quociente de Saúde Social
          </p>
          <span className="text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-wider border"
            style={{ backgroundColor: health.color + '15', color: health.color, borderColor: health.color + '33' }}>
            {health.label}
          </span>
        </div>
        
        <div className="flex items-end gap-5 z-10 relative">
          <div className="text-6xl font-black tracking-tight" style={{ color: health.color }}>{healthScore}</div>
          <div className="flex-1 pb-2">
            <div className="h-3.5 rounded-full overflow-hidden bg-gray-900 border border-gray-800/80">
              <div className="h-full rounded-full transition-all duration-1000"
                style={{ width: `${healthScore}%`, backgroundColor: health.color }} />
            </div>
            <div className="flex justify-between text-[9px] text-gray-500 font-bold uppercase tracking-widest mt-1.5">
              <span>Isolamento</span><span>Conexão Ideal</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3 mt-6 z-10 relative">
          {[
            { label: 'Registados', value: people.length, color: ACCENT },
            { label: 'Activos (30d)', value: people.filter(p => (daysSince(p.lastInteraction) || 999) <= 30).length, color: '#10B981' },
            { label: 'Íntimos (Dunbar)', value: circles.intimate.length, color: '#F59E0B' },
          ].map(s => (
            <div key={s.label} className="rounded-2xl p-3 text-center bg-black/40 border border-gray-850">
              <div className="text-2xl font-black" style={{ color: s.color }}>{s.value}</div>
              <div className="text-[9px] text-gray-500 font-bold uppercase tracking-wider mt-1">{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ── ALERTA DE RECONEXÃO / COOLING ─────────────────────────────────── */}
      {(alerts.cooling.length > 0 || alerts.attention.length > 0 || alerts.birthdays.length > 0) && (
        <div className="rounded-3xl overflow-hidden bg-gray-900/30 border border-gray-800">
          <div className="px-5 py-3.5 border-b border-gray-800 bg-black/20">
            <p className="text-xs font-black text-gray-300 uppercase tracking-widest">🚨 Sinais de Alerta Ativos</p>
          </div>
          <div className="p-5 space-y-4">
            {alerts.cooling.length > 0 && (
              <div>
                <p className="text-[10px] font-black mb-2 uppercase tracking-wider flex items-center gap-1.5 text-red-400">
                  ❄️ Vínculos Esfriando (Sem contato +30 dias)
                </p>
                <div className="space-y-1 bg-black/20 rounded-2xl p-2 border border-gray-800/40">
                  {alerts.cooling.slice(0, 3).map(p => (
                    <MiniPersonRow key={p.id} person={p} onClick={onSelectPerson}
                      extra={`${daysSince(p.lastInteraction)} dias`} />
                  ))}
                </div>
              </div>
            )}
            {alerts.attention.length > 0 && (
              <div className={alerts.cooling.length > 0 ? 'border-t border-gray-800/40 pt-3' : ''}>
                <p className="text-[10px] font-black mb-2 uppercase tracking-wider flex items-center gap-1.5 text-yellow-500">
                  ⚠️ Perda de Tração (Sem contato 14-30 dias)
                </p>
                <div className="space-y-1 bg-black/20 rounded-2xl p-2 border border-gray-800/40">
                  {alerts.attention.slice(0, 3).map(p => (
                    <MiniPersonRow key={p.id} person={p} onClick={onSelectPerson}
                      extra={`${daysSince(p.lastInteraction)} dias`} />
                  ))}
                </div>
              </div>
            )}
            {alerts.birthdays.length > 0 && (
              <div className={(alerts.cooling.length > 0 || alerts.attention.length > 0) ? 'border-t border-gray-800/40 pt-3' : ''}>
                <p className="text-[10px] font-black mb-2 uppercase tracking-wider flex items-center gap-1.5 text-purple-400">
                  🎂 Ciclo de Aniversário Próximo (30 dias)
                </p>
                <div className="space-y-1 bg-black/20 rounded-2xl p-2 border border-gray-800/40">
                  {alerts.birthdays.map(p => {
                    const d = getBirthdayDaysLeft(p.birthday);
                    return (
                      <MiniPersonRow key={p.id} person={p} onClick={onSelectPerson}
                        extra={d === 0 ? 'HOJE! 🎉' : `em ${d}d`} />
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── INTELECTO SOCIAL: RECOMENDAÇÕES LITERÁRIAS ────────────────────── */}
      {neglectedRecommendations.length > 0 && (
        <div className="rounded-3xl overflow-hidden bg-gradient-to-b from-[#19152b] to-[#080512] border border-purple-950/40 shadow-xl">
          <div className="px-5 py-4 border-b border-purple-950/40 bg-black/40">
            <h4 className="text-xs font-black text-purple-300 uppercase tracking-widest flex items-center gap-1.5">
              <span>📚</span> Recomendações Literárias de Reconexão
            </h4>
            <p className="text-[9px] text-gray-500 uppercase tracking-wider font-bold mt-0.5">
              Sugestões algorítmicas baseadas em Afinidades, Linguagem do Amor e MBTI
            </p>
          </div>

          <div className="p-5 space-y-5 divide-y divide-purple-950/20">
            {neglectedRecommendations.map(({ person, days, recs }) => {
              const pColor = getLevelColor(person.relationshipScore);
              return (
                <div key={person.id} className="pt-4 first:pt-0 space-y-3">
                  {/* Subject info */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full flex items-center justify-center font-black text-white text-[9px]" style={{ background: pColor }}>
                        {person.name.charAt(0).toUpperCase()}
                      </div>
                      <span className="text-xs font-black text-white">{person.nickname || person.name}</span>
                    </div>
                    <span className="text-[9px] font-black uppercase text-red-400 bg-red-950/20 border border-red-900/30 px-2 py-0.5 rounded-full">
                      {days} dias frio
                    </span>
                  </div>

                  {/* Recommendations Cards */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pl-1">
                    {recs.map((rec, i) => (
                      <div key={i} className="p-4 rounded-2xl bg-black/40 border border-purple-950/20 text-xs flex flex-col justify-between space-y-2 hover:border-purple-500/30 transition-all">
                        <div>
                          <p className="text-[8px] font-black uppercase tracking-widest text-purple-400">Livro Recomendado</p>
                          <p className="font-black text-white mt-1 leading-normal text-xs">
                            {rec.title}
                          </p>
                          <p className="text-[10px] text-gray-500 font-bold uppercase mt-0.5">
                            por {rec.author}
                          </p>
                        </div>
                        <p className="text-[10px] text-gray-400 leading-relaxed italic bg-purple-500/5 p-2 rounded-xl border border-purple-500/10">
                          "{rec.reason}"
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── CÍRCULOS DE DUNBAR ─────────────────────────────────────────────── */}
      <div className="rounded-3xl overflow-hidden bg-gray-900/30 border border-gray-800">
        <div className="px-5 py-4 border-b border-gray-800 bg-black/20">
          <p className="text-xs font-black text-gray-300 uppercase tracking-widest">🔵 Distribuição de Dunbar</p>
          <p className="text-[9px] text-gray-500 font-bold uppercase mt-0.5">Teoria evolucionista de esferas sociais de intimidade</p>
        </div>
        <div className="divide-y divide-gray-800/40">
          {[
            { label: '💜 Íntimos',     desc: 'Máx. 5 pessoas (Eixo de sustentação)', list: circles.intimate,    color: '#A855F7' },
            { label: '💛 Próximos',    desc: 'Máx. 15 pessoas (Eixo de convívio)',   list: circles.close,       color: '#F59E0B' },
            { label: '🤝 Ativos',      desc: 'Máx. 50 pessoas (Eixo de afinidade)',  list: circles.active,      color: '#38BDF8' },
            { label: '👋 Conhecidos',  desc: 'Máx. 150 pessoas (Eixo periférico)',   list: circles.acquaintance, color: '#94A3B8' },
          ].map(circle => (
            <div key={circle.label} className="p-5">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <span className="text-xs font-black text-white uppercase tracking-wider">{circle.label}</span>
                  <span className="text-[9px] text-gray-500 font-bold uppercase ml-2">{circle.desc}</span>
                </div>
                <span className="text-sm font-black px-2.5 py-0.5 bg-black/40 border border-gray-800 rounded-lg" style={{ color: circle.color }}>{circle.list.length}</span>
              </div>
              {circle.list.length > 0 ? (
                <div className="flex flex-wrap gap-2 pt-1">
                  {circle.list.slice(0, 8).map(p => (
                    <button key={p.id} onClick={() => onSelectPerson(p)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all hover:opacity-80"
                      style={{ backgroundColor: circle.color + '12', color: circle.color, border: `1px solid ${circle.color}25` }}>
                      <Avatar name={p.name} color={circle.color} size={18} />
                      {p.nickname || p.name.split(' ')[0]}
                    </button>
                  ))}
                  {circle.list.length > 8 && (
                    <span className="px-3 py-1.5 rounded-xl text-xs text-text-dim bg-gray-900 border border-gray-850">
                      +{circle.list.length - 8}
                    </span>
                  )}
                </div>
              ) : (
                <p className="text-[10px] text-gray-500 italic uppercase font-bold pl-1 pt-1">Esfera desocupada.</p>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* ── CATEGORIAS GERAIS ──────────────────────────────────────────────── */}
      {Object.keys(catDist).length > 0 && (
        <div className="rounded-3xl p-5 bg-gray-900/30 border border-gray-800">
          <p className="text-xs font-black text-gray-400 uppercase tracking-widest mb-4">📊 Concentração por Categoria</p>
          <div className="space-y-3">
            {CATEGORIES.filter(c => catDist[c.id]).map(cat => {
              const count = catDist[cat.id] || 0;
              const pct   = Math.round((count / people.length) * 100);
              return (
                <div key={cat.id}>
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-2">
                      <span>{cat.emoji}</span>
                      <span className="text-xs font-black text-white uppercase tracking-wider">{cat.label}</span>
                    </div>
                    <span className="text-[10px] text-gray-500 font-mono font-bold">{count} ({pct}%)</span>
                  </div>
                  <div className="h-2 rounded-full overflow-hidden bg-gray-950 border border-gray-850">
                    <div className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: cat.color }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

    </div>
  );
}

export default RelationshipAnalyticsView;
