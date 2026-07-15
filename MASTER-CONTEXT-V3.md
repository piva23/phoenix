# PHOENIX OS v3.0 — MASTER ARCHITECTURE & CONTEXT DOCUMENT
> **Status:** Ativo / Produção
> **Versão:** 3.0.0 (Pro)
> **Última Atualização:** Julho de 2026
> **Autor:** Arquiteto de Software de Elite & Engenheiro Front-end Sénior

---

## 🧭 1. Filosofia e Arquitetura Central

O **Phoenix OS** é um sistema operacional de vida pessoal unificado (*Life OS*) altamente gamificado, construído sobre uma filosofia de desenvolvimento autêntica, resiliente e focada na produtividade máxima de alta fidelidade. O sistema rejeita o design genérico e adota uma interface inspirada em ferramentas profissionais clássicas e modernas, utilizando um design dark ambientado com altíssimo contraste, tipografia cirúrgica e interações fluidas via micro-animações.

### 🔄 O Fluxo de Entidades: Persona -> Projeto -> Módulo -> Task
A engenharia de fluxo de dados do Phoenix OS baseia-se na **concentricidade de propósito**:

1. **Persona (O Núcleo de Identidade):** O utilizador opera sob diferentes "Personas" (ex: Profissional, Estudante, Atleta, Académico). A alternância de Persona no topo do sistema filtra dinamicamente todo o contexto operacional, limitando os projetos visíveis, alterando as missões ativas de RPG, filtrando o painel de finanças e ajustando a prioridade dos módulos.
2. **Projeto (O Vetor de Direção):** Cada Persona detém e cria Projetos que traduzem objetivos estratégicos em realidades pragmáticas. Os projetos fornecem a estrutura de fases, kanban e cronogramas.
3. **Módulo (O Motor de Execução):** São os subsistemas verticais dedicados a áreas críticas da vida (Estudo, Saúde, Finanças, Espiritual, Relacionamentos). Os módulos consomem e geram dados dinâmicos sincronizados com o progresso global.
4. **Task / Subtask (A Unidade Atómica):** A menor fração de esforço humano, cuja conclusão desencadeia reações em cadeia no motor de gamificação de RPG do sistema (atribuição de XP, subida de nível e desbloqueio de conquistas).

### 🎛️ A Mecânica do MainLayout (Navegação em Blocos)
A navegação do sistema é descentralizada e estruturada em quatro blocos semânticos e funcionais de alta coesão, implementados no painel de navegação persistente e responsivo do `MainLayout` e do `Sidebar`:

*   **Visão (Alinhamento Estratégico):**
    *   `Dashboard`: Central de comando em tempo real com resumos rápidos, progresso de hábitos e métricas consolidadas.
    *   `Inbox (Brain Dump)`: Caixa de entrada rápida offline para ideias brutas, livre de fricção de classificação imediata.
    *   `Aventura RPG`: O portal de gamificação onde a realidade encontra o jogo, oferecendo gerenciamento de missões (Quests) e radar de progresso.
*   **Execução (Trabalho Ativo):**
    *   `Projetos`: Gerenciamento visual avançado de fluxos de trabalho com tabelas de progresso e visualizadores interativos.
    *   `Estudo`: O mais completo motor de estudos, focado na preparação académica e profissional do utilizador.
    *   `Finanças`: Orçamento de base zero, controle de gastos e planejamento de metas em tempo real.
*   **Vida (Equilíbrio e Saúde):**
    *   `Saúde`: Tracker de hábitos corporais, rotinas de exercício físico e monitoramento nutricional/de sono.
    *   `Relacionamentos`: Gestão de interações sociais prioritárias, controle de contatos e geolocalização.
    *   `Espiritual`: Rotinas de mindfulness, meditação e diários reflexivos profundos.
    *   `Conhecimento`: Mapeamento de modelos mentais e gerenciamento de base de dados cognitiva pessoal (*Zettelkasten* simplificado).
*   **Sistema (Infraestrutura Geral):**
    *   `Calendário`: Visão integrada e mapeada de eventos de todas as Personas em uma única linha do tempo fluida.
    *   `Configurações`: Painel operacional de customização do sistema, gerenciamento de segurança (bloqueio por PIN) e sincronização na nuvem.

---

## 🛠️ 2. Stack Tecnológica Atual

O ecossistema técnico do Phoenix OS foi desenhado para escalabilidade vertical, responsividade instantânea no cliente e latência zero de renderização:

*   **Framework Principal:** React 18 (SPA robusto alimentado por React Router para renderização de rotas aninhadas e transições limpas).
*   **Controle de Estado Global:** Zustand (Motores independentes por módulo, operando com arquiteturas de atualização seletiva e subscrições otimizadas).
*   **Motor Estilístico:** Tailwind CSS v4 (Importação semântica pura `@import "tailwindcss"`, gerindo cores customizadas via variáveis CSS nativas `--primary`, `--bg-surface`, etc., dispensando classes embutidas estáticas).
*   **Orquestração de Movimento:** Framer Motion (Transições de página por hardware acelerado, fade-ins de carregamento e efeitos de arrastar dinâmicos).
*   **Métricas e Visualização de Dados:** Recharts (Gráficos lineares de alta precisão, barras de progresso dinâmicas e radares de performance em tempo real).
*   **Infraestrutura Cloud / Backend:** Firebase v10 (Gerenciamento de Autenticação OAuth via Google e banco de dados NoSQL Firestore em tempo real).
*   **Motor de Notificação:** React Hot Toast (Feedbacks visuais imediatos integrados diretamente com os handlers de erro de rede e ações de sincronização).

---

## 📦 3. Mapa de Stores (Gestão de Estado)

O estado interno do Phoenix OS é particionado em microssistemas autônomos no Zustand, reduzindo os gargalos de renderização e permitindo que cada módulo evolua de forma independente.

### 🗺️ Catálogo de Stores e Responsabilidades:
1.  **`usePersonaStore`:** Controla a criação, remoção, alteração e persistência das Personas e o estado da Persona ativa operacional.
2.  **`useProjectStore`:** Gerencia o ciclo de vida dos projetos, suas respectivas tarefas, fases do Kanban e status de progresso indexado.
3.  **`useStudyStore`:** Orquestra os tempos de sessões de estudo, disciplinas ativas, tópicos, subtópicos e logs detalhados de performance.
4.  **`useHealthStore`:** Armazena o consumo de calorias, água, logs de treinos físicos executados e consistência diária de hábitos de bem-estar.
5.  **`useFinanceStore`:** Processa transações, alocações de orçamento, cálculos de saldo disponível e progresso de fundos de emergência.
6.  **`useRelationshipStore`:** Salva notas de interações com familiares, mentores e amigos e coordena locais geográficos frequentes.
7.  **`useSpiritualStore`:** Registra sessões de meditação, exercícios de respiração e diários pessoais.
8.  **`useAuthStore`:** Gerencia as credenciais do utilizador obtidas pelo Firebase SDK. Não utiliza persistência local (o próprio Firebase Auth manipula a reidratação nativa dos tokens no indexDB).
9.  **`useCalendarStore`:** Agrega compromissos, tarefas e alarmes gerados dinamicamente pelos outros módulos em um painel unificado de tempo.
10. **`useRPGStore`:** Controla as estatísticas de gamificação do utilizador: Missões diárias, semanais, conquistas, XP conquistado, ouro e subida de níveis.
11. **`useUIStore`:** Controla as configurações de layout global (abertura do Sidebar, abas flutuantes e estado do Persona Switcher).

### 🔌 Mecanismo de Sincronização Híbrido: Offline-First + Cloud Sync
O Phoenix OS garante resiliência absoluta através de um fluxo arquitetural híbrido:
```
[User Actions] ──> [Zustand Store] ──> [LocalStorage (phoenix-*)] (Offline-First)
                          │
                          ▼ (Manual Cloud Sync Trigger)
               [Firebase Cloud Firestore] (Durable Cloud Backup)
```

*   **Persistência Offline-First:** Todas as alterações nas Zustand stores (com exceção da de autenticação) são interceptadas pelo middleware `persist`, gravando as chaves imediatamente no `localStorage` com o prefixo `phoenix-`. O sistema funciona 100% sem conexão com a internet.
*   **Sincronização Cloud Manual:** Através do painel de controle do Firebase Firestore, o utilizador pode:
    *   **Fazer Upload (Backup):** O sistema varre o `localStorage`, extrai todas as chaves iniciadas com `phoenix-`, consolida-as em um único payload JSON hermético e salva na coleção privada do Firestore no caminho estrito: `users/${user.uid}/backup/latest` via transação `setDoc`.
    *   **Puxar da Nuvem (Restore):** O sistema recupera o payload do Firestore para o utilizador ativo, limpa e reescreve as chaves locais correspondentes e força um `window.location.reload()`, fazendo com que todas as Zustand stores se auto-reidratem instantaneamente com os novos dados de forma consistente.

---

## 🧩 4. Ecossistema de Módulos (Status Atual)

O ecossistema do Phoenix OS v3.0 Pro é composto por ferramentas de altíssima engenhosidade, integradas de forma nativa e estética:

### 🎓 Motor de Estudos (Study Engine)
Um centro integrado para estudantes e profissionais focado em alto rendimento. Inclui painel de técnicas de estudo, planejamento de ciclos de estudo baseados na técnica de ciclos de aprendizado contínuo, controle de revisões sistemáticas espaçadas, simulação de provas académicas (Simulados) e um controle estatístico de redações de alta nota. A infraestrutura de matérias permite navegar dinamicamente da disciplina macro ao subtópico com mapas de dificuldade visual.

### 📈 Projetos e Fluxos de Trabalho (Projects & Kanban)
Substitui quadros de projetos externos por uma interface fluida baseada em Kanban. Suporta categorização por fase, cálculo de progresso automatizado baseado no encerramento de tarefas filhas e integração com os pontos de experiência do RPG do sistema.

### 💰 Orçamento de Base Zero (Zero-Based Budget Finance)
Um módulo de finanças pessoais rigoroso baseado na filosofia "todo centavo deve ter uma missão". Classifica receitas e despesas por categorias totalmente mutáveis, calcula o saldo líquido disponível projetado e fornece uma interface de listagem limpa de transações recentes.

### 🏃 Performance Física e Rotinas (Health & Workout Tracker)
Centraliza o monitoramento biológico do utilizador. Combina trackers de hábitos saudáveis diários (água, sono, consistência nutricional) com um diário de treino de força e cardio de alta fidelidade, alimentando dinamicamente as estatísticas de vitalidade da Persona ativa.

### ⚔️ Aventura RPG (RPG Gamification Platform)
O motor dinâmico que converte a disciplina diária do utilizador em progresso lúdico de jogo. Fornece missões diárias vinculadas a tarefas, painel de conquistas bloqueadas/desbloqueadas por nível e um gráfico de teia de aranha (radar) representando os atributos atuais da Persona (Força, Inteligência, Foco, Carisma, etc.) que sobem proporcionalmente conforme ações reais são tomadas no sistema.

### 👥 Conexões e Relacionamentos (Relationships Tracker)
Uma abordagem focada no cultivo ativo de relacionamentos de alta relevância (família, mentores, amigos próximos). Fornece registros cronológicos de encontros, anotações de conversas e geolocalização frequente de reuniões para controle pessoal de tempo social.

### 🌿 Diário de Presença (Spiritual & Mindfulness)
Oferece um porto seguro de introspecção com trackers de minutos diários meditados, cronômetro de respiração pranayama guiado graficamente por expansões de ondas senoidais, e diário privado de escrita terapêutica de gratidão ou reflexões estóicas.

### 🧠 Modelos Mentais e Base Cognitiva (Knowledge Base)
Um repositório cognitivo pessoal focado na consolidação de conhecimento teórico. Permite a catalogação e estudo analítico de modelos mentais célebres (ex: Princípio de Pareto, Navalha de Occam) com descrições detalhadas de aplicação prática e referências intelectuais.

### 📅 Calendário Universal (Universal Time Machine)
O integrador de dimensão temporal do Phoenix OS. Realiza o deep mapping, consolidando eventos específicos criados pelo utilizador nas telas de projetos, revisões de estudo, sessões agendadas ou compromissos diretos em uma linha do tempo única, ordenada e responsiva.

---

## 🔒 5. Autenticação e Segurança

O Phoenix OS implementa uma blindagem de acesso externa sem violar a integridade estrutural e de performance do sistema operacional interno:

```
[Visita Externa] ──> [App.jsx Router]
                          │
                ┌─────────┴─────────┐
                ▼                   ▼
         [/login Page]     [ProtectedRoute]
                                    │ (Verifica useAuthStore)
                             ┌──────┴──────┐
                             ▼             ▼
                        [User=Null]   [User=Active]
                             │             │
                             ▼             ▼
                    [Redirect to /login]  [Render MainLayout & Children]
```

1.  **Google OAuth via Firebase:** O fluxo de autenticação utiliza o provedor oficial do Google através da infraestrutura resiliente do Firebase Authentication, encapsulado de forma assíncrona no `useAuthStore`.
2.  **Proteção de Rota Hermética (`ProtectedRoute.jsx`):** Um componente de barreira global intercepta todos os caminhos do roteador que requerem sessão ativa.
    *   *Estado de Inicialização:* Enquanto o Firebase SDK valida o estado do token remoto, o componente exibe um carregador de inicialização esteticamente minimalista na cor `#0C0C10` com o letreiro animado *"Inicializando Phoenix OS..."*.
    *   *Desvio de Segurança:* Se nenhuma sessão for encontrada, o utilizador é redirecionado instantaneamente para a tela `/login`, blindando as páginas de projetos, finanças, estudos e dashboards.
3.  **LoginPage Sem Fricção:** Uma tela de entrada futurista ambientada em fundo escuro com um grande botão centralizado "Entrar com Google", oferecendo transições ricas alimentadas por Framer Motion e monitoramento de falhas de rede usando Toaster integrados.

---

## 🚀 6. Terreno para a V3.1.0 (Próximos Passos)

Esta seção documenta as aspirações arquiteturais, melhorias de infraestrutura e dívidas técnicas planejadas para a próxima fase do sistema operacional:

### ⚙️ Sugestões de Melhorias & Dívidas Técnicas:
*   [ ] **Sync em Segundo Plano Automatizado:** Implementar rotinas periódicas em segundo plano que fazem o backup silencioso dos dados no Firestore a cada X horas, evitando que o utilizador dependa exclusivamente da ação manual de backup no menu de configurações.
*   [ ] **Histórico Incremental de Backups:** Transformar o armazenamento de backup de um arquivo estático único (`/backup/latest`) para uma coleção incremental ordenada por timestamp, permitindo ao utilizador restaurar seu Phoenix OS em qualquer ponto histórico de sua evolução (*Time Machine*).
*   [ ] **Modo Offline Melhorado com Cache Inteligente:** Tratamento aprimorado de erros quando o utilizador tenta fazer ações de upload ou login sem conexão de internet ativa, exibindo mensagens preventivas mais elegantes e bloqueando botões de forma dinâmica.
*   [ ] **Otimização de Renderização de Cards do SettingsPage:** Desacoplar os handlers de sincronização cloud do componente principal de configurações para evitar re-renderizações desnecessárias das Zustand stores vizinhas durante os processos de backup e sincronização de dados.
