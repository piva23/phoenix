import { motion } from 'framer-motion';
import clsx from 'clsx';

const SPAN_MAP = {
  full: 'col-span-12',
  '1/2': 'col-span-12 lg:col-span-6',
  '1/3': 'col-span-12 lg:col-span-4',
  '2/3': 'col-span-12 lg:col-span-8',
  '7/12': 'col-span-12 lg:col-span-7',
  '5/12': 'col-span-12 lg:col-span-5',
  '4/12': 'col-span-12 lg:col-span-4',
  '3/12': 'col-span-12 lg:col-span-3',
  '6/12': 'col-span-12 lg:col-span-6',
  '8/12': 'col-span-12 lg:col-span-8',
  '9/12': 'col-span-12 lg:col-span-9',
  '10/12': 'col-span-12 lg:col-span-10',
  '11/12': 'col-span-12 lg:col-span-11',
};

export function BentoCard({
  children,
  className,
  span = 'full',
  onClick,
  gradient,
  glow,
  padding = true,
  animate = true,
}) {
  const Tag = animate ? motion.div : 'div';
  const animateProps = animate
    ? {
        initial: { opacity: 0, y: 12 },
        animate: { opacity: 1, y: 0 },
        transition: { duration: 0.4, ease: [0.4, 0, 0.2, 1] },
        whileHover: onClick ? { scale: 1.01, y: -2 } : undefined,
      }
    : {};

  return (
    <Tag
      onClick={onClick}
      className={clsx(
        'relative rounded-2xl border overflow-hidden transition-shadow duration-300',
        'backdrop-blur-xl bg-white/[0.04] border-white/[0.08]',
        onClick && 'cursor-pointer hover:shadow-lg hover:shadow-black/20 hover:border-white/[0.15]',
        padding && 'p-5',
        SPAN_MAP[span] || 'col-span-12',
        className
      )}
      style={{
        ...(gradient ? { background: gradient } : {}),
      }}
      {...animateProps}
    >
      {glow && (
        <div
          className="absolute inset-0 opacity-0 hover:opacity-100 transition-opacity duration-500 pointer-events-none rounded-2xl"
          style={{
            background: `radial-gradient(600px circle at var(--mouse-x, 50%) var(--mouse-y, 50%), ${glow}, transparent 40%)`,
          }}
        />
      )}
      <div className="relative z-10">{children}</div>
    </Tag>
  );
}

export function KPITile({ label, value, sub, icon, color, onClick }) {
  return (
    <BentoCard span="4/12" onClick={onClick} padding className="flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <span
          className="text-[10px] font-bold uppercase tracking-widest"
          style={{ color: 'var(--text-dim)' }}
        >
          {label}
        </span>
        <span className="text-lg">{icon}</span>
      </div>
      <div
        className="text-2xl font-black tracking-tight"
        style={{ color: color || 'var(--text-main)' }}
      >
        {value}
      </div>
      {sub && (
        <span className="text-[10px] font-medium" style={{ color: 'var(--text-dim)' }}>
          {sub}
        </span>
      )}
    </BentoCard>
  );
}

export function SectionHeader({ title, count, icon, sub }) {
  return (
    <div className="flex items-center justify-between mb-4">
      <div className="flex items-center gap-2">
        {icon && <span className="text-sm">{icon}</span>}
        <div>
          <h2
            className="text-xs font-bold uppercase tracking-widest"
            style={{ color: 'var(--text-dim)' }}
          >
            {title}
          </h2>
          {sub && (
            <p className="text-[10px] mt-0.5" style={{ color: 'var(--text-dim)' }}>
              {sub}
            </p>
          )}
        </div>
      </div>
      {count !== undefined && (
        <span
          className="text-[10px] font-bold px-2 py-0.5 rounded-lg"
          style={{
            background: 'rgba(255,255,255,0.05)',
            color: 'var(--text-dim)',
          }}
        >
          {count}
        </span>
      )}
    </div>
  );
}

export function ProgressRing({ value, size = 40, stroke = 4, color }) {
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (value / 100) * circumference;

  return (
    <svg width={size} height={size} className="rotate-[-90deg]">
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke="rgba(255,255,255,0.06)"
        strokeWidth={stroke}
      />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke={color || 'var(--primary)'}
        strokeWidth={stroke}
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        strokeLinecap="round"
        className="transition-all duration-700 ease-out"
      />
    </svg>
  );
}

export function Badge({ children, color, variant = 'default' }) {
  const base =
    'inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider';
  const variants = {
    default: 'bg-white/5 text-white/60',
    solid: '',
    outline: 'border border-white/10 text-white/60',
  };

  return (
    <span
      className={`${base} ${variants[variant]}`}
      style={
        variant === 'solid'
          ? { background: `${color}20`, color }
          : variant === 'outline'
          ? { borderColor: `${color}40`, color }
          : {}
      }
    >
      {children}
    </span>
  );
}
