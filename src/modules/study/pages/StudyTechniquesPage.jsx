import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { StudyLayout } from '../components/StudyLayout';

const TECHNIQUES = [
  {
    id: 'feynman',
    name: 'Técnica Feynman',
    tagline: 'Se você não consegue explicar de forma simples, você não entendeu.',
    icon: '🧠',
    color: '#EC4899',
    difficulty: 'Fácil a Média',
    focus: 'Compreensão Profunda',
    steps: [
      'Escolha um assunto ou conceito complexo que acabou de estudar.',
      'Finja ensinar esse assunto para uma criança de 10 anos ou um leigo completo, usando linguagem ultra simples e analógica.',
      'Identifique as falhas ou lacunas na sua própria explicação (onde você travou ou usou jargões excessivos).',
      'Volte ao material de origem para sanar essas dúvidas e simplificar ainda mais.'
    ],
    proTip: 'No Phoenix App, você pode usar o campo "Feynman" ao finalizar uma sessão para resumir em áudio/voz ou escrever uma síntese simples.',
    cognitiveImpact: 'Força a reestruturação semântica e impede a ilusão de competência.'
  },
  {
    id: 'recall',
    name: 'Active Recall (Evocação Ativa)',
    tagline: 'A memória não se fortalece ao ler, mas ao tentar lembrar.',
    icon: '⚡',
    color: '#F97316',
    difficulty: 'Alta',
    focus: 'Consolidação de Memória',
    steps: [
      'Feche o livro, pause o vídeo ou desligue os slides.',
      'Escreva em uma folha em branco ou diga em voz alta tudo o que se lembra sobre o tópico estudado.',
      'Não consulte o material de consulta até ter exaurido o esforço de lembrar.',
      'Abra o material e faça uma verificação ativa (em vermelho) do que errou ou esqueceu.'
    ],
    proTip: 'Após cada bloco de 25 minutos, faça 3 minutos de Recall mental absoluto. Use o indicador "Recall" nas suas sessões.',
    cognitiveImpact: 'Cria novos caminhos neurais e fortalece as sinapses de recuperação.'
  },
  {
    id: 'mpa',
    name: 'Método de Pegs de Associação (MPA)',
    tagline: 'Associe conceitos abstratos a marcos visuais físicos.',
    icon: '🔗',
    color: '#A855F7',
    difficulty: 'Média',
    focus: 'Memorização de Listas',
    steps: [
      'Crie um cabide mental usando números de 1 a 10 (ex: 1 = Sol, 2 = Sapato, 3 = Árvore).',
      'Para cada item da lista que precisa decorar, crie uma imagem mental absurda e exagerada ligando o item ao peg correspondente.',
      'Exemplo: Se o item 1 for "Constituição Federal", imagine o Sol brilhando com a capa da constituição queimando.',
      'Recupere a lista mentalmente percorrendo os pegs numéricos.'
    ],
    proTip: 'Ideal para decorar leis, prazos processuais e listas de características em concursos públicos.',
    cognitiveImpact: 'Aproveita o córtex visual e espacial, que possui capacidade de memória infinitamente superior.'
  },
  {
    id: 'mapa',
    name: 'Mapas Mentais Ativos',
    tagline: 'Uma árvore hierárquica de palavras-chave para o seu cérebro visual.',
    icon: '🗺️',
    color: '#14B8A6',
    difficulty: 'Média',
    focus: 'Estruturação de Matérias',
    steps: [
      'Coloque o conceito central no meio de uma página horizontal.',
      'Crie ramificações grossas para os subtópicos principais e ramos finos para os secundários.',
      'Use estritamente palavras-chave, ícones e cores diferentes para cada ramo principal.',
      'Construa-o preferencialmente de memória (mapa mental ativo) em vez de apenas copiar o livro.'
    ],
    proTip: 'Útil antes de revisar um assunto volumoso. Faça um rascunho rápido para mapear os pontos cegos.',
    cognitiveImpact: 'Promove a organização hierárquica do conhecimento e facilita o mapeamento espacial.'
  },
  {
    id: 'questoes',
    name: 'Engenharia Reversa de Questões',
    tagline: 'Aprenda resolvendo e decifrando o padrão da banca.',
    icon: '🎯',
    color: '#10B981',
    difficulty: 'Alta',
    focus: 'Resolução Prática',
    steps: [
      'Selecione um bloco de 10 a 15 questões antes mesmo de ler profundamente a teoria do assunto.',
      'Resolva as questões e leia os comentários detalhados dos professores e outros concurseiros.',
      'Descubra quais artigos da lei ou conceitos doutrinários são mais repetidos pela banca.',
      'Utilize esse mapeamento para direcionar sua leitura teórica, focando no que realmente cai.'
    ],
    proTip: 'Marque o modo "Questões" ao registrar sua sessão para alimentar seu Mapa de Calor de Dificuldades.',
    cognitiveImpact: 'Treina o reconhecimento de padrões e ativa o viés de novidade no cérebro.'
  },
  {
    id: 'flashcards',
    name: 'Repetição Espaçada com Flashcards',
    tagline: 'Sistemas inteligentes (Anki) que mostram o card no momento exato do esquecimento.',
    icon: '🃏',
    color: '#F59E0B',
    difficulty: 'Média',
    focus: 'Retenção a Longo Prazo',
    steps: [
      'No verso do card, coloque apenas uma pergunta atômica (ex: "Qual o prazo para apelação cível?").',
      'No verso, coloque a resposta ultra direta (ex: "15 dias úteis, art. 1.003, § 5º do CPC").',
      'Revise diariamente. Se acertar com facilidade, o card aparecerá mais tarde; se errar, reaparecerá imediatamente.',
      'Evite criar cards com blocos de textos gigantes.'
    ],
    proTip: 'Mantenha os flashcards sincronizados e revise-os todos os dias pela manhã como um ritual de prontidão.',
    cognitiveImpact: 'Combate a Curva do Esquecimento de Ebbinghaus de forma cirúrgica.'
  },
  {
    id: 'leitura',
    name: 'Leitura Ativa Dialógica',
    tagline: 'Não seja um passageiro passivo no livro — dialogue com o autor.',
    icon: '📖',
    color: '#3B82F6',
    difficulty: 'Fácil',
    focus: 'Foco e Engajamento',
    steps: [
      'Antes de ler uma página, transforme os subtítulos em perguntas na sua mente.',
      'Leia o parágrafo buscando responder a essa pergunta específica.',
      'Faça anotações marginais sucintas (2 a 3 palavras) com suas próprias conclusões ou dúvidas.',
      'A cada página, gaste 15 segundos resumindo mentalmente o argumento do autor.'
    ],
    proTip: 'Excelente para evitar o "Efeito de Ler Sem Prestar Atenção", onde você lê 3 páginas e não lembra de nada.',
    cognitiveImpact: 'Mantém o córtex pré-frontal ativado por meio da curiosidade e engajamento linguístico.'
  },
  {
    id: 'pomodoro',
    name: 'Blocos de Foco Extremo (Focus Blocks)',
    tagline: 'Sprints hiperfocados sem interrupções seguidos de descanso tático.',
    icon: '⏱️',
    color: '#E11D48',
    difficulty: 'Fácil',
    focus: 'Gestão de Energia',
    steps: [
      'Escolha a tarefa e elimine 100% das distrações (celular em outro cômodo, abas fechadas).',
      'Inicie um cronômetro de 25 a 50 minutos de trabalho ininterrupto.',
      'Ao soar o alarme, faça uma pausa obrigatória de 5 a 10 minutos (levante-se, tome água, não olhe redes sociais).',
      'A cada 4 blocos de foco, faça uma pausa maior de 20 a 30 minutos.'
    ],
    proTip: 'A pausa deve ser usada para descanso cognitivo real. Olhar o celular anula o efeito restaurador da pausa.',
    cognitiveImpact: 'Previne a fadiga de decisão e maximiza a atenção sustentada.'
  }
];

export function StudyTechniquesPage() {
  const [selectedId, setSelectedId] = useState(null);

  return (
    <StudyLayout>
      <div className="flex flex-col max-h-[calc(100vh-80px)] overflow-y-auto custom-scrollbar pr-1 pb-10 space-y-6 animate-fade-in">
        {/* Cabeçalho */}
        <div>
          <h1
            className="text-2xl font-extrabold tracking-tight"
            style={{ color: 'var(--text-main)' }}
          >
            Painel de Técnicas
          </h1>
          <p className="text-sm mt-1" style={{ color: 'var(--text-dim)' }}>
            Selecione e domine estratégias de estudos consagradas pela neurociência cognitiva para maximizar sua retenção.
          </p>
        </div>

        {/* Grid de Técnicas */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {TECHNIQUES.map(tech => {
            const isSelected = selectedId === tech.id;
            return (
              <motion.div
                key={tech.id}
                layoutId={`card-${tech.id}`}
                onClick={() => setSelectedId(isSelected ? null : tech.id)}
                className="relative rounded-2xl border p-5 cursor-pointer transition-all hover:shadow-lg flex flex-col justify-between"
                style={{
                  background: 'var(--bg-surface)',
                  borderColor: isSelected ? tech.color : 'var(--border)',
                  borderTop: `4px solid ${tech.color}`,
                }}
              >
                <div>
                  {/* Topo */}
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-3xl">{tech.icon}</span>
                    <div className="flex gap-1.5">
                      <span
                        className="text-[9px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider"
                        style={{
                          background: tech.color + '15',
                          color: tech.color,
                        }}
                      >
                        {tech.focus}
                      </span>
                    </div>
                  </div>

                  {/* Nome e Tagline */}
                  <h3
                    className="font-extrabold text-base mb-1 transition-colors"
                    style={{ color: isSelected ? tech.color : 'var(--text-main)' }}
                  >
                    {tech.name}
                  </h3>
                  <p
                    className="text-xs line-clamp-2"
                    style={{ color: 'var(--text-dim)' }}
                  >
                    {tech.tagline}
                  </p>
                </div>

                {/* Footer resumido */}
                <div
                  className="mt-4 pt-3 border-t flex items-center justify-between text-[10px]"
                  style={{ borderColor: 'var(--border)', color: 'var(--text-muted)' }}
                >
                  <span>Dificuldade: <strong className="text-text-main">{tech.difficulty}</strong></span>
                  <span
                    className="font-bold underline cursor-pointer hover:opacity-80"
                    style={{ color: tech.color }}
                  >
                    {isSelected ? 'Ver menos' : 'Ver protocolo →'}
                  </span>
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Modal/Protocolo de Detalhes Expandido */}
        <AnimatePresence>
          {selectedId && (
            (() => {
              const tech = TECHNIQUES.find(t => t.id === selectedId);
              return (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md"
                  onClick={() => setSelectedId(null)}
                >
                  <motion.div
                    initial={{ scale: 0.95, y: 20 }}
                    animate={{ scale: 1, y: 0 }}
                    exit={{ scale: 0.95, y: 20 }}
                    onClick={e => e.stopPropagation()}
                    className="w-full max-w-lg rounded-2xl overflow-hidden border p-6 flex flex-col gap-5 max-h-[85vh] overflow-y-auto"
                    style={{
                      background: 'var(--bg-surface)',
                      borderColor: 'var(--border-strong)',
                      borderTop: `6px solid ${tech.color}`,
                    }}
                  >
                    {/* Header do Protocolo */}
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <span className="text-4xl">{tech.icon}</span>
                        <div>
                          <h2
                            className="text-xl font-extrabold"
                            style={{ color: 'var(--text-main)' }}
                          >
                            {tech.name}
                          </h2>
                          <p
                            className="text-[10px] font-bold uppercase tracking-widest mt-0.5"
                            style={{ color: tech.color }}
                          >
                            Protocolo Científico
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={() => setSelectedId(null)}
                        className="text-text-dim w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white/5"
                      >
                        ✕
                      </button>
                    </div>

                    <p
                      className="text-sm font-medium italic border-l-2 pl-3 py-1"
                      style={{
                        borderColor: tech.color,
                        color: 'var(--text-muted)',
                      }}
                    >
                      "{tech.tagline}"
                    </p>

                    {/* Passos de Execução */}
                    <div className="space-y-3">
                      <h4
                        className="text-xs font-bold uppercase tracking-wider"
                        style={{ color: 'var(--text-dim)' }}
                      >
                        📋 Como executar passo a passo:
                      </h4>
                      <ol className="space-y-2">
                        {tech.steps.map((step, index) => (
                          <li key={index} className="flex gap-3 text-xs leading-relaxed">
                            <span
                              className="w-5 h-5 rounded-full shrink-0 flex items-center justify-center font-bold text-[10px] text-white"
                              style={{ background: tech.color }}
                            >
                              {index + 1}
                            </span>
                            <span style={{ color: 'var(--text-main)' }}>{step}</span>
                          </li>
                        ))}
                      </ol>
                    </div>

                    {/* Cognição & Dica de Uso */}
                    <div
                      className="p-4 rounded-xl space-y-3"
                      style={{ background: 'var(--bg-surface-2)' }}
                    >
                      <div className="space-y-1">
                        <h5 className="text-[10px] font-bold uppercase tracking-widest text-text-dim">
                          🧠 Mecanismo Cognitivo:
                        </h5>
                        <p className="text-xs" style={{ color: 'var(--text-main)' }}>
                          {tech.cognitiveImpact}
                        </p>
                      </div>

                      <div className="space-y-1">
                        <h5 className="text-[10px] font-bold uppercase tracking-widest text-text-dim">
                          💡 Dica de Integração no App:
                        </h5>
                        <p className="text-xs font-medium" style={{ color: tech.color }}>
                          {tech.proTip}
                        </p>
                      </div>
                    </div>

                    {/* Botão de Fechar */}
                    <button
                      onClick={() => setSelectedId(null)}
                      className="w-full py-2.5 rounded-xl font-bold text-xs text-white transition-opacity hover:opacity-90"
                      style={{ background: tech.color }}
                    >
                      Entendi e Quero Praticar
                    </button>
                  </motion.div>
                </motion.div>
              );
            })()
          )}
        </AnimatePresence>
      </div>
    </StudyLayout>
  );
}
