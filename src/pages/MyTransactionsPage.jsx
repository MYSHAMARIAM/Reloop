import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useMockData } from '../context/MockDataContext';
import { api } from '../api';
import { formatRupees } from '../utils/currency';
import { formatDateTime } from '../utils/time';
import StatusBadge from '../components/StatusBadge';
import {
  Handshake,
  MapPin,
  Calendar,
  CheckCircle,
  Clock,
  AlertCircle,
  FileText,
  User,
} from 'lucide-react';

export default function MyTransactionsPage({ onNavigate, onOpenAuth }) {
  const { currentUser, isMockMode } = useAuth();
  const { mockApi } = useMockData();

  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actionSuccess, setActionSuccess] = useState(null);

  // Handover form state for an open transaction modal/drawer
  const [selectedTx, setSelectedTx] = useState(null);
  const [venue, setVenue] = useState('');
  const [notes, setNotes] = useState('');

  const fetchTransactions = async () => {
    if (!currentUser) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      let data;
      if (isMockMode) {
        data = await mockApi.getMyTransactions(currentUser);
      } else {
        data = await api.dashboard.getMyTransactions();
      }
      setTransactions(data);
    } catch (err) {
      setError(err.message || 'Failed to load transactions');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTransactions();
  }, [currentUser, isMockMode]);

  const handleSaveVenue = async (txId) => {
    if (!venue.trim()) return alert('Please enter a campus meetup venue');
    try {
      if (isMockMode) {
        await mockApi.arrangeHandover(txId, {
          handover_venue: venue.trim(),
          handover_notes: notes.trim(),
        });
      } else {
        await api.transactions.arrangeHandover(txId, {
          handover_venue: venue.trim(),
          handover_notes: notes.trim(),
        });
      }
      setActionSuccess('Meetup venue & notes saved!');
      setSelectedTx(null);
      await fetchTransactions();
    } catch (err) {
      alert(err.message || 'Failed to arrange handover');
    }
  };

  const handleConfirmHandover = async (txId) => {
    if (!confirm('Confirm that you have met in person and verified the physical item?')) return;
    try {
      if (isMockMode) {
        await mockApi.confirmHandover(txId, currentUser);
      } else {
        await api.transactions.confirmHandover(txId);
      }
      setActionSuccess('Handover confirmation recorded!');
      await fetchTransactions();
    } catch (err) {
      alert(err.message || 'Failed to confirm handover');
    }
  };

  const handleFulfilmentAction = async (tx, action) => {
    try {
      if (isMockMode) return;
      if (action === 'advance') {
        if (tx.fulfilment_type === 'handover') await api.transactions.advancePickup(tx.id);
        else await api.transactions.advanceDelivery(tx.id);
      } else {
        await api.transactions.confirmReceipt(tx.id);
      }
      setActionSuccess(action === 'advance' ? 'Order status updated.' : 'Receipt confirmed. Order complete!');
      await fetchTransactions();
    } catch (err) {
      setError(err.message || 'Unable to update order');
    }
  };

  if (!currentUser) {
    return (
      <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center max-w-md mx-auto space-y-4 shadow-sm my-12">
        <Handshake className="w-12 h-12 text-slate-300 mx-auto" />
        <h2 className="text-xl font-bold text-slate-900">Sign In to View Transactions</h2>
        <p className="text-xs text-slate-500">Coordinate item handovers and mutual campus confirmations.</p>
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
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
          My Campus Handover Transactions
        </h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Schedule campus meetup spots, verify items in person, and mutually confirm handover completion
        </p>
      </div>

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

      {loading ? (
        <div className="py-16 text-center text-xs text-slate-400">Loading your transactions...</div>
      ) : transactions.length === 0 ? (
        <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center text-slate-500 space-y-3">
          <Handshake className="w-12 h-12 mx-auto text-slate-300" />
          <h3 className="font-bold text-slate-800">No active handover transactions</h3>
          <p className="text-xs text-slate-400">
            When a seller chooses a bidder and the bidder accepts, a handover transaction is automatically created here.
          </p>
          <button
            onClick={() => onNavigate('browse')}
            className="px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-bold hover:bg-slate-800 cursor-pointer"
          >
            Browse Auctions
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6">
          {transactions.map((tx) => {
            const isSeller = tx.seller_id === currentUser.id;
            const isBuyer = tx.buyer_id === currentUser.id;
            const hasMyConfirmation = isSeller ? tx.seller_confirmed : tx.buyer_confirmed;
            const hasOtherConfirmation = isSeller ? tx.buyer_confirmed : tx.seller_confirmed;

            return (
              <div
                key={tx.id}
                className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-sm space-y-6"
              >
                {/* Header Row */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700">
                        {isSeller ? 'You are Selling' : 'You are Buying'}
                      </span>
                      <StatusBadge status={tx.status} />
                    </div>
                    <h3 className="text-xl font-extrabold text-slate-900">{tx.listing_title}</h3>
                  </div>

                  <div className="text-right sm:text-right">
                    <span className="text-[11px] font-semibold text-slate-400 block uppercase tracking-wider">
                      Agreed Final Amount
                    </span>
                    <span className="text-2xl font-black text-slate-900">
                      {formatRupees(tx.final_amount_rupees)}
                    </span>
                  </div>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 space-y-2 text-xs">
                  <div className="flex flex-wrap justify-between gap-2"><span>Order reference: <strong>RLP-{tx.id}</strong></span><span>Demo payment: <strong>{tx.payment_status || 'unpaid'}</strong>{tx.payment_reference ? ` · ${tx.payment_reference}` : ''}</span></div>
                  <p>Fulfilment: <strong>{tx.fulfilment_type === 'delivery' ? 'Simulated platform delivery' : tx.fulfilment_type === 'handover' ? 'Nearby handover' : 'Not selected'}</strong> · Status: <strong>{(tx.fulfilment_status || tx.status).replaceAll('_', ' ')}</strong></p>
                  {tx.fulfilment_type === 'delivery' && tx.payment_status === 'paid_demo' && isSeller && tx.fulfilment_status !== 'delivered' && tx.fulfilment_status !== 'completed' && <button onClick={() => handleFulfilmentAction(tx, 'advance')} className="rounded-lg bg-emerald-600 px-3 py-2 font-bold text-white">Advance simulated delivery</button>}
                  {tx.fulfilment_type === 'handover' && tx.payment_status === 'paid_demo' && isSeller && tx.fulfilment_status === 'order_confirmed' && <button onClick={() => handleFulfilmentAction(tx, 'advance')} className="rounded-lg bg-emerald-600 px-3 py-2 font-bold text-white">Mark item ready for handover</button>}
                  {tx.payment_status === 'paid_demo' && isBuyer && ['delivered', 'awaiting_receipt'].includes(tx.fulfilment_status) && <button onClick={() => handleFulfilmentAction(tx, 'receipt')} className="rounded-lg bg-emerald-600 px-3 py-2 font-bold text-white">Confirm receipt</button>}
                  {tx.fulfilment_type === 'delivery' && <p className="text-amber-700">Simulated delivery only. No courier is connected.</p>}
                  {tx.timeline?.length > 0 && <ol className="list-inside list-decimal space-y-1 pt-2 text-slate-600">{tx.timeline.map((event, index) => <li key={`${tx.id}-${index}`}>{event.message} <span className="text-slate-400">({formatDateTime(event.created_at)})</span></li>)}</ol>}
                  {tx.status === 'completed' && <p className="font-bold text-emerald-700">Order Received Successfully!</p>}
                </div>

                {/* Handover Details & Coordination */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
                  {/* Participant details */}
                  <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 space-y-3">
                    <h4 className="font-bold text-slate-700 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                      <User className="w-3.5 h-3.5 text-slate-400" />
                      Participants
                    </h4>
                    <div className="space-y-1.5 text-slate-600">
                      <div className="flex justify-between">
                        <span>Seller:</span>
                        <span className="font-semibold text-slate-800">
                          {tx.seller_name} {isSeller && '(You)'}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>Selected Buyer:</span>
                        <span className="font-semibold text-slate-800">
                          {tx.buyer_name} {isBuyer && '(You)'}
                        </span>
                      </div>
                      <div className="flex justify-between text-slate-400 pt-1">
                        <span>Accepted On:</span>
                        <span>{formatDateTime(tx.created_at)}</span>
                      </div>
                    </div>
                  </div>

                  {/* Meetup venue details */}
                  <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="font-bold text-slate-700 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                        <MapPin className="w-3.5 h-3.5 text-slate-400" />
                        Campus Meetup Venue
                      </h4>
                      {tx.status !== 'completed' && tx.payment_status === 'paid_demo' && tx.fulfilment_type === 'handover' && tx.fulfilment_status === 'order_confirmed' && (
                        <button
                          onClick={() => {
                            setSelectedTx(tx);
                            setVenue(tx.handover_venue || '');
                            setNotes(tx.handover_notes || '');
                          }}
                          className="text-emerald-700 hover:text-emerald-800 font-bold text-xs cursor-pointer"
                        >
                          {tx.handover_venue ? 'Edit Venue' : '+ Set Venue'}
                        </button>
                      )}
                    </div>

                    {tx.handover_venue ? (
                      <div className="space-y-1">
                        <p className="font-bold text-slate-900 text-sm">{tx.handover_venue}</p>
                        {tx.handover_notes && (
                          <p className="text-slate-600 italic">"{tx.handover_notes}"</p>
                        )}
                      </div>
                    ) : (
                      <p className="text-slate-400 italic">
                        No meetup venue scheduled yet. Click "+ Set Venue" to designate library, canteen, or lab foyer.
                      </p>
                    )}
                  </div>
                </div>

                {/* Handover Mutual Confirmation Progress */}
                <div className="bg-slate-900 text-white p-5 rounded-2xl space-y-4">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <div>
                      <h4 className="font-bold text-sm text-white">Mutual Campus Handover Confirmation</h4>
                      <p className="text-[11px] text-slate-300">
                        Both students must meet on campus, inspect the item, and confirm completion.
                      </p>
                    </div>

                    {tx.status === 'completed' ? (
                      <span className="px-3 py-1 bg-emerald-500/20 text-emerald-300 font-bold text-xs rounded-full border border-emerald-400/30 flex items-center gap-1.5">
                        <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
                        Transaction Fully Completed
                      </span>
                    ) : (
                      <span className="px-3 py-1 bg-amber-500/20 text-amber-300 font-bold text-xs rounded-full border border-amber-400/30">
                        Awaiting Mutual Confirmation
                      </span>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1 text-xs">
                    {/* Seller status */}
                    <div className="flex items-center justify-between p-3 rounded-xl bg-slate-800/80 border border-slate-700">
                      <span>Seller ({tx.seller_name}) Confirmation:</span>
                      <span className={`font-bold ${tx.seller_confirmed ? 'text-emerald-400' : 'text-slate-400'}`}>
                        {tx.seller_confirmed ? '✓ Confirmed' : 'Pending'}
                      </span>
                    </div>

                    {/* Buyer status */}
                    <div className="flex items-center justify-between p-3 rounded-xl bg-slate-800/80 border border-slate-700">
                      <span>Buyer ({tx.buyer_name}) Confirmation:</span>
                      <span className={`font-bold ${tx.buyer_confirmed ? 'text-emerald-400' : 'text-slate-400'}`}>
                        {tx.buyer_confirmed ? '✓ Confirmed' : 'Pending'}
                      </span>
                    </div>
                  </div>

                  {/* Confirmation Action Button */}
                  {tx.status !== 'completed' && (
                    <div className="pt-2 flex justify-end">
                      {hasMyConfirmation ? (
                        <div className="text-xs text-emerald-400 font-medium flex items-center gap-1.5">
                          <CheckCircle className="w-4 h-4" />
                          You have confirmed this handover. Waiting for the other party.
                        </div>
                      ) : (
                        <button
                          onClick={() => handleConfirmHandover(tx.id)}
                          className="px-5 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs rounded-xl shadow-md cursor-pointer transition-colors"
                        >
                          I have met in person & confirm handover
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Edit Meetup Venue Modal */}
      {selectedTx && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <h3 className="font-bold text-slate-900 text-lg">Coordinate Meetup Location</h3>
            <p className="text-xs text-slate-500">
              Specify a public on-campus meeting point for physical handover.
            </p>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Meetup Venue *</label>
                <input
                  type="text"
                  placeholder="e.g. Central Library Lawn, Table 4 or Canteen Block B"
                  value={venue}
                  onChange={(e) => setVenue(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Meetup Notes (Optional)</label>
                <textarea
                  rows={2}
                  placeholder="e.g. Meet between 2:00 PM and 3:00 PM during break..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm"
                />
              </div>
            </div>

            <div className="flex gap-2 justify-end pt-2">
              <button
                onClick={() => setSelectedTx(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
              >
                Cancel
              </button>
              <button
                onClick={() => handleSaveVenue(selectedTx.id)}
                className="px-5 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-sm"
              >
                Save Handover Venue
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
