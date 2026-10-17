import React from 'react';
import { CATEGORIES } from '../utils/validators';
import AuctionCard from '../components/AuctionCard';
import {
  Gavel,
  ShieldCheck,
  MapPin,
  CheckCircle2,
  ArrowRight,
  TrendingUp,
  Sparkles,
  BookOpen,
  Calculator,
  Cpu,
  Bot,
  Radio,
  PenTool,
  Wrench,
  Layers,
} from 'lucide-react';

const ICON_MAP = {
  BookOpen,
  Calculator,
  Cpu,
  Bot,
  Radio,
  PenTool,
  Wrench,
  Layers,
};

export default function HomePage({ listings, onSelectListing, onNavigate, onQuickBid, onFilterCategory }) {
  const activeListings = listings.filter(l => l.status === 'active');
  const endedAwaitingListings = listings.filter(l => l.status === 'bidding_ended' && l.bid_count > 0);

  return (
    <div className="space-y-12 pb-16">
      {/* Hero Section */}
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-slate-800 to-emerald-950 text-white p-8 sm:p-12 shadow-xl border border-slate-800">
        <div className="relative z-10 max-w-3xl space-y-6">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/20 border border-emerald-400/30 text-emerald-300 text-xs font-semibold backdrop-blur-sm">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Campus Second-Hand Bidding Marketplace</span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight leading-tight">
            Buy, bid, and pass down{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-200">
              college essentials
            </span>{' '}
            within your campus.
          </h1>

          <p className="text-slate-300 text-sm sm:text-base leading-relaxed max-w-2xl">
            From graphing calculators and semester textbooks to Arduino starter kits and oscilloscope probes.
            Place competing bids or list your unused gear with safe, in-person campus handover.
          </p>

          <div className="flex flex-wrap items-center gap-3 pt-2">
            <button
              onClick={() => onNavigate('browse')}
              className="px-6 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-sm flex items-center gap-2 shadow-lg shadow-emerald-500/25 transition-all cursor-pointer"
            >
              <Gavel className="w-4 h-4" />
              Browse Active Auctions
              <ArrowRight className="w-4 h-4" />
            </button>

            <button
              onClick={() => onNavigate('sell')}
              className="px-6 py-3 rounded-xl bg-white/10 hover:bg-white/20 text-white font-semibold text-sm border border-white/20 backdrop-blur-sm transition-all cursor-pointer"
            >
              List an Item for Bidding
            </button>
          </div>

          {/* Quick Metrics */}
          <div className="grid grid-cols-3 gap-4 pt-6 border-t border-slate-700/60 max-w-lg">
            <div>
              <span className="block text-2xl font-black text-white">{activeListings.length}</span>
              <span className="text-xs text-slate-400">Live Auctions</span>
            </div>
            <div>
              <span className="block text-2xl font-black text-emerald-400">100%</span>
              <span className="text-xs text-slate-400">Student Verified</span>
            </div>
            <div>
              <span className="block text-2xl font-black text-teal-300">₹0</span>
              <span className="text-xs text-slate-400">No Platform Cuts</span>
            </div>
          </div>
        </div>

        {/* Decorative background glow */}
        <div className="absolute right-0 top-0 -mt-10 -mr-10 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
      </section>

      {/* College Categories Selector */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-slate-900 tracking-tight">Explore by Category</h2>
            <p className="text-xs text-slate-500">Find pre-owned course equipment, electronics & notes</p>
          </div>
          <button
            onClick={() => onNavigate('browse')}
            className="text-xs font-semibold text-emerald-600 hover:text-emerald-700 flex items-center gap-1 cursor-pointer"
          >
            View all categories <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
          {CATEGORIES.map((cat) => {
            const Icon = ICON_MAP[cat.icon] || Layers;
            return (
              <button
                key={cat.id}
                onClick={() => {
                  if (onFilterCategory) onFilterCategory(cat.id);
                  onNavigate('browse');
                }}
                className="p-3.5 rounded-2xl bg-white border border-slate-200 hover:border-emerald-300 hover:shadow-md hover:bg-emerald-50/40 transition-all text-center flex flex-col items-center gap-2 group cursor-pointer"
              >
                <div className="w-10 h-10 rounded-xl bg-slate-100 group-hover:bg-emerald-100 text-slate-600 group-hover:text-emerald-700 flex items-center justify-center transition-colors">
                  <Icon className="w-5 h-5" />
                </div>
                <span className="text-xs font-semibold text-slate-700 group-hover:text-slate-900 line-clamp-1">
                  {cat.label}
                </span>
              </button>
            );
          })}
        </div>
      </section>

      {/* Active Auctions Section */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping" />
            <div>
              <h2 className="text-xl font-bold text-slate-900 tracking-tight">Active Campus Auctions</h2>
              <p className="text-xs text-slate-500">Live competitive bidding with strict minimum increments</p>
            </div>
          </div>
          <button
            onClick={() => onNavigate('browse')}
            className="text-xs font-semibold text-emerald-600 hover:text-emerald-700 flex items-center gap-1 cursor-pointer"
          >
            Browse all ({activeListings.length}) <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {activeListings.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center text-slate-500 space-y-3">
            <Gavel className="w-10 h-10 mx-auto text-slate-300" />
            <p className="font-semibold text-slate-700">No active auctions at this moment.</p>
            <p className="text-xs">Be the first student to list an item on campus!</p>
            <button
              onClick={() => onNavigate('sell')}
              className="px-4 py-2 bg-emerald-600 text-white rounded-xl text-xs font-bold hover:bg-emerald-700"
            >
              Create First Listing
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {activeListings.slice(0, 6).map((listing) => (
              <AuctionCard
                key={listing.id}
                listing={listing}
                onSelect={onSelectListing}
                onQuickBid={onQuickBid}
              />
            ))}
          </div>
        )}
      </section>

      {/* Spotlight: Ended Auctions Awaiting Seller Decision */}
      {endedAwaitingListings.length > 0 && (
        <section className="bg-amber-50/70 border border-amber-200/80 rounded-3xl p-6 sm:p-8 space-y-4">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="space-y-1">
              <span className="text-xs font-bold uppercase tracking-wider text-amber-800 bg-amber-100 px-2 py-0.5 rounded-full">
                Core Reloop Mechanism Spotlight
              </span>
              <h2 className="text-xl font-bold text-slate-900">
                Bidding Ended: Seller Selection in Progress
              </h2>
              <p className="text-xs text-slate-600 max-w-xl">
                On Reloop, the highest bidder is <strong>not automatically selected</strong>.
                The seller reviews all eligible bids and explicitly chooses the student based on convenience, hostel proximity, or preference.
              </p>
            </div>
            <button
              onClick={() => onNavigate('seller-dashboard')}
              className="px-4 py-2 text-xs font-bold text-amber-900 bg-amber-200/80 hover:bg-amber-200 rounded-xl transition-colors cursor-pointer"
            >
              Go to Seller Dashboard
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 pt-2">
            {endedAwaitingListings.slice(0, 3).map((listing) => (
              <div
                key={listing.id}
                onClick={() => onSelectListing(listing.id)}
                className="bg-white p-4 rounded-2xl border border-amber-200 hover:shadow-md transition-all cursor-pointer flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
                    <span className="font-semibold text-slate-700">{listing.seller_name}</span>
                    <span className="text-amber-700 font-bold bg-amber-50 px-2 py-0.5 rounded">
                      {listing.bid_count} bids placed
                    </span>
                  </div>
                  <h4 className="font-bold text-slate-900 text-sm line-clamp-1">{listing.title}</h4>
                  <p className="text-xs text-slate-500 mt-1 line-clamp-2">{listing.description}</p>
                </div>

                <div className="pt-3 mt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                  <div>
                    <span className="text-[10px] text-slate-400 block">Top Bid</span>
                    <span className="font-extrabold text-slate-900">
                      ₹{(listing.current_highest_bid_paise / 100).toFixed(2)}
                    </span>
                  </div>
                  <span className="text-xs font-semibold text-emerald-700 hover:underline">
                    Review Bids & Choose →
                  </span>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* How Reloop Works (Architecture Principles) */}
      <section className="bg-white rounded-3xl border border-slate-200 p-8 sm:p-12 space-y-8">
        <div className="text-center max-w-2xl mx-auto space-y-2">
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight">How Bidding Works on Reloop</h2>
          <p className="text-xs sm:text-sm text-slate-500">
            A transparent, student-controlled second-hand marketplace designed for campus trust.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="p-5 rounded-2xl bg-slate-50 border border-slate-100 space-y-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-sm">
              1
            </div>
            <h3 className="font-bold text-slate-900 text-sm">List with Parameters</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Seller sets starting price, minimum bid increment, and auction duration (1 hour to 7 days).
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-slate-50 border border-slate-100 space-y-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-sm">
              2
            </div>
            <h3 className="font-bold text-slate-900 text-sm">Real Competing Bids</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Students bid with strict backend enforcement. No self-bidding, no bids below the required minimum.
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-slate-50 border border-slate-100 space-y-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-sm">
              3
            </div>
            <h3 className="font-bold text-slate-900 text-sm">Seller Winner Selection</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              When bidding ends, seller reviews all bids and explicitly selects a buyer. The selected student can accept or decline!
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-slate-50 border border-slate-100 space-y-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-sm">
              4
            </div>
            <h3 className="font-bold text-slate-900 text-sm">Mutual Handover Confirmation</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Parties arrange a campus meetup spot (library, canteen). Both verify the item in person and confirm completion.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
