import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../api';
import { formatDateTime } from '../utils/time';
import { User, Mail, MapPin, BadgeCheck, FileText, CheckCircle, AlertCircle } from 'lucide-react';

export default function ProfilePage({ onOpenAuth }) {
  const { currentUser, isMockMode } = useAuth();

  const [displayName, setDisplayName] = useState(currentUser?.display_name || '');
  const [collegeId, setCollegeId] = useState(currentUser?.college_id || '');
  const [campusLocation, setCampusLocation] = useState(currentUser?.campus_location || '');
  const [bio, setBio] = useState(currentUser?.bio || '');

  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState(null);

  if (!currentUser) {
    return (
      <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center max-w-md mx-auto space-y-4 shadow-sm my-12">
        <User className="w-12 h-12 text-slate-300 mx-auto" />
        <h2 className="text-xl font-bold text-slate-900">Sign In to View Profile</h2>
        <p className="text-xs text-slate-500">Manage your student credentials and campus location.</p>
        <button
          onClick={() => onOpenAuth('login')}
          className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-md cursor-pointer"
        >
          Sign In
        </button>
      </div>
    );
  }

  const handleUpdate = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      if (isMockMode) {
        currentUser.display_name = displayName.trim();
        currentUser.college_id = collegeId.trim() || null;
        currentUser.campus_location = campusLocation.trim() || null;
        currentUser.bio = bio.trim() || null;
        localStorage.setItem('reloop_current_user', JSON.stringify(currentUser));
      } else {
        await api.auth.updateProfile({
          display_name: displayName.trim(),
          college_id: collegeId.trim() || null,
          campus_location: campusLocation.trim() || null,
          bio: bio.trim() || null,
        });
      }
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      setError(err.message || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6 pb-20">
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
          Student Profile
        </h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Your campus identity on Reloop for listing items and placing bids
        </p>
      </div>

      {success && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center gap-3 text-xs text-emerald-800">
          <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0" />
          <span>Profile updated successfully!</span>
        </div>
      )}

      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl flex items-center gap-3 text-xs text-rose-800">
          <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Account Info Box */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-sm space-y-6">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-500 text-white font-black text-2xl flex items-center justify-center shadow-md">
            {currentUser.display_name.charAt(0).toUpperCase()}
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-900">{currentUser.display_name}</h2>
            <p className="text-xs text-slate-500 flex items-center gap-1.5 mt-0.5">
              <Mail className="w-3.5 h-3.5" />
              {currentUser.email}
            </p>
            <span className="text-[10px] text-slate-400 block mt-1">
              Member since {formatDateTime(currentUser.created_at)}
            </span>
          </div>
        </div>

        {/* Editable Fields */}
        <form onSubmit={handleUpdate} className="space-y-4 pt-4 border-t border-slate-100">
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Display Name
            </label>
            <div className="relative">
              <User className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
              <input
                type="text"
                required
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                College ID / Roll No.
              </label>
              <div className="relative">
                <BadgeCheck className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
                <input
                  type="text"
                  placeholder="2023-CS-042"
                  value={collegeId}
                  onChange={(e) => setCollegeId(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Campus Location / Hostel
              </label>
              <div className="relative">
                <MapPin className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
                <input
                  type="text"
                  placeholder="Hostel 4, Room 218"
                  value={campusLocation}
                  onChange={(e) => setCampusLocation(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Bio / Interests
            </label>
            <textarea
              rows={3}
              placeholder="Year, branch, or items you usually deal with..."
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              className="w-full px-4 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-sm transition-all cursor-pointer disabled:bg-slate-300"
          >
            {loading ? 'Saving...' : 'Save Profile Changes'}
          </button>
        </form>
      </div>
    </div>
  );
}
