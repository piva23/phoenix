import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { StudyLayout } from '../components/StudyLayout';
import { BentoCard, SectionHeader } from '../components/BentoCard';

const TECHNIQUES = [
  {
    id: 'feynman', name: 'Técnica Feynman', icon: '🧠', color: '#EC4899',
    tagline: 'Se você não consegue explicar de forma simples, você não entendeu.',
    difficulty: 'Fácil a Média', focus: 'Compreensão Profunda',
    steps: ['Escolha um assunto ou conceito complexo que acabou de estudar.', 'Finja ensinar esse assunto para uma criança de 10 anos ou um leigo completo, usando linguagem ultra simples e analógica.', 'Identifique as falhas ou lacunas na sua própria explicação (onde você travou ou usou jargões excessivos).', 'Volte ao material de origem para sanar essas dúvidas e simplificar ainda mais.'],
    proTip: 'No Phoenix App, você pode usar o campo "Feynman" ao finalizar uma sessão para resumir em áudio/voz ou escrever uma síntese simples.',
    cognitiveImpact: 'Força a reestruturação semântica e impede a ilusão de competência.',
  },
  {
    id: 'recall', name: 'Active Recall', icon: '⚡', color: '#F97316',
    tagline: 'A memória não se fortalece ao ler, mas ao tentar lembrar.',
    difficulty: 'Alta', focus: 'Consolidação de Memória',
    steps: ['Feche o livro, pause o vídeo ou desligue os slides.', 'Escreva em uma folha em branco ou diga em voz alta tudo o que se lembra sobre o tópico estudado.', 'Não consulte o material até ter exaurido o esforço de lembrar.', 'Abra o material e faça uma verificação ativa do que errou ou esqueceu.'],
    proTip: 'Após cada bloco de 25 minutos, faça 3 minutos de Recall mental absoluto.',
    cognitiveImpact: 'Cria novos caminhos neurais e fortalece as sinapses de recuperação.',
  },
  {
    id: 'mpa', name: 'Método de Pegs de Associação', icon: '🔗', color: '#A855F7',
    tagline: 'Associe conceitos abstratos a marcos visuais físicos.',
    difficulty: 'Média', focus: 'Memorização de Listas',
    steps: ['Crie um cabide mental usando números de 1 a 10 (ex: 1 = Sol, 2 = Sapato).', 'Para cada item, crie uma imagem mental absurda e exagerada ligando o item ao peg correspondente.', 'Exemplo: Se o item 1 for "Constituição Federal", imagine o Sol brilhando com a capa da constituição queimando.', 'Recupere a lista mentalmente percorrendo os pegs numéricos.'],
    proTip: 'Ideal para decorar leis, prazos processuais e listas de características em concursos públicos.',
    cognitiveImpact: 'Aproveita o córtex visual e espacial, que possui capacidade de memória infinitamente superior.',
  },
  {
    id: 'mapa', name: 'Mapas Mentais Ativos', icon: '🗺️', color: '#14B8A6',
    tagline: 'Uma árvore hierárquica de palavras-chave para o seu cérebro visual.',
    difficulty: 'Média', focus: 'Estruturação de Matérias',
    steps: ['Coloque o conceito central no meio de uma página horizontal.', 'Crie ramificações grossas para os subtópicos principais e ramos finos para os secundários.', 'Use estritamente palavras-chave, ícones e cores diferentes para cada ramo.', 'Construa-o preferencialmente de memória em vez de apenas copiar o livro.'],
    proTip: 'Útil antes de revisar um assunto volumoso. Faça um rascunho rápido para mapear os pontos cegos.',
    cognitiveImpact: 'Promove a organização hierárquica do conhecimento e facilita o mapeamento espacial.',
  },
  {
    id: 'questoes', name: 'Engenharia Reversa de Questões', icon: '🎯', color: '#10B981',
    tagline: 'Aprenda resolvendo e decifrando o padrão da banca.',
    difficulty: 'Alta', focus: 'Resolução Prática',
    steps: ['Selecione um bloco de 10 a 15 questões antes de ler profundamente a teoria.', 'Resolva as questões e leia os comentários detalhados dos professores.', 'Descubra quais artigos da lei ou conceitos são mais repetidos pela banca.', 'Utilize esse mapeamento para direcionar sua leitura teórica, focando no que realmente cai.'],
    proTip: 'Marque o modo "Questões" ao registrar sua sessão para alimentar seu Mapa de Calor de Dificuldades.',
    cognitiveImpact: 'Treina o reconhecimento de padrões e ativa o viés de novidade no cérebro.',
  },
  {
    id: 'flashcards', name: 'Repetição Espaçada com Flashcards', icon: '🃏', color: '#F59E0B',
    tagline: 'Sistemas inteligentes que mostram o card no momento exato do esquecimento.',
    difficulty: 'Média', focus: 'Retenção a Longo Prazo',
    steps: ['No verso do card, coloque apenas uma pergunta atômica.', 'No anverso, coloque a resposta ultra direta com referência.', 'Revise diariamente. Se acertar com facilidade, o card aparecerá mais tarde; se errar, reaparecerá imediatamente.', 'Evite criar cards com blocos de textos gigantes.'],
    proTip: 'Mantenha os flashcards sincronizados e revise-os todos os dias pela manhã como um ritual.',
    cognitiveImpact: 'Combate a Curva do Esquecimento de Ebbinghaus de forma cirúrgica.',
  },
  {
    id: 'leitura', name: 'Leitura Ativa Dialógica', icon: '📖', color: '#3B82F6',
    tagline: 'Não seja um passageiro passivo no livro — dialogue com o autor.',
    difficulty: 'Fácil', focus: 'Foco e Engajamento',
    steps: ['Antes de ler uma página, transforme os subtítulos em perguntas na sua mente.', 'Leia o parágrafo buscando responder a essa pergunta específica.', 'Faça anotações marginais sucintas com suas próprias conclusões ou dúvidas.', 'A cada página, gaste 15 segundos resumindo mentalmente o argumento do autor.'],
    proTip: 'Excelente para evitar o "Efeito de Ler Sem Prestar Atenção".',
    cognitiveImpact: 'Mantém o córtex pré-frontal ativado por meio da curiosidade e engajamento linguístico.',
  },
  {
    id: 'pomodoro', name: 'Blocos de Foco Extremo', icon: '⏱️', color: '#E11D48',
    tagline: 'Sprints hiperfocados sem interrupções seguidos de descanso tático.',
    difficulty: 'Fácil', focus: 'Gestão de Energia',
    steps: ['Escolha a tarefa e elimine 100% das distrações.', 'Inicie um cronômetro de 25 a 50 minutos de trabalho ininterrupto.', 'Ao soar o alarme, faça uma pausa obrigatória de 5 a 10 minutos.', 'A cada 4 blocos de foco, faça uma pausa maior de 20 a 30 minutos.'],
    proTip: 'A pausa deve ser usada para descanso cognitivo real. Olhar o celular anula o efeito restaurador.',
    cognitiveImpact: 'Previne a fadiga de decisão e maximiza a atenção sustentada.',
  },
];

export default function StudyTechniquesPageV2() {
  const [selectedId, setSelectedId] = useState(null);
  const selected = selectedId ? TECHNIQUES.find(t => t.id === selectedId) : null;

  return (
    <StudyLayout wide>
      <SectionHeader title="Painel de Técnicas" count={TECHNIQUES.length} icon="🧠" />
      <p className="text-xs mb-5 -mt-2" style={{ color: 'var(--text-dim)' }}>
        Estratégias de estudo consagradas pela neurociência cognitiva para maximizar sua retenção.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {TECHNIQUES.map((tech, i) => (
          <BentoCard
            key={tech.id}
            span="full"
            onClick={() => setSelectedId(selectedId === tech.id ? null : tech.id)}
            glow={tech.color + '30'}
            className="group"
          >
            <motion.div
              layoutId={`tech-card-${tech.id}`}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.04, duration: 0.35 }}
            >
              <div className="flex items-center justify-between mb-3">
                <span className="text-2xl">{tech.icon}</span>
                <span
                  className="text-[9px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider"
                  style={{ background: tech.color + '18', color: tech.color }}
                >
                  {tech.focus}
                </span>
              </div>
              <h3
                className="font-extrabold text-sm mb-1 transition-colors"
                style={{ color: selectedId === tech.id ? tech.color : 'var(--text-main)' }}
              >
                {tech.name}
              </h3>
              <p className="text-[11px] line-clamp-2 leading-relaxed" style={{ color: 'var(--text-dim)' }}>
                {tech.tagline}
              </p>
              <div
                className="mt-3 pt-2.5 border-t flex items-center justify-between text-[10px]"
                style={{ borderColor: 'var(--border)', color: 'var(--text-muted)' }}
              >
                <span>Dificuldade: <strong style={{ color: 'var(--text-main)' }}>{tech.difficulty}</strong></span>
                <span className="font-bold underline" style={{ color: tech.color }}>
                  {selectedId === tech.id ? 'Ver menos' : 'Ver protocolo →'}
                </span>
              </div>
            </motion.div>
          </BentoCard>
        ))}
      </div>

      <AnimatePresence>
        {selected && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md"
            onClick={() => setSelectedId(null)}
          >
            <motion.div
              initial={{ scale: 0.92, y: 24, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.92, y: 24, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 350, damping: 28 }}
              onClick={e => e.stopPropagation()}
              className="w-full max-w-lg rounded-2xl overflow-hidden border p-6 flex flex-col gap-5 max-h-[85vh] overflow-y-auto backdrop-blur-2xl"
              style={{
                background: 'rgba(15,15,20,0.85)',
                borderColor: selected.color + '40',
                borderTop: `6px solid ${selected.color}`,
                boxShadow: `0 0 60px ${selected.color}15, 0 25px 50px rgba(0,0,0,0.5)`,
              }}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-4xl">{selected.icon}</span>
                  <div>
                    <h2 className="text-xl font-extrabold" style={{ color: 'var(--text-main)' }}>
                      {selected.name}
                    </h2>
                    <p className="text-[10px] font-bold uppercase tracking-widest mt-0.5" style={{ color: selected.color }}>
                      Protocolo Científico
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedId(null)}
                  className="text-text-dim w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white/5 transition-colors"
                >
                  ✕
                </button>
              </div>

              <p
                className="text-sm font-medium italic border-l-2 pl-3 py-1"
                style={{ borderColor: selected.color, color: 'var(--text-muted)' }}
              >
                &ldquo;{selected.tagline}&rdquo;
              </p>

              <div className="space-y-3">
                <h4 className="text-[10px] font-bold uppercase tracking-wider" style={{ color: 'var(--text-dim)' }}>
                  📋 Como executar passo a passo:
                </h4>
                <ol className="space-y-2">
                  {selected.steps.map((step, idx) => (
                    <motion.li
                      key={idx}
                      initial={{ opacity: 0, x: -8 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.1 + idx * 0.06 }}
                      className="flex gap-3 text-xs leading-relaxed"
                    >
                      <span
                        className="w-5 h-5 rounded-full shrink-0 flex items-center justify-center font-bold text-[10px] text-white"
                        style={{ background: selected.color }}
                      >
                        {idx + 1}
                      </span>
                      <span style={{ color: 'var(--text-main)' }}>{step}</span>
                    </motion.li>
                  ))}
                </ol>
              </div>

              <div className="p-4 rounded-xl space-y-3" style={{ background: 'var(--bg-surface-2)' }}>
                <div className="space-y-1">
                  <h5 className="text-[10px] font-bold uppercase tracking-widest text-text-dim">🧠 Mecanismo Cognitivo:</h5>
                  <p className="text-xs" style={{ color: 'var(--text-main)' }}>{selected.cognitiveImpact}</p>
                </div>
                <div className="space-y-1">
                  <h5 className="text-[10px] font-bold uppercase tracking-widest text-text-dim">💡 Dica de Integração no App:</h5>
                  <p className="text-xs font-medium" style={{ color: selected.color }}>{selected.proTip}</p>
                </div>
              </div>

              <button
                onClick={() => setSelectedId(null)}
                className="w-full py-2.5 rounded-xl font-bold text-xs text-white transition-opacity hover:opacity-90"
                style={{ background: selected.color }}
              >
                Entendi e Quero Praticar
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </StudyLayout>
  );
}
