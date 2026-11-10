import React from 'react';
import { ArrowRight, Sparkles, ShieldCheck, Handshake, Scale } from 'lucide-react';
import AuctionCard from '../components/AuctionCard';
import ThoughtBand from '../components/ThoughtBand';
import { HeroCollage, HeroStrip } from '../components/HeroArt';
import { isAuctionLive } from '../utils/time';
import { useNow } from '../hooks/useNow';

const VALUE_POINTS = [
  {
    icon: Scale,
    title: 'Fair prices, set by the crowd',
    text: 'Starting prices and minimum increments keep every auction open, transparent and balanced.',
  },
  {
    icon: ShieldCheck,
    title: 'The seller always decides',
    text: 'When the timer ends, the seller reviews every offer and chooses the winner. Nothing is awarded automatically.',
  },
  {
    icon: Handshake,
    title: 'Handovers you can trust',
    text: 'Meet on campus, inspect the item in person and confirm together. No shipping, no surprises.',
  },
];

function ListingSection({ title, listings, onNavigate, onSelectListing, onQuickBid, onBuyNow }) {
  if (listings.length === 0) return null;
  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold text-slate-900">{title}</h2>
        <button
          onClick={() => onNavigate('browse')}
          className="text-xs font-bold text-emerald-700 hover:text-emerald-800 flex items-center gap-1 cursor-pointer"
        >
          See all <ArrowRight className="w-3 h-3" />
        </button>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
        {listings.map((listing) => (
          <AuctionCard
            key={listing.id}
            listing={listing}
            onSelect={onSelectListing}
            onQuickBid={onQuickBid}
            onBuyNow={onBuyNow}
          />
        ))}
      </div>
    </div>
  );
}

export default function HomePage({
  listings,
  onSelectListing,
  onNavigate,
  onQuickBid,
  onBuyNow,
  onFilterCategory,
}) {
  // Ticks every second so the live count drops the moment an auction's timer runs out
  const now = useNow(1000);

  // Auctions that are open right now: status is active AND the deadline is still ahead
  const liveListings = listings.filter((l) => isAuctionLive(l, now));
  const liveAuctionsCount = liveListings.length;

  const popularListings = [...liveListings].sort((a, b) => b.bid_count - a.bid_count).slice(0, 3);
  const promotionListings = [...liveListings]
    .sort((a, b) => a.starting_price_rupees - b.starting_price_rupees)
    .slice(0, 3);
  const recentListings = [...liveListings]
    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
    .slice(0, 3);

  const cardProps = { onNavigate, onSelectListing, onQuickBid, onBuyNow };

  return (
    <div className="space-y-10 pb-16">

      {/* 1. HERO */}
      <div className="hero-surface rounded-3xl p-8 sm:p-12 relative overflow-hidden text-white shadow-xl">
        <div className="relative z-10 grid lg:grid-cols-2 gap-10 lg:gap-6 items-center">

          {/* Left: short, confident message */}
          <div className="space-y-6 max-w-xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/25 text-emerald-300 text-xs font-bold tracking-wide uppercase">
              <Sparkles className="w-3.5 h-3.5" /> Campus Auction House
            </div>

            <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight leading-[1.08]">
              Great finds.
              <br />
              <span className="text-emerald-400">Fair prices.</span>
              <br />
              Right on campus.
            </h1>

            <p className="text-slate-300 text-base max-w-md">
              Textbooks, electronics and lab kits from students you can actually meet, with safe in-person handovers.
            </p>

            <div className="flex flex-wrap items-center gap-3 pt-1">
              <button
                onClick={() => onNavigate('browse')}
                className="px-6 py-3 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-xl transition-colors flex items-center gap-2 cursor-pointer"
              >
                Browse Auctions <ArrowRight className="w-4 h-4" />
              </button>
              <button
                onClick={() => onNavigate('sell')}
                className="px-6 py-3 bg-white/10 hover:bg-white/20 text-white font-bold rounded-xl transition-colors border border-white/15 cursor-pointer"
              >
                List an Item
              </button>
            </div>

            <div className="flex items-center gap-8 pt-6 border-t border-white/10">
              <div>
                <div className="flex items-center gap-2 text-2xl font-bold tabular-nums">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  {liveAuctionsCount}
                </div>
                <div className="text-xs text-slate-400 uppercase tracking-wider font-semibold">Live Auctions</div>
              </div>
              <div>
                <div className="text-2xl font-bold">100%</div>
                <div className="text-xs text-slate-400 uppercase tracking-wider font-semibold">Student Verified</div>
              </div>
              <div>
                <div className="text-2xl font-bold">₹0</div>
                <div className="text-xs text-slate-400 uppercase tracking-wider font-semibold">Platform Fees</div>
              </div>
            </div>
          </div>

          {/* Right: illustrated collage (desktop) */}
          <div className="hidden lg:block">
            <HeroCollage liveCount={liveAuctionsCount} />
          </div>
        </div>

        {/* Tablet / phone: compact strip under the text */}
        <div className="relative z-10 mt-8 lg:hidden">
          <HeroStrip />
        </div>
      </div>

      {/* 2. A THOUGHT ON AUCTIONS */}
      <ThoughtBand />

      {/* 3. LIVE LISTINGS */}
      <div className="space-y-10">
        {liveAuctionsCount === 0 && (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center">
            <h2 className="text-lg font-bold text-slate-900">No auctions are live right now</h2>
            <p className="text-sm text-slate-500 mt-1">Be the first to put something up. It takes about a minute.</p>
            <button
              onClick={() => onNavigate('sell')}
              className="mt-4 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold rounded-xl cursor-pointer"
            >
              List an Item
            </button>
          </div>
        )}
        <ListingSection title="Popular on Campus" listings={popularListings} {...cardProps} />
        <ListingSection title="Best Value Deals" listings={promotionListings} {...cardProps} />
        <ListingSection title="Recently Added" listings={recentListings} {...cardProps} />
      </div>

      {/* 4. WHY AUCTIONS */}
      <div>
        <div className="text-center max-w-xl mx-auto mb-6">
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-emerald-700">The Reloop way</p>
          <h2 className="text-2xl font-bold text-slate-900 mt-1">Auctions done properly</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {VALUE_POINTS.map(({ icon: Icon, title, text }) => (
            <div key={title} className="rounded-2xl border border-slate-200 bg-white p-6">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center mb-4">
                <Icon className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-slate-900">{title}</h3>
              <p className="text-sm text-slate-500 mt-1.5 leading-relaxed">{text}</p>
            </div>
          ))}
        </div>
      </div>

      {/* 5. SELLER BANNER */}
      <div className="bg-amber-50 rounded-2xl border border-amber-200 p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <div className="text-[10px] font-bold text-amber-800 tracking-wider uppercase mb-1">For sellers</div>
          <h3 className="text-lg font-bold text-amber-900">Auction closed? You choose the winner.</h3>
          <p className="text-xs text-amber-700 mt-1">
            Once the timer ends, review every offer and personally select the buyer. Nothing is awarded without your approval.
          </p>
        </div>
        <button
          onClick={() => onNavigate('seller-dashboard')}
          className="px-5 py-2.5 bg-amber-400 hover:bg-amber-500 text-amber-950 font-bold rounded-xl text-sm transition-colors whitespace-nowrap cursor-pointer"
        >
          Go to Seller Dashboard
        </button>
      </div>
    </div>
  );
}
