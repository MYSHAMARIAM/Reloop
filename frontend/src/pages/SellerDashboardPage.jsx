import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useMockData } from '../context/MockDataContext';
import { api } from '../api';
import { formatRupees } from '../utils/currency';
import StatusBadge from '../components/StatusBadge';
import {
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
  const { mockApi } = useMockData();

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('decision'); // 'decision', 'active', 'pending', 'reserved', 'completed', 'unsold'

  const fetchOverview = async () => {
    if (!currentUser) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      let res;
      if (isMockMode) {
        res = await mockApi.getSellerOverview(currentUser);
      } else {
        res = await api.dashboard.getSellerOverview();
      }
      setData(res);
      // Auto pick tab that has urgent items
      if (res.ended_awaiting_decision?.length > 0) setActiveTab('decision');
      else if (res.pending_bidder_responses?.length > 0) setActiveTab('pending');
      else if (res.active_auctions?.length > 0) setActiveTab('active');
    } catch (err) {
      setError(err.message || 'Failed to load seller dashboard');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOverview();
  }, [currentUser, isMockMode]);

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
    active_count: 0,
    awaiting_decision_count: 0,
    pending_response_count: 0,
    reserved_count: 0,
    completed_count: 0,
    unsold_count: 0,
  };

  return (
    <div className="space-y-6 pb-20">
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
          Seller Control Dashboard
        </h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Review ended auctions, select student winners, and coordinate item handovers
        </p>
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
            Active Bidding
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
                {data.active_auctions.map((l) => (
                  <div
                    key={l.id}
                    className="p-5 rounded-2xl border border-slate-200 flex flex-col justify-between space-y-3"
                  >
                    <div>
                      <div className="flex items-center justify-between text-xs mb-1">
                        <StatusBadge status={l.status} />
                        <span className="font-semibold text-slate-600">{l.bid_count} bids</span>
                      </div>
                      <h4 className="font-bold text-slate-900 text-base">{l.title}</h4>
                      <p className="text-xs text-slate-500 mt-1 line-clamp-1">{l.description}</p>
                    </div>

                    <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                      <span className="font-extrabold text-slate-900 text-sm">
                        {l.current_highest_bid_rupees
                          ? formatRupees(l.current_highest_bid_rupees)
                          : formatRupees(l.starting_price_rupees)}
                      </span>
                      <button
                        onClick={() => onSelectListing(l.id)}
                        className="text-xs font-bold text-emerald-700 hover:underline"
                      >
                        Inspect Bids →
                      </button>
                    </div>
                  </div>
                ))}
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
