/**
 * Reloop Time & Countdown Utilities
 *
 * IMPORTANT: the FastAPI backend stores and returns UTC timestamps WITHOUT a
 * timezone suffix (e.g. "2026-11-08T10:00:00"). Browsers read such strings as
 * LOCAL time, which shifts every date and countdown by the user's UTC offset
 * (5h 30m in India). parseServerDate() / normalizeServerDates() treat those
 * strings as UTC so that every date and countdown is correct.
 */

const HAS_TZ = /(Z|[+-]\d{2}:?\d{2})$/i;
const ISO_DATETIME = /^\d{4}-\d{2}-\d{2}[T ]\d{2}:\d{2}/;

/** Convert a server timestamp string into a proper UTC ISO string. */
export function toUtcIso(value) {
  if (typeof value !== 'string' || !ISO_DATETIME.test(value)) return value;
  const v = value.trim().replace(' ', 'T');
  return HAS_TZ.test(v) ? v : `${v}Z`;
}

/** Parse a server timestamp (UTC, with or without a "Z") into a Date. */
export function parseServerDate(value) {
  if (!value) return null;
  if (value instanceof Date) return value;
  const d = new Date(toUtcIso(value));
  return isNaN(d.getTime()) ? null : d;
}

/**
 * Walk an API response and fix every "*_at" timestamp (created_at, ends_at,
 * expires_at, selected_at ...) so it is unambiguous UTC.
 */
export function normalizeServerDates(node) {
  if (Array.isArray(node)) return node.map(normalizeServerDates);
  if (node && typeof node === 'object') {
    const out = {};
    for (const [key, val] of Object.entries(node)) {
      if (typeof val === 'string' && key.endsWith('_at')) out[key] = toUtcIso(val);
      else out[key] = normalizeServerDates(val);
    }
    return out;
  }
  return node;
}

export function formatTimeRemaining(secondsRemaining) {
  if (secondsRemaining <= 0) {
    return 'Auction Closed';
  }

  const days = Math.floor(secondsRemaining / (3600 * 24));
  const hours = Math.floor((secondsRemaining % (3600 * 24)) / 3600);
  const minutes = Math.floor((secondsRemaining % 3600) / 60);
  const seconds = secondsRemaining % 60;

  if (days > 0) {
    return `${days}d ${hours}h left`;
  }
  if (hours > 0) {
    return `${hours}h ${minutes}m left`;
  }
  if (minutes > 0) {
    return `${minutes}m ${seconds}s left`;
  }
  return `${seconds}s left`;
}

/** Date + time in the viewer's own timezone, e.g. "8 Nov 2026, 3:42 pm". */
export function formatDateTime(value) {
  const date = parseServerDate(value);
  if (!date) return '';
  return date.toLocaleString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
}

/** Parts for the live clock in the navbar. */
export function formatClockParts(date = new Date()) {
  return {
    weekday: date.toLocaleDateString('en-IN', { weekday: 'short' }),
    date: date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }),
    time: date.toLocaleTimeString('en-IN', {
      hour: 'numeric',
      minute: '2-digit',
      second: '2-digit',
      hour12: true,
    }),
  };
}

export function getSecondsRemaining(endsAtIso) {
  const target = parseServerDate(endsAtIso);
  if (!target) return 0;
  return Math.max(0, Math.floor((target.getTime() - Date.now()) / 1000));
}

/** True while an auction is open: status is active AND the deadline is in the future. */
export function isAuctionLive(listing, nowMs = Date.now()) {
  if (!listing || listing.status !== 'active') return false;
  const ends = parseServerDate(listing.ends_at);
  return !!ends && ends.getTime() > nowMs;
}

/** "just now", "5 min ago", "3 h ago", "2 d ago" (falls back to a date after a week). */
export function timeAgo(value, nowMs = Date.now()) {
  const d = parseServerDate(value);
  if (!d) return '';
  const sec = Math.max(0, Math.floor((nowMs - d.getTime()) / 1000));
  if (sec < 45) return 'just now';
  const min = Math.floor(sec / 60);
  if (min < 60) return `${min} min ago`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr} h ago`;
  const day = Math.floor(hr / 24);
  if (day < 7) return `${day} d ago`;
  return formatDateTime(d);
}
