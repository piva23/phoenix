import clsx from 'clsx';

/**
 * PageHeader — Banner gradiente padronizado para todas as páginas.
 *
 * Props:
 *   icon     — emoji ou ícone (opcional)
 *   title    — título da página (obrigatório)
 *   subtitle — subtítulo descritivo (opcional)
 *   badge    — badge/botão à direita (opcional, renderizado como children)
 *   className — classes extras no container (opcional)
 */
export function PageHeader({ icon, title, subtitle, badge, children, className }) {
  return (
    <div className={clsx('page-banner p-5 md:p-7 mb-6', className)}>
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3 min-w-0">
          {icon && <span className="text-2xl md:text-3xl flex-shrink-0">{icon}</span>}
          <div className="min-w-0">
            <h1 className="text-2xl md:text-3xl font-black text-text-main truncate">{title}</h1>
            {subtitle && (
              <p className="text-sm text-text-muted mt-1 truncate">{subtitle}</p>
            )}
          </div>
        </div>
        {(badge || children) && (
          <div className="flex-shrink-0 flex items-center gap-2">
            {badge}
            {children}
          </div>
        )}
      </div>
    </div>
  );
}
