import React, { useEffect, useState } from 'react';
import { Sparkles, ArrowRight, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { api } from '../api';
import { formatRupees } from '../utils/currency';

export default function OfferBanner({ onViewOffer, refreshKey }) {
  const { currentUser, isMockMode } = useAuth();
  const [offers, setOffers] = useState([]);
  const [dismissed, setDismissed] = useState([]);

  useEffect(() => {
    if (!currentUser || isMockMode) {
      setOffers([]);
      return;
    }
    let alive = true;
    const load = async () => {
      try {
        const rows = await api.dashboard.getMyBids();
        if (!alive) return;
        setOffers(rows.filter((r) => r.action_required && r.selection_invitation));
      } catch {
        // stay quiet: the banner is a convenience, not critical
      }
    };
    load();
    const timer = setInterval(() => {
      if (!document.hidden) load();
    }, 20000);
    return () => {
      alive = false;
      clearInterval(timer);
    };
  }, [currentUser?.id, isMockMode, refreshKey]);

  const visible = offers.filter((o) => !dismissed.includes(o.selection_invitation.id));
  if (visible.length === 0) return null;

  const first = visible[0];
  const extra = visible.length - 1;

  return (
    <div className="bg-amber-500 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2.5 flex items-center gap-3 text-xs sm:text-sm">
        <Sparkles className="w-4 h-4 shrink-0" />
        <p className="flex-1 font-semibold">
          You've been selected for <span className="underline">{first.listing.title}</span> at{' '}
          {formatRupees(first.selection_invitation.bid_amount_rupees)}
          {extra > 0 ? ` (+${extra} more)` : ''}. Accept or decline within 24 hours.
        </p>
        <button
          onClick={() => onViewOffer(first.listing.id)}
          className="px-3 py-1.5 bg-white text-amber-700 font-bold rounded-lg flex items-center gap-1 cursor-pointer hover:bg-amber-50"
        >
          View offer <ArrowRight className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={() => setDismissed((d) => [...d, first.selection_invitation.id])}
          className="p-1 rounded hover:bg-amber-600 cursor-pointer"
          aria-label="Dismiss"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}