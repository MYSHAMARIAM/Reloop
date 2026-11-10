import React from 'react';
import { RefreshCw, Mail, MapPin, ExternalLink, ShieldCheck } from 'lucide-react';

export default function Footer({ onNavigate }) {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-slate-900 border-t border-slate-800 text-slate-300 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          
          {/* 1. About Reloop */}
          <div className="space-y-4">
            <button
              onClick={() => onNavigate('home')}
              className="flex items-center gap-2.5 text-left group cursor-pointer"
            >
              <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center text-white">
                <RefreshCw className="w-4 h-4" />
              </div>
              <span className="text-xl font-bold tracking-tight text-white group-hover:text-emerald-400 transition-colors">
                Reloop
              </span>
            </button>
            <p className="text-sm text-slate-400 leading-relaxed">
              The trusted peer-to-peer marketplace for college students. Buy, bid, and pass down campus essentials safely within your verified student network.
            </p>
            <div className="flex items-center gap-2 text-xs font-semibold text-emerald-500 bg-emerald-500/10 w-fit px-2.5 py-1 rounded-md border border-emerald-500/20">
              <ShieldCheck className="w-3.5 h-3.5" />
              Student Verified Platform
            </div>
          </div>

          {/* 2. Quick Links */}
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">Quick Links</h3>
            <ul className="space-y-2.5 text-sm">
              <li>
                <button onClick={() => onNavigate('browse')} className="hover:text-emerald-400 transition-colors">
                  Browse Auctions
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('sell')} className="hover:text-emerald-400 transition-colors">
                  Sell an Item
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('seller-dashboard')} className="hover:text-emerald-400 transition-colors">
                  Seller Dashboard
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('transactions')} className="hover:text-emerald-400 transition-colors">
                  Orders & Handover
                </button>
              </li>
            </ul>
          </div>

          {/* 3. Help & Support */}
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">Help & Support</h3>
            <ul className="space-y-2.5 text-sm text-slate-400">
              <li className="hover:text-emerald-400 transition-colors cursor-pointer flex items-center gap-1.5">
                How Auctions Work <ExternalLink className="w-3 h-3" />
              </li>
              <li className="hover:text-emerald-400 transition-colors cursor-pointer flex items-center gap-1.5">
                Safe Campus Handover Guide <ExternalLink className="w-3 h-3" />
              </li>
              <li className="hover:text-emerald-400 transition-colors cursor-pointer flex items-center gap-1.5">
                Terms of Service <ExternalLink className="w-3 h-3" />
              </li>
              <li className="hover:text-emerald-400 transition-colors cursor-pointer flex items-center gap-1.5">
                Privacy Policy <ExternalLink className="w-3 h-3" />
              </li>
            </ul>
          </div>

          {/* 4. Contact Us */}
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">Contact Us</h3>
            <ul className="space-y-3 text-sm text-slate-400">
              <li className="flex items-start gap-2">
                <Mail className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                <span>support@reloop.edu</span>
              </li>
              <li className="flex items-start gap-2">
                <MapPin className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                <span>Student Activity Center<br/>University Campus</span>
              </li>
            </ul>
          </div>

        </div>

        {/* Bottom Bar: Copyright */}
        <div className="mt-12 pt-8 border-t border-slate-800 flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <p>© {currentYear} Reloop Campus Auctions. All rights reserved.</p>
          <p>Built for the student community.</p>
        </div>
      </div>
    </footer>
  );
}