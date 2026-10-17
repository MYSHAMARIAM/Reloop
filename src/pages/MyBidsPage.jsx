import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useMockData } from '../context/MockDataContext';
import { api } from '../api';
import { formatRupees } from '../utils/currency';
import StatusBadge from '../components/StatusBadge';
import CountdownTimer from '../components/CountdownTimer';
import { Gavel, CheckCircle, XCircle, AlertCircle, ArrowRight, Star } from 'lucide-react';

export default function MyBidsPage({ onNavigate, onSelectListing, onOpenAuth }) {
  const { currentUser, isMockMode } = useAuth();
  const { mockApi } = useMockData();

  const [bidItems, setBidItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actionSuccess, setActionSuccess] = useState(null);

  const fetchMyBids = async () => {
    if (!currentUser) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      let data;
      if (isMockMode) {
        data = await mockApi.getMyBids(currentUser);
      } else {
        data = await api.dashboard.getMyBids();
      }
      setBidItems(data);
    } catch (err) {
      setError(err.message || 'Failed to load your bids');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMyBids();
  }, [currentUser, isMockMode]);

  const handleRespond = async (selectionId, action, listingId) => {
    setError(null);
    setActionSuccess(null);
    try {
      let res;
      if (isMockMode) {
        res = await mockApi.respondToSelection(selectionId, action, currentUser);
      } else {
        res = await api.bids.respondToSelection(selectionId, action);
      }
      setActionSuccess(res?.message || `Offer ${action}ed successfully.`);
      await fetchMyBids();
      if (action === 'accept' && !isMockMode) {
        const detail = await api.listings.getById(listingId);
        if (detail.transaction?.id) onStartCheckout(detail.transaction.id);
      }
    } catch (err) {
      setError(err.message || `Failed to ${action} offer`);
    }
  };

  if (!currentUser) {
    return (
      <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center max-w-md mx-auto space-y-4 shadow-sm my-12">
        <Gavel className="w-12 h-12 text-slate-300 mx-auto" />
        <h2 className="text-xl font-bold text-slate-900">Sign In to View Bids</h2>
        <p className="text-xs text-slate-500">Track competing bids you've placed across campus auctions.</p>
        <button
          onClick={() => onOpenAuth('login')}
          className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-md cursor-pointer"
        >
          Sign In
        </button>
      </div>
    );
  }

  const pendingInvitations = bidItems.filter(b => b.action_required);

  return (
    <div className="space-y-6 pb-20">
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
          My Auction Bids
        </h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Review placed bids, auction status, and response invitations
        </p>
      </div>

      {actionSuccess && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center gap-3 text-xs text-emerald-800">
          <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0" />
          <span>{actionSuccess}</span>
        </div>
      )}

      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl flex items-center gap-3 text-xs text-rose-800">
          <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Action Required Banner: Seller Selection Invitations */}
      {pendingInvitations.length > 0 && (
        <div className="bg-amber-500/10 border-2 border-amber-500 rounded-3xl p-6 shadow-md space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500 text-white flex items-center justify-center font-black text-lg">
              <Star className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-extrabold text-slate-900">
                Action Required: You Have Been Chosen as Winner!
              </h2>
              <p className="text-xs text-amber-900">
                A seller has chosen your bid. Please accept or decline to proceed to handover coordination.
              </p>
            </div>
          </div>

          <div className="space-y-3 pt-2">
            {pendingInvitations.map((item) => (
              <div
                key={item.listing.id}
                className="bg-white p-4 rounded-2xl border border-amber-300 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
              >
                <div>
                  <h4 className="font-bold text-slate-900 text-sm">{item.listing.title}</h4>
                  <p className="text-xs text-slate-500">
                    Seller: <span className="font-semibold">{item.listing.seller_name}</span> | Agreed Bid:{' '}
                    <span className="font-extrabold text-emerald-700">
                      {formatRupees(item.selection_invitation.bid_amount_rupees)}
                    </span>
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleRespond(item.selection_invitation.id, 'accept', item.listing.id)}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-sm cursor-pointer"
                  >
                    Accept Offer
                  </button>
                  <button
                    onClick={() => handleRespond(item.selection_invitation.id, 'decline', item.listing.id)}
                    className="px-4 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-xs rounded-xl cursor-pointer"
                  >
                    Decline
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {loading ? (
        <div className="py-16 text-center text-xs text-slate-400">Loading your bid activity...</div>
      ) : bidItems.length === 0 ? (
        <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center text-slate-500 space-y-3">
          <Gavel className="w-12 h-12 mx-auto text-slate-300" />
          <h3 className="font-bold text-slate-800">You haven't bid on any items yet</h3>
          <p className="text-xs text-slate-400">
            Browse through active college auctions and place competing bids.
          </p>
          <button
            onClick={() => onNavigate('browse')}
            className="px-4 py-2 bg-emerald-600 text-white rounded-xl text-xs font-bold hover:bg-emerald-700 cursor-pointer"
          >
            Browse Auctions
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {bidItems.map((item) => (
            <div
              key={item.listing.id}
              className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm flex flex-col justify-between space-y-4 hover:border-slate-300 transition-all"
            >
              <div>
                <div className="flex items-center justify-between text-xs mb-2">
                  <StatusBadge status={item.listing.status} />
                  <CountdownTimer endsAt={item.listing.ends_at} status={item.listing.status} />
                </div>

                <h3 className="font-bold text-slate-900 text-base line-clamp-1">
                  {item.listing.title}
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Seller: {item.listing.seller_name} ({item.listing.seller_location || 'Campus'})
                </p>

                {/* Price Comparisons */}
                <div className="grid grid-cols-2 gap-3 mt-4 p-3 bg-slate-50 rounded-2xl text-xs border border-slate-100">
                  <div>
                    <span className="text-slate-400 block mb-0.5">Your Highest Bid</span>
                    <span className="font-extrabold text-emerald-700 text-sm">
                      {formatRupees(item.my_highest_bid_rupees)}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block mb-0.5">Current Auction Top</span>
                    <span className="font-extrabold text-slate-900 text-sm">
                      {formatRupees(item.listing.current_highest_bid_rupees)}
                    </span>
                  </div>
                </div>

                {/* Bid history pills */}
                <div className="mt-3">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">
                    Your Placed Bids ({item.my_bids.length})
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {item.my_bids.map((b) => (
                      <span
                        key={b.id}
                        className="px-2 py-0.5 text-xs bg-slate-100 text-slate-700 rounded-md font-medium"
                      >
                        {formatRupees(b.amount_rupees)}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                <span className="text-xs font-medium text-slate-500">
                  Total auction bids: {item.listing.bid_count}
                </span>
                <button
                  onClick={() => onSelectListing(item.listing.id)}
                  className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  View Auction <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
