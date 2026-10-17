import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useMockData } from '../context/MockDataContext';
import { api } from '../api';
import { CATEGORIES, CONDITIONS, DURATION_OPTIONS } from '../utils/validators';
import { PlusCircle, AlertCircle, Sparkles, Image, CheckCircle } from 'lucide-react';

export default function CreateListingPage({ onNavigate, onCreated, onOpenAuth }) {
  const { currentUser, isMockMode } = useAuth();
  const { mockApi } = useMockData();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState(CATEGORIES[0].id);
  const [condition, setCondition] = useState(CONDITIONS[1].id);
  const [startingPrice, setStartingPrice] = useState('500');
  const [minIncrement, setMinIncrement] = useState('50');
  const [durationHours, setDurationHours] = useState(24);
  const [imageUrl, setImageUrl] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  if (!currentUser) {
    return (
      <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center max-w-md mx-auto space-y-4 shadow-sm my-12">
        <div className="w-12 h-12 rounded-full bg-emerald-50 text-emerald-600 mx-auto flex items-center justify-center">
          <PlusCircle className="w-6 h-6" />
        </div>
        <h2 className="text-xl font-bold text-slate-900">Sign in to List an Item</h2>
        <p className="text-xs text-slate-600 leading-relaxed">
          You must be logged in as a verified student to list textbooks, electronics, and lab equipment on Reloop.
        </p>
        <button
          onClick={() => onOpenAuth('login')}
          className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-md cursor-pointer"
        >
          Sign In Now
        </button>
      </div>
    );
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    const price = parseFloat(startingPrice);
    const inc = parseFloat(minIncrement);

    if (isNaN(price) || price <= 0) {
      setError('Starting price must be a positive number');
      return;
    }

    if (isNaN(inc) || inc <= 0) {
      setError('Minimum increment must be a positive number');
      return;
    }

    if (title.trim().length < 3) {
      setError('Title must be at least 3 characters');
      return;
    }

    if (description.trim().length < 10) {
      setError('Description must be at least 10 characters');
      return;
    }

    setLoading(true);
    try {
      const payload = {
        title: title.trim(),
        description: description.trim(),
        category,
        condition,
        starting_price_rupees: price,
        min_increment_rupees: inc,
        duration_hours: Number(durationHours),
        image_url: imageUrl.trim() || null,
      };

      let newListing;
      if (isMockMode) {
        newListing = await mockApi.createListing(payload, currentUser);
      } else {
        newListing = await api.listings.create(payload);
      }

      setSuccess(true);
      if (onCreated) onCreated(newListing);
      setTimeout(() => {
        onNavigate('my-listings');
      }, 1200);
    } catch (err) {
      setError(err.message || 'Failed to create listing');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6 pb-20">
      <div className="space-y-1">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
          List an Item for Bidding
        </h1>
        <p className="text-xs text-slate-500">
          Set your starting price, increment, and auction duration. After bidding ends, you choose the winner.
        </p>
      </div>

      {success && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center gap-3 text-xs text-emerald-800 animate-in fade-in">
          <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0" />
          <span>Listing created successfully! Redirecting to your listings...</span>
        </div>
      )}

      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl flex items-center gap-3 text-xs text-rose-800">
          <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-sm space-y-6">
        {/* Title */}
        <div>
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
            Item Title *
          </label>
          <input
            type="text"
            required
            placeholder="e.g. Texas Instruments TI-84 Plus CE Graphing Calculator"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full px-4 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>

        {/* Category & Condition */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Category *
            </label>
            <select
              aria-label="Item category"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full px-3 py-2.5 text-sm border border-slate-200 rounded-xl bg-slate-50 focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer"
            >
              {CATEGORIES.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Physical Condition *
            </label>
            <select
              aria-label="Physical condition"
              value={condition}
              onChange={(e) => setCondition(e.target.value)}
              className="w-full px-3 py-2.5 text-sm border border-slate-200 rounded-xl bg-slate-50 focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer"
            >
              {CONDITIONS.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Description */}
        <div>
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
            Item Description *
          </label>
          <textarea
            required
            rows={4}
            placeholder="Mention edition, semester used, included accessories, or any minor defects..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full px-4 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>

        {/* Pricing & Increment */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-50/70 p-4 rounded-2xl border border-slate-100">
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Starting Price (₹ INR) *
            </label>
            <div className="relative">
              <span className="absolute left-3.5 top-2.5 text-slate-400 font-bold">₹</span>
              <input
                type="number"
                required
                min="1"
                step="1"
                placeholder="500"
                value={startingPrice}
                onChange={(e) => setStartingPrice(e.target.value)}
                className="w-full pl-8 pr-4 py-2.5 text-sm bg-white border border-slate-200 rounded-xl font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
            <p className="text-[10px] text-slate-400 mt-1">First valid bid starts here</p>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Minimum Bid Increment (₹ INR) *
            </label>
            <div className="relative">
              <span className="absolute left-3.5 top-2.5 text-slate-400 font-bold">₹</span>
              <input
                type="number"
                required
                min="1"
                step="1"
                placeholder="50"
                value={minIncrement}
                onChange={(e) => setMinIncrement(e.target.value)}
                className="w-full pl-8 pr-4 py-2.5 text-sm bg-white border border-slate-200 rounded-xl font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
            <p className="text-[10px] text-slate-400 mt-1">Each next bid must add at least this amount</p>
          </div>
        </div>

        {/* Bidding Duration */}
        <div>
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
            Auction Bidding Duration *
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {DURATION_OPTIONS.map((opt) => (
              <button
                key={opt.hours}
                type="button"
                onClick={() => setDurationHours(opt.hours)}
                className={`py-2 px-3 text-xs font-semibold rounded-xl border text-center transition-all cursor-pointer ${
                  durationHours === opt.hours
                    ? 'bg-emerald-50 border-emerald-500 text-emerald-800 shadow-xs'
                    : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
          <p className="text-[11px] text-slate-400 mt-1.5">
            Duration ranges from 1 hour to 7 days. Calculated authoritatively by UTC timestamp.
          </p>
        </div>

        {/* Optional Image URL */}
        <div>
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
            Image URL (Optional)
          </label>
          <div className="relative">
            <Image className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
            <input
              type="url"
              placeholder="https://... (or leave empty for clean category placeholder)"
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={loading || success}
          className="w-full py-3 text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-md shadow-emerald-600/20 transition-all cursor-pointer disabled:bg-slate-300"
        >
          {loading ? 'Publishing Auction...' : 'Publish College Auction'}
        </button>
      </form>
    </div>
  );
}
