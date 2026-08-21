// LoadingScreen — Spinner simples para Suspense fallback

export default function LoadingScreen() {
  return (
    <div
      className="fixed inset-0 flex flex-col items-center justify-center gap-4"
      style={{ background: 'var(--bg)' }}
    >
      {/* Spinner */}
      <div
        className="w-10 h-10 rounded-full border-3 border-t-transparent animate-spin"
        style={{
          borderWidth: '3px',
          borderColor: 'var(--border)',
          borderTopColor: 'var(--primary)',
        }}
      />
      {/* Texto */}
      <span
        className="text-xs font-bold uppercase tracking-widest animate-pulse"
        style={{ color: 'var(--text-dim)' }}
      >
        Carregando...
      </span>
    </div>
  );
}
