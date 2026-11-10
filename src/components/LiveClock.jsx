import React from 'react';
import { Clock } from 'lucide-react';
import { useNow } from '../hooks/useNow';
import { formatClockParts } from '../utils/time';

/**
 * Real, ticking date & time in the viewer's own timezone.
 * variant="stacked": time on top, date underneath (navbar)
 * variant="inline":  single line (top status bar / mobile menu)
 */
export default function LiveClock({ variant = 'stacked', className = '' }) {
  const now = useNow(1000);
  const { weekday, date, time } = formatClockParts(new Date(now));
  const tz = (() => {
    try { return Intl.DateTimeFormat().resolvedOptions().timeZone; } catch { return ''; }
  })();

  if (variant === 'inline') {
    return (
      <span
        className={`inline-flex items-center gap-1.5 tabular-nums ${className}`}
        title={tz ? `Local time (${tz})` : 'Local time'}
      >
        <Clock className="w-3.5 h-3.5 shrink-0" />
        <span>{weekday}, {date}</span>
        <span className="font-semibold">{time}</span>
      </span>
    );
  }

  return (
    <div
      className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border border-slate-200 bg-slate-50 ${className}`}
      title={tz ? `Local time (${tz})` : 'Local time'}
    >
      <Clock className="w-4 h-4 text-emerald-600 shrink-0" />
      <div className="leading-tight tabular-nums">
        <div className="text-xs font-bold text-slate-900">{time}</div>
        <div className="text-[10px] font-medium text-slate-500">{weekday}, {date}</div>
      </div>
    </div>
  );
}
