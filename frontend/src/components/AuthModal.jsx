import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { X, Lock, Mail, User, MapPin, BadgeCheck, AlertCircle } from 'lucide-react';

export default function AuthModal({ initialTab = 'login', onClose }) {
  const { login, register, availableDemoUsers, switchDemoUser } = useAuth();
  const [tab, setTab] = useState(initialTab); // 'login' or 'register'
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Form states
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [collegeId, setCollegeId] = useState('');
  const [campusLocation, setCampusLocation] = useState('');
  const [bio, setBio] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (tab === 'login') {
        await login(email, password);
      } else {
        await register({
          email,
          password,
          display_name: displayName,
          college_id: collegeId,
          campus_location: campusLocation,
          bio,
        });
      }
      onClose();
    } catch (err) {
      setError(err.message || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickDemoUser = (user) => {
    switchDemoUser(user);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl relative animate-in fade-in zoom-in-95 duration-150 my-8">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Tab Switcher */}
        <div className="flex border-b border-slate-200 mb-6">
          <button
            type="button"
            onClick={() => {
              setTab('login');
              setError(null);
            }}
            className={`flex-1 pb-3 text-sm font-bold text-center transition-colors border-b-2 cursor-pointer ${
              tab === 'login'
                ? 'border-emerald-600 text-emerald-700'
                : 'border-transparent text-slate-400 hover:text-slate-600'
            }`}
          >
            Student Login
          </button>
          <button
            type="button"
            onClick={() => {
              setTab('register');
              setError(null);
            }}
            className={`flex-1 pb-3 text-sm font-bold text-center transition-colors border-b-2 cursor-pointer ${
              tab === 'register'
                ? 'border-emerald-600 text-emerald-700'
                : 'border-transparent text-slate-400 hover:text-slate-600'
            }`}
          >
            Create Account
          </button>
        </div>

        {error && (
          <div className="p-3 mb-4 bg-rose-50 border border-rose-200 rounded-xl flex items-start gap-2 text-xs text-rose-700">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-500" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3.5">
          {tab === 'register' && (
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Full Display Name
              </label>
              <div className="relative">
                <User className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                <input
                  type="text"
                  required
                  placeholder="e.g. Aarav Sharma"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              College Email
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
              <input
                type="email"
                required
                placeholder="student@campus.edu"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Password {tab === 'register' && '(min 8 characters)'}
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
              <input
                type="password"
                required
                minLength={8}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>

          {tab === 'register' && (
            <>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    College Roll / ID
                  </label>
                  <div className="relative">
                    <BadgeCheck className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                    <input
                      type="text"
                      placeholder="2023-CS-042"
                      value={collegeId}
                      onChange={(e) => setCollegeId(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Campus Location
                  </label>
                  <div className="relative">
                    <MapPin className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Hostel 4, Block B"
                      value={campusLocation}
                      onChange={(e) => setCampusLocation(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Short Bio (Optional)
                </label>
                <textarea
                  rows={2}
                  placeholder="Year, branch, or items you usually deal with..."
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 mt-2 text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-md shadow-emerald-600/20 transition-all cursor-pointer disabled:bg-slate-300"
          >
            {loading ? 'Processing...' : tab === 'login' ? 'Sign In' : 'Create Student Account'}
          </button>
        </form>

        {/* Demo Personas for Quick Presentation Testing */}
        {availableDemoUsers && availableDemoUsers.length > 0 && (
          <div className="mt-6 pt-5 border-t border-slate-100">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2 text-center">
              Quick Demo Personas (1-Click Login)
            </p>
            <div className="grid grid-cols-2 gap-2">
              {availableDemoUsers.slice(0, 4).map((u) => (
                <button
                  key={u.id}
                  type="button"
                  onClick={() => handleQuickDemoUser(u)}
                  className="p-2 text-left bg-slate-50 hover:bg-emerald-50 hover:border-emerald-200 border border-slate-200 rounded-xl transition-all cursor-pointer text-xs"
                >
                  <span className="font-bold text-slate-800 block truncate">
                    {u.display_name}
                  </span>
                  <span className="text-[10px] text-slate-500 truncate block">
                    {u.campus_location || u.email}
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
