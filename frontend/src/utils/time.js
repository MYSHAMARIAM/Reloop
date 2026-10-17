/**
 * Reloop Time & Countdown Utilities
 */

export function formatTimeRemaining(secondsRemaining) {
  if (secondsRemaining <= 0) {
    return 'Bidding Closed';
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

export function formatDateTime(isoString) {
  if (!isoString) return '—';
  try {
    const d = new Date(isoString);
    return new Intl.DateTimeFormat('en-IN', {
      dateStyle: 'medium',
      timeStyle: 'short',
    }).format(d);
  } catch {
    return String(isoString);
  }
}

export function getSecondsRemaining(endsAtIso) {
  if (!endsAtIso) return 0;
  const target = new Date(endsAtIso).getTime();
  const now = Date.now();
  return Math.max(0, Math.floor((target - now) / 1000));
}
