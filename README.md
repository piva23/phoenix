# 🜁 Phoenix OS — README v2.5

> **Sistema Operacional Pessoal de Evolução**
> Um app React que organiza a vida inteira em módulos integrados, com XP, personas, analytics e persistência local.

---

## O que é o Phoenix OS

Phoenix OS não é um app de tarefas. Não é um app de hábitos.
É uma representação digital da sua vida — organizada por **Personas** que definem contexto, cor, foco e XP.

Cada ação em qualquer módulo gera XP que alimenta um **Radar RPG** de 6 eixos de evolução pessoal.

```
Pessoa → Persona Ativa → Módulos → Ações → XP → Radar de Evolução
```

---

## Stack Tecnológica

| Camada | Tecnologia |
|---|---|
| Framework | React (CRA) |
| Roteamento | React Router DOM |
| Estado global | Zustand + persist middleware |
| Persistência | LocalStorage (Firebase preparado) |
| Estilo | Tailwind v3 + CSS vars dinâmicas por persona |
| Animações | Framer Motion |
| Gráficos | Recharts |
| Notificações | React Hot Toast |
| Formulários | React Hook Form |
| Utilitários | clsx, date-fns |

---

## Arquitetura de Pastas

```
src/
├── app/
│   ├── App.jsx                    # Root: providers + rotas
│   └── ThemeEffect.jsx            # CSS vars da persona ativa no :root
│
├── layouts/
│   ├── MainLayout.jsx             # Wrapper geral
│   ├── Sidebar.jsx                # Navegação desktop
│   ├── BottomBar.jsx              # Navegação mobile (tabs fixas)
│   └── Topbar.jsx                 # Header mobile
│
├── stores/                        # 14 stores Zustand
│   ├── useUserStore.js            # nome, level, XP total
│   ├── usePersonaStore.js         # personas[], ativa, XP por persona
│   ├── useUIStore.js              # sidebar, tab ativa, favoritos
│   ├── useXPStore.js              # log de XP, radar 6 eixos
│   ├── useCalendarStore.js        # eventos unificados
│   ├── useStudyStore.js           # subjects → topics → subtopics → flashcards
│   ├── useSessionStore.js         # sessões de estudo
│   ├── useRevisionStore.js        # revisões R1→R6
│   ├── useRedacaoStore.js         # redações, temas, partes, anotações
│   ├── useConcursoStore.js        # concursos e editais
│   ├── useCycleStore.js           # ciclos de estudo
│   ├── useVisionStore.js          # vision board
│   ├── useHealthStore.js          # água, treino, corrida, dieta
│   └── useFinanceStore.js         # transações, orçamento, cartões, investimento
│
├── shared/
│   ├── constants/
│   │   ├── xpRules.js             # Regras de XP por ação
│   │   ├── studyTypes.js          # Tipos de estudo (teoria/questões/etc)
│   │   ├── personas.js            # Personas padrão
│   │   └── revisionStages.js      # Intervalos R1→R6
│   └── utils/
│       ├── time.js                # today(), formatTime(), etc
│       ├── xp.js                  # Cálculo de level (100×N²)
│       └── revisions.js           # Geração de datas de revisão
│
└── modules/                       # 9 módulos funcionais + 3 placeholders
    ├── dashboard/
    ├── personas/
    ├── calendar/
    ├── study/
    ├── projects/
    ├── health/
    ├── finance/
    ├── analytics/
    └── settings/
```

---

## Sistema de Personas

5 personas pré-configuradas, cada uma com tema de cores próprio:

| Persona | Foco | Cor |
|---|---|---|
| 🌞 Hórus | Estudo e Concurso | Âmbar |
| ⚔️ AJAA | Trabalho e Produtividade | Violeta |
| 🏛️ Atlas | Projetos e Construção | Índigo |
| 🪙 Mercurius | Finanças e Riqueza | Esmeralda |
| 👑 Pai Supremo | Família e Equilíbrio | Laranja |

A persona ativa muda o tema visual do app inteiro em tempo real via CSS vars.
Cada persona acumula XP próprio além do XP global.

---

## Sistema de XP e Radar

### Fórmula de Level
```
XP para o próximo nível = 100 × N²
Nível 1 → 2: 100 XP
Nível 2 → 3: 400 XP
Nível 5 → 6: 2.500 XP
```

### Radar RPG — 6 eixos
```
conhecimento  → sessões de estudo, redações, projetos concluídos
disciplina    → streak de estudo, treino, água, metas diárias
foco          → sessões longas, simulados, ciclo cumprido
consistência  → dias consecutivos ativos em qualquer módulo
velocidade    → questões resolvidas, sessões rápidas
retenção      → revisões concluídas, flashcards acertados
```

### Tabela de XP por ação

| Ação | XP | Eixo |
|---|---|---|
| Minuto de estudo | +1 XP | conhecimento |
| Questão correta | +2 XP | conhecimento |
| Sessão concluída | +20 XP | conhecimento |
| Revisão fácil | +15 XP | retenção |
| Revisão média | +10 XP | retenção |
| Revisão difícil | +5 XP | retenção |
| Flashcard revisado | +2 XP | retenção |
| Redação criada | +50 XP | conhecimento |
| Treino completo | +50 XP | disciplina |
| Meta de água | +30 XP | disciplina |
| Corrida registrada | +25 XP | disciplina |

---

## Módulos

### 📊 Dashboard
Página inicial com visão geral da vida.

- **Vision Board** — mural de metas visuais com imagens e texto
- Widget de XP e nível atual
- Resumo de estudo da semana
- Próximas revisões pendentes
- Streak geral
- Navegação rápida para módulos favoritos

---

### 🎭 Personas
Gerenciamento das personas de vida.

- Criar, editar e excluir personas
- Mudar persona ativa via FAB flutuante (qualquer tela)
- Cada persona: nome, emoji, descrição, cor primária, cor secundária, eixo radar principal
- XP acumulado por persona
- Histórico de uso

---

### 📅 Calendário
Visão unificada de todos os eventos da vida.

- Visualização mensal e semanal
- Eventos de estudo (sessões, revisões) aparecem automaticamente
- Eventos manuais com categoria e cor
- Integração com módulo de concursos (datas de prova)

---

### 📚 Study Engine v2.1
O módulo mais completo — gerencia todo o sistema de estudos para concurso.

**8 sub-abas:**

#### Matérias (`/study/subjects`)
- Grid de cards com 20 cores disponíveis
- KPIs por card: tempo total, questões, taxa de acerto
- Barra de progresso de subtópicos dominados
- Badge de peso no edital
- Clique → página de detalhe da matéria

#### Matéria (`/study/subjects/:id`)
- Header com KPIs e progresso geral
- Seção "Material Geral" (links, PDFs, documentos)
- Tópicos expansíveis com subtópicos inline
- Ações rápidas: marcar como estudado, revisão, sessão
- Clique no subtópico → página de conteúdo

#### Subtópico (`/study/subjects/:id/:topicId/:subtopicId`)
- **Teoria**: editor markdown funcional (H1/H2/H3, negrito, itálico, código, citações, listas)
  - 3 modos: Editar / Split (lado a lado) / Preview
  - Toolbar de inserção rápida
- **Mapa Mental**: suporte a imagem (zoom fullscreen), PDF (iframe), caminho local (clipboard)
- **Materiais**: links externos + caminhos locais com cópia automática
- **Questões**: placeholder para v3.0
- **Flashcards**: acesso direto ao deck do subtópico

#### Sessão (`/study/session`)
- Setup: matéria, tópico, subtópico, tipo de estudo
- Cronômetro com pause/retomar
- Pós-sessão: questões, páginas, minutos de aula, dificuldade, foco, energia
- Pergunta "Você dominou este subtópico?"
- Toggle de revisão automática (gera R1→R6)
- Tela de resultado com XP ganho

#### Revisões (`/study/revisions`)
- Tabs: Pendentes / Próximas / Histórico
- Link direto para o conteúdo do subtópico
- Modal de conclusão: escolha o método (releitura/questões/flashcards/feynman) → pontua fácil/médio/difícil
- Toggle "Registrar sessão ao concluir"
- Editar data de revisão individualmente

#### Flashcards (`/study/flashcards`)
- Dashboard "Meus Baralhos": KPIs globais + lista de decks
- Importar JSON (`[{question, answer, difficulty}]`)
- Exportar JSON
- Modo estudo: flip 3D, botões Errei/Difícil/Fácil
- Suporte a `<b>`, `<i>`, `<code>`, `<br>` nos cards
- Tela de resultado com placar

#### Redação (`/study/redacao`)
- Banco de 15 temas pré-cadastrados (Direito Administrativo, Constitucional, Atualidades)
- Sortear tema aleatório ou criar tema livre
- Editor por partes (Introdução, Desenvolvimento 1, Desenvolvimento 2, Conclusão)
- **Partes customizáveis**: renomear, adicionar, remover, ajustar meta de linhas
- Contagem de palavras e linhas por parte
- **Anotações de correção** por parte (toggle 💬)
- Exportar PDF via window.print()

#### Ciclo de Estudos (`/study/cycle`)
- Ciclo proporcional ao peso de cada matéria no edital
- **Importar edital**: cola texto "Matéria - 20%" → cria matérias automaticamente
- Editar ciclo ativo sem recriar
- Destaque da próxima matéria com tempo restante
- Progresso por matéria na rodada atual
- Avançar rodada quando todas concluídas

#### Analytics (`/study/analytics`)
- Filtro de período: 7 / 14 / 30 dias / Total
- Calendário mensal real (grade com intensidade por dia)
- Análise por matéria: maior facilidade / maior dificuldade
- Estudos do dia: lista de sessões de hoje
- KPIs: tempo total, sessões, taxa de revisão em dia

---

### 🗂️ Projects
Gerenciamento de projetos pessoais com estrutura OKR.

**Hierarquia:** Projeto → Objetivos → Key Results + Tasks

- Lista de projetos com filtro por persona e status
- Vinculação de projeto a uma persona
- **Visão Objetivos**: lista de OKRs com progresso
- **Gantt**: linha do tempo com milestones (◆)
- **Analytics do projeto**: gráfico de progresso, tasks por prioridade
- Tasks com prioridade (baixa/média/alta/crítica) → XP proporcional
- XP ao completar tasks (5/10/20/30 XP por prioridade)

---

### 💪 Saúde
Controle completo de saúde com toque único.

**3 tabs: Hoje / Planos / Analytics**

#### Hoje
**💧 Hidratação**
- Anel de progresso animado (ml atual / meta)
- Botões rápidos configuráveis: ☕150ml / 🥛200ml / 💧300ml / 🍶500ml / 🫙1L
- Timeline do dia com horário de cada registro
- Desfazer último registro
- XP ao bater 80% da meta (+30 XP)

**🏃 Corrida**
- Registrar minutos de corrida com um clique
- Semana atual do programa destacada (Sem 1-2: 20-30min, etc.)
- Streak visível
- XP ao registrar (+25 XP)

**💪 Musculação**
- Treino do dia automático (detecta dia da semana)
- Cada exercício: quadradinhos de série ■■□□
- **Toque = adiciona série → verde ao completar**
- Clique direito = desfaz última série
- Dia de descanso detectado automaticamente
- XP ao completar treino inteiro (+50 XP)
- Plano pré-carregado: Seg Peito+Tríceps / Ter Costas+Bíceps / Qua Ombros+Braços / Qui Peito+Costas / Sex Braço Pesado / Sáb Pernas+Core

**🍽️ Dieta**
- Refeições do dia em accordion por horário (7 refeições: 07h–22h)
- Cada item = chip clicável para marcar ✓
- Macros calculados em tempo real: kcal / proteína / carbo / gordura
- Barra de proteína (meta: 150g)
- 15 alimentos pré-calibrados: ovo, banana, carne, pão integral, iogurte, hipercalórico, etc.

#### Planos
- Editor de meta e botões de hidratação
- Editor de treino por dia da semana (exercícios, séries, reps, obs, descanso)
- Data de início do programa de corrida (calcula semana automaticamente)
- Editor completo do plano alimentar (horários, ícones, itens, macros)

#### Analytics
- **Streaks** com recorde histórico: água / corrida / treino / dieta
- **Heatmap 90 dias** — intensidade por número de áreas completadas
- **Resumo semanal**: dias de cada área nos últimos 7 dias
- Gráfico de água (14 dias), corrida (14 dias), proteína (7 dias)

---

### 💰 Finanças
Controle financeiro completo com orçamento vs realizado e parcelas.

**5 tabs: Visão Geral / Lançamentos / Cartões / Orçamento / Investimentos**

#### Visão Geral
- KPIs do mês: Receitas / Gastos / Saldo
- Gráfico de barras: receita vs gasto — 6 meses
- Linha de saldo mensal
- Progresso por categoria com alertas de estouro
- Navegação por mês (◀ ▶)

#### Lançamentos
- **3 tipos**: Receita / Despesa / Parcelado no cartão
- **Compra parcelada**: escolha 2x a 12x
  - Distribui automaticamente nas faturas dos meses corretos
  - Considera o dia de fechamento do cartão
  - Ex: 10x de R$30 → ocupa categoria Vestuário por 10 meses
- Lista agrupada por data com filtro por categoria e mês
- Excluir parcela individual ou grupo inteiro

#### Cartões
- Visão de fatura estilo Nubank por mês
- Status: aberta / fechada, dias para fechar, data de vencimento
- Cada compra parcelada exibe "2/10", "3/10" etc.
- Barra de limite utilizado
- Cadastro de múltiplos cartões (nome, cor, fechamento, vencimento, limite)
- Nubank pré-cadastrado (fechamento dia 17, vencimento dia 24)

#### Orçamento
- Define valor orçado por categoria por mês
- Barra de progresso verde (dentro) / vermelho (estouro)
- "✓ Sobrou R$253" ou "⚠ Estourou R$62" por categoria
- Copiar orçamento do mês anterior com 1 clique
- **Saldo projetado** (orçamento) vs **Saldo real** (lançamentos) — lado a lado
- Gerenciar categorias: adicionar, editar, excluir

**19 categorias pré-cadastradas:**
- Receitas: Salário Adto, Salário Fim, Vale Alimentação, Renda Extra
- Despesas: Moradia, Alimentação/Mercado, Alimentação Trabalho, Transporte, Saúde, Filhos, Educação, Serviços, Vestuário, Lazer, Gatos, Investimento, Presentes, Outros

#### Investimentos
- Saldo atual da caixinha Nubank com barra de progresso até a meta
- Atualizar saldo manualmente (registra histórico com data e nota)
- **Projeção automática**: aporte fixo + sobra média real dos últimos 3 meses → data prevista de chegada na meta
- **Divisões editáveis**: Cofre Mestre (60%), Reserva (18%), Educação (5%), Kids (2%), Férias (5%), Projetos (5%), Compra Planejada (5%)
- Gráfico de evolução do saldo ao longo do tempo

---

### 📈 Analytics Global
Visão consolidada de evolução em todos os módulos.

- Radar RPG dos 6 eixos com histórico
- XP por módulo e por persona
- Heatmap de atividade geral
- Ranking de consistência por área

---

### ⚙️ Configurações
- Tema claro / escuro / sistema
- Nome do usuário
- Reset de dados por módulo
- Export/Import de dados (JSON)

---

## Rotas Completas

```
/dashboard
/personas
/calendar
/study                          → redirect para /study/overview
/study/overview
/study/subjects
/study/subjects/:subjectId
/study/subjects/:subjectId/:topicId/:subtopicId
/study/session
/study/revisions
/study/flashcards
/study/redacao
/study/cycle
/study/concursos
/study/analytics
/study/simulados                → placeholder v3.0
/study/questoes                 → placeholder v3.0
/projects
/projects/:id
/health
/finance
/knowledge                      → placeholder
/relationships                  → placeholder
/spiritual                      → placeholder
/analytics
/settings
```

---

## Pacotes Entregues

| Pacote | Versão | Arquivo | Conteúdo |
|---|---|---|---|
| App base | v2.0 | `phoenix-os-v2.0.zip` | 56 arquivos — estrutura completa |
| Study Engine | v2.1 | `phoenix-study-v2.1.zip` | 12 arquivos — reescrita completa do módulo |
| Projects | v1.0 | `phoenix-projects-module.zip` | 11 arquivos — OKR + Gantt |
| Health | v1.0 | `phoenix-health-module.zip` | 5 arquivos — água, treino, dieta |
| Finance | v1.0 | `phoenix-finance-module.zip` | 7 arquivos — orçamento, cartões, investimento |

**Total: ~91 arquivos de código-fonte**

---

## Como Instalar Cada Módulo

### Ordem recomendada
1. Instale o app base (`phoenix-os-v2.0.zip`)
2. Aplique o patch do Study Engine (`phoenix-study-v2.1.zip`)
3. Copie os arquivos de Projects, Health e Finance para as pastas corretas
4. Ajuste os imports no `App.jsx` conforme `INSTRUCOES.md` de cada pacote

### Ajustes no App.jsx necessários

```js
// Study v2.1 — novos imports
import { StudySubjectDetailPage } from '../modules/study/pages/StudySubjectDetailPage'
import { StudyQuestoesPage }      from '../modules/study/pages/StudyQuestoesPage'

// Health — ajustar caminho
import { HealthPage }  from '../modules/health/pages/HealthPage'

// Finance — ajustar caminho
import { FinancePage } from '../modules/finance/pages/FinancePage'
```

```js
// Rotas novas do Study v2.1
{ path: 'study/subjects/:subjectId',                        element: <StudySubjectDetailPage /> },
{ path: 'study/questoes',                                   element: <StudyQuestoesPage />      },
```

---

## Próximos módulos planejados

| Módulo | Prioridade | Descrição |
|---|---|---|
| 📖 Knowledge Base | Alta | Base de conhecimento pessoal — notas, artigos, links, resumos |
| 👥 Relacionamentos | Média | Registro de contatos importantes, aniversários, conexões |
| 🙏 Espiritual | Baixa | Metas de meditação, gratidão, jornada interior |

---

## Módulos em desenvolvimento futuro

- **Banco de Questões v3.0** — importação JSON estilo TGC, cadernos de questões, estatísticas por matéria/tópico
- **Simulados v3.0** — simulados cronometrados com gabarito e análise de desempenho
- **Firebase Sync** — sincronização em nuvem + multi-dispositivo
- **PWA** — instalação como app nativo no celular
- **Notificações** — lembretes de revisão, meta de água, treino do dia
