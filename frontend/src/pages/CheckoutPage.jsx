import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useMockData } from '../context/MockDataContext';
import { api } from '../api';
import { formatRupees } from '../utils/currency';
import {
  CreditCard,
  Truck,
  MapPin,
  CheckCircle,
  AlertTriangle,
  ArrowLeft,
  ShieldCheck,
  Building,
  Info,
  Clock,
  Sparkles,
  RefreshCw,
  Package,
} from 'lucide-react';

export default function CheckoutPage({ transactionId, onBack, onComplete, onNavigate }) {
  const { currentUser, isMockMode } = useAuth();
  const { mockApi, transactions: mockTransactions } = useMockData();

  const [transaction, setTransaction] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Checkout form state
  const [fulfilmentType, setFulfilmentType] = useState('delivery'); // 'delivery' or 'pickup'
  const [deliveryAddress, setDeliveryAddress] = useState('Hostel Block B, Room 204, North Campus');
  const [handoverVenue, setHandoverVenue] = useState('Central Library Front Lawn / Main Canteen');
  const [paymentMethod, setPaymentMethod] = useState('upi'); // 'upi', 'wallet', 'card'

  // Processing state
  const [processing, setProcessing] = useState(false);
  const [paymentResult, setPaymentResult] = useState(null); // 'success', 'failure', or null
  const [resultMessage, setResultMessage] = useState('');

  const fetchTransactionData = async () => {
    try {
      setLoading(true);
      setError(null);

      if (isMockMode) {
        let tx = null;
        if (transactionId) {
          tx = mockTransactions.find(
            (t) => t.id === Number(transactionId) || t.listing_id === Number(transactionId)
          );
        }
        if (!tx) {
          // Fallback to first awaiting_payment transaction for this user
          tx = mockTransactions.find(
            (t) =>
              (t.buyer_id === currentUser?.id || t.selected_bidder_id === currentUser?.id) &&
              (t.status === 'awaiting_payment' || t.status === 'reserved')
          );
        }
        if (!tx && mockTransactions.length > 0) {
          tx = mockTransactions[0];
        }
        setTransaction(tx);
      } else {
        if (!transactionId) {
          setError('No active transaction selected for checkout.');
          return;
        }
        const data = await api.transactions.getById(transactionId);
        setTransaction(data);
      }
    } catch (err) {
      console.error('Failed to load transaction for checkout:', err);
      setError(err.message || 'Unable to load checkout details');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTransactionData();
  }, [transactionId, isMockMode]);

  const handleSimulatePayment = async (resultType) => {
    if (!transaction) return;
    setProcessing(true);
    setPaymentResult(null);
    setResultMessage('');

    try {
      const payload = {
        simulation_result: resultType,
        fulfilment_type: fulfilmentType,
        delivery_address: fulfilmentType === 'delivery' ? deliveryAddress : null,
        handover_venue: fulfilmentType === 'pickup' ? handoverVenue : null,
      };

      if (isMockMode) {
        const updated = await mockApi.simulatePayment(transaction.id, payload, currentUser);
        setTransaction(updated);
        if (resultType === 'success') {
          setPaymentResult('success');
          setResultMessage('Simulated payment successful! Your order has been placed.');
        } else {
          setPaymentResult('failure');
          setResultMessage('Simulated payment failed (Declined by issuer demo). You can try again.');
        }
      } else {
        const updated = await api.transactions.simulatePayment(transaction.id, payload);
        setTransaction(updated);
        setPaymentResult('success');
        setResultMessage('Simulated payment successful! Order confirmed.');
      }
    } catch (err) {
      setPaymentResult('failure');
      setResultMessage(err.message || 'Payment simulation failed.');
    } finally {
      setProcessing(false);
    }
  };

  if (loading) {
    return (
      <div className="py-20 text-center space-y-4">
        <div className="inline-block animate-spin rounded-full h-10 w-10 border-4 border-emerald-500 border-t-transparent" />
        <p className="text-sm font-semibold text-slate-500">Loading checkout details...</p>
      </div>
    );
  }

  if (error || !transaction) {
    return (
      <div className="max-w-xl mx-auto py-16 text-center space-y-4">
        <div className="w-14 h-14 bg-amber-50 text-amber-600 rounded-full flex items-center justify-center mx-auto">
          <AlertTriangle className="w-7 h-7" />
        </div>
        <h2 className="text-xl font-bold text-slate-900">Checkout Unavailable</h2>
        <p className="text-sm text-slate-500 max-w-md mx-auto">
          {error || 'No pending transaction found. Please check your bids or transactions tab.'}
        </p>
        <button
          onClick={onBack}
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-slate-900 text-white text-xs font-bold rounded-xl hover:bg-slate-800 transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to My Bids
        </button>
      </div>
    );
  }

  const basePrice = transaction.final_amount_rupees || transaction.agreed_amount_rupees || 0;
  const deliveryFee = fulfilmentType === 'delivery' ? 30 : 0;
  const sustainabilityFee = 0; // Free for college students
  const totalAmount = basePrice + deliveryFee + sustainabilityFee;

  // If already paid
  const isAlreadyPaid =
    transaction.payment_status === 'paid_demo' ||
    transaction.status === 'in_progress' ||
    transaction.status === 'completed' ||
    transaction.fulfilment_status === 'order_confirmed' ||
    transaction.fulfilment_status === 'ready_for_pickup';

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-20">
      {/* Top Header & Back */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <button
            onClick={onBack}
            className="inline-flex items-center gap-2 text-xs font-semibold text-slate-500 hover:text-slate-900 mb-2 transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to My Bids
          </button>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2.5">
            <CreditCard className="w-6 h-6 text-emerald-600" />
            Simulated Checkout & Order Placement
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Acceptance confirmed. Complete your simulated test checkout to reserve and schedule handover.
          </p>
        </div>

        {/* Demo Mode Notice Badge */}
        <div className="inline-flex items-center gap-2 bg-emerald-50 border border-emerald-200 text-emerald-800 text-[11px] font-bold px-3 py-1.5 rounded-full self-start">
          <Sparkles className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
          <span>Simulated Sandbox • Zero Real Money</span>
        </div>
      </div>

      {/* Success Notification after Payment */}
      {paymentResult === 'success' && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-3xl p-6 sm:p-8 space-y-4 animate-in fade-in duration-200">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 bg-emerald-600 text-white rounded-2xl flex items-center justify-center shrink-0 shadow-sm">
              <CheckCircle className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <h3 className="text-lg font-black text-emerald-950">
                Payment Simulation Successful!
              </h3>
              <p className="text-xs text-emerald-800 leading-relaxed">
                {resultMessage} Your transaction ID is{' '}
                <span className="font-mono font-bold">TX-{transaction.id}</span>. The seller has been notified
                to prepare your item for {fulfilmentType === 'delivery' ? 'delivery' : 'campus pickup'}.
              </p>
            </div>
          </div>

          <div className="pt-2 flex flex-wrap gap-3">
            <button
              onClick={() => onNavigate('transactions')}
              className="px-6 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold rounded-xl shadow-xs transition-colors cursor-pointer flex items-center gap-2"
            >
              <Package className="w-4 h-4" />
              Track Order & Handover
            </button>
            {onComplete && (
              <button
                onClick={onComplete}
                className="px-5 py-2.5 bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 text-xs font-bold rounded-xl transition-colors cursor-pointer"
              >
                Return to Marketplace
              </button>
            )}
          </div>
        </div>
      )}

      {/* Error / Failed simulation notification */}
      {paymentResult === 'failure' && (
        <div className="bg-red-50 border border-red-200 rounded-2xl p-5 flex items-start gap-3 text-xs text-red-800 animate-in fade-in">
          <AlertTriangle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <p className="font-bold text-red-950">Simulated Payment Declined</p>
            <p>{resultMessage}</p>
            <p className="text-[11px] text-red-700 pt-1">
              You can test the recovery flow by clicking "Simulate Successful Payment" below.
            </p>
          </div>
        </div>
      )}

      {/* Main Grid: Left Details & Right Order Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Fulfilment Method & Simulation Payment Controls */}
        <div className="lg:col-span-7 space-y-6">
          {/* Item Overview Card */}
          <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs flex items-center gap-5">
            <div className="w-20 h-20 rounded-2xl bg-slate-100 overflow-hidden shrink-0 border border-slate-200">
              {transaction.listing_image ? (
                <img
                  src={transaction.listing_image}
                  alt={transaction.listing_title}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-slate-400">
                  <Package className="w-8 h-8" />
                </div>
              )}
            </div>
            <div className="space-y-1 flex-1 min-w-0">
              <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-md inline-block">
                Offer Accepted
              </span>
              <h2 className="text-base font-black text-slate-900 truncate">
                {transaction.listing_title || 'Marketplace Item'}
              </h2>
              <p className="text-xs text-slate-500">
                Seller: <strong className="text-slate-800">{transaction.seller_name}</strong>
              </p>
              <p className="text-sm font-extrabold text-emerald-700">
                Agreed Bid: {formatRupees(basePrice)}
              </p>
            </div>
          </div>

          {/* Fulfilment Method Selection */}
          <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs space-y-5">
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
              1. Choose Fulfilment Method
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Option A: Campus Delivery */}
              <button
                type="button"
                onClick={() => setFulfilmentType('delivery')}
                disabled={isAlreadyPaid}
                className={`p-4 rounded-2xl border text-left transition-all cursor-pointer ${
                  fulfilmentType === 'delivery'
                    ? 'border-emerald-600 bg-emerald-50/50 ring-2 ring-emerald-600/20'
                    : 'border-slate-200 hover:border-slate-300 bg-white'
                } ${isAlreadyPaid ? 'opacity-60 cursor-not-allowed' : ''}`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center">
                    <Truck className="w-5 h-5" />
                  </div>
                  <span className="text-xs font-bold text-emerald-700">₹30</span>
                </div>
                <h4 className="text-xs font-black text-slate-900">Campus Courier Delivery</h4>
                <p className="text-[11px] text-slate-500 mt-1">
                  Dispatched directly to your campus hostel, dorm, or faculty department.
                </p>
              </button>

              {/* Option B: Campus Pickup / Meetup */}
              <button
                type="button"
                onClick={() => setFulfilmentType('pickup')}
                disabled={isAlreadyPaid}
                className={`p-4 rounded-2xl border text-left transition-all cursor-pointer ${
                  fulfilmentType === 'pickup'
                    ? 'border-emerald-600 bg-emerald-50/50 ring-2 ring-emerald-600/20'
                    : 'border-slate-200 hover:border-slate-300 bg-white'
                } ${isAlreadyPaid ? 'opacity-60 cursor-not-allowed' : ''}`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="w-9 h-9 rounded-xl bg-blue-100 text-blue-800 flex items-center justify-center">
                    <MapPin className="w-5 h-5" />
                  </div>
                  <span className="text-xs font-bold text-blue-700">Free</span>
                </div>
                <h4 className="text-xs font-black text-slate-900">Campus Pickup / Meetup</h4>
                <p className="text-[11px] text-slate-500 mt-1">
                  Coordinate directly with seller at campus landmarks (Library, Canteen, Quad).
                </p>
              </button>
            </div>

            {/* Address / Venue Input fields */}
            {fulfilmentType === 'delivery' ? (
              <div className="space-y-2 pt-2 border-t border-slate-100">
                <label className="block text-xs font-bold text-slate-700">
                  Campus Delivery Address (Hostel / Room / Department)
                </label>
                <input
                  type="text"
                  value={deliveryAddress}
                  onChange={(e) => setDeliveryAddress(e.target.value)}
                  disabled={isAlreadyPaid}
                  placeholder="e.g. Hostel Block B, Room 204, North Campus"
                  className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-emerald-600 font-medium"
                />
                <p className="text-[11px] text-slate-400">
                  Seller or student courier will drop off to this exact location.
                </p>
              </div>
            ) : (
              <div className="space-y-2 pt-2 border-t border-slate-100">
                <label className="block text-xs font-bold text-slate-700">
                  Preferred Campus Meetup Landmark
                </label>
                <input
                  type="text"
                  value={handoverVenue}
                  onChange={(e) => setHandoverVenue(e.target.value)}
                  disabled={isAlreadyPaid}
                  placeholder="e.g. Central Library Lawn, SAC Cafeteria, Tech Park"
                  className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-emerald-600 font-medium"
                />
                <p className="text-[11px] text-slate-400">
                  Choose a public, well-lit campus location for safe handover.
                </p>
              </div>
            )}
          </div>

          {/* Payment Method & Simulation Details */}
          <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs space-y-5">
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
              2. Simulated Payment Method
            </h3>

            <div className="grid grid-cols-3 gap-3">
              {[
                { id: 'upi', name: 'Campus UPI', desc: 'Simulated UPI App' },
                { id: 'wallet', name: 'Student Wallet', desc: 'Campus ID Balance' },
                { id: 'card', name: 'Demo RuPay / Card', desc: 'Test Virtual Card' },
              ].map((m) => (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => setPaymentMethod(m.id)}
                  disabled={isAlreadyPaid}
                  className={`p-3 rounded-xl border text-center transition-all cursor-pointer ${
                    paymentMethod === m.id
                      ? 'border-emerald-600 bg-emerald-50 text-emerald-950 font-bold'
                      : 'border-slate-200 text-slate-600 hover:border-slate-300'
                  }`}
                >
                  <p className="text-xs">{m.name}</p>
                  <p className="text-[10px] text-slate-400 mt-0.5">{m.desc}</p>
                </button>
              ))}
            </div>

            {/* Disclaimer box */}
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 flex items-start gap-3 text-xs text-slate-600">
              <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold text-slate-900">Zero Real Payment Guarantee</p>
                <p className="text-[11px] text-slate-500 mt-0.5 leading-relaxed">
                  Reloop is a simulated educational marketplace. No credit card details, bank credentials,
                  or live money transactions are accepted or processed.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Price Summary & Action Buttons */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs space-y-5 sticky top-24">
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
              Order Summary
            </h3>

            <div className="space-y-3 text-xs">
              <div className="flex justify-between text-slate-600">
                <span>Agreed Bid Amount:</span>
                <span className="font-semibold text-slate-900">{formatRupees(basePrice)}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Fulfilment ({fulfilmentType === 'delivery' ? 'Campus Delivery' : 'Pickup'}):</span>
                <span className="font-semibold text-slate-900">
                  {deliveryFee > 0 ? formatRupees(deliveryFee) : 'Free'}
                </span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Platform Sustainability Fee:</span>
                <span className="font-semibold text-emerald-700">₹0 (Student Free Tier)</span>
              </div>
              <div className="pt-3 border-t border-slate-200 flex justify-between items-center text-sm">
                <span className="font-bold text-slate-900">Total Payable:</span>
                <span className="font-black text-xl text-emerald-700">{formatRupees(totalAmount)}</span>
              </div>
            </div>

            {/* Action Buttons */}
            {isAlreadyPaid ? (
              <div className="space-y-3 pt-2">
                <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-2xl text-center space-y-1">
                  <CheckCircle className="w-5 h-5 text-emerald-600 mx-auto" />
                  <p className="text-xs font-bold text-emerald-950">Payment Already Completed</p>
                  <p className="text-[11px] text-emerald-800">
                    Status: {transaction.fulfilment_status || 'Order Confirmed'}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => onNavigate('transactions')}
                  className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-md transition-all cursor-pointer flex items-center justify-center gap-2"
                >
                  <Package className="w-4 h-4" />
                  View in Orders & Handover
                </button>
              </div>
            ) : (
              <div className="space-y-3 pt-2">
                {/* One click simulate success */}
                <button
                  type="button"
                  onClick={() => handleSimulatePayment('success')}
                  disabled={processing}
                  className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-700 active:scale-[0.99] text-white font-black text-xs rounded-xl shadow-md transition-all cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {processing ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      Processing Simulation...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="w-4 h-4" />
                      Simulate Successful Payment ({formatRupees(totalAmount)})
                    </>
                  )}
                </button>

                {/* Simulate failure button to test retry */}
                <button
                  type="button"
                  onClick={() => handleSimulatePayment('failure')}
                  disabled={processing}
                  className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs rounded-xl transition-all cursor-pointer disabled:opacity-50 flex items-center justify-center gap-1.5"
                >
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                  Simulate Payment Failure (Test Retry)
                </button>

                <p className="text-[11px] text-slate-400 text-center leading-tight">
                  Clicking will invoke the simulated payment pipeline, updating order status in real time.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
