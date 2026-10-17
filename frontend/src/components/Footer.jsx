import React from 'react';
import { RefreshCw, ShieldCheck, MapPin, Gavel } from 'lucide-react';

export default function Footer({ onNavigate }) {
  return (
    <footer className="bg-slate-900 text-slate-400 pt-12 pb-8 border-t border-slate-800 text-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 pb-8 border-b border-slate-800">
          {/* Brand info */}
          <div className="space-y-3 md:col-span-1">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-emerald-500 flex items-center justify-center text-white font-bold">
                <RefreshCw className="w-4 h-4" />
              </div>
              <span className="text-lg font-bold text-white tracking-tight">Reloop</span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              Local college second-hand bidding marketplace. Transparent bidding, seller-chosen winners, and safe on-campus handovers.
            </p>
          </div>

          {/* Quick links */}
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-200 mb-3">Marketplace</h4>
            <ul className="space-y-2 text-xs">
              <li>
                <button onClick={() => onNavigate('browse')} className="hover:text-emerald-400 transition-colors">
                  Browse Active Auctions
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('sell')} className="hover:text-emerald-400 transition-colors">
                  Sell an Item
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('my-bids')} className="hover:text-emerald-400 transition-colors">
                  My Bid History
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('seller-dashboard')} className="hover:text-emerald-400 transition-colors">
                  Seller Decision Dashboard
                </button>
              </li>
            </ul>
          </div>

          {/* College Core Rules */}
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-200 mb-3">Marketplace Principles</h4>
            <ul className="space-y-2 text-xs">
              <li className="flex items-center gap-2 text-slate-300">
                <Gavel className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span>Seller selects winner (not automatic)</span>
              </li>
              <li className="flex items-center gap-2 text-slate-300">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span>Selected bidder accepts or declines</span>
              </li>
              <li className="flex items-center gap-2 text-slate-300">
                <MapPin className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span>Mutual campus meetup & handover</span>
              </li>
            </ul>
          </div>

          {/* Technical Architecture */}
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-200 mb-3">Architecture</h4>
            <p className="text-xs text-slate-400 leading-relaxed">
              Standalone local full-stack system. React + Vite frontend, Python FastAPI + Uvicorn backend, SQLite database with SQLAlchemy ORM, and Argon2 password hashing.
            </p>
            <div className="mt-3 inline-block px-2 py-1 bg-slate-800 text-[11px] font-mono text-emerald-300 rounded border border-slate-700">
              Windows 11 Local Environment
            </div>
          </div>
        </div>

        <div className="pt-6 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-2">
          <p>© {new Date().getFullYear()} Reloop. College Second-Hand Marketplace. Built for academic demonstration.</p>
          <p className="text-slate-400">Strictly non-commercial peer-to-peer campus exchange.</p>
        </div>
      </div>
    </footer>
  );
}
