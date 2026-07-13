import { useMemo } from 'react';
import { useSessionStore } from '../../../stores/useSessionStore';
import { useStudyStore } from '../../../stores/useStudyStore';
import { StudyLayout } from '../components/StudyLayout';
import { formatMinutes } from '../../../shared/utils/time';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
} from 'recharts';

// ── helpers ───────────────────────────────────────────────────────────────────

const getLastNDays = n => {
  const dates = [];
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    dates.push(d.toISOString().split('T')[0]);
  }
  return dates;
};

const HEATMAP_COLORS = {
  0: 'var(--bg-surface-2)',
  1: 'rgba(139,92,246,0.3)',
  2: 'rgba(139,92,246,0.55)',
  3: 'rgba(139,92,246,0.8)',
  4: 'rgba(139,92,246,1)',
};

function intensityOf(mins) {
  if (mins <= 0) return 0;
  if (mins < 20) return 1;
  if (mins < 60) return 2;
  if (mins < 120) return 3;
  return 4;
}

// ── componente ────────────────────────────────────────────────────────────────

export function StudyOverviewPage() {
  // Usa os seletores do store refatorado — sem reprocessar no useMemo
  const sessions = useSessionStore(s => s.sessions);
  const getHeatmap = useSessionStore(s => s.getHeatmapData);
  const getMinsBySubject = useSessionStore(s => s.getMinutesBySubject);
  const subjects = useStudyStore(s => s.subjects);

  const {
    totalMinutes,
    totalQuestions,
    totalCorrect,
    heatmapData,
    subjectChartData,
    accuracyTrend,
  } = useMemo(() => {
    let tMins = 0,
      tQ = 0,
      tC = 0;
    const trendMap = {};

    sessions.forEach(s => {
      tMins += s.totalMinutes || 0;
      tQ += s.questionsAnswered || 0;
      tC += s.questionsCorrect || 0;

      // tendência de acertos — usa s.date (campo padronizado no store novo)
      if (s.date && s.studyType === 'questoes') {
        if (!trendMap[s.date]) trendMap[s.date] = { q: 0, c: 0 };
        trendMap[s.date].q += s.questionsAnswered || 0;
        trendMap[s.date].c += s.questionsCorrect || 0;
      }
    });

    // heatmap via seletor do store
    const rawHeatmap = getHeatmap();
    const days = getLastNDays(84); // 12 semanas
    const hData = days.map(date => ({
      date,
      mins: rawHeatmap[date] || 0,
      intensity: intensityOf(rawHeatmap[date] || 0),
    }));

    // barras por matéria via seletor do store
    const minsBySubj = getMinsBySubject();
    const sData = Object.entries(minsBySubj)
      .map(([id, mins]) => {
        const sub = subjects.find(x => x.id === id);
        const questionSessions = sessions.filter(
          s => s.subjectId === id && s.studyType === 'questoes'
        );
        const answered = questionSessions.reduce(
          (a, s) => a + (s.questionsAnswered || 0),
          0
        );
        const correct = questionSessions.reduce(
          (a, s) => a + (s.questionsCorrect || 0),
          0
        );
        return {
          name: sub?.name || 'Desconhecida',
          minutos: mins,
          acerto: answered > 0 ? Math.round((correct / answered) * 100) : 0,
          color: sub?.color || '#3B82F6',
        };
      })
      .sort((a, b) => b.minutos - a.minutos)
      .slice(0, 6);

    // curva de acertos — últimos 7 dias com questões
    const trend = Object.entries(trendMap)
      .sort(([a], [b]) => a.localeCompare(b))
      .slice(-7)
      .map(([date, data]) => {
        const [, m, d] = date.split('-');
        return {
          date: `${d}/${m}`,
          acerto: data.q > 0 ? Math.round((data.c / data.q) * 100) : 0,
          questoes: data.q,
        };
      });

    return {
      totalMinutes: tMins,
      totalQuestions: tQ,
      totalCorrect: tC,
      heatmapData: hData,
      subjectChartData: sData,
      accuracyTrend: trend,
    };
  }, [sessions, subjects]);

  const globalAccuracy =
    totalQuestions > 0 ? Math.round((totalCorrect / totalQuestions) * 100) : 0;
  const accColor =
    globalAccuracy >= 70
      ? '#10B981'
      : globalAccuracy >= 50
        ? '#F59E0B'
        : '#EF4444';

  return (
    <StudyLayout>
      <div className="flex flex-col max-h-[calc(100vh-80px)] overflow-y-auto custom-scrollbar pr-2 pb-10 space-y-6 animate-fade-in">
        {/* cabeçalho */}
        <div>
          <h1 className="text-2xl font-extrabold text-text-main tracking-tight">
            Visão Geral
          </h1>
          <p className="text-sm text-text-dim mt-1">
            Totais acumulados de toda a preparação.
          </p>
        </div>

        {/* KPIs globais */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            {
              label: 'Tempo Total',
              value: formatMinutes(totalMinutes),
              sub: 'Resíduo cognitivo acumulado',
              icon: '⏱',
            },
            {
              label: 'Questões',
              value: totalQuestions,
              sub: 'Recuperações ativas realizadas',
              icon: '🧠',
              accent: 'var(--secondary)',
            },
            {
              label: 'Precisão Global',
              value: `${globalAccuracy}%`,
              sub: 'Taxa de conversão de acertos',
              icon: '🎯',
              accent: accColor,
            },
          ].map(({ label, value, sub, icon, accent }) => (
            <div
              key={label}
              className="p-6 rounded-2xl border bg-[var(--bg-surface)] shadow-sm"
              style={{ borderColor: 'var(--border)' }}
            >
              <div className="flex justify-between items-start mb-2">
                <span className="text-xs font-bold text-text-muted uppercase tracking-wider">
                  {label}
                </span>
                <span className="text-xl">{icon}</span>
              </div>
              <div
                className="text-3xl font-black"
                style={{ color: accent || 'var(--text-main)' }}
              >
                {value}
              </div>
              <div className="text-[10px] text-text-dim mt-1 font-semibold">
                {sub}
              </div>
            </div>
          ))}
        </div>

        {/* Heatmap — 12 semanas */}
        <div
          className="p-6 rounded-2xl border bg-[var(--bg-surface)] shadow-sm"
          style={{ borderColor: 'var(--border)' }}
        >
          <div className="flex flex-col md:flex-row md:items-center justify-between mb-5 gap-3">
            <div>
              <h2 className="text-base font-bold text-text-main">
                Consistência Diária (84 dias)
              </h2>
              <p className="text-xs text-text-dim mt-0.5">
                A constância supera a intensidade.
              </p>
            </div>
            <div className="flex items-center gap-2 text-[10px] font-bold text-text-dim">
              <span>Menos</span>
              {[1, 2, 3, 4].map(i => (
                <div
                  key={i}
                  className="w-3 h-3 rounded-sm"
                  style={{ background: HEATMAP_COLORS[i] }}
                />
              ))}
              <span>Mais</span>
            </div>
          </div>

          {/* grid tipo GitHub: 12 colunas (semanas) × 7 linhas (dias) */}
          <div
            className="grid gap-1"
            style={{ gridTemplateColumns: 'repeat(12, 1fr)' }}
          >
            {Array.from({ length: 12 }).map((_, week) => (
              <div key={week} className="flex flex-col gap-1">
                {heatmapData.slice(week * 7, week * 7 + 7).map((day, i) => (
                  <div
                    key={i}
                    className="w-full aspect-square rounded-sm transition-transform hover:scale-125 cursor-default"
                    style={{
                      background: HEATMAP_COLORS[day.intensity],
                      border:
                        day.intensity === 0
                          ? '1px solid var(--border)'
                          : 'none',
                    }}
                    title={`${day.date} — ${formatMinutes(day.mins)}`}
                  />
                ))}
              </div>
            ))}
          </div>
        </div>

        {/* Gráficos lado a lado */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* barras por matéria */}
          <div
            className="p-6 rounded-2xl border bg-[var(--bg-surface)] shadow-sm flex flex-col"
            style={{ borderColor: 'var(--border)' }}
          >
            <h2 className="text-base font-bold text-text-main mb-1">
              Foco por Disciplina
            </h2>
            <p className="text-xs text-text-dim mb-5">
              Tempo total em minutos por matéria.
            </p>
            <div className="flex-1 min-h-[220px]">
              {subjectChartData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={subjectChartData}
                    layout="vertical"
                    margin={{ right: 30, left: 0 }}
                  >
                    <XAxis type="number" hide />
                    <YAxis
                      dataKey="name"
                      type="category"
                      axisLine={false}
                      tickLine={false}
                      tick={{
                        fill: 'var(--text-dim)',
                        fontSize: 11,
                        fontWeight: 600,
                      }}
                      width={110}
                    />
                    <Tooltip
                      cursor={{ fill: 'var(--bg-surface-2)' }}
                      contentStyle={{
                        background: 'var(--bg-surface)',
                        border: '1px solid var(--border)',
                        borderRadius: 8,
                        color: 'var(--text-main)',
                        fontSize: 12,
                      }}
                      formatter={v => [`${v} min`, 'Tempo']}
                    />
                    <Bar dataKey="minutos" radius={[0, 4, 4, 0]} barSize={20}>
                      {subjectChartData.map((e, i) => (
                        <cell key={i} fill={e.color} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex h-full items-center justify-center text-text-dim text-sm italic">
                  Registre sessões para ver o gráfico.
                </div>
              )}
            </div>
          </div>

          {/* curva de acertos */}
          <div
            className="p-6 rounded-2xl border bg-[var(--bg-surface)] shadow-sm flex flex-col"
            style={{ borderColor: 'var(--border)' }}
          >
            <h2 className="text-base font-bold text-text-main mb-1">
              Curva de Retenção
            </h2>
            <p className="text-xs text-text-dim mb-5">
              % de acerto nos últimos 7 dias com questões.
            </p>
            <div className="flex-1 min-h-[220px]">
              {accuracyTrend.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart
                    data={accuracyTrend}
                    margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                  >
                    <defs>
                      <linearGradient id="gradAcc" x1="0" y1="0" x2="0" y2="1">
                        <stop
                          offset="5%"
                          stopColor="var(--primary)"
                          stopOpacity={0.3}
                        />
                        <stop
                          offset="95%"
                          stopColor="var(--primary)"
                          stopOpacity={0}
                        />
                      </linearGradient>
                    </defs>
                    {/* linhas de referência: 70% e 85% */}
                    <CartesianGrid
                      strokeDasharray="3 3"
                      vertical={false}
                      stroke="var(--border)"
                      opacity={0.4}
                    />
                    <XAxis
                      dataKey="date"
                      axisLine={false}
                      tickLine={false}
                      tick={{
                        fill: 'var(--text-dim)',
                        fontSize: 10,
                        fontWeight: 'bold',
                      }}
                      dy={8}
                    />
                    <YAxis
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: 'var(--text-dim)', fontSize: 10 }}
                      domain={[0, 100]}
                    />
                    <Tooltip
                      contentStyle={{
                        background: 'var(--bg-surface)',
                        border: '1px solid var(--border)',
                        borderRadius: 8,
                        color: 'var(--text-main)',
                        fontSize: 12,
                      }}
                      formatter={(v, n) => [
                        n === 'acerto' ? `${v}%` : v,
                        n === 'acerto' ? 'Acerto' : 'Questões',
                      ]}
                    />
                    <Area
                      type="monotone"
                      dataKey="acerto"
                      stroke="var(--primary)"
                      strokeWidth={2.5}
                      fillOpacity={1}
                      fill="url(#gradAcc)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex h-full items-center justify-center text-text-dim text-sm italic">
                  Resolva questões para gerar o gráfico.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </StudyLayout>
  );
}
