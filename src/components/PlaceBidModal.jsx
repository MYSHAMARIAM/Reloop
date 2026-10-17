import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useMockData } from '../context/MockDataContext';
import { api } from '../api';
import { formatRupees, calculateNextMinimumBid } from '../utils/currency';
import { X, Gavel, AlertCircle, ShieldAlert } from 'lucide-react';

export default function PlaceBidModal({ listing, onClose, onBidSuccess, onOpenAuth }) {
  const { currentUser, isMockMode } = useAuth();
  const { mockApi } = useMockData();

  const minNextBid = calculateNextMinimumBid(
    listing.starting_price_rupees,
    listing.current_highest_bid_rupees,
    listing.min_increment_rupees
  );

  const [bidAmount, setBidAmount] = useState(minNextBid);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  if (!currentUser) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
        <div className="bg-white rounded-2xl max-w-md w-full p-6 text-center space-y-4 shadow-xl">
          <div className="w-12 h-12 rounded-full bg-emerald-50 text-emerald-600 mx-auto flex items-center justify-center">
            <Gavel className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-bold text-slate-900">Sign in to Place Bids</h3>
          <p className="text-sm text-slate-600">
            Only authenticated college students can participate in auction bidding.
          </p>
          <div className="flex gap-3 justify-center pt-2">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
            >
              Cancel
            </button>
            <button
              onClick={() => {
                onClose();
                onOpenAuth('login');
              }}
              className="px-5 py-2 text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg"
            >
              Sign In Now
            </button>
          </div>
        </div>
      </div>
    );
  }

  const isSeller = currentUser.id === listing.seller_id;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (isSeller) {
      setError('Sellers are prohibited from bidding on their own listings.');
      return;
    }

    const numBid = parseFloat(bidAmount);
    if (isNaN(numBid) || numBid < minNextBid) {
      setError(`Minimum bid required is ${formatRupees(minNextBid)}`);
      return;
    }

    setSubmitting(true);
    try {
      if (isMockMode) {
        await mockApi.placeBid(listing.id, numBid, currentUser);
      } else {
        await api.bids.submitBid(listing.id, numBid);
      }
      onBidSuccess();
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to place bid');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl relative animate-in fade-in zoom-in-95 duration-150">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <Gavel className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-slate-900 text-lg">Place a Competing Bid</h3>
            <p className="text-xs text-slate-500 line-clamp-1">{listing.title}</p>
          </div>
        </div>

        {isSeller && (
          <div className="p-3 mb-4 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-2.5 text-xs text-amber-800">
            <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <strong>Self-Bidding Restriction:</strong> You created this listing.
              College marketplace ethics prohibit sellers from bidding on their own items.
            </div>
          </div>
        )}

        {/* Pricing Summary Box */}
        <div className="bg-slate-50 rounded-xl p-4 mb-4 grid grid-cols-2 gap-3 text-xs border border-slate-100">
          <div>
            <span className="text-slate-400 block mb-0.5">Starting Price</span>
            <span className="font-semibold text-slate-800 text-sm">
              {formatRupees(listing.starting_price_rupees)}
            </span>
          </div>
          <div>
            <span className="text-slate-400 block mb-0.5">Min Increment</span>
            <span className="font-semibold text-slate-800 text-sm">
              +{formatRupees(listing.min_increment_rupees)}
            </span>
          </div>
          <div>
            <span className="text-slate-400 block mb-0.5">Current Highest Bid</span>
            <span className="font-bold text-slate-900 text-sm">
              {listing.current_highest_bid_rupees
                ? formatRupees(listing.current_highest_bid_rupees)
                : 'No bids yet'}
            </span>
          </div>
          <div>
            <span className="text-emerald-700 block mb-0.5 font-semibold">Minimum Next Bid</span>
            <span className="font-extrabold text-emerald-800 text-sm">
              {formatRupees(minNextBid)}
            </span>
          </div>
        </div>

        {error && (
          <div className="p-3 mb-4 bg-rose-50 border border-rose-200 rounded-xl flex items-start gap-2 text-xs text-rose-700">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-500" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Your Bid Amount (₹ INR)
            </label>
            <div className="relative">
              <span className="absolute left-3.5 top-2.5 text-slate-400 font-bold">₹</span>
              <input
                type="number"
                step="1"
                min={minNextBid}
                disabled={isSeller || submitting}
                value={bidAmount}
                onChange={(e) => setBidAmount(e.target.value)}
                className="w-full pl-8 pr-4 py-2.5 border border-slate-200 rounded-xl text-lg font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 disabled:bg-slate-100"
              />
            </div>
            <p className="text-[11px] text-slate-500 mt-1">
              Must be at least {formatRupees(minNextBid)}. Bids are binding and immutable.
            </p>
          </div>

          {/* Quick preset increments */}
          <div className="flex gap-2">
            {[0, 50, 100, 200].map((extra) => {
              const val = minNextBid + extra;
              return (
                <button
                  key={extra}
                  type="button"
                  disabled={isSeller}
                  onClick={() => setBidAmount(val)}
                  className="flex-1 py-1 px-2 text-xs font-medium bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition-colors disabled:opacity-50"
                >
                  +{formatRupees(extra)} ({formatRupees(val)})
                </button>
              );
            })}
          </div>

          <div className="flex gap-3 justify-end pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSeller || submitting}
              className="px-6 py-2 text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 rounded-xl shadow-md shadow-emerald-600/20 transition-all cursor-pointer"
            >
              {submitting ? 'Placing Bid...' : 'Submit Bid'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
