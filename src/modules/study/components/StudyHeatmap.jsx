import { useMemo } from 'react';

export function StudyHeatmap({ sessions = [], days = 60 }) {
  const data = useMemo(() => {
    const map = {};

    // 1. Processamento Seguro das Sessões (Blindagem contra o RangeError)
    sessions.forEach(s => {
      try {
        // Tenta capturar a data seja do startTime ou de um campo date legado
        const rawDate = s.startTime || s.date;
        if (!rawDate) return;

        const d = new Date(rawDate);
        if (isNaN(d.getTime())) return; // Se a data for inválida, ignora para não quebrar a tela

        const key = d.toISOString().split('T')[0];
        map[key] = (map[key] || 0) + (s.totalMinutes || 0);
      } catch (error) {
        // Falha silenciosa para dados corrompidos
      }
    });

    // 2. Geração da Grade de Dias Reais
    const result = [];
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const key = d.toISOString().split('T')[0];
      result.push({ key, val: map[key] || 0 });
    }

    return result;
  }, [sessions, days]);

  // 3. Sistema de Cores: A Regra dos 20 Minutos (Hex com Opacidade)
  const getColor = minutes => {
    if (minutes === 0) return 'var(--bg-surface-2)';
    if (minutes < 20) return 'var(--primary)4D'; // 30% Opacidade - Resistência Inicial
    if (minutes < 60) return 'var(--primary)99'; // 60% Opacidade - Hábito Profissional (>20min)
    if (minutes < 120) return 'var(--primary)CC'; // 80% Opacidade - Estudo Sólido
    return 'var(--primary)'; // 100% Opacidade - Alta Performance
  };

  return (
    <div>
      {/* Grid do Heatmap */}
      <div className="flex flex-wrap gap-1.5">
        {data.map(d => {
          const formattedDate = d.key.split('-').reverse().join('/');
          return (
            <div
              key={d.key}
              className="rounded-sm flex-shrink-0 transition-transform hover:scale-125 cursor-pointer"
              style={{
                width: 14,
                height: 14,
                background: getColor(d.val),
                border: d.val === 0 ? '1px solid var(--border)' : 'none',
              }}
              title={`${formattedDate}\nTempo: ${d.val} min`}
            />
          );
        })}
      </div>

      {/* Legenda Estratégica (Amador vs Profissional) */}
      <div
        className="flex gap-2 mt-4 items-center border-t pt-3"
        style={{ borderColor: 'var(--border)' }}
      >
        <span className="text-[10px] font-bold text-text-dim uppercase tracking-wider">
          Amador
        </span>

        {/* Níveis de Intensidade */}
        {[
          { val: 0, label: '0 min' },
          { val: 15, label: '< 20 min (Resistência)' },
          { val: 40, label: '20-59 min (Profissional)' },
          { val: 80, label: '1-2 horas (Sólido)' },
          { val: 150, label: '+2 horas (Alta Performance)' },
        ].map((lvl, i) => (
          <div
            key={i}
            className="rounded-sm"
            style={{
              width: 14,
              height: 14,
              background: getColor(lvl.val),
              border: lvl.val === 0 ? '1px solid var(--border)' : 'none',
            }}
            title={lvl.label}
          />
        ))}

        <span className="text-[10px] font-bold text-text-dim uppercase tracking-wider">
          Profissional
        </span>
      </div>
    </div>
  );
}
