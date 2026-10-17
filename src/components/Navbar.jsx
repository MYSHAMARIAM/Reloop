import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  Menu,
  X,
  Search,
  PlusCircle,
  Gavel,
  Package,
  Layers,
  LayoutDashboard,
  Handshake,
  User,
  LogOut,
  LogIn,
  RefreshCw,
} from 'lucide-react';

export default function Navbar({ onNavigate, currentPage, onOpenAuth, onSearch }) {
  const { currentUser, logout } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (onSearch) {
      onSearch(searchQuery);
    }
    onNavigate('browse');
  };

  const navItem = (pageKey, label, icon) => {
    const isActive = currentPage === pageKey;
    const Icon = icon;
    return (
      <button
        onClick={() => {
          onNavigate(pageKey);
          setMobileMenuOpen(false);
        }}
        className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors cursor-pointer ${
          isActive
            ? 'bg-emerald-50 text-emerald-700'
            : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
        }`}
      >
        {Icon && <Icon className="w-4 h-4" />}
        {label}
      </button>
    );
  };

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-4">
          {/* Brand Logo */}
          <div className="flex items-center gap-6">
            <button
              onClick={() => onNavigate('home')}
              className="flex items-center gap-2.5 text-left group cursor-pointer"
            >
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center text-white shadow-md shadow-emerald-500/20 group-hover:scale-105 transition-transform">
                <RefreshCw className="w-5 h-5" />
              </div>
              <div>
                <span className="text-xl font-bold tracking-tight text-slate-900 group-hover:text-emerald-700 transition-colors">
                  Reloop
                </span>
                <span className="block text-[10px] uppercase tracking-wider font-semibold text-emerald-600 -mt-1">
                  College Bids
                </span>
              </div>
            </button>

            {/* Desktop Navigation Links */}
            <nav className="hidden lg:flex items-center gap-1">
              {navItem('browse', 'Browse Auctions', Gavel)}
              {navItem('sell', 'Sell an Item', PlusCircle)}
            </nav>
          </div>

          {/* Search Bar */}
          <form
            onSubmit={handleSearchSubmit}
            className="hidden md:flex flex-1 max-w-md items-center relative"
          >
            <Search className="w-4 h-4 absolute left-3.5 text-slate-400 pointer-events-none" />
            <input
              type="text"
              placeholder="Search textbooks, calculators, Arduino, sensors..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 text-sm bg-slate-50 border border-slate-200 rounded-full focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-all text-slate-800 placeholder-slate-400"
            />
          </form>

          {/* User Status & Action Buttons */}
          <div className="hidden lg:flex items-center gap-2">
            {currentUser ? (
              <div className="flex items-center gap-1.5">
                {navItem('my-bids', 'My Bids', Gavel)}
                {navItem('my-listings', 'My Listings', Package)}
                {navItem('seller-dashboard', 'Dashboard', LayoutDashboard)}
                {navItem('transactions', 'Orders & Handover', Handshake)}
                
                {/* Profile Pill */}
                <button
                  onClick={() => onNavigate('profile')}
                  className={`flex items-center gap-2 pl-2 pr-3 py-1.5 ml-1 rounded-full border text-xs font-semibold cursor-pointer transition-colors ${
                    currentPage === 'profile'
                      ? 'bg-emerald-100 border-emerald-300 text-emerald-800'
                      : 'bg-slate-100 border-slate-200 text-slate-700 hover:bg-slate-200'
                  }`}
                  title={currentUser.email}
                >
                  <div className="w-6 h-6 rounded-full bg-emerald-600 text-white flex items-center justify-center text-xs font-bold">
                    {currentUser.display_name.charAt(0).toUpperCase()}
                  </div>
                  <span className="truncate max-w-[120px]">{currentUser.display_name}</span>
                </button>

                <button
                  onClick={logout}
                  title="Logout"
                  className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => onOpenAuth('login')}
                  className="px-4 py-2 text-sm font-semibold text-slate-700 hover:text-slate-900 hover:bg-slate-50 rounded-lg transition-colors cursor-pointer"
                >
                  Log in
                </button>
                <button
                  onClick={() => onOpenAuth('register')}
                  className="px-4 py-2 text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-sm shadow-emerald-600/30 transition-all cursor-pointer"
                >
                  Register
                </button>
              </div>
            )}
          </div>

          {/* Mobile Hamburger Button */}
          <div className="flex lg:hidden items-center gap-2">
            <button
              onClick={() => onNavigate('sell')}
              className="p-2 text-emerald-700 bg-emerald-50 rounded-lg"
              title="Sell an Item"
            >
              <PlusCircle className="w-5 h-5" />
            </button>
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 text-slate-600 hover:text-slate-900 rounded-lg hover:bg-slate-100"
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="lg:hidden border-t border-slate-200 bg-white px-4 pt-3 pb-6 space-y-3 shadow-xl animate-in slide-in-from-top duration-200">
          <form onSubmit={handleSearchSubmit} className="relative mb-2">
            <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
            <input
              type="text"
              placeholder="Search items..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </form>

          <div className="space-y-1">
            {navItem('home', 'Home', RefreshCw)}
            {navItem('browse', 'Browse Auctions', Gavel)}
            {navItem('sell', 'Sell an Item', PlusCircle)}
            
            {currentUser ? (
              <>
                <div className="pt-2 pb-1 border-t border-slate-100">
                  <p className="px-3 text-xs font-semibold uppercase tracking-wider text-slate-400">
                    My Account ({currentUser.display_name})
                  </p>
                </div>
                {navItem('my-listings', 'My Listings', Package)}
                {navItem('my-bids', 'My Bids', Gavel)}
                {navItem('seller-dashboard', 'Seller Dashboard', LayoutDashboard)}
                {navItem('transactions', 'My Transactions & Handover', Handshake)}
                {navItem('profile', 'My Profile', User)}
                
                <button
                  onClick={() => {
                    logout();
                    setMobileMenuOpen(false);
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium text-rose-600 hover:bg-rose-50 cursor-pointer"
                >
                  <LogOut className="w-4 h-4" />
                  Logout
                </button>
              </>
            ) : (
              <div className="pt-3 border-t border-slate-100 flex flex-col gap-2">
                <button
                  onClick={() => {
                    onOpenAuth('login');
                    setMobileMenuOpen(false);
                  }}
                  className="w-full py-2.5 text-center text-sm font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg"
                >
                  Log in
                </button>
                <button
                  onClick={() => {
                    onOpenAuth('register');
                    setMobileMenuOpen(false);
                  }}
                  className="w-full py-2.5 text-center text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-sm"
                >
                  Register Student Account
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
