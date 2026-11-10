import React from 'react';
import { useAuth } from '../context/AuthContext';
import { useMockData } from '../context/MockDataContext';
import { Server, Users, RefreshCw, AlertCircle, CheckCircle2 } from 'lucide-react';
import LiveClock from './LiveClock';

export default function MockBanner() {
  const { isMockMode, toggleMockMode, backendStatus, currentUser, switchDemoUser, availableDemoUsers } = useAuth();
  const { resetDemoData } = useMockData();

  return (
    <div className="bg-slate-900 text-slate-100 text-xs border-b border-slate-800">
      <div className="max-w-7xl mx-auto px-4 py-2 flex flex-wrap items-center justify-between gap-3">
        {/* Left: Environment Info */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-slate-800 border border-slate-700">
            <Server className="w-3.5 h-3.5 text-emerald-400" />
            <span className="font-semibold text-slate-200">
              {isMockMode ? 'Browser Preview Mode' : 'FastAPI Local API Mode'}
            </span>
          </div>

          <span className="text-slate-400 hidden md:inline">|</span>

          <span className="text-slate-300">
            {isMockMode ? (
              <span>
                <strong className="text-amber-300">Simulated Data Active</strong> for AI Studio browser preview.
                Windows local setup runs on <code className="bg-slate-800 px-1 py-0.5 rounded text-emerald-300">http://127.0.0.1:8000</code>.
              </span>
            ) : (
              <span>
                Connecting directly to FastAPI backend.
                {backendStatus === 'connected' ? (
                  <span className="text-emerald-400 font-medium ml-1 inline-flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" /> Uvicorn Online
                  </span>
                ) : (
                  <span className="text-rose-400 font-medium ml-1 inline-flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" /> Uvicorn Offline (start backend/run_server.py)
                  </span>
                )}
              </span>
            )}
          </span>
        </div>

        {/* Right: Quick Controls & Demo Persona Switcher */}
        <div className="flex items-center gap-3 flex-wrap">
          <LiveClock variant="inline" className="2xl:hidden text-slate-300" />
          {/* Demo User Switcher */}
          {isMockMode && availableDemoUsers && (
            <div className="flex items-center gap-1.5 bg-slate-800/80 px-2 py-1 rounded border border-slate-700">
              <Users className="w-3.5 h-3.5 text-indigo-400" />
              <span className="text-slate-400">Persona:</span>
              <select
                aria-label="Persona selector"
                value={currentUser?.email || ''}
                onChange={(e) => {
                  const target = availableDemoUsers.find(u => u.email === e.target.value);
                  if (target) switchDemoUser(target);
                }}
                className="bg-slate-900 text-slate-200 border-none text-xs rounded px-1.5 py-0.5 focus:ring-1 focus:ring-emerald-500 cursor-pointer"
              >
                {availableDemoUsers.map(u => (
                  <option key={u.id} value={u.email}>
                    {u.display_name} ({u.email.split('@')[0]})
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Reset Demo Data */}
          {isMockMode && (
            <button
              onClick={resetDemoData}
              title="Reset mock data to fresh demo state"
              className="text-slate-400 hover:text-white flex items-center gap-1 hover:bg-slate-800 px-2 py-1 rounded transition-colors"
            >
              <RefreshCw className="w-3 h-3" />
              Reset Demo
            </button>
          )}

          {/* Toggle Button */}
          <button
            onClick={() => toggleMockMode(!isMockMode)}
            className={`px-2.5 py-1 rounded font-medium text-xs transition-colors border ${
              isMockMode
                ? 'bg-emerald-600/20 text-emerald-300 border-emerald-500/40 hover:bg-emerald-600/30'
                : 'bg-amber-600/20 text-amber-300 border-amber-500/40 hover:bg-amber-600/30'
            }`}
          >
            Switch to {isMockMode ? 'FastAPI Backend' : 'Mock Preview'}
          </button>
        </div>
      </div>
    </div>
  );
}
