import React, { useState, useMemo } from 'react';
import { CATEGORIES, CONDITIONS } from '../utils/validators';
import AuctionCard from '../components/AuctionCard';
import { Search, Filter, SlidersHorizontal, RefreshCw } from 'lucide-react';

export default function BrowseAuctionsPage({
  listings,
  onSelectListing,
  onQuickBid,
  initialCategory,
  initialSearchQuery = '',
}) {
  const [search, setSearch] = useState(initialSearchQuery);
  const [selectedCategory, setSelectedCategory] = useState(initialCategory || 'all');
  const [selectedCondition, setSelectedCondition] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('active'); // 'active', 'bidding_ended', 'all'
  const [sortBy, setSortBy] = useState('newest'); // 'newest', 'ending_soon', 'price_asc', 'price_desc'

  const filteredListings = useMemo(() => {
    let result = [...listings];
    const now = new Date();

    // Status filter
    if (selectedStatus === 'active') {
      result = result.filter(l => l.status === 'active' && new Date(l.ends_at) > now);
    } else if (selectedStatus === 'bidding_ended') {
      result = result.filter(l => l.status === 'bidding_ended' || new Date(l.ends_at) <= now);
    } else if (selectedStatus !== 'all') {
      result = result.filter(l => l.status === selectedStatus);
    }

    // Category filter
    if (selectedCategory !== 'all') {
      result = result.filter(l => l.category === selectedCategory);
    }

    // Condition filter
    if (selectedCondition !== 'all') {
      result = result.filter(l => l.condition === selectedCondition);
    }

    // Search query
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        l => l.title.toLowerCase().includes(q) || l.description.toLowerCase().includes(q)
      );
    }

    // Sort
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

  const clearFilters = () => {
    setSearch('');
    setSelectedCategory('all');
    setSelectedCondition('all');
    setSelectedStatus('active');
    setSortBy('newest');
  };

  return (
    <div className="space-y-6 pb-16">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Browse College Auctions
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Discover peer-to-peer pre-owned gear listed by verified campus students
          </p>
        </div>

        <div className="text-xs font-semibold text-slate-500">
          Showing <span className="text-slate-900 font-bold">{filteredListings.length}</span> auctions
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row gap-3">
          {/* Keyword Search */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
            <input
              type="text"
              placeholder="Search by keywords (e.g. TI-84, Arduino, CLRS, Multimeter)..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white"
            />
          </div>

          {/* Sort Dropdown */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500 whitespace-nowrap">Sort by:</span>
            <select
              aria-label="Sort auctions by"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="px-3 py-2 text-xs font-semibold bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer"
            >
              <option value="newest">Newest First</option>
              <option value="ending_soon">Ending Soonest</option>
              <option value="price_asc">Price: Low to High</option>
              <option value="price_desc">Price: High to Low</option>
            </select>
          </div>
        </div>

        {/* Filter Pills */}
        <div className="flex flex-wrap items-center gap-3 pt-2 border-t border-slate-100 text-xs">
          {/* Status selector */}
          <div className="flex items-center gap-1.5">
            <span className="text-slate-400 font-medium">Status:</span>
            <div className="inline-flex rounded-lg bg-slate-100 p-0.5">
              {[
                { id: 'active', label: 'Active' },
                { id: 'bidding_ended', label: 'Bidding Ended' },
                { id: 'all', label: 'All' },
              ].map((st) => (
                <button
                  key={st.id}
                  onClick={() => setSelectedStatus(st.id)}
                  className={`px-2.5 py-1 rounded-md font-semibold transition-all cursor-pointer ${
                    selectedStatus === st.id
                      ? 'bg-white text-slate-900 shadow-xs'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  {st.label}
                </button>
              ))}
            </div>
          </div>

          {/* Category Dropdown */}
          <div className="flex items-center gap-1.5">
            <span className="text-slate-400 font-medium">Category:</span>
            <select
              aria-label="Filter by category"
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-2.5 py-1 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:ring-1 focus:ring-emerald-500 cursor-pointer"
            >
              <option value="all">All Categories</option>
              {CATEGORIES.map(c => (
                <option key={c.id} value={c.id}>{c.label}</option>
              ))}
            </select>
          </div>

          {/* Condition Dropdown */}
          <div className="flex items-center gap-1.5">
            <span className="text-slate-400 font-medium">Condition:</span>
            <select
              aria-label="Filter by condition"
              value={selectedCondition}
              onChange={(e) => setSelectedCondition(e.target.value)}
              className="px-2.5 py-1 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:ring-1 focus:ring-emerald-500 cursor-pointer"
            >
              <option value="all">All Conditions</option>
              {CONDITIONS.map(c => (
                <option key={c.id} value={c.id}>{c.label}</option>
              ))}
            </select>
          </div>

          {(search || selectedCategory !== 'all' || selectedCondition !== 'all' || selectedStatus !== 'active') && (
            <button
              onClick={clearFilters}
              className="text-emerald-700 hover:text-emerald-800 font-bold ml-auto flex items-center gap-1 cursor-pointer"
            >
              <RefreshCw className="w-3 h-3" />
              Reset Filters
            </button>
          )}
        </div>
      </div>

      {/* Grid of Auctions */}
      {filteredListings.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center text-slate-500 space-y-3">
          <Filter className="w-10 h-10 mx-auto text-slate-300" />
          <h3 className="font-bold text-slate-800">No auctions match your selected criteria</h3>
          <p className="text-xs text-slate-500">
            Try adjusting your search terms or clearing your category/condition filters.
          </p>
          <button
            onClick={clearFilters}
            className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold cursor-pointer"
          >
            Clear All Filters
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredListings.map((listing) => (
            <AuctionCard
              key={listing.id}
              listing={listing}
              onSelect={onSelectListing}
              onQuickBid={onQuickBid}
            />
          ))}
        </div>
      )}
    </div>
  );
}
