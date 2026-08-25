import { useEffect, useMemo, useState, type ReactNode } from 'react'
import logo from './imports/IMG_3096.PNG'
import {
  Icon,
  Panel,
  SectionHeader,
  AIBadge,
  StateGlyph,
  stateTint,
  Ring,
  Toggle,
  Slider,
  TButton,
  fmt,
  type AState,
} from './ui'
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  ResponsiveContainer,
  Tooltip,
  CartesianGrid,
} from 'recharts'

/* ============================================================ static data */
type Gas = { key: string; label: string; unit: string; value: string; state: AState; vac?: boolean }
const GAS_INIT: Gas[] = [
  { key: 'o2',      label: 'Oxygen',   unit: 'bar', value: '4.2', state: 'ok' },
  { key: 'vac',     label: 'Vac',      unit: 'kPa', value: '-22', state: 'critical', vac: true },
  { key: 'air',     label: 'Med Air',  unit: 'bar', value: '4.1', state: 'ok' },
  { key: 'n2o',     label: 'N₂O',      unit: 'bar', value: '3.9', state: 'ok' },
  { key: 'surgair', label: 'Surg Air', unit: 'bar', value: '6.8', state: 'ok' },
  { key: 'agss',    label: 'AGSS',     unit: 'kPa', value: '-14', state: 'caution', vac: true },
  { key: 'co2',     label: 'CO₂',      unit: 'bar', value: '3.4', state: 'caution' },
]
const cycle: Record<AState, AState> = { ok: 'caution', caution: 'critical', critical: 'ok' }

const NAV: { id: string; label: string; icon: (typeof Icon)[keyof typeof Icon]; tier?: number }[] = [
  { id: 'home', label: 'Home', icon: Icon.Home },
  { id: 'timers', label: 'Case Timers', icon: Icon.Clock },
  { id: 'lighting', label: 'Lighting', icon: Icon.Bulb },
  { id: 'environment', label: 'Climate', icon: Icon.Wind },
  { id: 'checklist', label: 'Checklist', icon: Icon.Check },
  { id: 'comm', label: 'Communication', icon: Icon.Phone },
  { id: 'media', label: 'Music', icon: Icon.Music },
  { id: 'analytics', label: 'Analytics', icon: Icon.Chart },
  { id: 'network', label: 'Hospital Network', icon: Icon.Grid },
  { id: 'recording', label: 'Recording', icon: Icon.Rec, tier: 2 },
  { id: 'routing', label: 'Routing', icon: Icon.Route, tier: 3 },
] as const

const CHECKLIST = {
  'Sign In': [
    'Patient identity, site, procedure & consent confirmed',
    'Site marked / not applicable',
    'Anaesthesia machine & medication check complete',
    'Pulse oximeter on patient and functioning',
    'Known allergy?',
    'Difficult airway / aspiration risk?',
    'Risk of >500ml blood loss?',
  ],
  'Time Out': [
    'All team members introduced by name and role',
    'Surgeon, anaesthetist & nurse confirm patient/site/procedure',
    'Anticipated critical events reviewed',
    'Antibiotic prophylaxis given within last 60 min',
    'Essential imaging displayed',
  ],
  'Sign Out': [
    'Procedure name recorded',
    'Instrument, sponge & needle counts correct',
    'Specimen labelled (incl. patient name)',
    'Equipment problems addressed',
    'Key concerns for recovery & management reviewed',
  ],
} as const
type Phase = keyof typeof CHECKLIST

/* ============================================================ App */
export default function App() {
  const [version, setVersion] = useState<1 | 2 | 3>(3)
  const modelLabel = ({ 1: 'C', 2: 'E', 3: 'S' } as const)[version]
  const [page, setPage] = useState<string>('home')
  const [now, setNow] = useState(new Date())

  // timers — proc counts up; anae is a countdown from a set H:M target
  const [proc, setProc] = useState({ run: false, sec: 0 })
  const [anae, setAnae] = useState({ run: false, sec: 0, target: 60 * 60 })
  const procStage = proc.sec === 0 ? 'Not Started' : proc.run ? 'In Progress' : 'Paused'

  // facility
  const [gases, setGases] = useState(GAS_INIT)
  const [otOccupied, setOtOccupied] = useState(true)
  const [camLive, setCamLive] = useState(false)
  const [videoInCall, setVideoInCall] = useState(false)

  // checklist
  const [checked, setChecked] = useState<Record<string, boolean>>({})

  // recording
  const [rec, setRec] = useState({ on: false, sec: 0 })

  // paging log
  type PageMsg = { id: number; msg: string; ot: string; time: string; ack: boolean }
  const [pages, setPages] = useState<PageMsg[]>([
    { id: 1, msg: 'Blood Bank — urgent sample pickup', ot: 'OT-3', time: '09:41', ack: true },
  ])

  // identity & climate defaults — lifted to App so Admin page can set them
  const [otName, setOtName] = useState('OT-3')
  const [tempSet, setTempSet] = useState(20)
  const [humSet, setHumSet] = useState(50)

  useEffect(() => {
    const t = setInterval(() => {
      setNow(new Date())
      setProc((p) => (p.run ? { ...p, sec: p.sec + 1 } : p))
      setAnae((a) => (a.run ? (a.sec <= 1 ? { ...a, sec: 0, run: false } : { ...a, sec: a.sec - 1 }) : a))
      setRec((r) => (r.on ? { ...r, sec: r.sec + 1 } : r))
    }, 1000)
    return () => clearInterval(t)
  }, [])

  const camActive = camLive || rec.on || videoInCall

  const shared = {
    version,
    now,
    gases,
    setGases,
    otOccupied,
    setOtOccupied,
    checked,
    setChecked,
    proc,
    setProc,
    anae,
    setAnae,
    rec,
    setRec,
    camLive,
    setCamLive,
    videoInCall,
    setVideoInCall,
    pages,
    setPages,
    setPage,
    otName,
    setOtName,
    tempSet,
    setTempSet,
    humSet,
    setHumSet,
  }

  const onSettings = page !== 'home'

  return (
    <div className="flex h-screen max-h-dvh flex-col overflow-hidden bg-[var(--color-ink-950)] text-[var(--color-fg)]">
      <TopBar
        now={now}
        proc={proc}
        anae={anae}
        procStage={procStage}
        otOccupied={otOccupied}
        camActive={camActive}
        onToggleCam={() => {
          // privacy switch — turns camera off and disconnects any live video call
          if (camActive) {
            setCamLive(false)
            setVideoInCall(false)
            setRec((r) => ({ ...r, on: false }))
          }
        }}
        otName={otName}
        modelLabel={modelLabel}
        onSettings={onSettings}
        adminActive={page === 'admin'}
        goHome={() => setPage('home')}
        goSettings={() => setPage('settings')}
        goAdmin={() => setPage('admin')}
      />

      <main className="min-h-0 flex-1 overflow-hidden">
        {page === 'home' ? (
          <NewHome {...shared} now={now} procStage={procStage} otOccupied={otOccupied} version={version} />
        ) : (
          <Settings page={page} setPage={setPage} version={version} setVersion={setVersion} shared={shared} otOccupied={otOccupied} camActive={camActive} />
        )}
      </main>

      <AlarmTicker gases={gases} otName={otName} />
    </div>
  )
}

/* ============================================================ Top bar */
function BigClock({ label, value, tint, sub }: { label: string; value: string; tint: string; sub?: string }) {
  return (
    <div className="flex flex-col">
      <span className="text-[10px] font-600 uppercase tracking-[0.2em] text-[#7f93a6]">{label}</span>
      <span className="font-mono text-3xl font-700 leading-none tabular-nums" style={{ color: tint }}>
        {value}
      </span>
      {sub && <span className="mt-0.5 text-[10px] font-600 text-[#7f93a6]">{sub}</span>}
    </div>
  )
}

function TopBar({
  now,
  proc,
  anae,
  procStage,
  otOccupied,
  camActive,
  otName,
  modelLabel,
  onToggleCam,
  onSettings,
  adminActive,
  goHome,
  goSettings,
  goAdmin,
}: any) {
  return (
    <header className="safe-x flex shrink-0 flex-wrap items-center gap-2 border-b border-[var(--color-line)] bg-[var(--color-ink-900)] px-3 py-1.5 sm:gap-4 sm:px-5">
      <div className="flex min-w-0 flex-1 items-center gap-2 sm:gap-3">
        <button onClick={goSettings} className="shrink-0 transition-opacity hover:opacity-80 active:scale-95">
          <img src={logo} alt="Prenit World Lifecare" className="h-8 w-auto rounded-lg bg-white/95 px-1.5 py-0.5 sm:h-10 sm:px-2 sm:py-1" />
        </button>
        <div className="mx-0.5 hidden h-8 w-px bg-[var(--color-line)] sm:block" />
        <div className="hidden min-w-0 leading-[1.1] md:block">
          <div className="truncate whitespace-nowrap text-[13px] font-800 uppercase tracking-[0.05em] text-[#eef3f8]">Surgery Room Management System</div>
          <div className="text-[10px] font-700 uppercase tracking-[0.18em] text-[#8ea3b6]">Surgeon Control Panel</div>
        </div>
        <div className="mx-1 hidden h-8 w-px bg-[var(--color-line)] lg:block" />
        <div className="flex min-w-0 flex-col items-start justify-center">
          <span className="text-[9px] font-700 uppercase tracking-[0.22em] text-[#5f7286] sm:text-[10px]">Operating Theatre</span>
          <span
            className="font-mono text-[1.35rem] font-800 leading-none tabular-nums sm:text-[1.65rem]"
            style={{ color: 'var(--color-cyan)', textShadow: '0 0 18px color-mix(in srgb, var(--color-cyan) 50%, transparent)' }}
          >
            {otName}
          </span>
        </div>
        <div
          className="ml-1 flex shrink-0 flex-col items-start justify-center border-l border-[var(--color-line)] pl-2 sm:ml-2 sm:pl-3"
          title={`Nova Model ${modelLabel}`}
        >
          <span className="text-[9px] font-700 uppercase tracking-[0.22em] text-[#5f7286] sm:text-[10px]">Model</span>
          <span className="font-mono text-[1.1rem] font-800 leading-none text-[var(--color-gold)] sm:text-[1.25rem]">{modelLabel}</span>
        </div>
      </div>

      <div className="ml-auto flex flex-wrap items-center justify-end gap-2 sm:gap-3">
        <button
          onClick={onToggleCam}
          disabled={!camActive}
          className="flex items-center gap-1.5 rounded-full border px-2.5 py-1.5 text-[11px] font-700 transition-all disabled:cursor-default enabled:active:scale-95 sm:gap-2 sm:px-3 sm:text-xs"
          style={
            camActive
              ? { borderColor: 'var(--color-critical)', color: 'var(--color-critical)', background: 'color-mix(in srgb, var(--color-critical) 15%, transparent)' }
              : { borderColor: 'var(--color-line)', color: '#6f8394' }
          }
          title={camActive ? 'Camera is live — tap to switch off for privacy' : 'Camera is off'}
        >
          <span className={`h-2.5 w-2.5 shrink-0 rounded-full ${camActive ? 'blink bg-[var(--color-critical)]' : 'bg-[#4a5c6d]'}`} />
          <Icon.Cam size={15} />
          <span className="sm:hidden">{camActive ? 'CAM ON' : 'CAM OFF'}</span>
          <span className="hidden sm:inline">{camActive ? 'CAMERA ON · TAP TO STOP' : 'CAMERA OFF'}</span>
        </button>

        <div className="flex items-center rounded-xl border border-[var(--color-line)] bg-[var(--color-ink-850)] p-1">
          <button
            onClick={goHome}
            className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-[11px] font-700 transition-colors sm:px-3 sm:text-xs ${!onSettings ? 'bg-[var(--color-cyan)] text-[#04201d]' : 'text-[#8ea3b6] hover:text-white'}`}
          >
            <Icon.Monitor size={15} />
            <span className="hidden xs:inline sm:inline">Display</span>
          </button>
          <button
            onClick={goSettings}
            className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-[11px] font-700 transition-colors sm:px-3 sm:text-xs ${onSettings && !adminActive ? 'bg-[var(--color-cyan)] text-[#04201d]' : 'text-[#8ea3b6] hover:text-white'}`}
          >
            <Icon.Home size={15} />
            <span className="hidden xs:inline sm:inline">Home</span>
          </button>
          <button
            onClick={goAdmin}
            title="Admin"
            aria-label="Admin"
            className={`grid place-items-center rounded-lg px-2 py-1.5 transition-colors sm:px-2.5 ${adminActive ? 'bg-[var(--color-cyan)] text-[#04201d]' : 'text-[#8ea3b6] hover:text-white'}`}
          >
            <Icon.Settings size={15} />
          </button>
        </div>
      </div>
    </header>
  )
}

/* ============================================================ Settings overview — Tesla-style command centre */
function Sparkline({ data, color, height = 40 }: { data: number[]; color: string; height?: number }) {
  const w = 120
  const min = Math.min(...data)
  const max = Math.max(...data)
  const span = max - min || 1
  const pts = data.map((v, i) => [(i / (data.length - 1)) * w, height - 4 - ((v - min) / span) * (height - 8)])
  const line = pts.map(([x, y]) => `${x.toFixed(1)},${y.toFixed(1)}`).join(' ')
  const area = `0,${height} ${line} ${w},${height}`
  const [lx, ly] = pts[pts.length - 1]
  const gid = `sg-${color.replace(/[^a-z0-9]/gi, '')}`
  return (
    <svg viewBox={`0 0 ${w} ${height}`} preserveAspectRatio="none" className="h-full w-full">
      <defs>
        <linearGradient id={gid} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.35" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <polygon points={area} fill={`url(#${gid})`} />
      <polyline points={line} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" vectorEffect="non-scaling-stroke" />
      <circle cx={lx} cy={ly} r="2.6" fill={color} />
    </svg>
  )
}

function TrendCard({ label, value, unit, data, color }: { label: string; value: string; unit: string; data: number[]; color: string }) {
  return (
    <div className="flex flex-col justify-between overflow-hidden rounded-2xl border border-[var(--color-line)] bg-[var(--color-ink-850)] p-4">
      <div className="flex items-start justify-between">
        <span className="text-[11px] font-700 uppercase tracking-[0.14em] text-[#8ea3b6]">{label}</span>
        <span className="font-mono text-xl font-800 tabular-nums text-[#eef3f8]">
          {value}
          <span className="ml-0.5 text-xs font-600 text-[#7f93a6]">{unit}</span>
        </span>
      </div>
      <div className="mt-3 h-10">
        <Sparkline data={data} color={color} />
      </div>
    </div>
  )
}

function GaugeTimer({ label, value, sub, pct, tint }: { label: string; value: string; sub: string; pct: number; tint: string }) {
  return (
    <div
      className="relative flex items-center gap-5 overflow-hidden rounded-2xl border p-5"
      style={{ borderColor: `color-mix(in srgb, ${tint} 40%, var(--color-line))`, background: `linear-gradient(150deg, color-mix(in srgb, ${tint} 12%, var(--color-ink-850)), var(--color-ink-900))` }}
    >
      <div className="pointer-events-none absolute -left-10 -top-10 h-32 w-32 rounded-full opacity-25 blur-2xl" style={{ background: `radial-gradient(circle, ${tint}, transparent 70%)` }} />
      <div className="relative shrink-0" style={{ filter: `drop-shadow(0 0 10px color-mix(in srgb, ${tint} 45%, transparent))` }}>
        <Ring pct={pct} size={104} stroke={9} color={tint}>
          <span className="font-mono text-sm font-800 tabular-nums" style={{ color: tint }}>{sub}</span>
        </Ring>
      </div>
      <div className="relative min-w-0">
        <div className="text-[11px] font-700 uppercase tracking-[0.16em] text-[#8ea3b6]">{label}</div>
        <div className="font-mono text-4xl font-800 leading-none tabular-nums" style={{ color: tint, textShadow: `0 0 22px color-mix(in srgb, ${tint} 40%, transparent)` }}>{value}</div>
      </div>
    </div>
  )
}

function QuickAction({ icon, label, sub, accent, live, onClick }: { icon: ReactNode; label: string; sub: string; accent: string; live?: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="group relative flex flex-col justify-between overflow-hidden rounded-2xl border p-4 text-left transition-all hover:-translate-y-0.5 active:scale-[0.98]"
      style={{ borderColor: `color-mix(in srgb, ${accent} 38%, var(--color-line))`, background: `linear-gradient(155deg, color-mix(in srgb, ${accent} 14%, var(--color-ink-850)), var(--color-ink-900))`, minHeight: 116 }}
    >
      <div className="pointer-events-none absolute -right-6 -top-6 h-24 w-24 rounded-full opacity-20 blur-2xl transition-opacity group-hover:opacity-40" style={{ background: `radial-gradient(circle, ${accent}, transparent 70%)` }} />
      <div className="pointer-events-none absolute -bottom-5 -right-4 opacity-[0.10]" style={{ color: accent }}>{icon}</div>
      <div className="relative flex items-center justify-between">
        <span className="grid h-11 w-11 place-items-center rounded-2xl" style={{ background: `color-mix(in srgb, ${accent} 22%, transparent)`, color: accent }}>{icon}</span>
        {live && (
          <span className="flex items-center gap-1.5 rounded-full border border-[var(--color-critical)] px-2 py-0.5 text-[10px] font-800 text-[var(--color-critical)]">
            <span className="blink h-1.5 w-1.5 rounded-full bg-[var(--color-critical)]" /> LIVE
          </span>
        )}
      </div>
      <div className="relative">
        <div className="text-[15px] font-800 tracking-tight text-[#eef3f8]">{label}</div>
        <div className="text-xs font-600" style={{ color: accent }}>{sub}</div>
      </div>
    </button>
  )
}

const TEMP_TREND = [20.1, 20.3, 20.2, 20.5, 20.4, 20.3, 20.6, 20.4, 20.4, 20.5, 20.4]
const HUM_TREND = [46, 47, 47, 48, 49, 48, 47, 48, 49, 48, 48]
const PRES_TREND = [9, 10, 11, 10, 12, 11, 11, 12, 11, 10, 11]

type DomeLight = { on: boolean; intensity: number; temp: number }

/* One surgical dome drawn into the shared SVG. `withCam` adds the central
   surgical-field camera lens as a separate tappable target. */
function Dome({
  cx,
  cy,
  name,
  light,
  selected,
  withCam,
  camActive,
  camSelected,
  onSelect,
  onSelectCam,
}: {
  cx: number
  cy: number
  name: string
  light: DomeLight
  selected: boolean
  withCam?: boolean
  camActive?: boolean
  camSelected?: boolean
  onSelect: () => void
  onSelectCam?: () => void
}) {
  const on = light.on
  const litOpacity = on ? 0.2 + (light.intensity / 100) * 0.8 : 0.06
  /* Black rim ellipse — LEDs must stay inside this (with margin for their radius) */
  const rimRx = 76
  const rimRy = 63
  /* Orbital fractions of the rim (elliptical, not circular) so dots never cross the black line */
  const rings = withCam
    ? [
        { frac: 0.50, n: 8, r: 5 },
        { frac: 0.78, n: 14, r: 4.5 },
      ]
    : [
        { frac: 0.30, n: 5, r: 5.5 },
        { frac: 0.55, n: 10, r: 5.2 },
        { frac: 0.78, n: 16, r: 4.5 },
      ]
  const clipId = `dome-clip-${cx}-${cy}`
  const leds: { x: number; y: number; r: number }[] = []
  rings.forEach(({ frac, n, r }) => {
    const orbitRx = rimRx * frac
    const orbitRy = rimRy * frac
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2 + (frac > 0.5 ? 0.12 : 0)
      leds.push({
        x: cx + Math.cos(a) * orbitRx,
        y: cy + Math.sin(a) * orbitRy,
        r,
      })
    }
  })
  return (
    <>
      <defs>
        <clipPath id={clipId}>
          <ellipse cx={cx} cy={cy} rx={rimRx - 1} ry={rimRy - 1} />
        </clipPath>
      </defs>
      {on && <ellipse cx={cx} cy={cy + 10} rx="120" ry="96" fill="url(#otGlow)" />}
      <g style={{ cursor: 'pointer' }} onClick={onSelect}>
        <ellipse cx={cx} cy={cy} rx="86" ry="72" fill="url(#domeMetal)" stroke={selected ? 'var(--color-cyan)' : 'var(--color-line)'} strokeWidth={selected ? 2.5 : 1.5} />
        <ellipse cx={cx} cy={cy} rx={rimRx} ry={rimRy} fill="none" stroke="#0d151c" strokeWidth="1.4" />
        <g clipPath={`url(#${clipId})`}>
          {leds.map((l, i) => (
            <g key={i}>
              <circle cx={l.x} cy={l.y} r={l.r} fill="#0f1922" stroke="#2a3742" strokeWidth="0.8" />
              <circle cx={l.x} cy={l.y} r={Math.max(1.5, l.r - 1.6)} fill="#ffe9bd" style={{ opacity: litOpacity, filter: on ? 'drop-shadow(0 0 3px #ffdf9e)' : 'none' }} />
            </g>
          ))}
        </g>
      </g>
      {withCam && (
        <g style={{ cursor: 'pointer' }} onClick={(e) => { e.stopPropagation(); onSelectCam?.() }}>
          <circle cx={cx} cy={cy} r="26" fill="#0d151c" stroke={camSelected ? 'var(--color-cyan)' : '#33424f'} strokeWidth={camSelected ? 2.5 : 1.5} />
          <circle cx={cx} cy={cy} r="18" fill="#060b10" stroke="#243039" strokeWidth="1" />
          <circle cx={cx} cy={cy} r="10" fill="#0b141b" stroke="#2f3e4a" strokeWidth="1" />
          <circle cx={cx - 3.5} cy={cy - 3.5} r="3" fill={camActive ? '#bfe9e2' : '#3a4a57'} opacity="0.85" />
          {camActive && <circle className="blink" cx={cx + 17} cy={cy - 17} r="3.4" fill="var(--color-critical)" style={{ filter: 'drop-shadow(0 0 4px var(--color-critical))' }} />}
        </g>
      )}
      {/* read-out below the head */}
      <text x={cx} y={cy + 96} textAnchor="middle" fontFamily="monospace" fontSize="24" fontWeight="800" fill={on ? '#f4f8fc' : '#5f7286'}>{on ? light.intensity : 0}<tspan fontSize="15" fill={on ? '#a9b8c6' : '#4a5c6d'}>%</tspan></text>
      <text x={cx} y={cy + 112} textAnchor="middle" fontSize="10" fontWeight="700" letterSpacing="1.2" fill="#8ea3b6">{(name ?? '').toUpperCase()} · {light.temp}K</text>
    </>
  )
}

/* Interactive twin-dome OT surgical light. Each dome opens its own light
   controls; dome B carries the surgical camera (zoom / focus). When either
   light is on, laminar airflow streams down over the sterile field. */
function OTLightScene() {
  const [lightA, setLightA] = useState<DomeLight>({ on: true, intensity: 92, temp: 4300 })
  const [lightB, setLightB] = useState<DomeLight>({ on: true, intensity: 88, temp: 4500 })
  const [cam, setCam] = useState({ on: true, zoom: 2.4, focus: 62 })
  const [open, setOpen] = useState<null | 'A' | 'B' | 'cam'>(null)
  const airOn = lightA.on || lightB.on
  const toggle = (k: 'A' | 'B' | 'cam') => setOpen((o) => (o === k ? null : k))

  return (
    <div className="relative h-full w-full">
      {/* laminar air-flow — subtle downward stream when the field is lit */}
      {airOn && (
        <div
          className="laminar pointer-events-none absolute inset-x-8 top-[26%] bottom-0"
          style={{
            background:
              'repeating-linear-gradient(180deg, transparent 0 12px, color-mix(in srgb, var(--color-cyan) 26%, transparent) 12px 15px, transparent 15px 26px), repeating-linear-gradient(90deg, transparent 0 13px, color-mix(in srgb, var(--color-cyan) 10%, transparent) 13px 14px, transparent 14px 26px)',
            maskImage: 'linear-gradient(to bottom, transparent, black 35%, black 80%, transparent)',
            WebkitMaskImage: 'linear-gradient(to bottom, transparent, black 35%, black 80%, transparent)',
            opacity: 0.4,
          }}
        />
      )}

      <svg viewBox="0 0 400 300" preserveAspectRatio="xMidYMid meet" className="relative h-full w-full">
        <defs>
          <radialGradient id="domeMetal" cx="45%" cy="32%" r="78%">
            <stop offset="0%" stopColor="#2f3d49" />
            <stop offset="60%" stopColor="#1c2731" />
            <stop offset="100%" stopColor="#121b23" />
          </radialGradient>
          <radialGradient id="otGlow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#fff6e2" stopOpacity="0.4" />
            <stop offset="100%" stopColor="#fff6e2" stopOpacity="0" />
          </radialGradient>
        </defs>

        {/* ceiling diffuser + suspension yoke feeding both domes */}
        <rect x="130" y="8" width="140" height="8" rx="3" fill="#26333e" />
        {Array.from({ length: 7 }).map((_, i) => (
          <line key={i} x1={138 + i * 20} y1="16" x2={138 + i * 20} y2="22" stroke="#1a242d" strokeWidth="2" />
        ))}
        <path d="M200 16 L200 40 M200 40 L95 78 M200 40 L305 78" fill="none" stroke="#2b3844" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" />
        <circle cx="200" cy="40" r="5" fill="#33424f" />

        <Dome cx={95} cy={150} name="Light 1" light={lightA} selected={open === 'A'} onSelect={() => toggle('A')} />
        <Dome cx={305} cy={150} name="Light 2" light={lightB} selected={open === 'B'} withCam camActive={cam.on} camSelected={open === 'cam'} onSelect={() => toggle('B')} onSelectCam={() => toggle('cam')} />
      </svg>

      {/* hint labels */}
      {!open && (
        <div className="pointer-events-none absolute inset-x-0 bottom-1 flex justify-center gap-5 text-[10px] font-700 uppercase tracking-[0.12em] text-[#6f8394]">
          <span>Tap a dome · lights</span>
          <span>Tap lens · camera</span>
        </div>
      )}

      {/* light control popup (dome A or B) */}
      {(open === 'A' || open === 'B') && (() => {
        const light = open === 'A' ? lightA : lightB
        const setLight = open === 'A' ? setLightA : setLightB
        return (
          <div className="absolute inset-x-2 bottom-2 max-h-[min(70%,22rem)] overflow-y-auto rounded-2xl border border-[var(--color-cyan)]/45 bg-[var(--color-ink-900)]/95 p-3 shadow-xl backdrop-blur sm:p-4">
            <div className="mb-3 flex items-center justify-between gap-2">
              <span className="flex min-w-0 items-center gap-2 text-sm font-800 text-[#eef3f8]"><Icon.Bulb size={16} className="shrink-0" /> <span className="truncate">Dome {open} · Surgical Light</span></span>
              <button onClick={() => setOpen(null)} className="shrink-0 text-xs font-700 text-[#7f93a6]">Close ✕</button>
            </div>
            <div className="mb-3 flex items-center justify-between">
              <span className="text-xs font-700 uppercase tracking-wide text-[#8ea3b6]">Power</span>
              <Toggle on={light.on} onChange={(v: boolean) => setLight((l) => ({ ...l, on: v }))} />
            </div>
            <div className="mb-1 flex items-center justify-between text-xs font-700 text-[#8ea3b6]">
              <span>Intensity</span><span className="font-mono text-[var(--color-cyan)]">{light.intensity}%</span>
            </div>
            <Slider value={light.intensity} min={0} max={100} onChange={(v: number) => setLight((l) => ({ ...l, intensity: v }))} disabled={!light.on} color="var(--color-cyan)" />
            <div className="mt-3 mb-1 flex items-center justify-between text-xs font-700 text-[#8ea3b6]">
              <span>Colour temp</span><span className="font-mono text-[var(--color-gold)]">{light.temp}K</span>
            </div>
            <Slider value={light.temp} min={3000} max={5000} onChange={(v: number) => setLight((l) => ({ ...l, temp: v }))} disabled={!light.on} color="var(--color-gold)" />
          </div>
        )
      })()}

      {/* surgical camera popup (zoom / focus) */}
      {open === 'cam' && (
        <div className="absolute inset-x-2 bottom-2 max-h-[min(70%,22rem)] overflow-y-auto rounded-2xl border border-[var(--color-cyan)]/45 bg-[var(--color-ink-900)]/95 p-3 shadow-xl backdrop-blur sm:p-4">
          <div className="mb-3 flex items-center justify-between gap-2">
            <span className="flex min-w-0 items-center gap-2 text-sm font-800 text-[#eef3f8]"><Icon.Video size={16} className="shrink-0" /> <span className="truncate">Surgical Field Camera</span></span>
            <button onClick={() => setOpen(null)} className="shrink-0 text-xs font-700 text-[#7f93a6]">Close ✕</button>
          </div>
          <div className="mb-3 flex items-center justify-between">
            <span className="text-xs font-700 uppercase tracking-wide text-[#8ea3b6]">Power</span>
            <Toggle on={cam.on} onChange={(v: boolean) => setCam((c) => ({ ...c, on: v }))} />
          </div>
          <div className="mb-1 flex items-center justify-between text-xs font-700 text-[#8ea3b6]">
            <span>Zoom</span><span className="font-mono text-[var(--color-cyan)]">{cam.zoom.toFixed(1)}×</span>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => setCam((c) => ({ ...c, zoom: Math.max(1, +(c.zoom - 0.2).toFixed(1)) }))} disabled={!cam.on} className="grid h-11 w-11 shrink-0 place-items-center rounded-lg border border-[var(--color-line)] text-lg font-800 text-[#cdd9e5] disabled:opacity-40">−</button>
            <div className="flex-1"><Slider value={cam.zoom * 10} min={10} max={100} onChange={(v: number) => setCam((c) => ({ ...c, zoom: +(v / 10).toFixed(1) }))} disabled={!cam.on} color="var(--color-cyan)" /></div>
            <button onClick={() => setCam((c) => ({ ...c, zoom: Math.min(10, +(c.zoom + 0.2).toFixed(1)) }))} disabled={!cam.on} className="grid h-11 w-11 shrink-0 place-items-center rounded-lg border border-[var(--color-line)] text-lg font-800 text-[#cdd9e5] disabled:opacity-40">+</button>
          </div>
          <div className="mt-3 mb-1 flex items-center justify-between text-xs font-700 text-[#8ea3b6]">
            <span>Focus</span><span className="font-mono text-[var(--color-violet)]">{cam.focus}%</span>
          </div>
          <Slider value={cam.focus} min={0} max={100} onChange={(v: number) => setCam((c) => ({ ...c, focus: v }))} disabled={!cam.on} color="var(--color-violet)" />
        </div>
      )}
    </div>
  )
}

/* compact status chip for the top strip */
function StatChip({ icon, label, value, color }: { icon: ReactNode; label: string; value: string; color: string }) {
  return (
    <div className="flex items-center gap-2 whitespace-nowrap">
      <span style={{ color }}>{icon}</span>
      <div className="leading-tight">
        <div className="text-[10px] font-700 uppercase tracking-[0.14em] text-[#6f8394]">{label}</div>
        <div className="text-xs font-800 tabular-nums text-[#dbe5ee]">{value}</div>
      </div>
    </div>
  )
}

/* a single time read-out (clock or timer) for the top block */
function TimeCell({ label, value, tint, badge, controls }: { label: string; value: string; tint: string; badge?: string; controls?: ReactNode }) {
  return (
    <div className="relative flex h-full min-h-0 flex-col justify-between overflow-hidden rounded-2xl border px-3 py-2 sm:px-3.5 sm:py-2.5" style={{ borderColor: `color-mix(in srgb, ${tint} 34%, var(--color-line))`, background: `linear-gradient(155deg, color-mix(in srgb, ${tint} 10%, var(--color-ink-850)), var(--color-ink-900))` }}>
      <div className="pointer-events-none absolute -right-8 -top-8 h-20 w-20 rounded-full opacity-20 blur-2xl" style={{ background: `radial-gradient(circle, ${tint}, transparent 70%)` }} />
      <div className="relative flex shrink-0 items-center justify-between gap-2">
        <span className="text-[10px] font-800 uppercase tracking-[0.16em] sm:text-[11px]" style={{ color: tint }}>{label}</span>
        {badge && <span className="rounded-full border px-2 py-0.5 text-[9px] font-800 uppercase tracking-wide sm:text-[10px]" style={{ borderColor: `color-mix(in srgb, ${tint} 45%, transparent)`, color: tint }}>{badge}</span>}
      </div>
      <div className="relative my-0.5 flex min-h-0 flex-1 items-center">
        <div className="font-mono text-[clamp(1.35rem,3.8vh,2.1rem)] font-800 leading-none tabular-nums" style={{ color: tint, textShadow: `0 0 18px color-mix(in srgb, ${tint} 35%, transparent)` }}>{value}</div>
      </div>
      {controls && <div className="relative mt-1 flex shrink-0 gap-1.5 sm:mt-1.5 sm:gap-2">{controls}</div>}
    </div>
  )
}

function MiniBtn({ icon, label, onClick, tint }: { icon: ReactNode; label: string; onClick: () => void; tint: string }) {
  return (
    /* min-h-[40px]: compact but still usable on touch panels */
    <button onClick={onClick} className="flex min-h-[40px] flex-1 items-center justify-center gap-1 rounded-lg border py-1.5 text-[10px] font-800 uppercase tracking-wide transition-all active:scale-95 sm:gap-1.5 sm:text-[11px]" style={{ borderColor: `color-mix(in srgb, ${tint} 40%, var(--color-line))`, color: tint, background: `color-mix(in srgb, ${tint} 10%, transparent)` }}>
      {icon} {label}
    </button>
  )
}

function ActionBtn({ icon, label, accent, onClick, live }: { icon: ReactNode; label: string; accent: string; onClick: () => void; live?: boolean }) {
  return (
    <button
      onClick={onClick}
      className="group relative flex h-full min-h-0 w-full flex-col items-center justify-center gap-0.5 overflow-hidden rounded-xl border p-1 transition-all hover:-translate-y-0.5 active:scale-95 sm:gap-1 sm:p-1.5"
      style={{
        borderColor: `color-mix(in srgb, ${accent} 32%, var(--color-line))`,
        background: `linear-gradient(160deg, color-mix(in srgb, ${accent} 12%, var(--color-ink-850)), var(--color-ink-900))`,
      }}
    >
      <div className="pointer-events-none absolute -right-4 -top-4 h-16 w-16 rounded-full opacity-15 blur-2xl transition-opacity group-hover:opacity-30" style={{ background: `radial-gradient(circle, ${accent}, transparent 70%)` }} />
      {live && <span className="blink absolute right-1.5 top-1.5 h-1.5 w-1.5 rounded-full bg-[var(--color-critical)]" />}
      <span
        className="relative grid aspect-square h-[clamp(1.75rem,28%,2.5rem)] place-items-center rounded-lg"
        style={{ background: `color-mix(in srgb, ${accent} 20%, transparent)`, color: accent }}
      >
        {icon}
      </span>
      <span className="relative max-w-full truncate px-0.5 text-center text-[clamp(0.6rem,1.4vh,0.7rem)] font-800 leading-tight text-[var(--color-fg)]">
        {label}
      </span>
    </button>
  )
}

function EnvRow({ label, value, unit, data, color }: { label: string; value: string; unit: string; data: number[]; color: string }) {
  return (
    <div className="flex min-h-0 flex-1 items-center gap-3">
      <div className="w-24 shrink-0">
        <div className="text-[10px] font-700 uppercase tracking-[0.12em] text-[#8ea3b6]">{label}</div>
        <div className="font-mono text-lg font-800 leading-tight tabular-nums text-[#eef3f8]">{value}<span className="ml-0.5 text-[11px] font-600 text-[#7f93a6]">{unit}</span></div>
      </div>
      <div className="h-9 min-w-0 flex-1"><Sparkline data={data} color={color} /></div>
    </div>
  )
}

function SettingsOverview({ shared }: any) {
  const { now, gases, proc, setProc, anae, setAnae, setPage } = shared
  const clock = now.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })
  const secs = now.toLocaleTimeString('en-GB', { second: '2-digit' })
  const date = now.toLocaleDateString('en-GB', { weekday: 'short', day: '2-digit', month: 'short', year: 'numeric' })

  const crit = gases.filter((g: Gas) => g.state === 'critical').length
  const caut = gases.filter((g: Gas) => g.state === 'caution').length
  const total = crit + caut
  const worst: AState = crit ? 'critical' : caut ? 'caution' : 'ok'
  const gasColor = worst === 'ok' ? 'var(--color-ok)' : stateTint(worst)
  const anaeShown = anae.sec > 0 ? anae.sec : anae.target

  const toggleAnae = () =>
    setAnae((a: any) => (a.run ? { ...a, run: false } : a.sec > 0 ? { ...a, run: true } : a.target > 0 ? { ...a, sec: a.target, run: true } : a))

  const stats = [
    { icon: <Icon.Shield size={16} />, label: 'Gases', value: total ? `${total} alert` : 'Normal', color: gasColor },
    { icon: <Icon.Power size={16} />, label: 'IPS', value: 'Normal', color: 'var(--color-ok)' },
    { icon: <Icon.Fan size={16} />, label: 'HEPA', value: '99.98%', color: 'var(--color-ok)' },
    { icon: <Icon.Shield size={16} />, label: 'UV', value: 'Off', color: '#6f8394' },
    { icon: <Icon.Drop size={16} />, label: 'Pressure', value: '+11 Pa', color: 'var(--color-blue)' },
    { icon: <Icon.Temp size={16} />, label: 'Temp', value: '20.4 °C', color: 'var(--color-cyan)' },
    { icon: <Icon.Drop size={16} />, label: 'Humidity', value: '48 % RH', color: 'var(--color-blue)' },
  ]

  return (
    <div className="relative flex h-full min-h-0 flex-col gap-2 overflow-hidden p-2 sm:gap-3 sm:p-3">
      {/* ambience */}
      <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -left-28 -top-28 h-[40vh] w-[40vh] rounded-full opacity-[0.12] blur-3xl" style={{ background: 'radial-gradient(circle, var(--color-cyan), transparent 70%)' }} />
      </div>

      {/* ---- top status strip ---- */}
      <div className="relative flex flex-none flex-col gap-2 rounded-2xl border border-[var(--color-line)] bg-[var(--color-ink-900)] px-3 py-2.5 sm:flex-row sm:items-center sm:gap-4 sm:px-4">
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 sm:gap-x-5">
          {stats.map((s) => <StatChip key={s.label} {...s} />)}
        </div>
        <div className="flex flex-wrap items-center gap-2 sm:ml-auto sm:gap-3 sm:whitespace-nowrap">
          <span className="text-xs font-600 uppercase tracking-[0.12em] text-[#9fb1c2]">{date}</span>
          <span className="flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-800" style={{ borderColor: gasColor, color: gasColor }}>
            <StateGlyph state={worst} size={13} />
            {total ? `${total} alarm${total > 1 ? 's' : ''}` : 'All normal'}
          </span>
        </div>
      </div>

      {/* ---- time block: procedure · live clock · anaesthesia (compact) ---- */}
      <div className="relative grid min-h-0 flex-[0.48] grid-cols-1 gap-2 sm:grid-cols-3 sm:gap-3">
        <TimeCell
          label="Procedure"
          badge={proc.run ? 'Running' : proc.sec ? 'Paused' : 'Idle'}
          value={fmt(proc.sec)}
          tint="var(--color-gold)"
          controls={
            <>
              <MiniBtn icon={proc.run ? <Icon.Pause size={13} /> : <Icon.Play size={13} />} label={proc.run ? 'Pause' : 'Start'} tint="var(--color-gold)" onClick={() => setProc((p: any) => ({ ...p, run: !p.run }))} />
              <MiniBtn icon={<Icon.Reset size={13} />} label="Reset" tint="var(--color-gold)" onClick={() => setProc({ run: false, sec: 0 })} />
            </>
          }
        />
        <div className="relative order-first flex min-h-0 flex-col items-center justify-center overflow-hidden rounded-2xl border border-[color-mix(in_srgb,var(--color-cyan)_28%,var(--color-line))] bg-[color-mix(in_srgb,var(--color-cyan)_7%,var(--color-ink-900))] px-2 py-1.5 sm:order-none sm:px-3 sm:py-2">
          <span className="text-[9px] font-800 uppercase tracking-[0.28em] text-[var(--color-cyan)] sm:text-[10px]">Theatre Time</span>
          <div className="flex items-baseline gap-1.5">
            <span className="font-mono text-[clamp(1.5rem,4vh,2.4rem)] font-800 leading-none tabular-nums text-[var(--color-fg)]">{clock}</span>
            <span className="font-mono text-sm font-500 tabular-nums text-[var(--color-muted-dim)] sm:text-base">{secs}</span>
          </div>
        </div>
        <TimeCell
          label="Anaesthesia"
          badge={anae.run ? 'Counting' : anae.sec ? 'Paused' : 'Set'}
          value={fmt(anaeShown)}
          tint="var(--color-cyan)"
          controls={
            <>
              <MiniBtn icon={anae.run ? <Icon.Pause size={13} /> : <Icon.Play size={13} />} label={anae.run ? 'Pause' : 'Start'} tint="var(--color-cyan)" onClick={toggleAnae} />
              <MiniBtn icon={<Icon.Reset size={13} />} label="Reset" tint="var(--color-cyan)" onClick={() => setAnae((a: any) => ({ ...a, run: false, sec: 0 }))} />
            </>
          }
        />
      </div>

      {/* ---- main: surgical lights · quick actions (dominant height) ---- */}
      <div className="relative grid min-h-0 flex-[2.05] grid-cols-1 gap-2 sm:gap-3 lg:grid-cols-[1.65fr_1fr]">
        {/* surgical lights */}
        <section className="relative flex min-h-0 flex-col overflow-hidden rounded-2xl border border-[var(--color-line)] bg-[var(--color-ink-950)] p-2 sm:p-3">
          <div className="mb-1 flex shrink-0 items-center justify-between gap-2">
            <span className="text-xs font-800 uppercase tracking-[0.16em] text-[var(--color-fg-soft)]">Surgical Lights</span>
            <span className="text-[10px] font-700 uppercase tracking-wide text-[var(--color-muted-dim)]">Laminar airflow</span>
          </div>
          <div className="relative min-h-0 flex-1">
            <OTLightScene />
          </div>
        </section>

        {/* quick actions — fills pane; 3×3 cells share height equally */}
        <section className="relative flex min-h-0 flex-col overflow-hidden rounded-2xl border border-[var(--color-line)] bg-[var(--color-ink-900)] p-2 sm:p-3">
          <div className="mb-1.5 shrink-0 text-xs font-800 uppercase tracking-[0.16em] text-[var(--color-fg-soft)] sm:mb-2">Quick Actions</div>
          <div className="grid min-h-0 flex-1 grid-cols-3 grid-rows-3 gap-1.5 sm:gap-2">
            <ActionBtn icon={<Icon.Check size={18} />} label="Checklist" accent="var(--color-ok)" onClick={() => setPage('checklist')} />
            <ActionBtn icon={<Icon.Phone size={18} />} label="Telephone" accent="var(--color-blue)" onClick={() => setPage('comm')} />
            <ActionBtn icon={<Icon.Music size={18} />} label="Music" accent="var(--color-violet)" onClick={() => setPage('media')} />
            <ActionBtn icon={<Icon.Bulb size={18} />} label="Room Lights" accent="var(--color-cyan)" onClick={() => setPage('lighting')} />
            <ActionBtn icon={<Icon.Cam size={18} />} label="Camera" accent="var(--color-gold)" onClick={() => setPage('comm')} />
            <ActionBtn icon={<Icon.Wind size={18} />} label="Climate" accent="var(--color-blue)" onClick={() => setPage('environment')} />
            <ActionBtn icon={<Icon.Clock size={18} />} label="Timers" accent="var(--color-gold)" onClick={() => setPage('timers')} />
            <ActionBtn icon={<Icon.Chart size={18} />} label="Analytics" accent="var(--color-gold)" onClick={() => setPage('analytics')} />
            <ActionBtn icon={<Icon.Rec size={18} />} label="Recording" accent="var(--color-caution)" onClick={() => setPage('recording')} />
          </div>
        </section>
      </div>
    </div>
  )
}

/* ============================================================ Settings */
const SETTINGS_NAV: { id: string; label: string; icon: (typeof Icon)[keyof typeof Icon]; tier?: number }[] = [
  { id: 'settings', label: 'Overview', icon: Icon.Grid },
  ...NAV.filter((n) => n.id !== 'home'),
  { id: 'admin', label: 'Admin', icon: Icon.Settings },
]

/* Grouped nav sections — each group has a tint colour and contains nav ids */
const NAV_GROUPS: { label: string; tint: string; ids: string[] }[] = [
  { label: 'Clinical',       tint: 'var(--color-cyan)', ids: ['timers', 'checklist'] },
  { label: 'Room Systems',   tint: 'var(--color-cyan)', ids: ['lighting', 'environment'] },
  { label: 'Comms & Media',  tint: 'var(--color-cyan)', ids: ['comm', 'media'] },
  { label: 'Data & Network', tint: 'var(--color-cyan)', ids: ['analytics', 'network', 'recording', 'routing'] },
]

function Settings({ page, setPage, version, setVersion, shared, otOccupied, camActive }: any) {
  const moduleNav = SETTINGS_NAV.filter((n) => n.id !== 'settings' && n.id !== 'admin')

  return (
    <div className="flex h-full min-h-0 flex-col md:flex-row">
      {/* Mobile — horizontal module chips */}
      <nav className="chip-scroll flex shrink-0 items-center gap-1.5 overflow-x-auto border-b border-[var(--color-line)] bg-[var(--color-ink-900)] px-2 py-2 md:hidden">
        {SETTINGS_NAV.filter((n) => n.id === 'settings').map((n) => {
          const active = page === n.id
          const I = n.icon
          return (
            <button
              key={n.id}
              onClick={() => setPage(n.id)}
              className="flex shrink-0 items-center gap-1.5 rounded-xl border px-3 py-2 text-[11px] font-700 transition-all"
              style={
                active
                  ? { color: 'var(--color-cyan-dim)', borderColor: 'color-mix(in srgb, var(--color-cyan-dim) 45%, var(--color-line))', background: 'color-mix(in srgb, var(--color-cyan-dim) 16%, transparent)' }
                  : { color: 'var(--color-muted)', borderColor: 'var(--color-line)', background: 'var(--color-ink-850)' }
              }
            >
              <I size={14} />
              <span className="whitespace-nowrap">{n.label}</span>
            </button>
          )
        })}
        {moduleNav.map((n) => {
          const locked = n.tier ? version < n.tier : false
          const active = page === n.id
          const I = n.icon
          return (
            <button
              key={n.id}
              onClick={() => !locked && setPage(n.id)}
              disabled={locked}
              className={`flex shrink-0 items-center gap-1.5 rounded-xl border px-3 py-2 text-[11px] font-700 transition-all ${
                locked ? 'opacity-40' : ''
              }`}
              style={
                active
                  ? { color: 'var(--color-cyan-dim)', borderColor: 'color-mix(in srgb, var(--color-cyan-dim) 45%, var(--color-line))', background: 'color-mix(in srgb, var(--color-cyan-dim) 16%, transparent)' }
                  : { color: 'var(--color-muted)', borderColor: 'var(--color-line)', background: 'var(--color-ink-850)' }
              }
            >
              <I size={14} />
              <span className="whitespace-nowrap">{n.label}</span>
              {locked && <Icon.Lock size={10} />}
            </button>
          )
        })}
      </nav>

      {/* Desktop — clean section rail (no scroll; even item spacing) */}
      <nav className="hidden h-full min-h-0 w-[236px] shrink-0 flex-col overflow-hidden border-r border-[var(--color-line)] bg-[var(--color-ink-950)] md:flex">
        <div className="flex h-full min-h-0 flex-col gap-1 overflow-hidden px-2.5 py-2.5">
          {/* Overview */}
          <button
            type="button"
            onClick={() => setPage('settings')}
            className={`flex w-full shrink-0 items-center gap-[3px] rounded-2xl px-2.5 py-2 text-left text-[13px] font-700 transition-all ${
              page === 'settings'
                ? 'text-[var(--color-cyan-dim)]'
                : 'text-[var(--color-fg-soft)] hover:bg-[var(--color-ink-750)] hover:text-white'
            }`}
            style={
              page === 'settings'
                ? { background: 'color-mix(in srgb, var(--color-cyan-dim) 22%, var(--color-ink-900))' }
                : undefined
            }
          >
            <span
              className="grid h-8 w-8 shrink-0 place-items-center rounded-xl"
              style={{
                color: page === 'settings' ? 'var(--color-cyan-dim)' : 'var(--color-fg-soft)',
                background: page === 'settings'
                  ? 'color-mix(in srgb, var(--color-cyan-dim) 22%, transparent)'
                  : 'var(--color-ink-900)',
              }}
            >
              <Icon.Grid size={16} />
            </span>
            Overview
          </button>

          <div className="flex min-h-0 flex-1 flex-col gap-1 overflow-hidden pt-1">
            {NAV_GROUPS.map((group) => {
              const groupItems = SETTINGS_NAV.filter((n) => group.ids.includes(n.id))
              return (
                <div key={group.label} className="flex min-h-0 flex-col gap-1">
                  {/* Section label + rule */}
                  <div className="flex shrink-0 items-center gap-2 px-1 pt-1">
                    <span className="shrink-0 text-[10px] font-800 uppercase tracking-[0.14em] text-[var(--color-cyan)]">
                      {group.label}
                    </span>
                    <span className="h-px min-w-0 flex-1 bg-[var(--color-line)]" />
                  </div>

                  {groupItems.map((n) => {
                    const locked = n.tier ? version < n.tier : false
                    const active = page === n.id
                    const I = n.icon
                    return (
                      <button
                        key={n.id}
                        type="button"
                        disabled={locked}
                        onClick={() => !locked && setPage(n.id)}
                        className={`flex h-9 w-full shrink-0 items-center gap-[3px] rounded-xl px-2 text-left text-[12px] transition-all ${
                          active
                            ? 'font-700 text-[var(--color-cyan-dim)]'
                            : locked
                              ? 'cursor-default font-600 opacity-40'
                              : 'font-600 text-[var(--color-fg-soft)] hover:bg-[var(--color-ink-750)] hover:text-white'
                        }`}
                        style={
                          active
                            ? { background: 'color-mix(in srgb, var(--color-cyan-dim) 18%, transparent)' }
                            : undefined
                        }
                      >
                        <span
                          className="grid h-8 w-8 shrink-0 place-items-center rounded-xl"
                          style={{
                            background: active
                              ? 'color-mix(in srgb, var(--color-cyan-dim) 22%, transparent)'
                              : 'var(--color-ink-900)',
                            color: active ? 'var(--color-cyan-dim)' : locked ? '#3a4b5c' : 'var(--color-fg-soft)',
                          }}
                        >
                          <I size={15} />
                        </span>
                        <span className="flex-1 truncate leading-snug">{n.label}</span>
                        {locked && <Icon.Lock size={10} className="text-[var(--color-muted-deep)]" />}
                      </button>
                    )
                  })}
                </div>
              )
            })}
          </div>

          <div className="shrink-0 border-t border-[var(--color-line)] pt-1">
            <button
              type="button"
              onClick={() => setPage('admin')}
              className={`flex h-9 w-full items-center gap-[3px] rounded-xl px-2 text-left text-[12px] transition-all ${
                page === 'admin'
                  ? 'font-700 text-[var(--color-cyan-dim)]'
                  : 'font-600 text-[var(--color-fg-soft)] hover:bg-[var(--color-ink-750)] hover:text-white'
              }`}
              style={
                page === 'admin'
                  ? { background: 'color-mix(in srgb, var(--color-cyan-dim) 18%, transparent)' }
                  : undefined
              }
            >
              <span
                className="grid h-8 w-8 shrink-0 place-items-center rounded-xl"
                style={{
                  background: page === 'admin'
                    ? 'color-mix(in srgb, var(--color-cyan-dim) 22%, transparent)'
                    : 'var(--color-ink-900)',
                  color: page === 'admin' ? 'var(--color-cyan-dim)' : 'var(--color-fg-soft)',
                }}
              >
                <Icon.Settings size={15} />
              </span>
              Admin
            </button>
          </div>
        </div>
      </nav>

      <div className="flex min-h-0 flex-1 flex-col overflow-hidden p-2 sm:p-3">
        {page !== 'settings' && (
          <button
            onClick={() => setPage('settings')}
            className="mb-2 hidden shrink-0 items-center gap-2 self-start rounded-xl border border-[var(--color-line)] bg-[var(--color-ink-850)] px-3 py-2 text-[12px] font-700 text-[var(--color-muted)] transition-all hover:bg-[var(--color-ink-800)] hover:text-[var(--color-cyan)] md:flex"
          >
            <Icon.Home size={14} /> Overview
          </button>
        )}
        <div className="min-h-0 flex-1 overflow-hidden">
          <div className={`module-fit ${['admin', 'analytics', 'checklist', 'network', 'paging'].includes(page) ? 'overflow-y-auto' : ''}`}>
            {page === 'settings' && <SettingsOverview version={version} setPage={setPage} shared={shared} otOccupied={otOccupied} camActive={camActive} />}
            {page === 'timers' && <TimersControl {...shared} />}
            {page === 'lighting' && <Lighting occupied={otOccupied} />}
            {page === 'environment' && <Environment {...shared} />}
            {page === 'checklist' && <Checklist checked={shared.checked} setChecked={shared.setChecked} />}
            {page === 'comm' && <Comm {...shared} camActive={camActive} />}
            {page === 'media' && <Media />}
            {page === 'analytics' && <Analytics />}
            {page === 'network' && <Network />}
            {page === 'recording' && <Recording {...shared} locked={version < 2} />}
            {page === 'routing' && <Routing locked={version < 3} />}
            {page === 'admin' && <Admin otName={shared.otName} setOtName={shared.setOtName} tempSet={shared.tempSet} setTempSet={shared.setTempSet} humSet={shared.humSet} setHumSet={shared.setHumSet} />}
          </div>
        </div>
      </div>
    </div>
  )
}

/* ============================================================ Alarm ticker */
function AlarmTicker({ gases, otName }: { gases: Gas[]; otName: string }) {
  /* IEC 60601-1-8 §6.8 — alarm pause: max 120 s, auto-rearms, shows countdown */
  const [pauseSecs, setPauseSecs] = useState(0)
  const paused = pauseSecs > 0

  useEffect(() => {
    if (!paused) return
    const id = setInterval(() => setPauseSecs((s) => Math.max(0, s - 1)), 1000)
    return () => clearInterval(id)
  }, [paused])

  const alarms = gases
    .filter((g) => g.state !== 'ok')
    .map((g) => {
      /* All gas alarms in this system are LOW-pressure / INSUFFICIENT-flow events.
         Supply gases (bar): critical = dangerously low pressure.
         Vacuum / AGSS (kPa): critical = insufficient suction (value too close to 0).
         Never label supply-pressure alarms as "HIGH". */
      const direction = g.vac ? 'INSUFFICIENT' : 'PRESSURE LOW'
      return {
        loc: otName,
        param: `${g.label} ${direction} · ${g.value} ${g.unit}`,
        state: g.state,
        time: new Date(Date.now() - (g.key.length % 9) * 60000).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }),
      }
    })
  const crit = alarms.some((a) => a.state === 'critical')
  const active = crit && !paused

  const pauseMins = Math.floor(pauseSecs / 60)
  const pausePad = String(pauseSecs % 60).padStart(2, '0')
  const pauseLabel = paused
    ? `Muted · ${pauseMins}:${pausePad} · Tap to un-mute`
    : 'Mute Alarms'

  return (
    <footer
      className="safe-x safe-b flex shrink-0 flex-wrap items-center gap-2 border-t px-3 py-1.5 sm:gap-4 sm:px-5 sm:py-2"
      style={{
        borderColor: active ? 'var(--color-critical)' : 'var(--color-line)',
        background: active ? 'color-mix(in srgb, var(--color-critical) 12%, var(--color-ink-900))' : 'var(--color-ink-900)',
      }}
    >
      <div className="flex shrink-0 items-center gap-2">
        <Icon.Bell size={16} className={active ? 'blink-critical text-[var(--color-critical)]' : 'text-[#7f93a6]'} />
        <span className="text-xs font-700 uppercase tracking-[0.14em] text-[#8ea3b6]">
          Alarms · {alarms.length}
        </span>
      </div>
      <div className="order-last flex w-full flex-1 items-center gap-4 overflow-x-auto sm:order-none sm:w-auto sm:gap-5">
        {alarms.length === 0 && (
          <span className="text-xs font-600 text-[var(--color-ok)]">All parameters within limits</span>
        )}
        {alarms.map((a, i) => (
          <span
            key={i}
            className={`flex items-center gap-2 whitespace-nowrap text-xs font-600 ${!paused ? (a.state === 'critical' ? 'blink-critical' : a.state === 'caution' ? 'blink-caution' : '') : ''}`}
          >
            <StateGlyph state={a.state} size={13} />
            <span className="font-mono text-[#7f93a6]">{a.time}</span>
            <span style={{ color: stateTint(a.state) }}>{a.param}</span>
            <span className="text-[#5f7286]">· {a.loc}</span>
          </span>
        ))}
      </div>
      <button
        onClick={() => setPauseSecs(paused ? 0 : 120)}
        className={`ml-auto shrink-0 rounded-lg border px-3 py-2 text-[11px] font-700 transition-colors sm:text-xs ${
          paused
            ? 'border-[var(--color-caution)]/50 bg-[var(--color-caution)]/10 text-[var(--color-caution)]'
            : 'border-[var(--color-line)] text-[#cdd9e5] hover:border-[#3a4b5c]'
        }`}
      >
        <span className="sm:hidden">{paused ? `Muted ${pauseMins}:${pausePad}` : 'Mute'}</span>
        <span className="hidden sm:inline">{pauseLabel}</span>
      </button>
    </footer>
  )
}

/* ============================================================ HOME */
/* ============================================================ New Design — glass-cockpit home */
/* Nominal supply values — ring fill % only.
   Vacuum/AGSS: absolute value of expected operating pressure (kPa).
   Surg Air: 7 bar instrument air supply. */
const GAS_NOMINAL: Record<string, number> = { o2: 4.5, n2o: 4.5, air: 4.5, co2: 4.5, surgair: 7.5, vac: 50, agss: 20 }

type TimerTheme = { tint: string; from: string; to: string; ink: string }
function TimerControl({
  theme,
  icon,
  label,
  badge,
  value,
  run,
  stage,
  onToggle,
  onReset,
}: {
  theme: TimerTheme
  icon: ReactNode
  label: string
  badge?: string
  value: string
  run: boolean
  stage: string
  onToggle: () => void
  onReset: () => void
}) {
  const { tint, from, to, ink } = theme
  return (
    <div
      className="relative flex h-full flex-1 flex-col overflow-hidden rounded-2xl border p-2.5 sm:p-3"
      style={{
        borderColor: `color-mix(in srgb, ${tint} 42%, var(--color-line))`,
        background: `linear-gradient(158deg, color-mix(in srgb, ${tint} 15%, var(--color-ink-850)), var(--color-ink-900))`,
      }}
    >
      <span className="absolute inset-x-0 top-0 h-1" style={{ background: `linear-gradient(90deg, ${from}, ${to})` }} />
      {/* header */}
      <div className="flex shrink-0 items-center gap-2">
        <span className="grid h-8 w-8 place-items-center rounded-xl sm:h-9 sm:w-9" style={{ background: `${tint}22`, color: tint }}>{icon}</span>
        <div className="min-w-0 flex-1">
          <div className="truncate fluid-label font-800 tracking-tight" style={{ color: tint }}>{label}</div>
          {badge && <div className="text-[9px] font-700 uppercase tracking-[0.16em] text-[#7f93a6] sm:text-[10px]">{badge}</div>}
        </div>
      </div>
      {/* time */}
      <div className="home-deck flex min-h-0 flex-1 flex-col items-center justify-center py-0.5">
        <span
          className="font-mono fluid-timer font-800 leading-none tabular-nums"
          style={{ backgroundImage: `linear-gradient(180deg, ${from}, ${to})`, WebkitBackgroundClip: 'text', backgroundClip: 'text', color: 'transparent' }}
        >
          {value}
        </span>
        <div className="mt-1 flex items-center gap-1.5">
          <span className={`h-2 w-2 rounded-full ${run ? 'breathe' : ''}`} style={{ background: run ? tint : '#4a5c6d' }} />
          <span className="text-[10px] font-700 uppercase tracking-[0.14em] text-[#9fb1c2] sm:text-[11px]">{stage}</span>
        </div>
      </div>
      {/* controls */}
      <div className="mt-1 flex shrink-0 gap-2">
        <button
          onClick={onToggle}
          className="flex flex-1 items-center justify-center gap-2 rounded-xl py-2 text-sm font-800 transition-all active:scale-95 sm:py-2.5"
          style={run ? { background: 'transparent', color: tint, border: `1.5px solid ${tint}` } : { background: tint, color: ink, border: `1.5px solid ${tint}` }}
        >
          {run ? <><Icon.Pause size={16} /> Pause</> : <><Icon.Play size={16} /> Start</>}
        </button>
        <button
          onClick={onReset}
          className="flex items-center justify-center gap-2 rounded-xl border border-[var(--color-line)] px-3 py-2 text-sm font-700 text-[#9fb1c2] transition-all hover:border-[#3a4b5c] hover:text-white active:scale-95 sm:px-4 sm:py-2.5"
        >
          <Icon.Reset size={16} /> Reset
        </button>
      </div>
    </div>
  )
}

function CountdownControl({
  theme,
  icon,
  label,
  target,
  remaining,
  run,
  onAdjust,
  onToggle,
  onReset,
}: {
  theme: TimerTheme
  icon: ReactNode
  label: string
  target: number
  remaining: number
  run: boolean
  onAdjust: (deltaSec: number) => void
  onToggle: () => void
  onReset: () => void
}) {
  const { tint, from, to, ink } = theme
  const standby = !run && remaining === 0
  const shown = remaining > 0 ? remaining : target
  const stage = run ? 'Counting down' : remaining > 0 ? 'Paused' : 'Set duration'
  const low = run && remaining > 0 && remaining <= 60
  const step = (
    label: string,
    onDown: () => void,
    onUp: () => void,
  ) => (
    <div className="flex flex-1 flex-col items-center gap-0.5">
      <span className="text-[9px] font-700 uppercase tracking-[0.16em] text-[#7f93a6] sm:text-[10px]">{label}</span>
      <div className="flex w-full items-center gap-1.5">
        <button onClick={onDown} className="grid h-9 flex-1 place-items-center rounded-lg border text-lg font-800 transition-all active:scale-90 sm:h-11 sm:text-xl" style={{ borderColor: `color-mix(in srgb, ${tint} 45%, var(--color-line))`, color: tint }}>−</button>
        <button onClick={onUp} className="grid h-9 flex-1 place-items-center rounded-lg border text-lg font-800 transition-all active:scale-90 sm:h-11 sm:text-xl" style={{ borderColor: `color-mix(in srgb, ${tint} 45%, var(--color-line))`, color: tint }}>+</button>
      </div>
    </div>
  )
  return (
    <div
      className={`relative flex h-full flex-1 flex-col overflow-hidden rounded-2xl border p-2.5 sm:p-3 ${low ? 'softpulse' : ''}`}
      style={{
        borderColor: `color-mix(in srgb, ${tint} 42%, var(--color-line))`,
        background: `linear-gradient(158deg, color-mix(in srgb, ${tint} 15%, var(--color-ink-850)), var(--color-ink-900))`,
      }}
    >
      <span className="absolute inset-x-0 top-0 h-1" style={{ background: `linear-gradient(90deg, ${from}, ${to})` }} />
      <div className="flex shrink-0 items-center gap-2">
        <span className="grid h-8 w-8 place-items-center rounded-xl sm:h-9 sm:w-9" style={{ background: `${tint}22`, color: tint }}>{icon}</span>
        <div className="min-w-0 flex-1">
          <div className="truncate fluid-label font-800 tracking-tight" style={{ color: tint }}>{label}</div>
          <div className="text-[9px] font-700 uppercase tracking-[0.16em] text-[#7f93a6] sm:text-[10px]">Countdown</div>
        </div>
      </div>
      <div className="home-deck flex min-h-0 flex-1 flex-col items-center justify-center py-0.5">
        <span
          className="font-mono fluid-timer font-800 leading-none tabular-nums"
          style={{ backgroundImage: `linear-gradient(180deg, ${from}, ${to})`, WebkitBackgroundClip: 'text', backgroundClip: 'text', color: 'transparent' }}
        >
          {fmt(shown)}
        </span>
        <div className="mt-1 flex items-center gap-1.5">
          <span className={`h-2 w-2 rounded-full ${run ? 'breathe' : ''}`} style={{ background: run ? tint : '#4a5c6d' }} />
          <span className="text-[10px] font-700 uppercase tracking-[0.14em] text-[#9fb1c2] sm:text-[11px]">{stage}</span>
        </div>
      </div>
      {standby && (
        <div className="mb-1.5 flex shrink-0 gap-2 sm:gap-3">
          {step('Hours', () => onAdjust(-3600), () => onAdjust(3600))}
          {step('Minutes', () => onAdjust(-60), () => onAdjust(60))}
        </div>
      )}
      <div className="mt-1 flex shrink-0 gap-2">
        <button
          onClick={onToggle}
          disabled={standby && target === 0}
          className="flex flex-1 items-center justify-center gap-2 rounded-xl py-2 text-sm font-800 transition-all active:scale-95 disabled:opacity-40 sm:py-2.5"
          style={run ? { background: 'transparent', color: tint, border: `1.5px solid ${tint}` } : { background: tint, color: ink, border: `1.5px solid ${tint}` }}
        >
          {run ? <><Icon.Pause size={16} /> Pause</> : <><Icon.Play size={16} /> Start</>}
        </button>
        <button
          onClick={onReset}
          className="flex items-center justify-center gap-2 rounded-xl border border-[var(--color-line)] px-3 py-2 text-sm font-700 text-[#9fb1c2] transition-all hover:border-[#3a4b5c] hover:text-white active:scale-95 sm:px-4 sm:py-2.5"
        >
          <Icon.Reset size={16} /> Reset
        </button>
      </div>
    </div>
  )
}

function GasGauge({ g, onClick }: { g: Gas; onClick: () => void }) {
  const alarm = g.state !== 'ok'
  const color = alarm ? stateTint(g.state) : 'var(--color-ok)'
  const pct = Math.min(100, (Math.abs(parseFloat(g.value)) / (GAS_NOMINAL[g.key] || 5)) * 100)
  return (
    <button
      onClick={onClick}
      className={`group relative flex h-full min-h-0 flex-col items-center justify-center gap-1 overflow-hidden rounded-2xl border p-1.5 transition-all active:scale-[0.97] ${g.state === 'critical' ? 'softpulse' : ''}`}
      style={{
        borderColor: alarm ? color : 'var(--color-line)',
        background: alarm ? `color-mix(in srgb, ${color} 16%, var(--color-ink-850))` : 'var(--color-ink-850)',
      }}
    >
      <div
        className="flex min-h-0 w-full flex-1 items-center justify-center py-0.5"
        style={{ filter: alarm ? `drop-shadow(0 0 6px ${color})` : 'none' }}
      >
        <Ring pct={pct} size={82} stroke={7} color={color} fluid>
          <div className="text-center leading-none">
            <div className="font-mono text-[clamp(0.85rem,2.1vh,1.25rem)] font-800 tabular-nums" style={{ color: alarm ? color : '#eef3f8' }}>{g.value}</div>
            <div className="mt-0.5 text-[9px] font-600 text-[#7f93a6] sm:text-[10px]">{g.unit}</div>
          </div>
        </Ring>
      </div>
      <div className="flex shrink-0 items-center gap-1">
        <StateGlyph state={g.state} size={14} />
        <span className="text-[clamp(0.7rem,1.8vh,1.15rem)] font-800 tracking-tight" style={{ color: alarm ? color : '#eef3f8' }}>{g.label}</span>
      </div>
      {alarm && (
        <span className="shrink-0 text-[9px] font-800 uppercase tracking-widest" style={{ color }}>
          {g.state === 'critical' ? 'High' : 'Low'}
        </span>
      )}
    </button>
  )
}

function NewVital({ label, value, unit, accent, big, icon }: { label: string; value: string; unit: string; accent: string; big?: boolean; icon?: ReactNode }) {
  return (
    <div
      className={`relative flex h-full min-h-0 flex-col justify-center overflow-hidden rounded-2xl border ${big ? 'px-4 py-2' : 'px-3 py-1.5'}`}
      style={{
        borderColor: big ? `color-mix(in srgb, ${accent} 45%, var(--color-line))` : 'var(--color-line)',
        background: `linear-gradient(160deg, color-mix(in srgb, ${accent} ${big ? 14 : 8}%, var(--color-ink-850)), var(--color-ink-900))`,
      }}
    >
      <span className="absolute inset-y-0 left-0" style={{ width: big ? 5 : 4, background: accent }} />
      {big && icon && (
        <div className="pointer-events-none absolute -right-3 -top-3 opacity-[0.12]" style={{ color: accent }}>{icon}</div>
      )}
      <div className={`font-700 uppercase text-[#9fb1c2] ${big ? 'text-[clamp(0.7rem,1.6vh,1rem)] tracking-[0.14em]' : 'text-[clamp(0.6rem,1.2vh,0.75rem)] tracking-[0.12em]'}`}>{label}</div>
      <div
        className={`font-mono font-800 leading-none tabular-nums ${big ? 'text-[clamp(1.8rem,6vh,4rem)]' : 'text-[clamp(1.1rem,2.8vh,1.65rem)]'}`}
        style={{ color: accent, textShadow: big ? `0 0 22px color-mix(in srgb, ${accent} 40%, transparent)` : 'none' }}
      >
        {value}
        <span className={`ml-1 font-600 text-[#7f93a6] ${big ? 'text-xl' : 'text-xs'}`}>{unit}</span>
      </div>
    </div>
  )
}

/* Differential pressure tile — colour-zoned bar shows where current value sits
   in the OR positive-pressure range (8–15 Pa per EN ISO 14644 / HTM 03-01).
   <5 Pa = critical (breach risk), 5–8 = caution, 8–15 = normal, >15 = high */
function DiffPressureTile({ value = 11 }: { value?: number }) {
  const accent =
    value < 5 ? 'var(--color-critical)'
    : value < 8 ? 'var(--color-caution)'
    : value <= 15 ? 'var(--color-cyan)'
    : 'var(--color-blue)'
  const status =
    value < 5 ? 'CRITICAL — LOW' : value < 8 ? 'Caution' : value <= 15 ? 'Normal' : 'High'
  /* Map 0–20 Pa onto a 0–100% bar */
  const markerPct = Math.min(100, Math.max(0, (value / 20) * 100))
  return (
    <div
      className="relative flex h-full min-h-0 flex-col justify-between overflow-hidden rounded-2xl border px-3 py-2"
      style={{
        borderColor: `color-mix(in srgb, ${accent} 45%, var(--color-line))`,
        background: `linear-gradient(160deg, color-mix(in srgb, ${accent} 8%, var(--color-ink-850)), var(--color-ink-900))`,
      }}
    >
      <span className="absolute inset-y-0 left-0 rounded-l-2xl" style={{ width: 4, background: accent }} />
      <div className="font-700 uppercase text-[#9fb1c2] text-[clamp(0.6rem,1.2vh,0.75rem)] tracking-[0.12em]">Diff. Pressure</div>
      <div className="font-mono font-800 leading-none tabular-nums text-[clamp(1.15rem,2.8vh,1.65rem)]" style={{ color: accent }}>
        +{value}<span className="ml-1 text-[11px] font-600 text-[#7f93a6]">Pa</span>
      </div>
      {/* Zone bar */}
      <div className="mt-1.5">
        <div className="relative h-2 overflow-hidden rounded-full bg-[#1b2530]">
          <div className="absolute inset-y-0 left-0 rounded-l-full" style={{ width: '25%', background: 'var(--color-critical)', opacity: 0.35 }} />
          <div className="absolute inset-y-0" style={{ left: '25%', width: '15%', background: 'var(--color-caution)', opacity: 0.35 }} />
          <div className="absolute inset-y-0" style={{ left: '40%', width: '35%', background: 'var(--color-ok)', opacity: 0.35 }} />
          <div className="absolute inset-y-0 rounded-r-full" style={{ left: '75%', right: 0, background: 'var(--color-blue)', opacity: 0.35 }} />
          {/* Marker */}
          <div
            className="absolute top-0 bottom-0 w-[3px] rounded-full"
            style={{ left: `${markerPct}%`, transform: 'translateX(-50%)', background: accent, boxShadow: `0 0 4px ${accent}` }}
          />
        </div>
        <div className="mt-0.5 flex justify-between text-[8px] font-600 text-[#4a5c6d]">
          <span>0</span><span>5</span><span>8</span><span>15</span><span>20</span>
        </div>
      </div>
      <div className="mt-0.5 text-[9px] font-700 uppercase tracking-wide" style={{ color: accent }}>{status}</div>
    </div>
  )
}

/* HEPA filter life — accent lerps red→green with remaining % (0=red, 100=green). */
function hepaLifeColor(pct: number) {
  const t = Math.min(100, Math.max(0, pct))
  return `color-mix(in srgb, var(--color-ok) ${t}%, var(--color-critical))`
}

function HepaLifeTile({ pct = 86 }: { pct?: number }) {
  const accent = hepaLifeColor(pct)
  const status = pct >= 70 ? 'Life OK' : pct >= 35 ? 'Monitor' : pct > 0 ? 'Replace Soon' : 'Replace Now'
  return (
    <div
      className="relative flex h-full min-h-0 flex-col justify-between overflow-hidden rounded-2xl border px-3 py-2"
      style={{
        borderColor: `color-mix(in srgb, ${accent} 45%, var(--color-line))`,
        background: `linear-gradient(160deg, color-mix(in srgb, ${accent} 8%, var(--color-ink-850)), var(--color-ink-900))`,
      }}
    >
      <span className="absolute inset-y-0 left-0 rounded-l-2xl" style={{ width: 4, background: accent }} />
      <div className="font-700 uppercase text-[var(--color-muted)] text-[clamp(0.6rem,1.2vh,0.75rem)] tracking-[0.12em]">HEPA Filter</div>
      <div className="font-mono font-800 leading-none tabular-nums text-[clamp(1.15rem,2.8vh,1.65rem)]" style={{ color: accent }}>
        {pct}<span className="ml-1 text-[11px] font-600 text-[var(--color-muted-dim)]">%</span>
      </div>
      {/* Remaining life bar — fill color follows red→green scale */}
      <div className="mt-1.5">
        <div className="relative h-2 overflow-hidden rounded-full bg-[var(--color-track)]">
          <div
            className="absolute inset-0 opacity-25"
            style={{ background: 'linear-gradient(to right, var(--color-critical), var(--color-ok))' }}
          />
          <div
            className="relative h-full rounded-full transition-all"
            style={{ width: `${pct}%`, background: accent, boxShadow: `0 0 8px color-mix(in srgb, ${accent} 50%, transparent)` }}
          />
        </div>
        <div className="mt-0.5 flex justify-between text-[8px] font-600 text-[var(--color-muted-deep)]">
          <span>0%</span><span>Remaining</span><span>100%</span>
        </div>
      </div>
      <div className="mt-0.5 text-[9px] font-700 uppercase tracking-wide" style={{ color: accent }}>{status}</div>
    </div>
  )
}

function ClimateTile({
  label,
  value,
  unit,
  accent,
  icon,
  setpoint,
  min,
  max,
  step,
  decimals = 0,
  onAdjust,
}: {
  label: string
  value: string
  unit: string
  accent: string
  icon?: ReactNode
  setpoint: number
  min: number
  max: number
  step: number
  decimals?: number
  onAdjust: (delta: number) => void
}) {
  return (
    <div
      className="relative flex h-full min-h-0 flex-col justify-center overflow-hidden rounded-2xl border px-3 py-2"
      style={{
        borderColor: `color-mix(in srgb, ${accent} 45%, var(--color-line))`,
        background: `linear-gradient(160deg, color-mix(in srgb, ${accent} 14%, var(--color-ink-850)), var(--color-ink-900))`,
      }}
    >
      <span className="absolute inset-y-0 left-0" style={{ width: 5, background: accent }} />
      {icon && <div className="pointer-events-none absolute -right-2 -top-2 opacity-[0.11]" style={{ color: accent }}>{icon}</div>}
      <div className="font-700 uppercase text-[#9fb1c2] text-[clamp(0.65rem,1.2vh,0.8rem)] tracking-[0.12em]">{label}</div>
      <div
        className="font-mono font-800 leading-none tabular-nums text-[clamp(1.6rem,4.2vh,2.4rem)]"
        style={{ color: accent, textShadow: `0 0 22px color-mix(in srgb, ${accent} 40%, transparent)` }}
      >
        {value}
        <span className="ml-1 text-[clamp(0.85rem,1.8vh,1.1rem)] font-600 text-[#7f93a6]">{unit}</span>
      </div>
      <div className="mt-1 flex items-center gap-2">
        <span className="text-[10px] font-700 uppercase tracking-[0.12em] text-[#7f93a6]">
          Set <span className="font-mono text-[#b9c7d6]">{setpoint.toFixed(decimals)}{unit}</span>
        </span>
        <div className="ml-auto flex items-center gap-1.5">
          <button
            onClick={() => onAdjust(-step)}
            disabled={setpoint <= min}
            className="grid h-8 w-8 place-items-center rounded-xl border text-base font-800 transition-all active:scale-90 disabled:opacity-30 sm:h-9 sm:w-9"
            style={{ borderColor: `color-mix(in srgb, ${accent} 55%, var(--color-line))`, color: accent, background: `color-mix(in srgb, ${accent} 12%, transparent)` }}
          >
            −
          </button>
          <button
            onClick={() => onAdjust(step)}
            disabled={setpoint >= max}
            className="grid h-8 w-8 place-items-center rounded-xl border text-base font-800 transition-all active:scale-90 disabled:opacity-30 sm:h-9 sm:w-9"
            style={{ borderColor: `color-mix(in srgb, ${accent} 55%, var(--color-line))`, color: accent, background: `color-mix(in srgb, ${accent} 12%, transparent)` }}
          >
            +
          </button>
        </div>
      </div>
    </div>
  )
}

const PROC_THEME: TimerTheme = { tint: 'var(--color-gold)', from: '#e8b87a', to: '#b87d3f', ink: '#241703' }
const ANAE_THEME: TimerTheme = { tint: 'var(--color-cyan)', from: '#9fd9d1', to: 'var(--color-cyan-dim)', ink: '#04211d' }

function NewHome(props: any) {
  const { gases, setGases, proc, setProc, anae, setAnae, now, procStage, otOccupied, tempSet, setTempSet, humSet, setHumSet } = props
  const cycleGas = (i: number) =>
    setGases((prev: Gas[]) => prev.map((x, xi) => (xi === i ? { ...x, state: cycle[x.state] } : x)))
  const clock = now.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })
  const secs = now.toLocaleTimeString('en-GB', { second: '2-digit' })
  const date = now.toLocaleDateString('en-GB', { weekday: 'long', day: '2-digit', month: 'long' })

  const alarms = gases.filter((g: Gas) => g.state !== 'ok')
  const crit = gases.filter((g: Gas) => g.state === 'critical').length
  const caut = gases.filter((g: Gas) => g.state === 'caution').length
  const worst: AState = crit ? 'critical' : caut ? 'caution' : 'ok'
  const ringColor = stateTint(worst)
  const alarmParts: string[] = []
  if (crit) alarmParts.push(`${crit} high`)
  if (caut) alarmParts.push(`${caut} low`)
  const total = crit + caut
  const statusText = total ? `${total} alarm${total > 1 ? 's' : ''} · ${alarmParts.join(', ')}` : 'All systems nominal'

  return (
    <div className="relative flex h-full min-h-0 flex-col gap-2 overflow-hidden p-2 sm:gap-2.5 sm:p-3">
      {/* ---- calm static ambience: no motion, just depth ---- */}
      <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -left-28 -top-32 h-[42vh] w-[42vh] rounded-full opacity-20 blur-3xl" style={{ background: 'radial-gradient(circle, var(--color-cyan), transparent 70%)' }} />
        <div className="absolute -bottom-36 right-[-7rem] h-[46vh] w-[46vh] rounded-full opacity-[0.14] blur-3xl" style={{ background: 'radial-gradient(circle, var(--color-violet), transparent 70%)' }} />
        <div className="absolute inset-0 opacity-[0.04]" style={{ backgroundImage: 'linear-gradient(var(--color-cyan) 1px, transparent 1px), linear-gradient(90deg, var(--color-cyan) 1px, transparent 1px)', backgroundSize: '46px 46px' }} />
      </div>

      {/* ---- instrument deck: timers flanking live clock — shares viewport height ---- */}
      <section className="home-deck relative grid min-h-0 flex-[1.35] grid-cols-1 gap-2 sm:gap-2.5 md:grid-cols-[1.05fr_1.3fr_1.05fr]">
        <div className="order-2 min-h-0 md:order-1">
          <TimerControl
            theme={PROC_THEME}
            icon={<Icon.Clock size={19} />}
            label="Procedure Time"
            badge="Case duration"
            value={fmt(proc.sec)}
            run={proc.run}
            stage={procStage}
            onToggle={() => setProc((p: any) => ({ ...p, run: !p.run }))}
            onReset={() => setProc({ run: false, sec: 0 })}
          />
        </div>

        <Panel className="home-deck relative order-1 flex min-h-0 flex-col items-center justify-center overflow-hidden md:order-2">
          <span className="pointer-events-none absolute left-2 top-2 h-5 w-5 rounded-tl-lg border-l-2 border-t-2 sm:left-3 sm:top-3 sm:h-6 sm:w-6" style={{ borderColor: 'color-mix(in srgb, var(--color-cyan) 55%, transparent)' }} />
          <span className="pointer-events-none absolute right-2 top-2 h-5 w-5 rounded-tr-lg border-r-2 border-t-2 sm:right-3 sm:top-3 sm:h-6 sm:w-6" style={{ borderColor: 'color-mix(in srgb, var(--color-cyan) 55%, transparent)' }} />
          <span className="pointer-events-none absolute bottom-2 left-2 h-5 w-5 rounded-bl-lg border-b-2 border-l-2 sm:bottom-3 sm:left-3 sm:h-6 sm:w-6" style={{ borderColor: 'color-mix(in srgb, var(--color-cyan) 55%, transparent)' }} />
          <span className="pointer-events-none absolute bottom-2 right-2 h-5 w-5 rounded-br-lg border-b-2 border-r-2 sm:bottom-3 sm:right-3 sm:h-6 sm:w-6" style={{ borderColor: 'color-mix(in srgb, var(--color-cyan) 55%, transparent)' }} />
          <div className="pointer-events-none absolute inset-0 grid place-items-center opacity-40">
            <svg viewBox="0 0 200 200" className="h-[130%] w-[130%]">
              <circle cx="100" cy="100" r="92" fill="none" stroke="var(--color-line)" strokeWidth="0.6" />
              <circle cx="100" cy="100" r="70" fill="none" stroke="color-mix(in srgb, var(--color-cyan) 35%, transparent)" strokeWidth="0.8" strokeDasharray="2 5" />
              <circle cx="100" cy="100" r="48" fill="none" stroke="var(--color-line)" strokeWidth="0.6" />
            </svg>
          </div>

          <div className="relative flex min-h-0 flex-1 flex-col items-center justify-center px-2 py-1">
            <span
              className="font-mono fluid-clock font-800 leading-none tabular-nums"
              style={{ backgroundImage: 'linear-gradient(135deg, #9fe4d8, #a9c3e0 55%, #b6a8db)', WebkitBackgroundClip: 'text', backgroundClip: 'text', color: 'transparent' }}
            >
              {clock}
            </span>
            <span className="mt-0.5 font-mono text-[clamp(0.85rem,2.2vh,1.35rem)] font-500 tabular-nums text-[#7f93a6]">{secs}s</span>
            <span className="mt-1 text-center text-[clamp(0.7rem,1.6vh,1rem)] font-600 tracking-wide text-[#b9c7d6]">{date}</span>
          </div>

          <div className="relative w-full shrink-0">
            <div className="flex flex-wrap items-center justify-center gap-1.5 rounded-xl border border-[color-mix(in_srgb,var(--color-cyan)_28%,var(--color-line))] bg-[color-mix(in_srgb,var(--color-cyan)_8%,var(--color-ink-850))] px-2 py-1.5 sm:gap-2 sm:px-3">
              <StateGlyph state={worst} size={14} />
              <span className="text-[clamp(0.65rem,1.4vh,0.9rem)] font-700 tracking-wide" style={{ color: worst === 'ok' ? 'var(--color-cyan)' : ringColor }}>{statusText}</span>
              <span className="text-[clamp(0.6rem,1.3vh,0.8rem)] font-600 text-[#7f93a6]">· {otOccupied ? 'OT Active' : 'OT Idle'}</span>
            </div>
          </div>
        </Panel>

        <div className="order-3 min-h-0">
          <CountdownControl
            theme={ANAE_THEME}
            icon={<Icon.Clock size={19} />}
            label="Anaesthesia Countdown"
            target={anae.target}
            remaining={anae.sec}
            run={anae.run}
            onAdjust={(d: number) =>
              setAnae((a: any) => ({ ...a, target: Math.max(0, Math.min(12 * 3600, a.target + d)) }))
            }
            onToggle={() =>
              setAnae((a: any) => {
                if (a.run) return { ...a, run: false }
                if (a.sec > 0) return { ...a, run: true }
                if (a.target <= 0) return a
                return { ...a, sec: a.target, run: true }
              })
            }
            onReset={() => setAnae((a: any) => ({ ...a, run: false, sec: 0 }))}
          />
        </div>
      </section>

      {/* ---- gas instrument row ---- */}
      <Panel className="relative flex min-h-0 flex-[0.95] flex-col !p-2 sm:!p-3">
        <SectionHeader
          icon={<Icon.Wind size={15} />}
          tint="var(--color-blue)"
          right={
            alarms.length ? (
              <span className="text-[10px] font-700 text-[var(--color-caution)]">
                {alarms.length} line{alarms.length > 1 ? 's' : ''} out of range
              </span>
            ) : undefined
          }
        >
          Medical Gas Supply
        </SectionHeader>
        <div className="grid min-h-0 flex-1 grid-cols-7 gap-1.5 sm:gap-2">
          {gases.map((g: Gas, i: number) => (
            <GasGauge key={g.key} g={g} onClick={() => cycleGas(i)} />
          ))}
        </div>
      </Panel>

      {/* ---- environment strip ---- */}
      <div className="relative grid min-h-0 flex-[1] grid-cols-2 gap-2 sm:gap-2.5 lg:grid-cols-[1fr_1fr_1.2fr]">
        <ClimateTile
          label="Temperature"
          value="20.4"
          unit="°C"
          accent="var(--color-gold)"
          icon={<Icon.Temp size={48} />}
          setpoint={tempSet}
          min={16}
          max={26}
          step={0.5}
          decimals={1}
          onAdjust={(d: number) => setTempSet((t: number) => Math.round(Math.min(26, Math.max(16, t + d)) * 10) / 10)}
        />
        <ClimateTile
          label="Humidity"
          value="48"
          unit="%"
          accent="var(--color-blue)"
          icon={<Icon.Drop size={48} />}
          setpoint={humSet}
          min={30}
          max={60}
          step={1}
          onAdjust={(d: number) => setHumSet((h: number) => Math.min(60, Math.max(30, h + d)))}
        />
        <div className="col-span-2 grid min-h-0 grid-cols-2 gap-2 sm:gap-2.5 lg:col-span-1">
          <DiffPressureTile value={11} />
          <HepaLifeTile pct={86} />
          <NewVital label="IPS Isolation" value="198" unit="kΩ" accent="#a9c3e0" />
          <div
            className="relative flex min-h-0 flex-col items-center justify-center gap-1 overflow-hidden rounded-2xl border px-2 py-1.5 text-center"
            style={{ borderColor: 'var(--color-line)', background: 'var(--color-ink-850)' }}
          >
            <img src={logo} alt="Prenit World Lifecare" className="h-[clamp(1.75rem,5vh,3.25rem)] w-auto rounded-lg bg-white/95 px-2 py-1" />
            <span className="text-[clamp(0.55rem,1.1vh,0.7rem)] font-700 uppercase leading-tight tracking-[0.12em] text-[#9fb1c2]">
              Surgery Room Management System
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}

function TimersControl({ proc, setProc, anae, setAnae }: any) {
  const procStage = proc.sec === 0 ? 'Not Started' : proc.run ? 'In Progress' : 'Paused'
  return (
    <div className="grid h-full min-h-0 grid-cols-1 gap-3 overflow-hidden md:grid-cols-2">
      <TimerCard
        title="Procedure Timer"
        tint="var(--color-gold)"
        sec={proc.sec}
        run={proc.run}
        stage={procStage}
        onToggle={() => setProc((p: any) => ({ ...p, run: !p.run }))}
        onReset={() => setProc({ run: false, sec: 0 })}
      />
      <TimerCard
        title="Anaesthesia Countdown"
        tint="var(--color-cyan)"
        sec={anae.sec || anae.target}
        run={anae.run}
        stage={anae.run ? 'Counting down' : anae.sec ? 'Paused' : 'Set duration'}
        independent
        onToggle={() =>
          setAnae((a: any) => {
            if (a.run) return { ...a, run: false }
            if (a.sec > 0) return { ...a, run: true }
            if (a.target <= 0) return a
            return { ...a, sec: a.target, run: true }
          })
        }
        onReset={() => setAnae((a: any) => ({ ...a, run: false, sec: 0 }))}
      />
      <Panel className="min-h-0 md:col-span-2">
        <SectionHeader tint="var(--color-blue)">About the two clocks</SectionHeader>
        <p className="text-sm leading-relaxed text-[var(--color-muted)]">
          The procedure and anaesthesia timers are clinically distinct and never merged. Start, pause, and reset live here in Settings so the Home screen stays a calm, glanceable display — no control can be triggered accidentally mid-case. The live values remain visible from across the room on Home.
        </p>
      </Panel>
    </div>
  )
}

function TimerCard({ title, tint, sec, run, stage, onToggle, onReset, independent }: any) {
  const pct = (sec % 3600) / 36
  return (
    <Panel className="flex h-full flex-col justify-center">
      <div className="mb-3 flex items-center justify-between">
        <SectionHeader tint={tint}>{title}</SectionHeader>
        {independent && (
          <span className="rounded-full border border-[var(--color-gold)]/40 px-2 py-0.5 text-[10px] font-700 uppercase tracking-wide text-[var(--color-gold)]">
            Independent
          </span>
        )}
      </div>
      <div className="flex items-center gap-4">
        <Ring pct={pct} color={tint} size={88}>
          <span className="text-[10px] font-700 uppercase tracking-widest text-[#7f93a6]">{stage}</span>
        </Ring>
        <div className="flex-1">
          <div className="font-mono text-4xl font-700 tabular-nums" style={{ color: tint }}>
            {fmt(sec)}
          </div>
          <div className="mt-3 flex gap-2">
            <TButton variant={run ? 'ghost' : 'primary'} onClick={onToggle} className="flex-1">
              {run ? <Icon.Pause size={16} /> : <Icon.Play size={16} />}
              {run ? 'Pause' : sec ? 'Resume' : 'Start'}
            </TButton>
            <TButton onClick={onReset}>
              <Icon.Reset size={16} />
            </TButton>
          </div>
        </div>
      </div>
    </Panel>
  )
}

function QuickLight() {
  const [v, setV] = useState(92)
  return (
    <Panel>
      <SectionHeader icon={<Icon.Bulb size={16} />} tint="var(--color-cyan)">
        Quick Light
      </SectionHeader>
      <div className="mb-2 flex items-end justify-between">
        <span className="text-xs font-600 text-[#9fb1c2]">OT Light Intensity</span>
        <span className="font-mono text-2xl font-700 text-[var(--color-cyan)]">{v}%</span>
      </div>
      <Slider value={v} onChange={setV} />
      <div className="mt-3 grid grid-cols-3 gap-2">
        {[50, 80, 100].map((p) => (
          <TButton key={p} onClick={() => setV(p)} active={v === p}>
            {p}%
          </TButton>
        ))}
      </div>
    </Panel>
  )
}

function phaseStatus(items: readonly string[], phase: string, checked: Record<string, boolean>) {
  const done = items.filter((_, i) => checked[`${phase}-${i}`]).length
  return { done, total: items.length }
}

function ChecklistSummary({ checked, onOpen }: { checked: Record<string, boolean>; onOpen: () => void }) {
  return (
    <Panel>
      <SectionHeader icon={<Icon.Check size={16} />} tint="var(--color-blue)" right={
        <button onClick={onOpen} className="text-[10px] font-700 uppercase tracking-wide text-[var(--color-cyan)] hover:underline">
          Open →
        </button>
      }>
        WHO Safety Checklist
      </SectionHeader>
      <div className="space-y-2">
        {(Object.keys(CHECKLIST) as Phase[]).map((phase) => {
          const { done, total } = phaseStatus(CHECKLIST[phase], phase, checked)
          const status = done === 0 ? 'Not Started' : done === total ? 'Complete' : 'In Progress'
          const tint = done === total ? 'var(--color-ok)' : done === 0 ? '#7f93a6' : 'var(--color-caution)'
          return (
            <button key={phase} onClick={onOpen} className="flex w-full items-center gap-3 rounded-xl bg-[var(--color-ink-800)] p-2.5 text-left hover:bg-[var(--color-ink-750)]">
              <div className="flex-1">
                <div className="text-[13px] font-700">{phase}</div>
                <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-[#1b2530]">
                  <div className="h-full rounded-full transition-all" style={{ width: `${(done / total) * 100}%`, background: tint }} />
                </div>
              </div>
              <div className="text-right">
                <div className="font-mono text-sm font-700">{done}/{total}</div>
                <div className="text-[10px] font-600" style={{ color: tint }}>{status}</div>
              </div>
            </button>
          )
        })}
      </div>
    </Panel>
  )
}

function MiniStat({ label, value, unit, state, ai }: { label: string; value: string; unit: string; state: AState; ai?: boolean }) {
  return (
    <div className="rounded-xl border border-[var(--color-line)] bg-[var(--color-ink-800)] p-3">
      <div className="mb-1 flex items-center gap-1.5">
        <StateGlyph state={state} size={12} />
        <span className="text-[10px] font-600 uppercase tracking-wide text-[#7f93a6]">{label}</span>
        {ai && <span className="ml-auto"><AIBadge /></span>}
      </div>
      <div className="font-mono text-xl font-700 tabular-nums text-[#e7eef5]">
        {value}
        <span className="text-xs text-[#7f93a6]"> {unit}</span>
      </div>
    </div>
  )
}

/* ============================================================ LIGHTING */
function Lighting({ occupied }: { occupied: boolean }) {
  const [l1, setL1] = useState({ intensity: 92, temp: 4300, focus: 24 })
  const [l2, setL2] = useState({ intensity: 92, temp: 4300, focus: 24 })
  const [sync, setSync] = useState(true)
  const [shadow, setShadow] = useState(true)
  const [endo, setEndo] = useState(false)
  const [ceiling, setCeiling] = useState(40)

  const set1 = (patch: any) => {
    setL1((p) => ({ ...p, ...patch }))
    if (sync) setL2((p) => ({ ...p, ...patch }))
  }
  return (
    <div className="grid h-full min-h-0 grid-cols-1 gap-3 overflow-hidden lg:grid-cols-3 lg:gap-4">
      <div className="min-h-0 space-y-3 overflow-hidden lg:col-span-2 lg:space-y-4">
        <Panel>
          <SectionHeader icon={<Icon.Bulb size={16} />} tint="var(--color-cyan)" right={
            <label className="flex items-center gap-2 text-xs font-600 text-[var(--color-muted)]">
              Sync L1 ↔ L2 <Toggle on={sync} onChange={setSync} />
            </label>
          }>
            Surgical Light Heads
          </SectionHeader>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <LightHead name="Light 1" data={l1} onChange={set1} />
            <LightHead name="Light 2" data={l2} onChange={(p: any) => setL2((s) => ({ ...s, ...p }))} disabled={sync} />
          </div>
        </Panel>

        <Panel>
          <SectionHeader tint="var(--color-blue)">Modes</SectionHeader>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <ModeToggle label="Shadow-Free Mode" desc="Multi-source overlap cancels shadows" on={shadow} onChange={setShadow} />
            <ModeToggle label="Endo Mode" desc="Dimmed green ambient for scope work" on={endo} onChange={setEndo} tint="var(--color-violet)" />
          </div>
        </Panel>
      </div>

      <div className="space-y-4">
        <Panel>
          <SectionHeader tint="var(--color-violet)">Peripheral / Ceiling Light</SectionHeader>
          <div className="mb-2 flex items-end justify-between">
            <span className="text-xs font-600 text-[#9fb1c2]">Dimmer</span>
            <span className="font-mono text-2xl font-700 text-[var(--color-violet)]">{ceiling}%</span>
          </div>
          <Slider value={ceiling} onChange={setCeiling} color="var(--color-violet)" />
          <div className="mt-4 text-xs font-600 text-[#9fb1c2]">Colour Tone Presets</div>
          <div className="mt-2 grid grid-cols-3 gap-2">
            {['Warm', 'Neutral', 'Cool'].map((t) => (
              <TButton key={t}>{t}</TButton>
            ))}
          </div>
        </Panel>

        <Panel>
          <SectionHeader tint="var(--color-caution)">UV-C Disinfection</SectionHeader>
          <div className="flex items-center gap-3 rounded-xl border border-[var(--color-caution)]/30 bg-[var(--color-caution)]/10 p-3">
            <Icon.Lock size={20} className="text-[var(--color-caution)]" />
            <div className="text-xs font-600 text-[#cdd9e5]">
              {occupied ? 'Interlocked — OT occupied. UV-C disabled for safety.' : 'OT clear — cycle available.'}
            </div>
          </div>
          <TButton disabled={occupied} variant="primary" className="mt-3 w-full">
            Start 20-min Disinfection Cycle
          </TButton>
        </Panel>
      </div>
    </div>
  )
}

function LightHead({ name, data, onChange, disabled }: any) {
  return (
    <div className={`rounded-xl border border-[var(--color-line)] bg-[var(--color-ink-800)] p-4 ${disabled ? 'opacity-60' : ''}`}>
      <div className="mb-3 flex items-center justify-between">
        <span className="font-700">{name}</span>
        <span className="font-mono text-lg font-700 text-[var(--color-cyan)]">{data.intensity}%</span>
      </div>
      <Field label="Intensity" value={`${data.intensity}%`}>
        <Slider value={data.intensity} onChange={(v) => onChange({ intensity: v })} disabled={disabled} />
      </Field>
      <Field label="Colour Temperature" value={`${data.temp}K`}>
        <Slider value={data.temp} min={3000} max={5000} onChange={(v) => onChange({ temp: v })} disabled={disabled} color="var(--color-gold)" />
      </Field>
      <Field label="Focus / Spot Ø" value={`${data.focus} cm`}>
        <Slider value={data.focus} min={10} max={30} onChange={(v) => onChange({ focus: v })} disabled={disabled} color="var(--color-blue)" />
      </Field>
    </div>
  )
}
function Field({ label, value, children }: any) {
  return (
    <div className="mb-3">
      <div className="mb-1 flex justify-between text-[11px] font-600 text-[#9fb1c2]">
        <span>{label}</span>
        <span className="font-mono">{value}</span>
      </div>
      {children}
    </div>
  )
}
function ModeToggle({ label, desc, on, onChange, tint = 'var(--color-cyan)' }: any) {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-[var(--color-line)] bg-[var(--color-ink-800)] p-3">
      <div className="flex-1">
        <div className="text-sm font-700" style={{ color: on ? tint : undefined }}>{label}</div>
        <div className="text-[11px] text-[#7f93a6]">{desc}</div>
      </div>
      <Toggle on={on} onChange={onChange} />
    </div>
  )
}

/* ============================================================ ENVIRONMENT */
function Environment({ otOccupied, setOtOccupied }: any) {
  const [tempSet, setTempSet] = useState(20)
  const [rhSet, setRhSet] = useState(48)
  const trend = useMemo(
    () => Array.from({ length: 24 }, (_, i) => ({ h: `${i}:00`, temp: +(20 + Math.sin(i / 3) * 0.8).toFixed(1), rh: Math.round(46 + Math.cos(i / 4) * 4) })),
    [],
  )
  return (
    <div className="grid h-full min-h-0 grid-cols-1 gap-3 overflow-hidden lg:grid-cols-3 lg:gap-4">
      <div className="min-h-0 space-y-3 overflow-hidden lg:col-span-2 lg:space-y-4">
        <Panel>
          <SectionHeader icon={<Icon.Fan size={16} />} tint="var(--color-violet)">Climate Set Points</SectionHeader>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="rounded-xl border border-[var(--color-line)] bg-[var(--color-ink-800)] p-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-600 text-[#9fb1c2]">Temperature</span>
                <StateGlyph state="ok" />
              </div>
              <div className="my-2 font-mono text-3xl font-700">20.4<span className="text-lg text-[#7f93a6]">°C</span></div>
              <div className="mb-1 flex justify-between text-[11px] text-[#7f93a6]"><span>Set point</span><span className="font-mono">{tempSet}°C</span></div>
              <Slider value={tempSet} min={16} max={26} onChange={setTempSet} color="var(--color-violet)" />
            </div>
            <div className="rounded-xl border border-[var(--color-line)] bg-[var(--color-ink-800)] p-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-600 text-[#9fb1c2]">Humidity</span>
                <StateGlyph state="ok" />
              </div>
              <div className="my-2 font-mono text-3xl font-700">48<span className="text-lg text-[#7f93a6]">%</span></div>
              <div className="mb-1 flex justify-between text-[11px] text-[#7f93a6]"><span>Set point</span><span className="font-mono">{rhSet}%</span></div>
              <Slider value={rhSet} min={30} max={60} onChange={setRhSet} color="var(--color-blue)" />
            </div>
          </div>
        </Panel>

        <Panel>
          <SectionHeader tint="var(--color-blue)" right={<AIBadge label="AI trend watch" />}>24-Hour Environment Trend</SectionHeader>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={trend} margin={{ left: -18, right: 8, top: 8 }}>
              <CartesianGrid stroke="#1b2530" vertical={false} />
              <XAxis dataKey="h" tick={{ fill: '#5f7286', fontSize: 10 }} interval={3} />
              <YAxis tick={{ fill: '#5f7286', fontSize: 10 }} domain={[15, 55]} />
              <Tooltip contentStyle={tooltip} />
              <Line dataKey="temp" stroke="var(--color-violet)" dot={false} strokeWidth={2} />
              <Line dataKey="rh" stroke="var(--color-blue)" dot={false} strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </Panel>
      </div>

      <div className="space-y-4">
        <Panel>
          <SectionHeader tint="var(--color-cyan)">Air & Structure</SectionHeader>
          <div className="grid grid-cols-2 gap-3">
            <MiniStat label="Diff. Pressure" value="+11" unit="Pa" state="ok" />
            <MiniStat label="HEPA Life" value="86" unit="%" state="ok" ai />
            <MiniStat label="HEPA Airflow" value="0.42" unit="m/s" state="ok" />
          </div>
          <button
            onClick={() => setOtOccupied((v: boolean) => !v)}
            className="mt-3 flex w-full items-center justify-between rounded-xl border border-[var(--color-line)] bg-[var(--color-ink-800)] p-3"
          >
            <div className="flex items-center gap-2"><Icon.Door size={18} className="text-[var(--color-muted)]" /><span className="text-sm font-600">OT Occupancy</span></div>
            <span className="text-sm font-700" style={{ color: otOccupied ? 'var(--color-cyan)' : '#7f93a6' }}>{otOccupied ? 'Occupied' : 'Clear'}</span>
          </button>
        </Panel>
        <Panel>
          <SectionHeader tint="var(--color-gold)" right={<AIBadge />}>Alarm Correlation</SectionHeader>
          <p className="text-xs leading-relaxed text-[#9fb1c2]">
            AGSS flow and differential pressure are drifting together. Nova groups them as{' '}
            <span className="font-700 text-[#e7eef5]">one root-cause event</span> — likely a scavenging load change — instead of two separate alarms, reducing alarm fatigue.
          </p>
        </Panel>
      </div>
    </div>
  )
}
const tooltip = { background: '#0f151c', border: '1px solid #24313f', borderRadius: 12, fontSize: 12, color: '#e7eef5' }

/* ============================================================ CHECKLIST */
function Checklist({ checked, setChecked }: any) {
  const [phase, setPhase] = useState<Phase>('Sign In')
  const items = CHECKLIST[phase]
  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
      <Panel className="lg:col-span-1">
        <SectionHeader icon={<Icon.Check size={16} />} tint="var(--color-blue)">Phases</SectionHeader>
        <div className="space-y-2">
          {(Object.keys(CHECKLIST) as Phase[]).map((p) => {
            const { done, total } = phaseStatus(CHECKLIST[p], p, checked)
            const active = phase === p
            const tint = done === total ? 'var(--color-ok)' : done === 0 ? '#7f93a6' : 'var(--color-caution)'
            return (
              <button
                key={p}
                onClick={() => setPhase(p)}
                className={`w-full rounded-xl border p-3 text-left transition-all ${active ? 'border-[var(--color-cyan)] bg-[var(--color-cyan)]/10' : 'border-[var(--color-line)] bg-[var(--color-ink-800)]'}`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-700">{p}</span>
                  <span className="font-mono text-sm" style={{ color: tint }}>{done}/{total}</span>
                </div>
                <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-[#1b2530]">
                  <div className="h-full transition-all" style={{ width: `${(done / total) * 100}%`, background: tint }} />
                </div>
              </button>
            )
          })}
        </div>
      </Panel>

      <Panel className="lg:col-span-2">
        <SectionHeader tint="var(--color-cyan)" right={phase === 'Time Out' ? <AIBadge label="Suggests: Anaesthesia Support page" /> : undefined}>
          {phase} Items
        </SectionHeader>
        <div className="space-y-2">
          {items.map((item, i) => {
            const key = `${phase}-${i}`
            const on = !!checked[key]
            return (
              <button
                key={key}
                onClick={() => setChecked((c: any) => ({ ...c, [key]: !c[key] }))}
                className={`flex w-full items-center gap-3 rounded-xl border p-3.5 text-left transition-all ${on ? 'border-[var(--color-ok)]/40 bg-[var(--color-ok)]/10' : 'border-[var(--color-line)] bg-[var(--color-ink-800)] hover:border-[#3a4b5c]'}`}
              >
                <span className={`grid h-6 w-6 shrink-0 place-items-center rounded-md border ${on ? 'border-[var(--color-ok)] bg-[var(--color-ok)]' : 'border-[#3a4b5c]'}`}>
                  {on && <Icon.Check size={14} className="text-[#04201d]" />}
                </span>
                <span className={`text-sm font-600 ${on ? 'text-[#e7eef5]' : 'text-[#cdd9e5]'}`}>{item}</span>
              </button>
            )
          })}
        </div>
      </Panel>
    </div>
  )
}

/* ============================================================ COMMUNICATION */
function Comm({ camLive, setCamLive, videoInCall, setVideoInCall, pages, setPages, otName }: any) {
  const [tab, setTab] = useState<'phone' | 'video' | 'paging'>('phone')
  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden">
      <div className="mb-2 flex shrink-0 flex-wrap gap-2 sm:mb-3">
        {(['phone', 'video', 'paging'] as const).map((t) => (
          <TButton key={t} active={tab === t} onClick={() => setTab(t)} className="min-h-[40px] flex-1 sm:min-h-[44px] sm:flex-none">
            <span className="sm:hidden">{t === 'phone' ? 'Phone' : t === 'video' ? 'Video' : 'Paging'}</span>
            <span className="hidden sm:inline">{t === 'phone' ? 'Telephone / Intercom' : t === 'video' ? 'Panel Video Call' : 'Broadcast Paging'}</span>
          </TButton>
        ))}
      </div>
      <div className="min-h-0 flex-1 overflow-hidden">
        {tab === 'phone' && <Phone />}
        {tab === 'video' && (
          <VideoCall
            camLive={camLive}
            setCamLive={setCamLive}
            inCall={videoInCall}
            setInCall={setVideoInCall}
          />
        )}
        {tab === 'paging' && <Paging pages={pages} setPages={setPages} otName={otName} />}
      </div>
    </div>
  )
}

function Phone() {
  const ext = [
    ['Reception', '2100'],
    ['Blood Bank', '2255'],
    ['CSSD', '2310'],
    ['Anaesthesia', '2401'],
    ['Pharmacy', '2180'],
    ['Biomed', '2500'],
  ]
  const [digits, setDigits] = useState('')
  const [active, setActive] = useState<string | null>(null)
  const [callSec, setCallSec] = useState(0)

  useEffect(() => {
    if (!active) {
      setCallSec(0)
      return
    }
    const id = setInterval(() => setCallSec((s) => s + 1), 1000)
    return () => clearInterval(id)
  }, [active])

  const press = (d: string) => {
    if (active) return
    setDigits((v) => (v.length >= 16 ? v : v + d))
  }
  const backspace = () => {
    if (active) return
    setDigits((v) => v.slice(0, -1))
  }
  const clear = () => {
    if (active) return
    setDigits('')
  }
  const startCall = (num?: string) => {
    const n = (num ?? digits).replace(/\D/g, '')
    if (!n) return
    setDigits(n)
    setActive(n)
  }
  const endCall = () => {
    setActive(null)
    setCallSec(0)
  }
  const dialKeys = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '*', '0', '#'] as const
  const callLabel = active
    ? `Connected · ext. ${active} · ${fmt(callSec)}`
    : digits
      ? `Ready to dial ${digits}`
      : 'Enter a number or pick an extension'

  return (
    <div className="grid h-full min-h-0 grid-cols-1 gap-3 lg:grid-cols-[minmax(240px,0.9fr)_1.4fr]">
      {/* Dial pad — left */}
      <Panel className="flex h-full min-h-0 flex-col !p-3">
        <SectionHeader icon={<Icon.Phone size={16} />} tint="var(--color-cyan)">Dial Pad</SectionHeader>

        <div
          className="mb-2 flex shrink-0 items-center justify-between gap-2 rounded-xl border px-3 py-2.5 sm:mb-3 sm:px-4"
          style={{
            borderColor: active ? 'color-mix(in srgb, var(--color-ok) 45%, var(--color-line))' : 'var(--color-line)',
            background: active ? 'color-mix(in srgb, var(--color-ok) 10%, var(--color-ink-800))' : 'var(--color-ink-800)',
          }}
        >
          <span className={`min-w-0 truncate font-mono text-[clamp(1.25rem,2.8vh,1.85rem)] font-800 tabular-nums tracking-wider ${digits || active ? 'text-[var(--color-fg)]' : 'text-[var(--color-muted-deep)]'}`}>
            {digits || '— — — —'}
          </span>
          {!active && digits && (
            <button
              onClick={backspace}
              onContextMenu={(e) => { e.preventDefault(); clear() }}
              className="grid h-9 w-9 shrink-0 place-items-center rounded-lg border border-[var(--color-line)] text-sm font-800 text-[var(--color-muted)] transition-colors hover:border-[var(--color-cyan)]/40 hover:text-[var(--color-fg)]"
              title="Backspace"
            >
              ⌫
            </button>
          )}
        </div>

        <div className="grid min-h-0 flex-1 grid-cols-3 gap-1.5 sm:gap-2">
          {dialKeys.map((k) => (
            <button
              key={k}
              onClick={() => press(k)}
              disabled={!!active}
              className="flex min-h-0 items-center justify-center rounded-xl border border-[var(--color-line)] bg-[var(--color-ink-800)] text-[clamp(1.1rem,2.4vh,1.65rem)] font-800 text-[var(--color-fg)] transition-all hover:border-[var(--color-cyan)]/50 hover:bg-[color-mix(in_srgb,var(--color-cyan)_10%,var(--color-ink-800))] active:scale-95 disabled:cursor-default disabled:opacity-40"
            >
              {k}
            </button>
          ))}
        </div>

        <div className="mt-2 grid shrink-0 grid-cols-2 gap-2 sm:mt-3">
          {active ? (
            <TButton variant="danger" className="col-span-2 min-h-[44px]" onClick={endCall}>
              <Icon.Phone size={16} /> End Call
            </TButton>
          ) : (
            <>
              <TButton className="min-h-[44px]" onClick={clear} disabled={!digits}>Clear</TButton>
              <TButton variant="primary" className="min-h-[44px]" onClick={() => startCall()} disabled={!digits}>
                <Icon.Phone size={16} /> Call
              </TButton>
            </>
          )}
        </div>

        <div
          className={`mt-2 shrink-0 rounded-xl border px-3 py-2 text-xs font-600 sm:mt-3 sm:text-sm ${
            active
              ? 'border-[var(--color-ok)]/40 bg-[var(--color-ok)]/10 text-[var(--color-ok)]'
              : 'border-[var(--color-line)] bg-[var(--color-ink-800)] text-[var(--color-muted)]'
          }`}
        >
          {active && <span className="mr-2 inline-block h-2 w-2 rounded-full bg-[var(--color-ok)] breathe" />}
          {callLabel}
        </div>
      </Panel>

      {/* Extensions — right */}
      <Panel className="flex h-full min-h-0 flex-col !p-3">
        <SectionHeader icon={<Icon.Grid size={16} />} tint="var(--color-blue)">Hospital Extensions</SectionHeader>
        <div className="grid min-h-0 flex-1 grid-cols-2 gap-2 sm:gap-3 lg:grid-cols-2 xl:grid-cols-3">
          {ext.map(([name, num]) => {
            const on = active === num
            return (
              <button
                key={num}
                onClick={() => (on ? endCall() : startCall(num))}
                className={`flex min-h-0 items-center justify-between gap-2 rounded-xl border p-3 text-left transition-all active:scale-[0.98] sm:p-4 ${
                  on
                    ? 'border-[var(--color-ok)] bg-[var(--color-ok)]/10'
                    : 'border-[var(--color-line)] bg-[var(--color-ink-800)] hover:border-[color-mix(in_srgb,var(--color-cyan)_35%,var(--color-line))]'
                }`}
              >
                <div className="min-w-0">
                  <div className="truncate font-700 text-[var(--color-fg)]">{name}</div>
                  <div className="font-mono text-sm text-[var(--color-muted-dim)]">ext. {num}</div>
                  {on && <div className="mt-1 text-[11px] font-700 uppercase tracking-wide text-[var(--color-ok)]">In call · {fmt(callSec)}</div>}
                </div>
                <Icon.Phone size={20} className={`shrink-0 ${on ? 'breathe text-[var(--color-ok)]' : 'text-[var(--color-muted-dim)]'}`} />
              </button>
            )
          })}
        </div>
      </Panel>
    </div>
  )
}

function VideoCall({ camLive, setCamLive, inCall, setInCall }: any) {
  const [mic, setMic] = useState(true)
  const panels = ['OT-1 Cardiac', 'OT-2 Ortho', 'OT-4 Neuro', 'OT-5 General', 'ICU Nursing Station']
  const [callee, setCallee] = useState(panels[2])
  const start = () => {
    setInCall(true)
    setCamLive(true)
  }
  const end = () => {
    setInCall(false)
    setCamLive(false)
  }
  return (
    <div className="grid h-full min-h-0 grid-cols-1 gap-3 overflow-hidden lg:grid-cols-3">
      <Panel className="flex min-h-0 flex-col lg:col-span-2">
        <SectionHeader icon={<Icon.Video size={16} />} tint="var(--color-cyan)">
          Panel-to-Panel Video Call
        </SectionHeader>
        <div className="relative flex min-h-0 flex-1 items-center justify-center overflow-hidden rounded-xl border border-[var(--color-line)] bg-[var(--color-ink-950)]">
          {inCall ? (
            <>
              <div className="absolute inset-0 opacity-20" style={{ background: 'radial-gradient(circle at 50% 40%, var(--color-cyan), transparent 60%)' }} />
              <div className="text-center">
                <div className="mx-auto mb-3 grid h-16 w-16 place-items-center rounded-full bg-[var(--color-ink-800)] text-2xl font-800 text-[var(--color-cyan)]">{callee[3]}</div>
                <div className="text-lg font-700 text-[var(--color-fg)]">{callee}</div>
                <div className="font-mono text-sm text-[var(--color-muted-dim)]">Nova secure link · 00:34</div>
              </div>
              {camLive && (
                <span className="absolute left-3 top-3 flex items-center gap-2 rounded-full border border-[var(--color-critical)] bg-[var(--color-critical)]/20 px-3 py-1 text-xs font-700 text-[var(--color-critical)]">
                  <span className="blink h-2 w-2 rounded-full bg-[var(--color-critical)]" /> CAMERA LIVE
                </span>
              )}
              <div className="absolute bottom-3 right-3 h-20 w-32 rounded-lg border border-[var(--color-line)] bg-[var(--color-ink-850)] p-2 text-[10px] text-[var(--color-muted-dim)]">Self · OT-3</div>
            </>
          ) : (
            <div className="text-sm text-[var(--color-muted-dim)]">No active call — direct Nova link, not the public phone network.</div>
          )}
        </div>
        <div className="mt-3 flex shrink-0 flex-wrap gap-2">
          {!inCall ? (
            <TButton variant="primary" onClick={start} className="flex-1"><Icon.Video size={16} /> Call {callee}</TButton>
          ) : (
            <>
              <TButton active={camLive} onClick={() => setCamLive((v: boolean) => !v)}><Icon.Cam size={16} /> {camLive ? 'Camera On' : 'Camera Off'}</TButton>
              <TButton active={mic} onClick={() => setMic((v) => !v)}><Icon.Mic size={16} /> {mic ? 'Mic On' : 'Muted'}</TButton>
              <TButton variant="danger" onClick={end} className="flex-1">End Call</TButton>
            </>
          )}
        </div>
      </Panel>
      <Panel>
        <SectionHeader tint="var(--color-blue)">Nova Panels</SectionHeader>
        <div className="space-y-2">
          {panels.map((p) => (
            <button key={p} onClick={() => setCallee(p)} className={`flex w-full items-center gap-2 rounded-xl border p-3 text-left ${callee === p ? 'border-[var(--color-cyan)] bg-[var(--color-cyan)]/10' : 'border-[var(--color-line)] bg-[var(--color-ink-800)]'}`}>
              <span className="h-2 w-2 rounded-full bg-[var(--color-ok)]" />
              <span className="text-sm font-600">{p}</span>
            </button>
          ))}
        </div>
      </Panel>
    </div>
  )
}

const PAGE_MSGS = [
  'Housekeeping needed in OT',
  'Request Anaesthesia Support',
  'Blood Bank — urgent sample pickup',
  'CSSD — instrument request',
  'Call Supervisor to OT',
  'Emergency — Code Blue',
]
const CUSTOM_MSG = '__custom__'

function Paging({ pages, setPages, otName }: any) {
  const [msgKey, setMsgKey] = useState(PAGE_MSGS[1])
  const [customText, setCustomText] = useState('')
  const isCustom = msgKey === CUSTOM_MSG
  const msg = isCustom ? customText.trim() : msgKey
  const canSend = !!msg

  const send = () => {
    if (!canSend) return
    const id = Date.now()
    const time = new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })
    const ot = otName || 'OT'
    setPages((p: any) => [{ id, msg, ot, time, ack: false }, ...p])
    setTimeout(() => setPages((p: any) => p.map((x: any) => (x.id === id ? { ...x, ack: true } : x))), 2600)
    if (isCustom) setCustomText('')
  }

  return (
    <div className="grid h-full min-h-0 grid-cols-1 gap-3 overflow-hidden lg:grid-cols-2 lg:gap-4">
      <Panel className="flex min-h-0 flex-col overflow-hidden">
        <SectionHeader icon={<Icon.Send size={16} />} tint="var(--color-cyan)" right={<AIBadge label="Suggests: Anaesthesia Support" />}>
          Broadcast Page
        </SectionHeader>
        <div className="min-h-0 flex-1 overflow-y-auto">
          <label className="mb-1 block text-xs font-600 text-[var(--color-muted)]">Message</label>
          <div className="mb-3 grid gap-2">
            {PAGE_MSGS.map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => setMsgKey(m)}
                className={`rounded-lg border px-3 py-2 text-left text-sm font-600 ${msgKey === m ? 'border-[var(--color-cyan)] bg-[var(--color-cyan)]/10 text-[var(--color-cyan)]' : m.includes('Code Blue') ? 'border-[var(--color-critical)]/40 bg-[var(--color-ink-800)] text-[var(--color-critical)]' : 'border-[var(--color-line)] bg-[var(--color-ink-800)] text-[var(--color-fg-soft)]'}`}
              >
                {m}
              </button>
            ))}
            <button
              type="button"
              onClick={() => setMsgKey(CUSTOM_MSG)}
              className={`rounded-lg border px-3 py-2 text-left text-sm font-600 ${isCustom ? 'border-[var(--color-cyan)] bg-[var(--color-cyan)]/10 text-[var(--color-cyan)]' : 'border-[var(--color-line)] bg-[var(--color-ink-800)] text-[var(--color-fg-soft)]'}`}
            >
              Custom message…
            </button>
          </div>
          {isCustom && (
            <div className="mb-3">
              <label className="mb-1 block text-xs font-600 text-[var(--color-muted)]">Type your message</label>
              <textarea
                value={customText}
                onChange={(e) => setCustomText(e.target.value.slice(0, 160))}
                placeholder="Enter custom page text…"
                rows={3}
                className="w-full resize-none rounded-xl border border-[var(--color-line)] bg-[var(--color-ink-800)] px-3 py-2.5 text-sm font-600 text-[var(--color-fg)] outline-none placeholder:text-[var(--color-muted-deep)] focus:border-[var(--color-cyan)]"
              />
              <p className="mt-1 text-[11px] text-[var(--color-muted-deep)]">{customText.length}/160 · From {otName || 'OT'}</p>
            </div>
          )}
        </div>
        <TButton variant="primary" onClick={send} disabled={!canSend} className="mt-2 w-full shrink-0">
          <Icon.Send size={16} /> Send Page
        </TButton>
        <p className="mt-2 shrink-0 text-[11px] text-[var(--color-muted-dim)]">Also pushed to department TV displays and the Nova staff mobile app — no nurse relay required.</p>
      </Panel>
      <Panel className="flex min-h-0 flex-col overflow-hidden">
        <SectionHeader tint="var(--color-blue)">Page Log</SectionHeader>
        <div className="min-h-0 flex-1 space-y-2 overflow-y-auto">
          {pages.length === 0 && (
            <p className="py-6 text-center text-sm text-[var(--color-muted-dim)]">No pages sent yet.</p>
          )}
          {pages.map((p: any) => (
            <div key={p.id} className="rounded-xl border border-[var(--color-line)] bg-[var(--color-ink-800)] p-3">
              <div className="flex items-start justify-between gap-2">
                <span className="min-w-0 flex-1 text-sm font-700 text-[var(--color-fg)]">{p.msg}</span>
                <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-700 ${p.ack ? 'bg-[var(--color-ok)]/15 text-[var(--color-ok)]' : 'bg-[var(--color-caution)]/15 text-[var(--color-caution)]'}`}>
                  {p.ack ? 'Acknowledged' : 'Sent'}
                </span>
              </div>
              <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] font-600 text-[var(--color-muted-dim)]">
                <span className="font-mono font-700 text-[var(--color-cyan)]">From {p.ot}</span>
                <span className="font-mono">{p.time}</span>
              </div>
            </div>
          ))}
        </div>
      </Panel>
    </div>
  )
}

/* ============================================================ MEDIA */
function Media() {
  const [playing, setPlaying] = useState(true)
  const [vol, setVol] = useState(35)
  const [src, setSrc] = useState('Local Playlist')
  const tracks = [
    ['Weightless', 'Marconi Union', '8:09'],
    ['Nuvole Bianche', 'Ludovico Einaudi', '5:57'],
    ['An Ending', 'Brian Eno', '4:22'],
    ['Avril 14th', 'Aphex Twin', '2:04'],
  ]
  return (
    <div className="grid h-full min-h-0 grid-cols-1 gap-3 overflow-hidden lg:grid-cols-3">
      <Panel className="flex min-h-0 flex-col lg:col-span-2">
        <SectionHeader icon={<Icon.Music size={16} />} tint="var(--color-violet)">Now Playing — {src}</SectionHeader>
        <div className="flex items-center gap-4 rounded-xl border border-[var(--color-line)] bg-[var(--color-ink-800)] p-3 sm:p-4">
          <div className="grid h-14 w-14 shrink-0 place-items-center rounded-xl bg-[var(--color-violet)]/20 sm:h-16 sm:w-16"><Icon.Music size={26} className="text-[var(--color-violet)]" /></div>
          <div className="min-w-0 flex-1">
            <div className="truncate font-700 text-[var(--color-fg)]">Weightless</div>
            <div className="text-sm text-[var(--color-muted-dim)]">Marconi Union</div>
            <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-[var(--color-track)]"><div className="h-full w-1/3 bg-[var(--color-violet)]" /></div>
          </div>
          <TButton variant="primary" onClick={() => setPlaying((p) => !p)}>{playing ? <Icon.Pause size={18} /> : <Icon.Play size={18} />}</TButton>
        </div>
        <div className="mt-3 flex items-center gap-3">
          <span className="text-xs font-600 text-[var(--color-muted)]">Volume</span>
          <Slider value={vol} onChange={setVol} color="var(--color-violet)" />
          <span className="font-mono text-sm text-[var(--color-fg-soft)]">{vol}%</span>
        </div>
        <div className="mt-3 flex items-center gap-2 rounded-lg bg-[var(--color-gold)]/10 p-2.5 text-xs font-600 text-[var(--color-gold)]">
          <Icon.Bell size={14} /> Auto-mute armed — music ducks on incoming call, page, or alarm.
        </div>
        <div className="mt-3 min-h-0 flex-1 space-y-1 overflow-hidden">
          {tracks.map((t, i) => (
            <div key={i} className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm ${i === 0 ? 'bg-[var(--color-violet)]/10 text-[var(--color-violet)]' : 'text-[var(--color-fg-soft)] hover:bg-[var(--color-ink-800)]'}`}>
              <span className="font-mono text-xs text-[var(--color-muted-dim)]">{i + 1}</span>
              <span className="min-w-0 flex-1 truncate font-600">{t[0]}</span>
              <span className="hidden truncate text-[var(--color-muted-dim)] sm:inline">{t[1]}</span>
              <span className="font-mono text-xs text-[var(--color-muted-dim)]">{t[2]}</span>
            </div>
          ))}
        </div>
      </Panel>
      <Panel>
        <SectionHeader tint="var(--color-blue)">Sources</SectionHeader>
        <div className="space-y-2">
          {['Local Playlist', 'Spotify', 'Bluetooth', 'Internet Radio'].map((s) => (
            <button key={s} onClick={() => setSrc(s)} className={`w-full rounded-xl border p-3 text-left text-sm font-600 ${src === s ? 'border-[var(--color-violet)] bg-[var(--color-violet)]/10 text-[var(--color-violet)]' : 'border-[var(--color-line)] bg-[var(--color-ink-800)] text-[#cdd9e5]'}`}>{s}</button>
          ))}
        </div>
      </Panel>
    </div>
  )
}

/* ============================================================ ANALYTICS */
function Analytics() {
  const weekly = [
    { d: 'Mon', c: 12 }, { d: 'Tue', c: 15 }, { d: 'Wed', c: 11 }, { d: 'Thu', c: 17 },
    { d: 'Fri', c: 14 }, { d: 'Sat', c: 6, f: 8 }, { d: 'Sun', c: 0, f: 4 },
  ]
  const gasUse = [
    { name: 'O₂', v: 42, c: 'var(--color-cyan)' },
    { name: 'N₂O', v: 21, c: 'var(--color-blue)' },
    { name: 'Med Air', v: 18, c: 'var(--color-violet)' },
    { name: 'CO₂', v: 12, c: 'var(--color-gold)' },
    { name: 'N₂', v: 7, c: 'var(--color-pastel)' },
  ]
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Headline label="OT Utilization" value="78" unit="%" tint="var(--color-cyan)" />
        <Headline label="Cases This Week" value="75" unit="" tint="var(--color-blue)" />
        <Headline label="Avg Turnover" value="24" unit="min" tint="var(--color-violet)" />
        <Headline label="Active Alerts" value="1" unit="" tint="var(--color-caution)" />
      </div>
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Panel className="lg:col-span-2">
          <SectionHeader tint="var(--color-cyan)" right={<AIBadge label="Forecast overlay" />}>Weekly Case Volume</SectionHeader>
          <ResponsiveContainer width="100%" height={230}>
            <BarChart data={weekly} margin={{ left: -20, top: 8 }}>
              <CartesianGrid stroke="#1b2530" vertical={false} />
              <XAxis dataKey="d" tick={{ fill: '#5f7286', fontSize: 11 }} />
              <YAxis tick={{ fill: '#5f7286', fontSize: 11 }} />
              <Tooltip contentStyle={tooltip} cursor={{ fill: '#ffffff08' }} />
              <Bar dataKey="c" fill="var(--color-cyan)" radius={[4, 4, 0, 0]} />
              <Bar dataKey="f" fill="var(--color-gold)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
          <p className="text-[11px] text-[#7f93a6]"><span className="text-[var(--color-gold)]">Gold</span> = AI forecast for the coming weekend, supporting staffing decisions.</p>
        </Panel>
        <Panel>
          <SectionHeader tint="var(--color-violet)">Gas Consumption</SectionHeader>
          <ResponsiveContainer width="100%" height={180}>
            <PieChart>
              <Pie data={gasUse} dataKey="v" innerRadius={45} outerRadius={70} paddingAngle={2}>
                {gasUse.map((g) => <Cell key={g.name} fill={g.c} stroke="none" />)}
              </Pie>
              <Tooltip contentStyle={tooltip} />
            </PieChart>
          </ResponsiveContainer>
          <div className="mt-1 grid grid-cols-2 gap-1 text-[11px]">
            {gasUse.map((g) => (
              <div key={g.name} className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full" style={{ background: g.c }} /><span className="text-[#9fb1c2]">{g.name}</span><span className="ml-auto font-mono text-[#7f93a6]">{g.v}%</span></div>
            ))}
          </div>
        </Panel>
      </div>
      <Panel>
        <SectionHeader tint="var(--color-caution)">Recent Alert Log</SectionHeader>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[480px] text-sm">
            <thead><tr className="text-left text-[11px] uppercase tracking-wide text-[#5f7286]"><th className="pb-2">Time</th><th>Parameter</th><th>OT</th><th>Severity</th></tr></thead>
            <tbody className="font-mono text-[13px]">
              {[
                ['09:52', 'CO₂ pressure low', 'OT-3', 'caution'],
                ['08:14', 'HEPA life 20% remaining', 'OT-1', 'caution'],
                ['07:40', 'Door open > 30s', 'OT-5', 'ok'],
                ['06:22', 'IPS insulation trend flagged', 'OT-2', 'caution'],
              ].map((r, i) => (
                <tr key={i} className="border-t border-[var(--color-line)]">
                  <td className="py-2 text-[#7f93a6]">{r[0]}</td>
                  <td className="text-[#cdd9e5]">{r[1]}</td>
                  <td className="text-[#7f93a6]">{r[2]}</td>
                  <td><span className="inline-flex items-center gap-1" style={{ color: stateTint(r[3] as AState) }}><StateGlyph state={r[3] as AState} size={12} /> {r[3]}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>
    </div>
  )
}
function Headline({ label, value, unit, tint }: any) {
  return (
    <Panel>
      <div className="text-[11px] font-600 uppercase tracking-wide text-[#7f93a6]">{label}</div>
      <div className="mt-1 font-mono text-2xl font-700 tabular-nums sm:text-4xl" style={{ color: tint }}>{value}<span className="text-base text-[#7f93a6] sm:text-lg"> {unit}</span></div>
    </Panel>
  )
}

/* ============================================================ NETWORK */
function Network() {
  const ots = [
    { id: 'OT-1 Cardiac', status: 'Active', gas: 'ok', temp: '20.1', rh: '47', dp: '+12', t: '01:42:10', alerts: 0 },
    { id: 'OT-2 Ortho', status: 'Active', gas: 'caution', temp: '21.0', rh: '52', dp: '+9', t: '00:58:03', alerts: 1 },
    { id: 'OT-3 General', status: 'Active', gas: 'caution', temp: '20.4', rh: '48', dp: '+11', t: '00:34:55', alerts: 1 },
    { id: 'OT-4 Neuro', status: 'Idle', gas: 'ok', temp: '19.8', rh: '46', dp: '+13', t: '—', alerts: 0 },
    { id: 'OT-5 General', status: 'Active', gas: 'ok', temp: '20.6', rh: '49', dp: '+10', t: '02:11:20', alerts: 0 },
    { id: 'OT-6 Day Care', status: 'Offline', gas: 'ok', temp: '—', rh: '—', dp: '—', t: '—', alerts: 0 },
  ]
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Headline label="OTs Connected" value="6" unit="" tint="var(--color-cyan)" />
        <Headline label="Active Now" value="4" unit="" tint="var(--color-ok)" />
        <Headline label="Total Alerts" value="2" unit="" tint="var(--color-caution)" />
        <Headline label="Avg Utilization" value="74" unit="%" tint="var(--color-blue)" />
      </div>
      <Panel>
        <SectionHeader icon={<Icon.Grid size={16} />} tint="var(--color-cyan)">Connected Hospital Network</SectionHeader>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] text-sm">
            <thead><tr className="text-left text-[11px] uppercase tracking-wide text-[#5f7286]"><th className="pb-2">OT</th><th>Status</th><th>Gas</th><th>Temp</th><th>RH</th><th>ΔP</th><th>Case Time</th><th>Alerts</th></tr></thead>
            <tbody>
              {ots.map((o) => (
                <tr key={o.id} className="border-t border-[var(--color-line)]">
                  <td className="py-2.5 font-600 text-[#e7eef5]">{o.id}</td>
                  <td><span className="inline-flex items-center gap-1.5 text-xs font-700" style={{ color: o.status === 'Active' ? 'var(--color-ok)' : o.status === 'Idle' ? '#7f93a6' : 'var(--color-critical)' }}><span className={`h-2 w-2 rounded-full ${o.status === 'Active' ? 'breathe' : ''}`} style={{ background: 'currentColor' }} />{o.status}</span></td>
                  <td><StateGlyph state={o.gas as AState} size={14} /></td>
                  <td className="font-mono text-[#cdd9e5]">{o.temp}</td>
                  <td className="font-mono text-[#cdd9e5]">{o.rh}</td>
                  <td className="font-mono text-[#cdd9e5]">{o.dp}</td>
                  <td className="font-mono text-[var(--color-cyan)]">{o.t}</td>
                  <td className="font-mono" style={{ color: o.alerts ? 'var(--color-caution)' : '#7f93a6' }}>{o.alerts}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>
      <Panel>
        <SectionHeader tint="var(--color-gold)" right={<AIBadge label="Predictive insight" />}>AI Utilization & Maintenance Insight</SectionHeader>
        <div className="grid gap-3 md:grid-cols-2">
          <div className="rounded-xl border border-[var(--color-blue)]/30 bg-[var(--color-blue)]/5 p-3 text-sm text-[#cdd9e5]">
            <b className="text-[var(--color-blue)]">Scheduling opportunity:</b> OT-4 Neuro has run at 38% utilization this week — well below the 74% average. Consider re-routing two elective general cases here Thursday.
          </div>
          <div className="rounded-xl border border-[var(--color-caution)]/30 bg-[var(--color-caution)]/5 p-3 text-sm text-[#cdd9e5]">
            <b className="text-[var(--color-caution)]">Trend alert:</b> OT-2 differential pressure is declining ~1.2 Pa/day — projected to reach the alarm threshold in ~4 days. Schedule HEPA inspection before it alarms.
          </div>
        </div>
      </Panel>
    </div>
  )
}

/* ============================================================ RECORDING */
function Recording({ rec, setRec, locked }: any) {
  const [src, setSrc] = useState('Endoscope')
  const [bookmarks, setBookmarks] = useState(0)
  const sources = ['Endoscope', 'Ceiling Cam 1', 'Ceiling Cam 2', 'Microscope', 'C-Arm / Fluoro', 'External Input']
  if (locked) return <LockedPage title="Recording Module" tier="V2 Record" />
  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
      <Panel className="lg:col-span-2">
        <SectionHeader icon={<Icon.Rec size={16} />} tint="var(--color-critical)">Recording — Source: {src}</SectionHeader>
        <div className="relative flex aspect-video items-center justify-center overflow-hidden rounded-xl border border-[var(--color-line)] bg-[var(--color-ink-950)]">
          <span className="text-sm text-[#7f93a6]">{src} feed</span>
          {rec.on && <span className="absolute left-3 top-3 flex items-center gap-2 rounded-full bg-[var(--color-critical)] px-3 py-1 text-xs font-700 text-white"><span className="blink h-2 w-2 rounded-full bg-white" /> REC {fmt(rec.sec)}</span>}
        </div>
        <div className="mt-3 flex gap-2">
          <TButton variant={rec.on ? 'danger' : 'primary'} onClick={() => setRec((r: any) => ({ ...r, on: !r.on }))} className="flex-1">
            {rec.on ? <Icon.Pause size={16} /> : <Icon.Rec size={16} />} {rec.on ? 'Stop Recording' : 'Start Recording'}
          </TButton>
          <TButton disabled={!rec.on} onClick={() => setBookmarks((b) => b + 1)}>Bookmark ({bookmarks})</TButton>
        </div>
      </Panel>
      <div className="space-y-4">
        <Panel>
          <SectionHeader tint="var(--color-blue)">Camera Source</SectionHeader>
          <div className="space-y-2">
            {sources.map((s) => (
              <button key={s} onClick={() => setSrc(s)} className={`w-full rounded-lg border p-2.5 text-left text-sm font-600 ${src === s ? 'border-[var(--color-cyan)] bg-[var(--color-cyan)]/10 text-[var(--color-cyan)]' : 'border-[var(--color-line)] bg-[var(--color-ink-800)] text-[#cdd9e5]'}`}>{s}</button>
            ))}
          </div>
        </Panel>
        <Panel>
          <SectionHeader tint="var(--color-cyan)">Storage</SectionHeader>
          <Ring pct={38} size={100} color="var(--color-cyan)"><div className="text-center"><div className="font-mono text-lg font-700">62%</div><div className="text-[10px] text-[#7f93a6]">free</div></div></Ring>
          <div className="mt-2 text-center font-mono text-xs text-[#7f93a6]">1.24 TB of 2 TB remaining</div>
        </Panel>
      </div>
    </div>
  )
}

/* ============================================================ ROUTING */
function Routing({ locked }: { locked: boolean }) {
  const sources = ['Endoscope', 'Ceiling Cam 1', 'Ceiling Cam 2', 'Microscope', 'C-Arm', 'External']
  const dests = ['Surgeon Mon', 'Wall 1', 'Wall 2', 'Anaesthesia', 'Recorder', 'Broadcast']
  const [matrix, setMatrix] = useState<Record<string, number>>({ 'Surgeon Mon': 0, 'Wall 1': 1, Recorder: 0 })
  const [broadcast, setBroadcast] = useState(false)
  const [layout, setLayout] = useState('PiP')
  if (locked) return <LockedPage title="Routing & Broadcast Matrix" tier="V3 Integrate" />
  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
      <Panel className="lg:col-span-2">
        <SectionHeader icon={<Icon.Route size={16} />} tint="var(--color-cyan)">Source × Destination Matrix</SectionHeader>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-center text-xs">
            <thead>
              <tr>
                <th className="p-2 text-left text-[#5f7286]">Destination \ Source</th>
                {sources.map((s) => <th key={s} className="p-2 font-600 text-[#9fb1c2]">{s}</th>)}
              </tr>
            </thead>
            <tbody>
              {dests.map((d) => (
                <tr key={d} className="border-t border-[var(--color-line)]">
                  <td className="p-2 text-left font-600 text-[#cdd9e5]">{d}</td>
                  {sources.map((s, si) => {
                    const on = matrix[d] === si
                    return (
                      <td key={s} className="p-1.5">
                        <button
                          onClick={() => setMatrix((m) => ({ ...m, [d]: on ? -1 : si }))}
                          className={`h-8 w-8 rounded-lg border transition-all ${on ? 'border-[var(--color-cyan)] bg-[var(--color-cyan)] text-[#04201d]' : 'border-[var(--color-line)] bg-[var(--color-ink-800)] hover:border-[#3a4b5c]'}`}
                        >
                          {on ? '●' : ''}
                        </button>
                      </td>
                    )
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>
      <div className="space-y-4">
        <Panel>
          <SectionHeader tint="var(--color-critical)">Live Broadcast / Tele-Mentoring</SectionHeader>
          <div className="flex items-center justify-between rounded-xl border border-[var(--color-line)] bg-[var(--color-ink-800)] p-3">
            <span className="text-sm font-600">Broadcast</span>
            <Toggle on={broadcast} onChange={setBroadcast} />
          </div>
          {broadcast && <div className="mt-2 flex items-center gap-2 text-sm font-600 text-[var(--color-critical)]"><span className="blink h-2 w-2 rounded-full bg-[var(--color-critical)]" /> Live · 14 viewers</div>}
          <div className="mt-3 grid grid-cols-3 gap-2">
            {['Single', 'PiP', 'Quad'].map((l) => (
              <TButton key={l} active={layout === l} onClick={() => setLayout(l)}>{l}</TButton>
            ))}
          </div>
        </Panel>
        <Panel>
          <SectionHeader tint="var(--color-gold)" right={<AIBadge label="Roadmap" />}>Virtual Director</SectionHeader>
          <p className="text-xs leading-relaxed text-[#9fb1c2]">Automatic camera-switching for broadcast and recording (V3 roadmap, camera-dependent). Non-clinical — no treatment decision involved.</p>
        </Panel>
      </div>
    </div>
  )
}

/* ============================================================ ADMIN */
function Admin({ otName, setOtName, tempSet, setTempSet, humSet, setHumSet }: any) {
  const [unlocked, setUnlocked] = useState(false)
  const [pwInput, setPwInput] = useState('')
  const [pwError, setPwError] = useState(false)

  const tryUnlock = () => {
    if (pwInput === 'P1234') { setUnlocked(true); setPwError(false) }
    else { setPwError(true); setPwInput('') }
  }

  if (!unlocked) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="w-80">
          <Panel>
            <div className="mb-5 flex flex-col items-center text-center">
              <span className="mb-3 grid h-14 w-14 place-items-center rounded-2xl bg-[var(--color-ink-800)]" style={{ color: 'var(--color-violet)' }}>
                <Icon.Lock size={28} />
              </span>
              <h2 className="text-lg font-800 text-[var(--color-fg)]">Admin Access</h2>
              <p className="mt-1 text-sm text-[var(--color-muted-dim)]">Enter master password to continue</p>
            </div>
            <input
              type="password"
              value={pwInput}
              onChange={(e) => { setPwInput(e.target.value); setPwError(false) }}
              onKeyDown={(e) => e.key === 'Enter' && tryUnlock()}
              placeholder="••••••"
              maxLength={10}
              autoFocus
              className="w-full rounded-xl border bg-[var(--color-ink-800)] px-4 py-3 text-center font-mono text-xl tracking-[0.5em] text-[var(--color-fg)] outline-none transition-colors"
              style={{ borderColor: pwError ? 'var(--color-critical)' : 'var(--color-line)' }}
            />
            {pwError && <p className="mt-2 text-center text-sm font-700 text-[var(--color-critical)]">Incorrect password</p>}
            <TButton variant="primary" onClick={tryUnlock} className="mt-4 w-full">Unlock</TButton>
          </Panel>
        </div>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
      {/* ── System Identity ── */}
      <Panel>
        <SectionHeader icon={<Icon.Lock size={16} />} tint="var(--color-violet)">System Identity</SectionHeader>
        <div>
          <label className="mb-1 block text-xs font-700 uppercase tracking-wide text-[var(--color-muted)]">Operating Theatre Name</label>
          <input
            value={otName}
            onChange={(e) => setOtName(e.target.value.slice(0, 12))}
            className="w-full rounded-xl border border-[var(--color-line)] bg-[var(--color-ink-800)] px-4 py-2.5 font-mono text-xl font-700 text-[var(--color-cyan)] outline-none focus:border-[var(--color-cyan)]"
            maxLength={12}
          />
          <p className="mt-1 text-[11px] text-[var(--color-muted-deep)]">Shown in top bar and alarm log. Max 12 characters.</p>
        </div>
      </Panel>

      {/* ── Climate Defaults ── */}
      <Panel>
        <SectionHeader icon={<Icon.Temp size={16} />} tint="var(--color-gold)">Climate Defaults</SectionHeader>
        <div className="space-y-4">
          <div>
            <label className="mb-1 block text-xs font-700 uppercase tracking-wide text-[var(--color-muted)]">Default Temperature Set Point</label>
            <div className="flex items-center gap-3">
              <button onClick={() => setTempSet((t: number) => Math.max(16, +(t - 0.5).toFixed(1)))} className="grid h-11 w-11 place-items-center rounded-xl border border-[var(--color-line)] text-xl font-800" style={{ color: 'var(--color-gold)' }}>−</button>
              <span className="flex-1 text-center font-mono text-2xl font-800" style={{ color: 'var(--color-gold)' }}>{tempSet.toFixed(1)} °C</span>
              <button onClick={() => setTempSet((t: number) => Math.min(26, +(t + 0.5).toFixed(1)))} className="grid h-11 w-11 place-items-center rounded-xl border border-[var(--color-line)] text-xl font-800" style={{ color: 'var(--color-gold)' }}>+</button>
            </div>
            <p className="mt-1 text-[11px] text-[var(--color-muted-deep)]">Range: 16–26 °C per DIN 1946-4 / HTM 03-01</p>
          </div>
          <div>
            <label className="mb-1 block text-xs font-700 uppercase tracking-wide text-[var(--color-muted)]">Default Humidity Set Point</label>
            <div className="flex items-center gap-3">
              <button onClick={() => setHumSet((h: number) => Math.max(30, h - 1))} className="grid h-11 w-11 place-items-center rounded-xl border border-[var(--color-line)] text-xl font-800" style={{ color: 'var(--color-blue)' }}>−</button>
              <span className="flex-1 text-center font-mono text-2xl font-800" style={{ color: 'var(--color-blue)' }}>{humSet}% RH</span>
              <button onClick={() => setHumSet((h: number) => Math.min(60, h + 1))} className="grid h-11 w-11 place-items-center rounded-xl border border-[var(--color-line)] text-xl font-800" style={{ color: 'var(--color-blue)' }}>+</button>
            </div>
            <p className="mt-1 text-[11px] text-[var(--color-muted-deep)]">Range: 30–60% RH per DIN 1946-4</p>
          </div>
        </div>
      </Panel>

      {/* ── System Information ── */}
      <Panel>
        <SectionHeader tint="var(--color-violet)">System Information</SectionHeader>
        <div className="grid grid-cols-2 gap-3 text-sm">
          {[
            ['Product', 'Nova Sterilizio'], ['Version', '1.0.0'],
            ['Manufacturer', 'Prenit World LLP'], ['Standard', 'IEC 60601-1-8'],
            ['Region', 'EU / Global'], ['Released', '2026-08'],
          ].map(([k, v]) => (
            <div key={k} className="rounded-xl border border-[var(--color-line)] bg-[var(--color-ink-800)] p-3">
              <div className="text-[10px] font-700 uppercase tracking-wide text-[var(--color-muted-dim)]">{k}</div>
              <div className="mt-0.5 font-mono font-700 text-[var(--color-fg-soft)]">{v}</div>
            </div>
          ))}
        </div>
      </Panel>

      {/* ── Session ── */}
      <Panel>
        <SectionHeader tint="var(--color-critical)" right={
          <button
            onClick={() => { setUnlocked(false); setPwInput('') }}
            className="rounded-lg border border-[var(--color-caution)]/50 px-3 py-1 text-xs font-700 text-[var(--color-caution)] transition-colors hover:border-[var(--color-caution)]"
          >
            Lock
          </button>
        }>Admin Session</SectionHeader>
        <div className="flex items-center gap-3 rounded-xl border border-[var(--color-ok)]/30 bg-[var(--color-ok)]/8 p-3">
          <Icon.Shield size={18} className="shrink-0" style={{ color: 'var(--color-ok)' }} />
          <div>
            <div className="text-sm font-700" style={{ color: 'var(--color-ok)' }}>Session active</div>
            <div className="text-xs text-[var(--color-muted-dim)]">Navigate away or tap Lock to secure the admin panel.</div>
          </div>
        </div>
      </Panel>
    </div>
  )
}

function LockedPage({ title, tier }: { title: string; tier: string }) {
  return (
    <div className="grid h-full place-items-center">
      <Panel className="max-w-md text-center">
        <div className="mx-auto mb-4 grid h-16 w-16 place-items-center rounded-2xl bg-[var(--color-ink-800)] text-[#7f93a6]"><Icon.Lock size={30} /></div>
        <h2 className="text-xl font-800">{title}</h2>
        <p className="mt-2 text-sm text-[#9fb1c2]">This module is included in <span className="font-700 text-[var(--color-cyan)]">{tier}</span> and above. Switch tier using the version selector in the top bar to preview it.</p>
      </Panel>
    </div>
  )
}
