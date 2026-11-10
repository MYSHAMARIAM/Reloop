import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useMockData } from '../context/MockDataContext';
import { api } from '../api';
import { formatRupees } from '../utils/currency';
import { formatClockParts, timeAgo } from '../utils/time';
import { useNow } from '../hooks/useNow';
import StatusBadge from '../components/StatusBadge';
import CountdownTimer from '../components/CountdownTimer';
import {
  Zap,
  Activity,
  LayoutDashboard,
  Clock,
  CheckCircle,
  AlertCircle,
  UserCheck,
  Package,
  Layers,
  ArrowRight,
} from 'lucide-react';

export default function SellerDashboardPage({ onNavigate, onSelectListing, onOpenAuth }) {
  const { currentUser, isMockMode } = useAuth();
  const { mockApi, listings: mockListings, bids: mockBids, selections: mockSelections, transactions: mockTransactions } = useMockData();
  const now = useNow(30000); // keeps "5 min ago" labels fresh

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [activeTab, setActiveTab] = useState('decision'); // 'decision', 'active', 'pending', 'reserved', 'completed', 'unsold'

  // silent = background refresh: no spinner, no tab switching, errors don't wipe the screen
  const fetchOverview = async ({ silent = false } = {}) => {
    if (!currentUser) {
      setLoading(false);
      return;
    }
    if (!silent) setLoading(true);
    try {
      let res;
      if (isMockMode) {
        res = await mockApi.getSellerOverview(currentUser);
      } else {
        res = await api.dashboard.getSellerOverview();
      }
      setData(res);
      setError(null);
      setLastUpdated(Date.now());
      if (!silent) {
        // Auto pick tab that has urgent items
        if (res.ended_awaiting_decision?.length > 0) setActiveTab('decision');
        else if (res.pending_bidder_responses?.length > 0) setActiveTab('pending');
        else if (res.active_auctions?.length > 0) setActiveTab('active');
      }
    } catch (err) {
      if (!silent) setError(err.message || 'Failed to load seller dashboard');
    } finally {
      if (!silent) setLoading(false);
    }
  };

  // First load / user switch
  useEffect(() => {
    fetchOverview();
  }, [currentUser, isMockMode]);

  // LIVE: real backend -> poll every 8s while the tab is visible, and refresh on return to the tab
  useEffect(() => {
    if (!currentUser || isMockMode) return;
    const refresh = () => {
      if (!document.hidden) fetchOverview({ silent: true });
    };
    const timer = setInterval(refresh, 8000);
    document.addEventListener('visibilitychange', refresh);
    window.addEventListener('focus', refresh);
    return () => {
      clearInterval(timer);
      document.removeEventListener('visibilitychange', refresh);
      window.removeEventListener('focus', refresh);
    };
  }, [currentUser, isMockMode]);

  // LIVE: demo mode -> re-read the moment any bid / listing / offer changes
  useEffect(() => {
    if (!currentUser || !isMockMode) return;
    fetchOverview({ silent: true });
  }, [mockListings, mockBids, mockSelections, mockTransactions]);

  // When an open auction's timer runs out, refresh so it moves out of "Live" on its own
  useEffect(() => {
    if (!currentUser || !data?.active_auctions?.length) return;
    const ends = data.active_auctions
      .map((l) => new Date(l.ends_at).getTime())
      .filter((t) => !isNaN(t));
    if (ends.length === 0) return;
    const wait = Math.min(...ends) - Date.now();
    if (wait > 60 * 60 * 1000) return;
    const t = setTimeout(() => fetchOverview({ silent: true }), Math.max(wait, 0) + 1500);
    return () => clearTimeout(t);
  }, [data]);

  if (!currentUser) {
    return (
      <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center max-w-md mx-auto space-y-4 shadow-sm my-12">
        <LayoutDashboard className="w-12 h-12 text-slate-300 mx-auto" />
        <h2 className="text-xl font-bold text-slate-900">Sign In to View Dashboard</h2>
        <p className="text-xs text-slate-500">Track and make decisions on your auctions across all stages.</p>
        <button
          onClick={() => onOpenAuth('login')}
          className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-md cursor-pointer"
        >
          Sign In
        </button>
      </div>
    );
  }

  const summary = data?.summary || {
    total_bids: 0,
    active_count: 0,
    awaiting_decision_count: 0,
    pending_response_count: 0,
    reserved_count: 0,
    completed_count: 0,
    unsold_count: 0,
  };

  return (
    <div className="space-y-6 pb-20">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Seller Control Dashboard
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Review ended auctions, select student winners, and coordinate item handovers
          </p>
        </div>
        <div className="flex items-center gap-2 text-[11px] text-slate-500">
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 font-bold">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            LIVE
          </span>
          <span className="tabular-nums">
            {lastUpdated ? `Updated ${formatClockParts(new Date(lastUpdated)).time}` : 'Connecting…'}
          </span>
          <button
            onClick={() => fetchOverview({ silent: true })}
            className="px-2.5 py-1 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 font-semibold text-slate-600 cursor-pointer"
          >
            Refresh
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl flex items-center gap-3 text-xs text-rose-800">
          <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <button
          onClick={() => setActiveTab('decision')}
          className={`p-4 rounded-2xl border text-left transition-all cursor-pointer ${
            activeTab === 'decision'
              ? 'bg-amber-50 border-amber-300 shadow-sm'
              : 'bg-white border-slate-200 hover:border-slate-300'
          }`}
        >
          <span className="text-[11px] font-bold uppercase tracking-wider text-amber-800 block">
            Awaiting Decision
          </span>
          <span className="text-2xl font-black text-amber-900 mt-1 block">
            {summary.awaiting_decision_count}
          </span>
          <span className="text-[10px] text-amber-700">Choose Winner</span>
        </button>

        <button
          onClick={() => setActiveTab('pending')}
          className={`p-4 rounded-2xl border text-left transition-all cursor-pointer ${
            activeTab === 'pending'
              ? 'bg-indigo-50 border-indigo-300 shadow-sm'
              : 'bg-white border-slate-200 hover:border-slate-300'
          }`}
        >
          <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-800 block">
            Pending Response
          </span>
          <span className="text-2xl font-black text-indigo-900 mt-1 block">
            {summary.pending_response_count}
          </span>
          <span className="text-[10px] text-indigo-700">Bidder Accepting</span>
        </button>

        <button
          onClick={() => setActiveTab('active')}
          className={`p-4 rounded-2xl border text-left transition-all cursor-pointer ${
            activeTab === 'active'
              ? 'bg-emerald-50 border-emerald-300 shadow-sm'
              : 'bg-white border-slate-200 hover:border-slate-300'
          }`}
        >
          <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-800 block">
            Live Auctions
          </span>
          <span className="text-2xl font-black text-emerald-900 mt-1 block">
            {summary.active_count}
          </span>
          <span className="text-[10px] text-emerald-700">Open Auctions</span>
        </button>

        <button
          onClick={() => setActiveTab('reserved')}
          className={`p-4 rounded-2xl border text-left transition-all cursor-pointer ${
            activeTab === 'reserved'
              ? 'bg-purple-50 border-purple-300 shadow-sm'
              : 'bg-white border-slate-200 hover:border-slate-300'
          }`}
        >
          <span className="text-[11px] font-bold uppercase tracking-wider text-purple-800 block">
            Reserved
          </span>
          <span className="text-2xl font-black text-purple-900 mt-1 block">
            {summary.reserved_count}
          </span>
          <span className="text-[10px] text-purple-700">Meetup Scheduled</span>
        </button>

        <button
          onClick={() => setActiveTab('completed')}
          className={`p-4 rounded-2xl border text-left transition-all cursor-pointer ${
            activeTab === 'completed'
              ? 'bg-blue-50 border-blue-300 shadow-sm'
              : 'bg-white border-slate-200 hover:border-slate-300'
          }`}
        >
          <span className="text-[11px] font-bold uppercase tracking-wider text-blue-800 block">
            Completed
          </span>
          <span className="text-2xl font-black text-blue-900 mt-1 block">
            {summary.completed_count}
          </span>
          <span className="text-[10px] text-blue-700">Handover Done</span>
        </button>

        <button
          onClick={() => setActiveTab('unsold')}
          className={`p-4 rounded-2xl border text-left transition-all cursor-pointer ${
            activeTab === 'unsold'
              ? 'bg-slate-100 border-slate-300 shadow-sm'
              : 'bg-white border-slate-200 hover:border-slate-300'
          }`}
        >
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-600 block">
            Unsold / No Bids
          </span>
          <span className="text-2xl font-black text-slate-800 mt-1 block">
            {summary.unsold_count}
          </span>
          <span className="text-[10px] text-slate-500">Ended with 0 bids</span>
        </button>
      </div>

      {/* Live bid activity across all of this seller's auctions */}
      <div className="bg-white rounded-3xl border border-slate-200 p-5 sm:p-6 shadow-sm">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <Activity className="w-4 h-4 text-emerald-600" />
            Live Bid Activity
          </h3>
          <span className="text-[11px] text-slate-500">
            <span className="font-bold text-slate-800">{summary.total_bids ?? 0}</span> total bids on your items
          </span>
        </div>
        {(!data?.recent_bids || data.recent_bids.length === 0) ? (
          <p className="text-xs text-slate-400 py-4 text-center bg-slate-50 rounded-2xl">
            New bids on your items will appear here the moment they are placed.
          </p>
        ) : (
          <ul className="divide-y divide-slate-100">
            {data.recent_bids.map((b) => (
              <li key={b.id} className="py-2.5 flex items-center justify-between gap-3 text-xs">
                <div className="min-w-0">
                  <span className="font-bold text-slate-900">{b.bidder_name}</span>
                  <span className="text-slate-500"> placed a bid on </span>
                  <button
                    onClick={() => onSelectListing(b.listing_id)}
                    className="font-semibold text-emerald-700 hover:underline cursor-pointer truncate max-w-[16rem] align-bottom"
                  >
                    {b.listing_title}
                  </button>
                </div>
                <div className="text-right shrink-0">
                  <div className="font-extrabold text-slate-900">{formatRupees(b.amount_rupees)}</div>
                  <div className="text-[10px] text-slate-400">{timeAgo(b.created_at, now)}</div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Main Tab Content */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-sm">
        {/* Tab 1: Ended Auctions Awaiting Decision */}
        {activeTab === 'decision' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-slate-900">
                  Ended Auctions Awaiting Your Winner Decision ({data?.ended_awaiting_decision?.length || 0})
                </h3>
                <p className="text-xs text-slate-500">
                  Select a student from the bid list. You are not forced to select the highest bidder.
                </p>
              </div>
            </div>

            {(!data?.ended_awaiting_decision || data.ended_awaiting_decision.length === 0) ? (
              <div className="py-12 text-center text-xs text-slate-400 bg-slate-50 rounded-2xl">
                No ended auctions currently awaiting a decision.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {data.ended_awaiting_decision.map((l) => (
                  <div
                    key={l.id}
                    className="p-5 rounded-2xl border border-amber-200 bg-amber-50/40 flex flex-col justify-between space-y-4"
                  >
                    <div>
                      <div className="flex items-center justify-between text-xs mb-1">
                        <span className="font-bold text-amber-800 bg-amber-100 px-2 py-0.5 rounded">
                          Decision Required
                        </span>
                        <span className="text-slate-600 font-semibold">{l.bid_count} bids placed</span>
                      </div>
                      <h4 className="font-bold text-slate-900 text-base">{l.title}</h4>
                      <p className="text-xs text-slate-600 mt-1 line-clamp-2">{l.description}</p>
                    </div>

                    <div className="pt-3 border-t border-amber-200/60 flex items-center justify-between">
                      <div>
                        <span className="text-[10px] text-slate-400 block">Top Bid</span>
                        <span className="font-extrabold text-slate-900 text-sm">
                          {formatRupees(l.current_highest_bid_rupees)}
                        </span>
                      </div>
                      <button
                        onClick={() => onSelectListing(l.id)}
                        className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer"
                      >
                        Choose Winning Bidder →
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Tab 2: Pending Bidder Responses */}
        {activeTab === 'pending' && (
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-bold text-slate-900">
                Offers Sent to Bidders ({data?.pending_bidder_responses?.length || 0})
              </h3>
              <p className="text-xs text-slate-500">
                You have selected a winner and are waiting for their acceptance. If they decline or expire, you can choose another bidder.
              </p>
            </div>

            {(!data?.pending_bidder_responses || data.pending_bidder_responses.length === 0) ? (
              <div className="py-12 text-center text-xs text-slate-400 bg-slate-50 rounded-2xl">
                No offers currently pending response.
              </div>
            ) : (
              <div className="space-y-3">
                {data.pending_bidder_responses.map((item) => (
                  <div
                    key={item.listing.id}
                    className="p-4 rounded-2xl border border-indigo-200 bg-indigo-50/40 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                  >
                    <div>
                      <h4 className="font-bold text-slate-900 text-sm">{item.listing.title}</h4>
                      <p className="text-xs text-slate-600">
                        Selected Student: <span className="font-bold">{item.selection.selected_bidder_name}</span> |
                        Amount: <span className="font-bold text-indigo-700">{formatRupees(item.selection.bid_amount_rupees)}</span>
                      </p>
                    </div>

                    <button
                      onClick={() => onSelectListing(item.listing.id)}
                      className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-xs cursor-pointer self-start sm:self-auto"
                    >
                      View Auction Status
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Tab 3: Active Auctions */}
        {activeTab === 'active' && (
          <div className="space-y-4">
            <h3 className="text-lg font-bold text-slate-900">
              Active College Auctions ({data?.active_auctions?.length || 0})
            </h3>
            {(!data?.active_auctions || data.active_auctions.length === 0) ? (
              <div className="py-12 text-center text-xs text-slate-400 bg-slate-50 rounded-2xl">
                No active auctions currently running.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {data.active_auctions.map((l) => {
                  const hasBids = l.current_highest_bid_rupees !== null && l.current_highest_bid_rupees !== undefined;
                  const buyNow = l.buy_now_price_rupees ?? (l.buy_now_price_paise ? l.buy_now_price_paise / 100 : null);
                  return (
                    <div
                      key={l.id}
                      className="p-5 rounded-2xl border border-slate-200 flex flex-col justify-between space-y-3"
                    >
                      <div>
                        <div className="flex items-center justify-between text-xs mb-1">
                          <StatusBadge status={l.status} />
                          <span className="font-semibold text-slate-600">
                            {l.bid_count} {l.bid_count === 1 ? 'bid' : 'bids'}
                          </span>
                        </div>
                        <h4 className="font-bold text-slate-900 text-base">{l.title}</h4>
                        <p className="text-xs text-slate-500 mt-1 line-clamp-1">{l.description}</p>
                      </div>

                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <span className="block text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                            {hasBids ? 'Current bid' : 'Starting price'}
                          </span>
                          <span className="font-extrabold text-slate-900 text-lg">
                            {formatRupees(hasBids ? l.current_highest_bid_rupees : l.starting_price_rupees)}
                          </span>
                        </div>
                        <CountdownTimer endsAt={l.ends_at} status={l.status} />
                      </div>

                      {buyNow ? (
                        <div className="inline-flex items-center gap-1 self-start text-[11px] font-bold text-blue-700 bg-blue-50 border border-blue-200 rounded px-1.5 py-0.5">
                          <Zap className="w-3 h-3" /> Buy Now {formatRupees(buyNow)}
                        </div>
                      ) : null}

                      <div className="pt-2 border-t border-slate-100 flex justify-end">
                        <button
                          onClick={() => onSelectListing(l.id)}
                          className="text-xs font-bold text-emerald-700 hover:underline cursor-pointer"
                        >
                          Inspect Bids →
                        </button>
                      </div>
                    </div>
                  );
                })}

              </div>
            )}
          </div>
        )}

        {/* Tab 4: Reserved Items */}
        {activeTab === 'reserved' && (
          <div className="space-y-4">
            <h3 className="text-lg font-bold text-slate-900">
              Reserved Items for Handover ({data?.reserved_items?.length || 0})
            </h3>
            {(!data?.reserved_items || data.reserved_items.length === 0) ? (
              <div className="py-12 text-center text-xs text-slate-400 bg-slate-50 rounded-2xl">
                No items currently reserved.
              </div>
            ) : (
              <div className="space-y-3">
                {data.reserved_items.map((l) => (
                  <div
                    key={l.id}
                    className="p-4 rounded-2xl border border-purple-200 bg-purple-50/40 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                  >
                    <div>
                      <h4 className="font-bold text-slate-900 text-sm">{l.title}</h4>
                      <p className="text-xs text-slate-500">
                        Reserved for buyer handover. Coordinate meetup time and location.
                      </p>
                    </div>
                    <button
                      onClick={() => onNavigate('transactions')}
                      className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs rounded-xl"
                    >
                      Coordinate Handover
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Tab 5: Completed Sales */}
        {activeTab === 'completed' && (
          <div className="space-y-4">
            <h3 className="text-lg font-bold text-slate-900">
              Completed Handover Sales ({data?.completed_sales?.length || 0})
            </h3>
            {(!data?.completed_sales || data.completed_sales.length === 0) ? (
              <div className="py-12 text-center text-xs text-slate-400 bg-slate-50 rounded-2xl">
                No completed transactions yet.
              </div>
            ) : (
              <div className="space-y-3">
                {data.completed_sales.map((l) => (
                  <div
                    key={l.id}
                    className="p-4 rounded-2xl border border-blue-200 bg-blue-50/40 flex items-center justify-between"
                  >
                    <div>
                      <h4 className="font-bold text-slate-900 text-sm">{l.title}</h4>
                      <span className="text-xs text-blue-800 font-semibold">Handover confirmed by both students</span>
                    </div>
                    <button
                      onClick={() => onSelectListing(l.id)}
                      className="text-xs font-bold text-blue-700 hover:underline"
                    >
                      View Archive
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Tab 6: Unsold / No Bids */}
        {activeTab === 'unsold' && (
          <div className="space-y-4">
            <h3 className="text-lg font-bold text-slate-900">
              Unsold Auctions ({data?.unsold_auctions?.length || 0})
            </h3>
            {(!data?.unsold_auctions || data.unsold_auctions.length === 0) ? (
              <div className="py-12 text-center text-xs text-slate-400 bg-slate-50 rounded-2xl">
                No unsold auctions.
              </div>
            ) : (
              <div className="space-y-3">
                {data.unsold_auctions.map((l) => (
                  <div
                    key={l.id}
                    className="p-4 rounded-2xl border border-slate-200 bg-slate-50 flex items-center justify-between"
                  >
                    <div>
                      <h4 className="font-bold text-slate-900 text-sm">{l.title}</h4>
                      <span className="text-xs text-slate-500">Concluded without eligible bids</span>
                    </div>
                    <button
                      onClick={() => onSelectListing(l.id)}
                      className="text-xs font-bold text-slate-700 hover:underline"
                    >
                      View Details
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
