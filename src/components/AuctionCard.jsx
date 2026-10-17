import React from 'react';
import { formatRupees } from '../utils/currency';
import { getCategoryLabel, getConditionLabel } from '../utils/validators';
import StatusBadge from './StatusBadge';
import CountdownTimer from './CountdownTimer';
import { Gavel, MapPin, Tag } from 'lucide-react';

export default function AuctionCard({ listing, onSelect, onQuickBid }) {
  const hasBids = listing.current_highest_bid_rupees !== null && listing.current_highest_bid_rupees !== undefined;
  const priceDisplay = hasBids
    ? formatRupees(listing.current_highest_bid_rupees)
    : formatRupees(listing.starting_price_rupees);

  return (
    <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm hover:shadow-md transition-all duration-200 flex flex-col group">
      {/* Image container with Fallback Placeholder */}
      <div className="relative aspect-video bg-slate-100 overflow-hidden">
        {listing.image_url ? (
          <img
            src={listing.image_url}
            alt={listing.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            onError={(e) => {
              // Fallback to local colored placeholder
              e.target.style.display = 'none';
              e.target.nextSibling.style.display = 'flex';
            }}
          />
        ) : null}

        <div
          className={`w-full h-full ${listing.image_url ? 'hidden' : 'flex'} flex-col items-center justify-center bg-gradient-to-br from-slate-100 to-slate-200 text-slate-400 p-4`}
        >
          <Tag className="w-10 h-10 mb-1 text-slate-300" />
          <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">
            {getCategoryLabel(listing.category)}
          </span>
        </div>

        {/* Top Badges */}
        <div className="absolute top-2.5 left-2.5 right-2.5 flex items-center justify-between pointer-events-none">
          <StatusBadge status={listing.status} />
          <span className="px-2 py-0.5 text-[11px] font-semibold rounded-md bg-black/60 text-white backdrop-blur-sm">
            {getConditionLabel(listing.condition)}
          </span>
        </div>
      </div>

      {/* Card Content */}
      <div className="p-4 flex-1 flex flex-col justify-between">
        <div>
          {/* Category & Campus Location */}
          <div className="flex items-center justify-between text-xs text-slate-500 mb-1.5">
            <span className="font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
              {getCategoryLabel(listing.category)}
            </span>
            {listing.seller_location && (
              <span className="flex items-center gap-1 text-slate-400 truncate max-w-[130px]">
                <MapPin className="w-3 h-3 shrink-0" />
                {listing.seller_location}
              </span>
            )}
          </div>

          {/* Title */}
          <h3 className="font-bold text-slate-900 text-base line-clamp-1 group-hover:text-emerald-700 transition-colors">
            {listing.title}
          </h3>

          {/* Description */}
          <p className="text-xs text-slate-600 line-clamp-2 mt-1 mb-3">
            {listing.description}
          </p>
        </div>

        <div>
          {/* Price & Bids Section */}
          <div className="pt-3 border-t border-slate-100 flex items-end justify-between mb-3">
            <div>
              <span className="block text-[11px] uppercase tracking-wider font-semibold text-slate-400">
                {hasBids ? 'Current Highest Bid' : 'Starting Price'}
              </span>
              <span className="text-lg font-extrabold text-slate-900 tracking-tight">
                {priceDisplay}
              </span>
            </div>

            <div className="text-right">
              <span className="inline-flex items-center gap-1 text-xs font-semibold text-slate-600 bg-slate-100 px-2 py-0.5 rounded">
                <Gavel className="w-3 h-3 text-slate-400" />
                {listing.bid_count} {listing.bid_count === 1 ? 'bid' : 'bids'}
              </span>
            </div>
          </div>

          {/* Countdown & Actions */}
          <div className="flex items-center justify-between pt-2 border-t border-slate-50">
            <CountdownTimer endsAt={listing.ends_at} status={listing.status} />

            <div className="flex items-center gap-2">
              {listing.status === 'active' && onQuickBid && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onQuickBid(listing);
                  }}
                  className="px-3 py-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded-lg transition-colors cursor-pointer"
                >
                  Place Bid
                </button>
              )}
              <button
                onClick={() => onSelect(listing.id)}
                className="px-3.5 py-1.5 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
              >
                View Details
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
