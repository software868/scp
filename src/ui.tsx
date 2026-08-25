import type { ReactNode, CSSProperties } from 'react'

/* ---------------------------------------------------------------- Icons */
type IProps = { size?: number; className?: string; style?: CSSProperties }
const svg = (paths: ReactNode) => (p: IProps) => (
  <svg
    width={p.size ?? 20}
    height={p.size ?? 20}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={1.7}
    strokeLinecap="round"
    strokeLinejoin="round"
    className={p.className}
    style={p.style}
  >
    {paths}
  </svg>
)

export const Icon = {
  Home: svg(<><path d="M3 11l9-7 9 7" /><path d="M5 10v10h14V10" /><path d="M9 20v-6h6v6" /></>),
  Bulb: svg(<><path d="M9 18h6" /><path d="M10 21h4" /><path d="M12 3a6 6 0 0 0-4 10.5c.7.7 1 1.3 1 2.5h6c0-1.2.3-1.8 1-2.5A6 6 0 0 0 12 3Z" /></>),
  Wind: svg(<><path d="M3 8h11a2.5 2.5 0 1 0-2.5-2.5" /><path d="M3 12h15a3 3 0 1 1-3 3" /><path d="M3 16h8a2 2 0 1 1-2 2" /></>),
  Check: svg(<><path d="M9 11l3 3L22 4" /><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" /></>),
  Phone: svg(<><path d="M4 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 12l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 2 6a2 2 0 0 1 2-2Z" /></>),
  Music: svg(<><path d="M9 18V5l10-2v13" /><circle cx="6" cy="18" r="3" /><circle cx="16" cy="16" r="3" /></>),
  Chart: svg(<><path d="M3 3v18h18" /><path d="M7 14l3-4 3 3 4-6" /></>),
  Grid: svg(<><rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" /><rect x="3" y="14" width="7" height="7" rx="1" /><rect x="14" y="14" width="7" height="7" rx="1" /></>),
  Rec: svg(<><circle cx="12" cy="12" r="9" /><circle cx="12" cy="12" r="4" fill="currentColor" stroke="none" /></>),
  Route: svg(<><circle cx="5" cy="6" r="2" /><circle cx="19" cy="6" r="2" /><circle cx="5" cy="18" r="2" /><circle cx="19" cy="18" r="2" /><path d="M7 6h10M7 18h10M5 8v8M19 8v8" /></>),
  Video: svg(<><rect x="2" y="6" width="14" height="12" rx="2" /><path d="M22 8l-6 4 6 4V8Z" /></>),
  Mic: svg(<><rect x="9" y="3" width="6" height="11" rx="3" /><path d="M6 11a6 6 0 0 0 12 0" /><path d="M12 17v4" /></>),
  Lock: svg(<><rect x="4" y="10" width="16" height="10" rx="2" /><path d="M8 10V7a4 4 0 0 1 8 0v3" /></>),
  Play: svg(<><path d="M6 4l14 8-14 8V4Z" fill="currentColor" stroke="none" /></>),
  Pause: svg(<><rect x="6" y="4" width="4" height="16" rx="1" fill="currentColor" stroke="none" /><rect x="14" y="4" width="4" height="16" rx="1" fill="currentColor" stroke="none" /></>),
  Reset: svg(<><path d="M3 12a9 9 0 1 0 3-6.7" /><path d="M3 4v4h4" /></>),
  Bell: svg(<><path d="M6 9a6 6 0 0 1 12 0c0 5 2 6 2 6H4s2-1 2-6Z" /><path d="M10 20a2 2 0 0 0 4 0" /></>),
  Cam: svg(<><path d="M4 8h3l1.5-2h7L17 8h3a1 1 0 0 1 1 1v9a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9a1 1 0 0 1 1-1Z" /><circle cx="12" cy="13" r="3.5" /></>),
  AI: svg(<><path d="M12 3l2 4 4 2-4 2-2 4-2-4-4-2 4-2 2-4Z" /><path d="M19 15l.8 1.6L21.5 17l-1.7.8L19 19.5l-.8-1.7L16.5 17l1.7-.4Z" /></>),
  Send: svg(<><path d="M22 2L11 13" /><path d="M22 2l-7 20-4-9-9-4 20-7Z" /></>),
  Temp: svg(<><path d="M10 14V5a2 2 0 1 1 4 0v9a4 4 0 1 1-4 0Z" /></>),
  Drop: svg(<><path d="M12 3s6 6.5 6 11a6 6 0 0 1-12 0c0-4.5 6-11 6-11Z" /></>),
  Door: svg(<><path d="M5 21V4a1 1 0 0 1 1-1h9a1 1 0 0 1 1 1v17" /><path d="M3 21h16" /><path d="M13 12h.01" /></>),
  Shield: svg(<><path d="M12 3l7 3v5c0 5-3.5 8.5-7 10-3.5-1.5-7-5-7-10V6l7-3Z" /></>),
  Power: svg(<><path d="M12 3v9" /><path d="M6.3 6.3a8 8 0 1 0 11.4 0" /></>),
  Fan: svg(<><circle cx="12" cy="12" r="2" /><path d="M12 10c0-4 1-6 3-6s3 3-1 6M14 12c4 0 6 1 6 3s-3 3-6-1M12 14c0 4-1 6-3 6s-3-3 1-6M10 12c-4 0-6-1-6-3s3-3 6 1" /></>),
  Clock: svg(<><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></>),
  Monitor: svg(<><rect x="2" y="3" width="20" height="14" rx="2" /><path d="M8 21h8M12 17v4" /></>),
  Menu: svg(<><path d="M4 7h16M4 12h16M4 17h16" /></>),
  Close: svg(<><path d="M6 6l12 12M18 6L6 18" /></>),
  Settings: svg(<><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09A1.65 1.65 0 0 0 15 4.6a1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1Z" /></>),
  ChevronRight: svg(<><path d="M9 6l6 6-6 6" /></>),
  ChevronDown: svg(<><path d="M6 9l6 6 6-6" /></>),
}

/* ---------------------------------------------------------------- Panels */
export function Panel({
  children,
  className = '',
  pad = true,
}: {
  children: ReactNode
  className?: string
  pad?: boolean
}) {
  return (
    <div
      className={`rounded-2xl border border-[var(--color-line)] bg-[var(--color-ink-850)]/80 ${
        pad ? 'p-3 sm:p-4' : ''
      } ${className}`}
    >
      {children}
    </div>
  )
}

export function SectionHeader({
  icon,
  tint,
  children,
  right,
}: {
  icon?: ReactNode
  tint?: string
  children: ReactNode
  right?: ReactNode
}) {
  return (
    <div className="mb-1.5 flex flex-wrap items-center gap-2">
      {icon && (
        <span
          className="grid h-7 w-7 shrink-0 place-items-center rounded-lg"
          style={{ background: `${tint}1a`, color: tint }}
        >
          {icon}
        </span>
      )}
      <h3 className="min-w-0 text-[11px] font-700 uppercase tracking-[0.22em] text-[#8ea3b6]">
        {children}
      </h3>
      <div className="ml-auto flex shrink-0 items-center">{right}</div>
    </div>
  )
}

export function AIBadge({ label = 'AI' }: { label?: string }) {
  return (
    <span
      className="inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-700 tracking-wide"
      style={{
        borderColor: 'var(--color-gold)',
        color: 'var(--color-gold)',
        background: 'color-mix(in srgb, var(--color-gold) 12%, transparent)',
      }}
    >
      <Icon.AI size={11} />
      {label}
    </span>
  )
}

/* ------------------------------------------------------- Clinical state pill */
export type AState = 'ok' | 'caution' | 'critical'
const stateColor: Record<AState, string> = {
  ok: 'var(--color-ok)',
  caution: 'var(--color-caution)',
  critical: 'var(--color-critical)',
}
export function StateGlyph({ state, size = 14 }: { state: AState; size?: number }) {
  const c = stateColor[state]
  if (state === 'ok')
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" style={{ color: c }}>
        <circle cx="12" cy="12" r="10" fill="none" stroke={c} strokeWidth="2" />
        <path d="M7 12l3.5 3.5L17 8" fill="none" stroke={c} strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    )
  if (state === 'critical')
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" style={{ color: c }}>
        <path d="M12 3l9 16H3L12 3Z" fill={c} />
        <path d="M12 9v4" stroke="#0b0f14" strokeWidth="2" strokeLinecap="round" />
        <circle cx="12" cy="16" r="1.1" fill="#0b0f14" />
      </svg>
    )
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" style={{ color: c }}>
      <path d="M12 21L3 5h18L12 21Z" fill={c} />
      <path d="M12 15v-4" stroke="#0b0f14" strokeWidth="2" strokeLinecap="round" />
      <circle cx="12" cy="9" r="1.1" fill="#0b0f14" />
    </svg>
  )
}
export function stateTint(s: AState) {
  return stateColor[s]
}

/* ---------------------------------------------------------------- Ring */
export function Ring({
  pct,
  size = 88,
  stroke = 8,
  color = 'var(--color-cyan)',
  children,
  fluid,
}: {
  pct: number
  size?: number
  stroke?: number
  color?: string
  children?: ReactNode
  /** Scale to parent instead of fixed px — for viewport-fit panels */
  fluid?: boolean
}) {
  const r = (size - stroke) / 2
  const c = 2 * Math.PI * r
  return (
    <div
      className={`relative grid place-items-center ${fluid ? 'aspect-square h-full max-h-full w-auto max-w-full' : ''}`}
      style={fluid ? undefined : { width: size, height: size }}
    >
      <svg
        viewBox={`0 0 ${size} ${size}`}
        width={fluid ? undefined : size}
        height={fluid ? undefined : size}
        className={`-rotate-90 ${fluid ? 'h-full w-full' : ''}`}
        preserveAspectRatio="xMidYMid meet"
      >
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#1b2530" strokeWidth={stroke} />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={color}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={c - (c * Math.min(100, pct)) / 100}
          style={{ transition: 'stroke-dashoffset 0.6s ease' }}
        />
      </svg>
      <div className="absolute inset-0 grid place-items-center">{children}</div>
    </div>
  )
}

/* ---------------------------------------------------------------- Controls */
export function Toggle({
  on,
  onChange,
  disabled,
}: {
  on: boolean
  onChange: (v: boolean) => void
  disabled?: boolean
}) {
  return (
    <button
      disabled={disabled}
      onClick={() => onChange(!on)}
      className="relative h-7 w-12 rounded-full transition-colors disabled:opacity-40"
      style={{ background: on ? 'var(--color-cyan)' : '#24313f' }}
    >
      <span
        className="absolute top-1 h-5 w-5 rounded-full bg-white transition-all"
        style={{ left: on ? 26 : 4 }}
      />
    </button>
  )
}

export function Slider({
  value,
  min = 0,
  max = 100,
  onChange,
  color = 'var(--color-cyan)',
  disabled,
}: {
  value: number
  min?: number
  max?: number
  onChange: (v: number) => void
  color?: string
  disabled?: boolean
}) {
  return (
    <input
      type="range"
      min={min}
      max={max}
      value={value}
      disabled={disabled}
      onChange={(e) => onChange(Number(e.target.value))}
      className="h-2 w-full cursor-pointer appearance-none rounded-full disabled:opacity-40 [&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:shadow-lg"
      style={{
        background: `linear-gradient(to right, ${color} ${
          ((value - min) / (max - min)) * 100
        }%, #24313f 0%)`,
      }}
    />
  )
}

export function TButton({
  children,
  onClick,
  variant = 'ghost',
  active,
  disabled,
  className = '',
}: {
  children: ReactNode
  onClick?: () => void
  variant?: 'primary' | 'ghost' | 'danger'
  active?: boolean
  disabled?: boolean
  className?: string
}) {
  const base =
    'inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-600 transition-all disabled:opacity-40 disabled:cursor-not-allowed active:scale-[0.97]'
  const styles: Record<string, string> = {
    primary: 'bg-[var(--color-cyan)] text-[#04201d] hover:brightness-110',
    danger: 'bg-[var(--color-critical)] text-white hover:brightness-110',
    ghost: active
      ? 'bg-[var(--color-cyan)]/15 text-[var(--color-cyan)] border border-[var(--color-cyan)]/40'
      : 'bg-[var(--color-ink-800)] text-[#cdd9e5] border border-[var(--color-line)] hover:border-[#3a4b5c]',
  }
  return (
    <button onClick={onClick} disabled={disabled} className={`${base} ${styles[variant]} ${className}`}>
      {children}
    </button>
  )
}

export function fmt(sec: number) {
  const h = Math.floor(sec / 3600)
  const m = Math.floor((sec % 3600) / 60)
  const s = sec % 60
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${pad(h)}:${pad(m)}:${pad(s)}`
}
