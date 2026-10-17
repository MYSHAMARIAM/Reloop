import React, { useState, useEffect } from 'react';
import { formatTimeRemaining, getSecondsRemaining } from '../utils/time';
import { Clock } from 'lucide-react';

export default function CountdownTimer({ endsAt, status, className = '' }) {
  const [seconds, setSeconds] = useState(() => getSecondsRemaining(endsAt));

  useEffect(() => {
    if (status !== 'active') return;

    setSeconds(getSecondsRemaining(endsAt));
    const interval = setInterval(() => {
      const rem = getSecondsRemaining(endsAt);
      setSeconds(rem);
      if (rem <= 0) {
        clearInterval(interval);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [endsAt, status]);

  if (status && status !== 'active') {
    return (
      <span className={`inline-flex items-center gap-1.5 text-xs text-slate-500 ${className}`}>
        <Clock className="w-3.5 h-3.5 text-slate-400" />
        Auction Closed
      </span>
    );
  }

  const isUrgent = seconds > 0 && seconds <= 3600; // Under 1 hour

  return (
    <span
      className={`inline-flex items-center gap-1.5 text-xs font-medium ${
        isUrgent ? 'text-rose-600 font-semibold animate-pulse' : 'text-slate-600'
      } ${className}`}
    >
      <Clock className={`w-3.5 h-3.5 ${isUrgent ? 'text-rose-500' : 'text-slate-400'}`} />
      {formatTimeRemaining(seconds)}
    </span>
  );
}
