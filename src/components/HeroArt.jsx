import React from 'react';
import { Gavel } from 'lucide-react';

/* ------------------------------------------------------------------
   Local SVG illustrations (no network, no external images needed).
   Colours are hard-coded on purpose so the artwork looks identical in
   light and dark mode.
   ------------------------------------------------------------------ */

function BooksArt({ id }) {
  return (
    <svg viewBox="0 0 200 150" className="w-full h-full" role="img" aria-label="Stack of textbooks">
      <defs>
        <linearGradient id={`${id}-g1`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#34d399" /><stop offset="1" stopColor="#047857" />
        </linearGradient>
        <linearGradient id={`${id}-g2`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#38bdf8" /><stop offset="1" stopColor="#0369a1" />
        </linearGradient>
        <linearGradient id={`${id}-g3`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#fbbf24" /><stop offset="1" stopColor="#b45309" />
        </linearGradient>
      </defs>
      <ellipse cx="100" cy="136" rx="72" ry="7" fill="#0f172a" opacity=".16" />
      <rect x="26" y="98" width="148" height="30" rx="5" fill={`url(#${id}-g1)`} />
      <rect x="26" y="98" width="148" height="6" rx="3" fill="#fff" opacity=".2" />
      <rect x="44" y="110" width="54" height="4" rx="2" fill="#fff" opacity=".75" />
      <rect x="44" y="118" width="32" height="3" rx="1.5" fill="#fff" opacity=".5" />
      <rect x="38" y="68" width="126" height="28" rx="5" fill={`url(#${id}-g2)`} />
      <rect x="38" y="68" width="126" height="6" rx="3" fill="#fff" opacity=".2" />
      <rect x="140" y="78" width="10" height="10" rx="2" fill="#fff" opacity=".7" />
      <rect x="54" y="80" width="46" height="4" rx="2" fill="#fff" opacity=".75" />
      <g transform="rotate(-5 92 52)">
        <rect x="32" y="38" width="118" height="26" rx="5" fill={`url(#${id}-g3)`} />
        <rect x="32" y="38" width="118" height="6" rx="3" fill="#fff" opacity=".22" />
        <rect x="48" y="50" width="44" height="4" rx="2" fill="#fff" opacity=".8" />
        <path d="M128 38 v24 l6 -5 6 5 v-24z" fill="#f43f5e" />
      </g>
    </svg>
  );
}

function LaptopArt({ id }) {
  return (
    <svg viewBox="0 0 200 150" className="w-full h-full" role="img" aria-label="Laptop">
      <defs>
        <linearGradient id={`${id}-s`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#0ea5e9" /><stop offset="1" stopColor="#4f46e5" />
        </linearGradient>
      </defs>
      <ellipse cx="100" cy="134" rx="76" ry="6" fill="#0f172a" opacity=".16" />
      <rect x="40" y="20" width="120" height="82" rx="8" fill="#1e293b" />
      <rect x="47" y="27" width="106" height="68" rx="4" fill={`url(#${id}-s)`} />
      <rect x="56" y="38" width="40" height="4" rx="2" fill="#fff" opacity=".9" />
      <rect x="62" y="48" width="58" height="4" rx="2" fill="#a7f3d0" />
      <rect x="62" y="58" width="34" height="4" rx="2" fill="#fde68a" />
      <rect x="56" y="68" width="48" height="4" rx="2" fill="#fff" opacity=".7" />
      <circle cx="136" cy="76" r="9" fill="#fff" opacity=".18" />
      <path d="M22 106 h156 l-9 15 a6 6 0 0 1 -5 3 h-128 a6 6 0 0 1 -5 -3z" fill="#cbd5e1" />
      <rect x="84" y="106" width="32" height="5" rx="2.5" fill="#94a3b8" />
    </svg>
  );
}

function CalculatorArt({ id }) {
  const keys = [];
  for (let r = 0; r < 4; r++) {
    for (let c = 0; c < 4; c++) {
      keys.push({ x: 72 + c * 15, y: 62 + r * 16, hot: c === 3 });
    }
  }
  return (
    <svg viewBox="0 0 200 150" className="w-full h-full" role="img" aria-label="Scientific calculator">
      <defs>
        <linearGradient id={`${id}-b`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#334155" /><stop offset="1" stopColor="#0f172a" />
        </linearGradient>
      </defs>
      <ellipse cx="100" cy="138" rx="46" ry="5" fill="#0f172a" opacity=".16" />
      <rect x="62" y="10" width="76" height="124" rx="10" fill={`url(#${id}-b)`} />
      <rect x="70" y="18" width="60" height="30" rx="4" fill="#a7f3d0" />
      <text x="124" y="40" textAnchor="end" fontSize="12.5" fontWeight="700" fill="#064e3b" fontFamily="ui-monospace, monospace">3.14159</text>
      {keys.map((k, i) => (
        <rect key={i} x={k.x} y={k.y} width="11" height="11" rx="3" fill={k.hot ? '#10b981' : '#64748b'} />
      ))}
    </svg>
  );
}

function CircuitArt({ id }) {
  return (
    <svg viewBox="0 0 200 150" className="w-full h-full" role="img" aria-label="Electronics lab kit">
      <defs>
        <linearGradient id={`${id}-p`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#10b981" /><stop offset="1" stopColor="#065f46" />
        </linearGradient>
      </defs>
      <ellipse cx="100" cy="134" rx="74" ry="6" fill="#0f172a" opacity=".16" />
      <rect x="28" y="26" width="144" height="94" rx="9" fill={`url(#${id}-p)`} />
      <g stroke="#a7f3d0" strokeWidth="2.5" fill="none" strokeLinecap="round" opacity=".85">
        <path d="M40 48 H78 V62" /><path d="M160 48 H128 V62" />
        <path d="M40 100 H76 V86" /><path d="M160 100 H126 V86" /><path d="M40 74 H64" /><path d="M136 74 H160" />
      </g>
      <rect x="78" y="58" width="48" height="32" rx="4" fill="#0f172a" />
      {[0, 1, 2, 3].map((i) => (
        <g key={i}>
          <rect x={84 + i * 10} y="52" width="4" height="6" fill="#e2e8f0" />
          <rect x={84 + i * 10} y="90" width="4" height="6" fill="#e2e8f0" />
        </g>
      ))}
      <circle cx="90" cy="68" r="2.5" fill="#34d399" />
      <circle cx="44" cy="40" r="5" fill="#fbbf24" /><circle cx="156" cy="108" r="5" fill="#f43f5e" />
      <rect x="148" y="36" width="12" height="12" rx="2" fill="#38bdf8" />
    </svg>
  );
}

const TILES = [
  { key: 'books',  label: 'Textbooks',   Art: BooksArt,      bg: 'from-[#ecfdf5] to-[#d1fae5]', pos: 'top-0 left-0',         rot: '-4deg', delay: '0s'   },
  { key: 'laptop', label: 'Electronics', Art: LaptopArt,     bg: 'from-[#eff6ff] to-[#dbeafe]', pos: 'top-3 right-0',       rot: '3deg',  delay: '1.2s' },
  { key: 'calc',   label: 'Calculators', Art: CalculatorArt, bg: 'from-[#fffbeb] to-[#fef3c7]', pos: 'bottom-0 left-4',      rot: '2deg',  delay: '2.1s' },
  { key: 'lab',    label: 'Lab kits',    Art: CircuitArt,    bg: 'from-[#f0fdfa] to-[#ccfbf1]', pos: 'bottom-0 right-2',    rot: '-3deg', delay: '0.6s' },
];

function Tile({ tile, idPrefix, className = '', style }) {
  const { Art, label, bg } = tile;
  return (
    <div
      className={`rounded-2xl bg-gradient-to-br ${bg} shadow-xl shadow-black/30 ring-1 ring-white/40 overflow-hidden ${className}`}
      style={style}
    >
      <div className="h-[calc(100%-2rem)] px-3 pt-3">
        <Art id={`${idPrefix}-${tile.key}`} />
      </div>
      <div className="h-8 flex items-center px-3 text-[11px] font-bold uppercase tracking-wider text-[#334155] bg-white/60">
        {label}
      </div>
    </div>
  );
}

/** Large floating collage (desktop) */
export function HeroCollage({ liveCount = 0 }) {
  return (
    <div className="relative h-[430px] w-full" aria-hidden={false}>
      {TILES.map((t) => (
        <Tile
          key={t.key}
          tile={t}
          idPrefix="hc"
          className={`absolute ${t.pos} w-[47%] h-[190px] rl-float`}
          style={{ '--r': t.rot, transform: `rotate(${t.rot})`, animationDelay: t.delay }}
        />
      ))}

      {/* Live auctions badge (real, current number) */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-10 rounded-2xl bg-[#0b1220]/85 backdrop-blur-md ring-1 ring-white/15 px-5 py-3.5 shadow-2xl text-center">
        <div className="flex items-center justify-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.18em] text-emerald-300">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          Live now
        </div>
        <div className="mt-1 flex items-center justify-center gap-2 text-white">
          <Gavel className="w-5 h-5 text-emerald-400" />
          <span className="text-3xl font-black tabular-nums leading-none">{liveCount}</span>
        </div>
        <div className="mt-1 text-[11px] text-slate-300">{liveCount === 1 ? 'auction open' : 'auctions open'}</div>
      </div>
    </div>
  );
}

/** Compact strip (tablet / phone) */
export function HeroStrip() {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
      {TILES.map((t) => (
        <Tile key={t.key} tile={t} idPrefix="hs" className="h-[130px]" />
      ))}
    </div>
  );
}
