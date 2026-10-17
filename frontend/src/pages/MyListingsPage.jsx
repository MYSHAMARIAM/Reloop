import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useMockData } from '../context/MockDataContext';
import { api } from '../api';
import { formatRupees } from '../utils/currency';
import { formatDateTime } from '../utils/time';
import StatusBadge from '../components/StatusBadge';
import { Package, PlusCircle, AlertCircle, Trash2, Eye, Gavel } from 'lucide-react';

export default function MyListingsPage({ onNavigate, onSelectListing, onOpenAuth }) {
  const { currentUser, isMockMode } = useAuth();
  const { mockApi } = useMockData();

  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchMyListings = async () => {
    if (!currentUser) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      let data;
      if (isMockMode) {
        data = await mockApi.getMyListings(currentUser);
      } else {
        data = await api.dashboard.getMyListings();
      }
      setListings(data);
    } catch (err) {
      setError(err.message || 'Failed to load your listings');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMyListings();
  }, [currentUser, isMockMode]);

  const handleDeactivate = async (id) => {
    if (!confirm('Are you sure you want to deactivate/withdraw this listing?')) return;
    try {
      if (isMockMode) {
        // mock deactivate
        alert('Item marked as withdrawn');
      } else {
        await api.listings.deactivate(id);
      }
      await fetchMyListings();
    } catch (err) {
      alert(err.message || 'Cannot deactivate listing');
    }
  };

  if (!currentUser) {
    return (
      <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center max-w-md mx-auto space-y-4 shadow-sm my-12">
        <Package className="w-12 h-12 text-slate-300 mx-auto" />
        <h2 className="text-xl font-bold text-slate-900">Sign In to View Listings</h2>
        <p className="text-xs text-slate-500">View and manage items you've put up for bidding.</p>
        <button
          onClick={() => onOpenAuth('login')}
          className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-md cursor-pointer"
        >
          Sign In
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-20">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            My Created Listings
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Manage your pre-owned college items and track bidding activity
          </p>
        </div>

        <button
          onClick={() => onNavigate('sell')}
          className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-sm flex items-center gap-1.5 self-start sm:self-auto cursor-pointer"
        >
          <PlusCircle className="w-4 h-4" />
          Create New Listing
        </button>
      </div>

      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl flex items-center gap-3 text-xs text-rose-800">
          <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {loading ? (
        <div className="py-16 text-center text-xs text-slate-400">Loading your listings...</div>
      ) : listings.length === 0 ? (
        <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center text-slate-500 space-y-3">
          <Package className="w-12 h-12 mx-auto text-slate-300" />
          <h3 className="font-bold text-slate-800">You haven't listed any items yet</h3>
          <p className="text-xs text-slate-400">
            Have old textbooks, an extra calculator, or spare sensors? Put them up for bidding.
          </p>
          <button
            onClick={() => onNavigate('sell')}
            className="px-4 py-2 bg-emerald-600 text-white rounded-xl text-xs font-bold hover:bg-emerald-700 cursor-pointer"
          >
            Sell Your First Item
          </button>
        </div>
      ) : (
        <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
                  <th className="py-3.5 px-6">Item Title</th>
                  <th className="py-3.5 px-4">Starting Price</th>
                  <th className="py-3.5 px-4">Highest Bid</th>
                  <th className="py-3.5 px-4">Bids</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4">Created</th>
                  <th className="py-3.5 px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {listings.map((l) => (
                  <tr key={l.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="py-4 px-6 font-bold text-slate-900 max-w-xs truncate">
                      {l.title}
                    </td>
                    <td className="py-4 px-4 font-semibold text-slate-700">
                      {formatRupees(l.starting_price_rupees)}
                    </td>
                    <td className="py-4 px-4 font-extrabold text-slate-900">
                      {l.current_highest_bid_rupees ? formatRupees(l.current_highest_bid_rupees) : '—'}
                    </td>
                    <td className="py-4 px-4">
                      <span className="inline-flex items-center gap-1 font-semibold text-slate-700 bg-slate-100 px-2 py-0.5 rounded">
                        <Gavel className="w-3 h-3 text-slate-400" />
                        {l.bid_count}
                      </span>
                    </td>
                    <td className="py-4 px-4">
                      <StatusBadge status={l.status} />
                    </td>
                    <td className="py-4 px-4 text-slate-400 whitespace-nowrap">
                      {formatDateTime(l.created_at)}
                    </td>
                    <td className="py-4 px-6 text-right space-x-2 whitespace-nowrap">
                      <button
                        onClick={() => onSelectListing(l.id)}
                        className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-lg transition-colors cursor-pointer"
                      >
                        Details
                      </button>
                      {l.status === 'active' && (
                        <button
                          onClick={() => handleDeactivate(l.id)}
                          className="px-2.5 py-1.5 text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                          title="Withdraw Listing"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
