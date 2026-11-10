import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useMockData } from '../context/MockDataContext';
import { api } from '../api';
import { formatRupees } from '../utils/currency';
import { X, Zap, AlertCircle, ShieldCheck } from 'lucide-react';

export default function BuyNowModal({ listing, onClose, onSuccess, onOpenAuth }) {
  const { currentUser, isMockMode } = useAuth();
  const { mockApi } = useMockData();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const price =
    listing.buy_now_price_rupees ??
    (listing.buy_now_price_paise ? listing.buy_now_price_paise / 100 : 0);

  if (!currentUser) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
        <div className="bg-white rounded-2xl max-w-md w-full p-6 text-center space-y-4 shadow-xl">
          <div className="w-12 h-12 rounded-full bg-blue-50 text-blue-600 mx-auto flex items-center justify-center">
            <Zap className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-bold text-slate-900">Sign in to Buy Now</h3>
          <p className="text-sm text-slate-600">
            Only verified college students can purchase items on Reloop.
          </p>
          <div className="flex gap-3 justify-center pt-2">
            <button onClick={onClose} className="px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100 rounded-lg cursor-pointer">
              Cancel
            </button>
            <button
              onClick={() => { onClose(); onOpenAuth('login'); }}
              className="px-5 py-2 text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg cursor-pointer"
            >
              Sign In Now
            </button>
          </div>
        </div>
      </div>
    );
  }

  const isOwnListing = currentUser.id === listing.seller_id;

  const handleConfirm = async () => {
    setError(null);
    setSubmitting(true);
    try {
      const tx = isMockMode
        ? await mockApi.buyNow(listing.id, currentUser)
        : await api.listings.buyNow(listing.id);
      onSuccess(tx);
    } catch (err) {
      setError(err.message || 'Buy Now failed. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl max-w-md w-full shadow-xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label="Confirm Buy Now"
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <Zap className="w-5 h-5 text-blue-600" /> Buy Now
          </h3>
          <button onClick={onClose} className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer" aria-label="Close">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <div>
            <p className="text-sm font-semibold text-slate-900 line-clamp-2">{listing.title}</p>
            <p className="text-xs text-slate-500 mt-0.5">Sold by {listing.seller_name}</p>
          </div>

          <div className="flex items-baseline justify-between p-4 rounded-xl bg-blue-50 border border-blue-200">
            <span className="text-xs font-bold uppercase tracking-wider text-blue-800">Buy Now price</span>
            <span className="text-2xl font-black text-blue-900">{formatRupees(price)}</span>
          </div>

          <div className="flex gap-2 text-xs text-slate-600">
            <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            <p>
              Buying now ends the auction immediately and reserves this item for you. You will
              continue to checkout to complete the purchase and arrange a safe campus handover.
            </p>
          </div>

          {isOwnListing && (
            <div className="flex items-start gap-2 p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              You listed this item, so you cannot buy it.
            </div>
          )}

          {error && (
            <div className="flex items-start gap-2 p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <div className="flex gap-3 pt-1">
            <button
              onClick={onClose}
              className="flex-1 py-2.5 text-sm font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl cursor-pointer"
            >
              Cancel
            </button>
            <button
              onClick={handleConfirm}
              disabled={submitting || isOwnListing}
              className="flex-1 py-2.5 text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-lg shadow-blue-600/20 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              {submitting ? 'Processing…' : `Confirm · ${formatRupees(price)}`}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
