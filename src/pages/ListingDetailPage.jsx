import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useMockData } from '../context/MockDataContext';
import { api } from '../api';
import { formatRupees, calculateNextMinimumBid } from '../utils/currency';
import { formatDateTime } from '../utils/time';
import { getCategoryLabel, getConditionLabel } from '../utils/validators';
import StatusBadge from '../components/StatusBadge';
import CountdownTimer from '../components/CountdownTimer';
import PlaceBidModal from '../components/PlaceBidModal';
import {
  ArrowLeft,
  Gavel,
  ShieldCheck,
  MapPin,
  Clock,
  User,
  CheckCircle,
  XCircle,
  AlertCircle,
  Tag,
  Handshake,
  Check,
  X,
} from 'lucide-react';

export default function ListingDetailPage({
  listingId,
  onBack,
  onNavigate,
  onOpenAuth,
}) {
  const { currentUser, isMockMode } = useAuth();
  const { mockApi } = useMockData();

  const [listing, setListing] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);          // action errors (shown as a banner)
  const [loadError, setLoadError] = useState(null);  // page failed to load (full-page error)
  const [actionSuccess, setActionSuccess] = useState(null);
  const [showBidModal, setShowBidModal] = useState(false);
  const [processingSelection, setProcessingSelection] = useState(false);
  const [confirmModalBid, setConfirmModalBid] = useState(null);

  const fetchDetail = async (showSpinner = false, silent = false) => {
    try {
      if (showSpinner) setLoading(true);
      setLoadError(null);
      let data;
      if (isMockMode) {
        data = await mockApi.getListingById(listingId);
      } else {
        data = await api.listings.getById(listingId);
      }
      setListing(data);
      } catch (err) {
        if (!silent) {
          setLoadError(err.message || 'Failed to load listing details');
        }
      } finally {
        setLoading(false);
      }
    };



// Initial fetch
useEffect(() => {
  fetchDetail(true);
}, [listingId, isMockMode, currentUser?.id]);

// Auto-refresh every 15 seconds
useEffect(() => {
  if (isMockMode) return;

  const timer = setInterval(() => {
    if (!document.hidden && !processingSelection) {
      fetchDetail(false, true);
    }
  }, 15000);

  return () => clearInterval(timer);
}, [listingId, isMockMode, processingSelection, currentUser?.id]);

// Loading state
if (loading) {
  return (
    <div className="py-20 text-center space-y-3">
      <div className="w-8 h-8 border-3 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto" />
      <p className="text-xs text-slate-500 font-medium">
        Loading auction details...
      </p>
    </div>
  );
}

// Keep your existing error handling below this



  if (loadError || !listing) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center space-y-4 max-w-lg mx-auto">
        <AlertCircle className="w-10 h-10 text-rose-500 mx-auto" />
        <h3 className="font-bold text-slate-900">Unable to load auction</h3>
        <p className="text-xs text-slate-500">{loadError || 'Listing not found.'}</p>
        <button
          onClick={onBack}
          className="px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-semibold"
        >
          Back to Listings
        </button>
      </div>
    );
  }

  const isSeller = currentUser && currentUser.id === listing.seller_id;
  const isAuctionEnded = listing.status !== 'active' || new Date(listing.ends_at) <= new Date();
  const bids = listing.bids || [];
  const minNextBid = calculateNextMinimumBid(
    listing.starting_price_rupees,
    listing.current_highest_bid_rupees,
    listing.min_increment_rupees
  );

  // A selection offer is waiting for the selected bidder's answer
  const hasPendingSelection =
    !!listing.active_selection && listing.active_selection.status === 'pending';

  // Seller may pick a bidder any time until the item is reserved/sold (timer or not)
  const sellerCanSelect =
    !!isSeller && listing.status !== 'sold' && listing.status !== 'reserved' && listing.status !== 'withdrawn';

  // Is the CURRENT USER the selected bidder? String() avoids "5" vs 5 mismatches.
  const myPendingSelection =
    !!currentUser &&
    hasPendingSelection &&
    String(listing.active_selection.selected_bidder_id) === String(currentUser.id);

  const hasBuyNow = !!listing.buy_now_price_paise;

  const handleBuyNow = async () => {
    if (!currentUser) return onOpenAuth('login');
    setProcessingSelection(true);
    setActionSuccess(null);
    setError(null);
    try {
      const tx = isMockMode
        ? await mockApi.buyNow(listing.id, currentUser)
        : await api.listings.buyNow(listing.id);
      onNavigate('checkout', tx.id);
    } catch (err) {
      setError(err.message || 'Buy Now failed');
    } finally {
      setProcessingSelection(false);
    }
  };

  // Handle seller selecting a bidder
  const handleSelectBidder = async (bidId) => {
    if (!currentUser) return onOpenAuth('login');
    setProcessingSelection(true);
    setActionSuccess(null);
    setError(null);
    try {
      if (isMockMode) {
        await mockApi.selectBidder(listing.id, bidId, currentUser);
      } else {
        await api.bids.selectBidder(listing.id, bidId);
      }
      setActionSuccess('Bidder selected! An invitation has been sent to the student to accept or decline.');
      await fetchDetail();
    } catch (err) {
      setError(err.message || 'Failed to select bidder');
    } finally {
      setProcessingSelection(false);
    }
  };

  // Handle selected bidder responding to selection
  const handleRespondToSelection = async (action) => {
    if (!listing.active_selection) return;
    setProcessingSelection(true);
    setActionSuccess(null);
    setError(null);
    try {
      let res;
      if (isMockMode) {
        res = await mockApi.respondToSelection(listing.active_selection.id, action, currentUser);
      } else {
        res = await api.bids.respondToSelection(listing.active_selection.id, action);
      }
      setActionSuccess(res?.message || `Offer ${action}ed.`);

      // Use the transaction id returned by the API (the local `listing` is stale here)
      const txId = res?.transaction_id || res?.transaction?.id;
      if (action === 'accept' && txId && onNavigate) {
        onNavigate('checkout', txId);
      } else {
        await fetchDetail();
      }
    } catch (err) {
      setError(err.message || `Failed to ${action} offer`);
    } finally {
      setProcessingSelection(false);
    }
  };

  return (
    <div className="space-y-6 pb-20">
      {/* Back button */}
      <button
        onClick={onBack}
        className="inline-flex items-center gap-2 text-xs font-semibold text-slate-500 hover:text-slate-900 transition-colors cursor-pointer"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Auctions
      </button>

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

      {/* Main Grid: Left Item Details, Right Bidding / Selection Column */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left 2 Columns: Image & Listing Information */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm">
            {/* Image Banner */}
            <div className="relative aspect-video bg-slate-100 overflow-hidden">
              {listing.image_url ? (
                <img
                  src={listing.image_url}
                  alt={listing.title}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.target.style.display = 'none';
                    e.target.nextSibling.style.display = 'flex';
                  }}
                />
              ) : null}

              <div
                className={`w-full h-full ${listing.image_url ? 'hidden' : 'flex'} flex-col items-center justify-center bg-gradient-to-br from-slate-100 to-slate-200 text-slate-400 p-8`}
              >
                <Tag className="w-16 h-16 mb-2 text-slate-300" />
                <span className="text-sm font-semibold text-slate-600 uppercase tracking-wider">
                  {getCategoryLabel(listing.category)}
                </span>
                <span className="text-xs text-slate-400">Campus Second-Hand Equipment</span>
              </div>

              <div className="absolute top-4 left-4 right-4 flex items-center justify-between">
                <StatusBadge status={listing.status} />
                <span className="px-3 py-1 text-xs font-bold rounded-lg bg-black/60 text-white backdrop-blur-sm">
                  {getConditionLabel(listing.condition)}
                </span>
              </div>
            </div>

            {/* Information Body */}
            <div className="p-6 sm:p-8 space-y-6">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full">
                    {getCategoryLabel(listing.category)}
                  </span>
                  <span className="text-xs text-slate-400">
                    Listed {formatDateTime(listing.created_at)}
                  </span>
                </div>

                <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                  {listing.title}
                </h1>
              </div>

              {/* Description */}
              <div className="space-y-2">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Item Description
                </h3>
                <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-line bg-slate-50/60 p-4 rounded-2xl border border-slate-100">
                  {listing.description}
                </p>
              </div>

              {/* Seller Information */}
              <div className="pt-4 border-t border-slate-100 flex items-center justify-between flex-wrap gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-full bg-slate-900 text-white font-bold flex items-center justify-center text-sm shadow-sm">
                    {listing.seller_name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <span className="block text-xs font-semibold text-slate-400">Seller</span>
                    <span className="font-bold text-slate-900 text-sm">{listing.seller_name}</span>
                  </div>
                </div>

                {listing.seller_location && (
                  <div className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 text-slate-700 rounded-xl text-xs font-medium">
                    <MapPin className="w-3.5 h-3.5 text-slate-400" />
                    <span>Campus: {listing.seller_location}</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Bid History Table */}
          <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <Gavel className="w-4 h-4 text-emerald-600" />
                  Bid History ({bids.length})
                </h3>
                <p className="text-xs text-slate-500">
                  Immutable public audit trail of student bids
                </p>
              </div>
              <span className="text-xs font-semibold text-slate-500">
                Sorted by highest amount
              </span>
            </div>

            {bids.length === 0 ? (
              <div className="py-8 text-center text-slate-400 text-xs bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                No bids have been placed on this auction yet.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-200 text-slate-400 font-semibold uppercase tracking-wider text-[10px]">
                      <th className="pb-3">Rank</th>
                      <th className="pb-3">Bidder</th>
                      <th className="pb-3">Amount</th>
                      <th className="pb-3">Time</th>
                      {sellerCanSelect && <th className="pb-3 text-right">Seller Action</th>}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {bids.map((b, idx) => (
                      <tr key={b.id} className="hover:bg-slate-50/60 transition-colors">
                        <td className="py-3 font-mono font-bold text-slate-400">
                          #{idx + 1}
                        </td>
                        <td className="py-3 font-semibold text-slate-800">
                          {b.bidder_name}
                          {currentUser && b.bidder_id === currentUser.id && (
                            <span className="ml-1.5 text-[10px] bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded font-bold">
                              You
                            </span>
                          )}
                        </td>
                        <td className="py-3 font-extrabold text-slate-900 text-sm">
                          {formatRupees(b.amount_rupees)}
                        </td>
                        <td className="py-3 text-slate-400">
                          {formatDateTime(b.created_at)}
                        </td>
                        {sellerCanSelect && (
                          <td className="py-3 text-right">
                            {listing.status === 'reserved' || listing.status === 'sold' ? (
                              <span className="text-[11px] text-slate-400">Item Reserved</span>
                            ) : listing.active_selection && listing.active_selection.bid_id === b.id ? (
                              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-700 bg-amber-50 px-2.5 py-1 rounded-md border border-amber-200">
                                Selected (Awaiting Response)
                              </span>
                            ) : (
                              <button
                                onClick={() => setConfirmModalBid(b)}
                                disabled={processingSelection || (listing.active_selection && listing.active_selection.status === 'pending')}
                                className="px-3.5 py-1.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl transition-all cursor-pointer disabled:opacity-50 shadow-xs flex items-center gap-1.5 ml-auto"
                              >
                                <Check className="w-3.5 h-3.5" />
                                Agree & Sell
                              </button>
                            )}
                          </td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Bidding Controls & Selection/Handover Status Cards */}
        <div className="space-y-6">
          {/* Action Box: Bidding + optional Buy Now */}
          {!isAuctionEnded && !hasPendingSelection && (
            <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm space-y-6 sticky top-24">
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                  {listing.current_highest_bid_rupees ? 'Current Highest Bid' : 'Starting Price'}
                </span>
                <div className="text-3xl font-black text-slate-900 tracking-tight">
                  {listing.current_highest_bid_rupees
                    ? formatRupees(listing.current_highest_bid_rupees)
                    : formatRupees(listing.starting_price_rupees)}
                </div>
              </div>

              {/* Countdown timer pill */}
              <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100 flex items-center justify-between">
                <span className="text-xs text-slate-500 font-medium">Auction Ends</span>
                <CountdownTimer endsAt={listing.ends_at} status={listing.status} />
              </div>

              {/* Bid Breakdown */}
              <div className="space-y-2 text-xs pt-2 border-t border-slate-100">
                <div className="flex justify-between text-slate-600">
                  <span>Starting Price:</span>
                  <span className="font-semibold">{formatRupees(listing.starting_price_rupees)}</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Minimum Increment:</span>
                  <span className="font-semibold">+{formatRupees(listing.min_increment_rupees)}</span>
                </div>
                <div className="flex justify-between text-emerald-700 font-bold pt-1 border-t border-slate-100">
                  <span>Minimum Next Valid Bid:</span>
                  <span>{formatRupees(minNextBid)}</span>
                </div>
              </div>

              {/* Action Button */}
              {isSeller ? (
                <div className="p-3 bg-slate-100 text-slate-600 text-xs rounded-xl text-center font-medium">
                  You are the seller of this item. Sellers cannot bid on their own items.
                </div>
              ) : (
                <button
                  onClick={() => {
                    if (!currentUser) onOpenAuth('login');
                    else setShowBidModal(true);
                  }}
                  className="w-full py-3 text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-lg shadow-emerald-600/25 transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Gavel className="w-4 h-4" />
                  Place Bid (Min {formatRupees(minNextBid)})
                </button>
              )}

              <p className="text-[11px] text-slate-400 text-center leading-normal">
                The seller may accept any bid early, before the timer ends.
              </p>

              {hasBuyNow && !isSeller && (
                <div className="space-y-3 pt-4 border-t border-slate-100">
                  <div className="flex items-baseline justify-between">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Buy Now Price</span>
                    <span className="text-xl font-black text-slate-900">
                      {formatRupees(listing.buy_now_price_rupees ?? listing.buy_now_price_paise / 100)}
                    </span>
                  </div>
                  <button
                    onClick={handleBuyNow}
                    disabled={processingSelection}
                    className="w-full py-3 text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-lg transition-all cursor-pointer disabled:opacity-50"
                  >
                    Buy Now Instantly
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Other visitors: explain why bidding is paused */}
          {hasPendingSelection && !myPendingSelection && !isSeller && (
            <div className="bg-amber-50 border border-amber-200 rounded-3xl p-5 text-xs text-amber-900">
              The seller has selected a bidder and is waiting for their response. Bids and Buy Now are paused until they answer.
            </div>
          )}

            {/* Invitation Box for Selected Bidder */}
          {myPendingSelection && (
            <div className="bg-emerald-500/10 border-2 border-emerald-500 rounded-3xl p-6 shadow-md space-y-4 animate-in zoom-in-95 duration-200">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-emerald-500 text-white flex items-center justify-center font-bold">
                  <CheckCircle className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-slate-900 text-base">
                    You've Been Selected!
                  </h3>
                  <p className="text-xs text-emerald-900 font-medium">
                    The seller has selected your bid of {formatRupees(listing.active_selection.bid_amount_rupees)}.
                  </p>
                </div>
              </div>

              <p className="text-xs text-slate-700 leading-relaxed bg-white/70 p-3 rounded-xl border border-emerald-200">
                Accept to reserve this item and continue to checkout, or decline to let the seller choose someone else. This offer expires in 24 hours.
              </p>

              <div className="flex gap-2">
                <button
                  onClick={() => handleRespondToSelection('accept')}
                  disabled={processingSelection}
                  className="flex-1 py-2.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-sm transition-all cursor-pointer flex items-center justify-center gap-1.5 disabled:opacity-50"
                >
                  <Check className="w-4 h-4" />
                  Accept & Proceed to Checkout
                </button>
                <button
                  onClick={() => handleRespondToSelection('decline')}
                  disabled={processingSelection}
                  className="py-2.5 px-4 text-xs font-bold text-rose-700 bg-rose-100 hover:bg-rose-200 rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5 disabled:opacity-50"
                >
                  <XCircle className="w-4 h-4" />
                  Decline
                </button>
              </div>
            </div>
          )}

          {/* Seller Selection Management Panel when bidding ended */}
          {sellerCanSelect && (
            <div className="bg-slate-900 text-white rounded-3xl p-6 shadow-xl space-y-4">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-emerald-400" />
                <h3 className="font-bold text-base text-white">Seller Winner Selection</h3>
              </div>

              <p className="text-xs text-slate-300 leading-relaxed">
                {isAuctionEnded ? 'This auction has ended.' : 'This auction is still open, but you can accept any bid right now.'} You can select <strong>any bidder</strong> from the table on the left. The highest bidder is not automatically chosen.
              </p>

              {listing.active_selection && listing.active_selection.status === 'pending' ? (
                <div className="p-3 bg-slate-800 rounded-xl border border-amber-500/40 text-xs space-y-1">
                  <div className="flex items-center justify-between text-amber-300 font-bold">
                    <span>Offer Sent to:</span>
                    <span>{listing.active_selection.selected_bidder_name}</span>
                  </div>
                  <p className="text-slate-400 text-[11px]">
                    Waiting for student response. They can accept or decline within 24 hours.
                  </p>
                </div>
              ) : bids.length > 0 ? (
                <div className="p-3 bg-slate-800/80 rounded-xl text-xs text-emerald-300 border border-emerald-500/30">
                  Select a bidder in the table to send them an invitation.
                </div>
              ) : (
                <div className="p-3 bg-slate-800 rounded-xl text-xs text-slate-400">
                  No bids were received on this auction.
                </div>
              )}
            </div>
          )}

          {/* Reserved or Sold Handover Info Card */}
          {(listing.status === 'reserved' || listing.status === 'sold') && listing.transaction && (
            <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm space-y-4">
              <div className="flex items-center gap-2 text-slate-900 font-bold text-base">
                <Handshake className="w-5 h-5 text-emerald-600" />
                <span>Campus Handover Status</span>
              </div>

              <div className="text-xs space-y-2 bg-slate-50 p-4 rounded-2xl border border-slate-100">
                <div className="flex justify-between">
                  <span className="text-slate-500">Agreed Amount:</span>
                  <span className="font-bold text-slate-900">
                    {formatRupees(listing.transaction.final_amount_rupees)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Buyer:</span>
                  <span className="font-semibold text-slate-800">
                    {listing.transaction.buyer_name}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Meetup Venue:</span>
                  <span className="font-semibold text-slate-800">
                    {listing.transaction.handover_venue || 'Not yet scheduled'}
                  </span>
                </div>
              </div>

              <button
                onClick={() => onNavigate('transactions')}
                className="w-full py-2.5 text-xs font-bold text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors cursor-pointer"
              >
                Go to Handover Coordination →
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Place Bid Modal */}
      {showBidModal && (
        <PlaceBidModal
          listing={listing}
          onClose={() => setShowBidModal(false)}
          onBidSuccess={() => {
            setActionSuccess('Bid placed successfully!');
            fetchDetail();
          }}
          onOpenAuth={onOpenAuth}
        />
      )}

      {/* Agree & Sell Confirmation Dialog Modal */}
      {confirmModalBid && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 space-y-6 shadow-2xl border border-slate-200">
            <div className="flex items-start justify-between">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-md">
                  Confirm Winner Selection
                </span>
                <h3 className="text-xl font-black text-slate-900 mt-2">
                  Agree & Sell to Bidder
                </h3>
              </div>
              <button
                onClick={() => setConfirmModalBid(null)}
                className="p-1 text-slate-400 hover:text-slate-700 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-2 text-xs">
              <div>
                <span className="text-slate-400 block mb-0.5">Item:</span>
                <span className="font-bold text-slate-900">{listing.title}</span>
              </div>
              <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-200/60">
                <div>
                  <span className="text-slate-400 block mb-0.5">Selected Bidder:</span>
                  <span className="font-bold text-slate-900">{confirmModalBid.bidder_name}</span>
                </div>
                <div>
                  <span className="text-slate-400 block mb-0.5">Agreed Price:</span>
                  <span className="font-extrabold text-emerald-700 text-sm">
                    {formatRupees(confirmModalBid.amount_rupees)}
                  </span>
                </div>
              </div>
            </div>

            <div className="text-xs text-slate-600 bg-amber-50 border border-amber-200 p-3.5 rounded-xl space-y-1">
              <p className="font-bold text-amber-900">Notice:</p>
              <p className="text-amber-800 leading-relaxed">
                By confirming, you explicitly choose <strong>{confirmModalBid.bidder_name}</strong> to purchase this item for <strong>{formatRupees(confirmModalBid.amount_rupees)}</strong>.
                They will have 24 hours to respond. If declined or expired, you can choose another bidder.
              </p>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setConfirmModalBid(null)}
                className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={async () => {
                  const bidId = confirmModalBid.id;
                  setConfirmModalBid(null);
                  await handleSelectBidder(bidId);
                }}
                disabled={processingSelection}
                className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-md cursor-pointer disabled:opacity-50"
              >
                {processingSelection ? 'Recording...' : 'Confirm & Agree to Sell'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
