import React, { useState, useMemo } from 'react';
import { CATEGORIES, CONDITIONS } from '../utils/validators';
import AuctionCard from '../components/AuctionCard';
import { Search, Filter, RefreshCw } from 'lucide-react';

export default function BrowseAuctionsPage({
  listings,
  onSelectListing,
  onQuickBid,
  onBuyNow,
  initialCategory,
  initialSearchQuery = '',
}) {
  const [search, setSearch] = useState(initialSearchQuery);
  const [selectedCategory, setSelectedCategory] = useState(initialCategory || 'all');
  const [selectedCondition, setSelectedCondition] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('active');
  const [sortBy, setSortBy] = useState('newest');

  const filteredListings = useMemo(() => {
    let result = [...listings];
    const now = new Date();

    if (selectedStatus === 'active') {
      result = result.filter(l => l.status === 'active' && new Date(l.ends_at) > now);
    } else if (selectedStatus === 'bidding_ended') {
      result = result.filter(l => l.status === 'bidding_ended' || new Date(l.ends_at) <= now);
    } else if (selectedStatus !== 'all') {
      result = result.filter(l => l.status === selectedStatus);
    }

    if (selectedCategory !== 'all') {
      result = result.filter(l => l.category === selectedCategory);
    }

    if (selectedCondition !== 'all') {
      result = result.filter(l => l.condition === selectedCondition);
    }

    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        l => l.title.toLowerCase().includes(q) || l.description.toLowerCase().includes(q)
      );
    }

    if (sortBy === 'newest') {
      result.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    } else if (sortBy === 'ending_soon') {
      result.sort((a, b) => new Date(a.ends_at) - new Date(b.ends_at));
    } else if (sortBy === 'price_asc') {
      result.sort((a, b) => a.starting_price_rupees - b.starting_price_rupees);
    } else if (sortBy === 'price_desc') {
      result.sort((a, b) => b.starting_price_rupees - a.starting_price_rupees);
    }

    return result;
  }, [listings, search, selectedCategory, selectedCondition, selectedStatus, sortBy]);

  // Derived lists for the Amazon-style carousels
  const popularListings = useMemo(() => {
    return [...listings].filter(l => l.status === 'active').sort((a, b) => b.bid_count - a.bid_count).slice(0, 6);
  }, [listings]);

  const promotionListings = useMemo(() => {
    return [...listings].filter(l => l.status === 'active').sort((a, b) => a.starting_price_rupees - b.starting_price_rupees).slice(0, 6);
  }, [listings]);

  const clearFilters = () => {
    setSearch('');
    setSelectedCategory('all');
    setSelectedCondition('all');
    setSelectedStatus('active');
    setSortBy('newest');
  };

  return (
    <div className="space-y-6 pb-16 bg-slate-50/50">
      
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-2">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            Discover
          </h1>
        </div>
        <div className="text-xs font-semibold text-slate-500">
          Showing <span className="text-slate-900 font-bold">{filteredListings.length}</span> results
        </div>
      </div>

      {/* Amazon-style Search Bar */}
      <div className="relative">
        <Search className="w-5 h-5 absolute left-4 top-3 text-slate-400" />
        <input
          type="text"
          placeholder="Search College Auctions..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-12 pr-4 py-3 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 shadow-sm"
        />
      </div>

      {/* Horizontal Carousels (Only show if no search/filters are active) */}
      {!search && selectedCategory === 'all' && (
        <div className="space-y-6">
          {/* Popular Section */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-lg font-bold text-slate-900">Popular</h2>
              <span className="text-xs text-emerald-700 font-semibold cursor-pointer hover:underline">See all</span>
            </div>
            <div className="flex overflow-x-auto gap-4 pb-4 snap-x hide-scrollbar">
              {popularListings.map(listing => (
                <div key={listing.id} className="min-w-[160px] w-[160px] snap-start">
                  <AuctionCard listing={listing} onSelect={onSelectListing} onQuickBid={onQuickBid} onBuyNow={onBuyNow} />
                </div>
              ))}
            </div>
          </div>

          {/* Promotions Section */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-lg font-bold text-slate-900">Promotions</h2>
              <span className="text-xs text-emerald-700 font-semibold cursor-pointer hover:underline">See all</span>
            </div>
            <div className="flex overflow-x-auto gap-4 pb-4 snap-x hide-scrollbar">
              {promotionListings.map(listing => (
                <div key={listing.id} className="min-w-[160px] w-[160px] snap-start">
                  <AuctionCard listing={listing} onSelect={onSelectListing} onQuickBid={onQuickBid} onBuyNow={onBuyNow} />
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Filters Bar (Sleeker) */}
      <div className="bg-white rounded-lg border border-slate-200 p-3 shadow-sm">
        <div className="flex flex-wrap items-center gap-3 text-xs">
          
          <div className="flex items-center gap-1.5 border-r border-slate-200 pr-3">
            <Filter className="w-3.5 h-3.5 text-slate-500" />
            <span className="text-slate-700 font-semibold">Filters</span>
          </div>

          {/* Status */}
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="px-2 py-1.5 bg-slate-50 border border-slate-200 rounded text-slate-700 focus:outline-none focus:ring-1 focus:ring-emerald-500 cursor-pointer font-medium"
          >
            <option value="active">Active Auctions</option>
            <option value="bidding_ended">Ended</option>
            <option value="all">All Status</option>
          </select>

          {/* Category */}
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-2 py-1.5 bg-slate-50 border border-slate-200 rounded text-slate-700 focus:outline-none focus:ring-1 focus:ring-emerald-500 cursor-pointer font-medium"
          >
            <option value="all">All Categories</option>
            {CATEGORIES.map(c => (
              <option key={c.id} value={c.id}>{c.label}</option>
            ))}
          </select>

          {/* Condition */}
          <select
            value={selectedCondition}
            onChange={(e) => setSelectedCondition(e.target.value)}
            className="px-2 py-1.5 bg-slate-50 border border-slate-200 rounded text-slate-700 focus:outline-none focus:ring-1 focus:ring-emerald-500 cursor-pointer font-medium"
          >
            <option value="all">All Conditions</option>
            {CONDITIONS.map(c => (
              <option key={c.id} value={c.id}>{c.label}</option>
            ))}
          </select>

          {/* Sort */}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="px-2 py-1.5 bg-slate-50 border border-slate-200 rounded text-slate-700 focus:outline-none focus:ring-1 focus:ring-emerald-500 cursor-pointer font-medium ml-auto"
          >
            <option value="newest">Newest First</option>
            <option value="ending_soon">Ending Soonest</option>
            <option value="price_asc">Price: Low to High</option>
            <option value="price_desc">Price: High to Low</option>
          </select>

          {(search || selectedCategory !== 'all' || selectedCondition !== 'all' || selectedStatus !== 'active') && (
            <button
              onClick={clearFilters}
              className="text-emerald-700 hover:text-emerald-800 font-bold flex items-center gap-1 cursor-pointer"
            >
              <RefreshCw className="w-3 h-3" /> Reset
            </button>
          )}
        </div>
      </div>

      {/* Main Grid */}
      {filteredListings.length === 0 ? (
        <div className="bg-white rounded-lg border border-slate-200 p-12 text-center text-slate-500 space-y-3">
          <Filter className="w-10 h-10 mx-auto text-slate-300" />
          <h3 className="font-bold text-slate-800">No auctions found</h3>
          <p className="text-xs">Try adjusting your filters or search terms.</p>
          <button
            onClick={clearFilters}
            className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded text-xs font-semibold cursor-pointer"
          >
            Clear Filters
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {filteredListings.map((listing) => (
            <AuctionCard
              key={listing.id}
              listing={listing}
              onSelect={onSelectListing}
              onQuickBid={onQuickBid} onBuyNow={onBuyNow}
            />
          ))}
        </div>
      )}

      {/* Inline CSS to hide scrollbar for horizontal lists */}
      <style dangerouslySetInnerHTML={{__html: `
        .hide-scrollbar::-webkit-scrollbar { display: none; }
        .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}} />
    </div>
  );
}