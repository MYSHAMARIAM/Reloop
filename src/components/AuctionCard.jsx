import React from 'react';
import { formatRupees } from '../utils/currency';
import { isAuctionLive } from '../utils/time';
import { getCategoryLabel, getConditionLabel } from '../utils/validators';
import { useAuth } from '../context/AuthContext';
import StatusBadge from './StatusBadge';
import CountdownTimer from './CountdownTimer';
import { Tag, Zap } from 'lucide-react';

export default function AuctionCard({ listing, onSelect, onQuickBid, onBuyNow }) {
  const { currentUser } = useAuth();

  const hasBids = listing.current_highest_bid_rupees !== null && listing.current_highest_bid_rupees !== undefined;
  const priceDisplay = hasBids
    ? formatRupees(listing.current_highest_bid_rupees)
    : formatRupees(listing.starting_price_rupees);

  const buyNowRupees =
    listing.buy_now_price_rupees ??
    (listing.buy_now_price_paise ? listing.buy_now_price_paise / 100 : null);
  const hasBuyNow = !!(listing.has_buy_now || listing.buy_now_price_paise) && !!buyNowRupees;

  const isLive = isAuctionLive(listing);
  const isOwnListing = !!currentUser && currentUser.id === listing.seller_id;
  const canBuyNow = isLive && hasBuyNow && !isOwnListing && !!onBuyNow;

  return (
    <div className="bg-white rounded-lg border border-slate-200 overflow-hidden hover:shadow-md transition-shadow duration-200 flex flex-col group h-full">

      {/* Image Container */}
      <div
        className="relative aspect-square bg-slate-50 overflow-hidden cursor-pointer"
        onClick={() => onSelect(listing.id)}
      >
        {listing.image_url ? (
          <img
            src={listing.image_url}
            alt={listing.title}
            className="w-full h-full object-contain p-2 group-hover:scale-105 transition-transform duration-300"
            onError={(e) => {
              e.target.style.display = 'none';
              e.target.nextSibling.style.display = 'flex';
            }}
          />
        ) : null}

        {/* Placeholder if no image */}
        <div
          className={`w-full h-full ${listing.image_url ? 'hidden' : 'flex'} flex-col items-center justify-center bg-slate-50 text-slate-400`}
        >
          <Tag className="w-8 h-8 mb-1 text-slate-300" />
        </div>

        {/* Top Badges */}
        <div className="absolute top-2 left-2 right-2 flex items-start justify-between pointer-events-none">
          <StatusBadge status={listing.status} />
          <span className="px-1.5 py-0.5 text-[10px] font-bold rounded bg-slate-900/80 text-white uppercase tracking-wider backdrop-blur-sm">
            {getConditionLabel(listing.condition)}
          </span>
        </div>
      </div>

      {/* Content */}
      <div className="p-3 flex-1 flex flex-col justify-between">
        <div>
          {/* Category */}
          <span className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider">
            {getCategoryLabel(listing.category)}
          </span>

          {/* Title */}
          <h3 className="font-semibold text-slate-900 text-sm line-clamp-1 mt-1 leading-tight group-hover:text-emerald-700 transition-colors">
            {listing.title}
          </h3>
        </div>

        <div className="mt-2">
          {/* Live price */}
          <span className="block text-[10px] font-semibold uppercase tracking-wider text-slate-400">
            {hasBids ? 'Current bid' : 'Starting price'}
          </span>
          <div className="flex items-baseline gap-1.5">
            <span className="text-base font-extrabold text-slate-900">
              {priceDisplay}
            </span>
            <span className="text-xs text-slate-500 font-medium">
              ({listing.bid_count} {listing.bid_count === 1 ? 'bid' : 'bids'})
            </span>
          </div>

          {/* Buy Now price */}
          {hasBuyNow && (
            <div className="mt-1 inline-flex items-center gap-1 text-[11px] font-bold text-blue-700 bg-blue-50 border border-blue-200 rounded px-1.5 py-0.5">
              <Zap className="w-3 h-3" />
              Buy Now {formatRupees(buyNowRupees)}
            </div>
          )}

          {/* Timer */}
          <div className="mt-1 mb-3">
            <CountdownTimer endsAt={listing.ends_at} status={listing.status} />
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2 mt-3">
            <button
              onClick={() => onSelect(listing.id)}
              className="flex-1 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-md transition-colors cursor-pointer"
            >
              Details
            </button>
            {isLive && onQuickBid && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onQuickBid(listing);
                }}
                className="flex-1 py-1.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-md transition-colors cursor-pointer"
              >
                Place Bid
              </button>
            )}
          </div>

          {canBuyNow && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onBuyNow(listing);
              }}
              className="mt-2 w-full py-1.5 text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 rounded-md transition-colors cursor-pointer flex items-center justify-center gap-1.5"
            >
              <Zap className="w-3.5 h-3.5" />
              Buy Now
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
