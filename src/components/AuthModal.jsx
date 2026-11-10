import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { X, Lock, Mail, User, MapPin, BadgeCheck, AlertCircle, ShieldCheck } from 'lucide-react';

export default function AuthModal({ initialTab = 'login', onClose }) {
  const { login, register, verifyOtp } = useAuth();
  const [tab, setTab] = useState(initialTab); 
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // OTP Flow State
  const [requireOtp, setRequireOtp] = useState(false);
  const [otpCode, setOtpCode] = useState('');

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
        const res = await login(email, password);
        
        // THIS IS THE CRITICAL CHECK
        if (res && res.require_otp) {
          setRequireOtp(true); 
        } else {
          onClose(); 
        }
      } else {
        await register({
          email, password, display_name: displayName,
          college_id: collegeId, campus_location: campusLocation, bio,
        });
        onClose();
      }
    } catch (err) {
      setError(err.message || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      await verifyOtp(email, otpCode.trim());
      onClose();
    } catch (err) {
      setError(err.message || 'Invalid OTP');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl relative my-8">
        <button onClick={onClose} className="absolute top-4 right-4 p-1 text-slate-400 hover:text-slate-600">
          <X className="w-5 h-5" />
        </button>

        {!requireOtp && (
          <div className="flex border-b border-slate-200 mb-6">
            <button type="button" onClick={() => { setTab('login'); setError(null); }} className={`flex-1 pb-3 text-sm font-bold ${tab === 'login' ? 'border-b-2 border-emerald-600 text-emerald-700' : 'text-slate-400'}`}>Student Login</button>
            <button type="button" onClick={() => { setTab('register'); setError(null); }} className={`flex-1 pb-3 text-sm font-bold ${tab === 'register' ? 'border-b-2 border-emerald-600 text-emerald-700' : 'text-slate-400'}`}>Create Account</button>
          </div>
        )}

        {error && (
          <div className="p-3 mb-4 bg-rose-50 border border-rose-200 rounded-xl flex items-start gap-2 text-xs text-rose-700">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
            <span>{error}</span>
          </div>
        )}
        {/* MAIN FORM */}
        {!requireOtp ? (
          <form onSubmit={handleSubmit} className="space-y-3.5">
            {tab === 'register' && (
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Full Display Name</label>
                <div className="relative">
                  <User className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                  <input type="text" required placeholder="e.g. Aarav Sharma" value={displayName} onChange={(e) => setDisplayName(e.target.value)} className="w-full pl-9 pr-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500" />
                </div>
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">College Email</label>
              <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="w-full px-3 py-2 text-sm border rounded-xl" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Password</label>
              <input type="password" required value={password} onChange={(e) => setPassword(e.target.value)} className="w-full px-3 py-2 text-sm border rounded-xl" />
            </div>

            {tab === 'register' && (
              <>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">College Roll / ID</label>
                    <div className="relative">
                      <BadgeCheck className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                      <input type="text" placeholder="2023-CS-042" value={collegeId} onChange={(e) => setCollegeId(e.target.value)} className="w-full pl-9 pr-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Campus Location</label>
                    <div className="relative">
                      <MapPin className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                      <input type="text" placeholder="Hostel 4, Block B" value={campusLocation} onChange={(e) => setCampusLocation(e.target.value)} className="w-full pl-9 pr-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500" />
                    </div>
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Short Bio (Optional)</label>
                  <textarea rows={2} placeholder="Year, branch, or items you usually deal with..." value={bio} onChange={(e) => setBio(e.target.value)} className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500" />
                </div>
              </>
            )}

            <button type="submit" disabled={loading} className="w-full py-2.5 mt-2 text-sm font-semibold text-white bg-emerald-600 rounded-xl">
              {loading ? 'Processing...' : tab === 'login' ? 'Sign In' : 'Create Account'}
            </button>
          </form>
        ) : (
          <form onSubmit={handleVerifyOtp} className="space-y-4 py-4">
            <div className="text-center space-y-2 mb-6">
              <ShieldCheck className="w-12 h-12 text-emerald-500 mx-auto" />
              <h3 className="text-lg font-bold text-slate-900">Security Check</h3>
              <p className="text-xs text-slate-500">We sent a code to <strong>{email}</strong>.</p>
            </div>
            
            <input 
              type="text" 
              placeholder="Enter 6-digit OTP" 
              value={otpCode} 
              onChange={e => setOtpCode(e.target.value)}
              className="w-full p-3 border rounded-xl text-center text-2xl font-mono" 
              maxLength={6}
              required 
            />
            
            <button type="submit" disabled={loading} className="w-full py-3 bg-emerald-600 text-white font-bold rounded-xl">
              {loading ? 'Verifying...' : 'Verify & Log In'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}