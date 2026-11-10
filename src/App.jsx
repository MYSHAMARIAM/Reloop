import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { MockDataProvider, useMockData } from './context/MockDataContext';
import { ThemeProvider } from './context/ThemeContext';
import { api } from './api';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import MockBanner from './components/MockBanner';
import AuthModal from './components/AuthModal';
import PlaceBidModal from './components/PlaceBidModal';
import BuyNowModal from './components/BuyNowModal';

// Pages
import HomePage from './pages/HomePage';
import BrowseAuctionsPage from './pages/BrowseAuctionsPage';
import ListingDetailPage from './pages/ListingDetailPage';
import CreateListingPage from './pages/CreateListingPage';
import MyListingsPage from './pages/MyListingsPage';
import MyBidsPage from './pages/MyBidsPage';
import SellerDashboardPage from './pages/SellerDashboardPage';
import MyTransactionsPage from './pages/MyTransactionsPage';
import CheckoutPage from './pages/CheckoutPage';
import ProfilePage from './pages/ProfilePage';
import OfferBanner from './components/OfferBanner';

function MainApp() {
  const { isMockMode } = useAuth();
  const { listings: mockListings, mockApi } = useMockData();

  const [currentPage, setCurrentPage] = useState('home');
  const [selectedListingId, setSelectedListingId] = useState(null);
  const [checkoutTransactionId, setCheckoutTransactionId] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Global modals
  const [authModalTab, setAuthModalTab] = useState(null); // 'login', 'register', or null
  const [quickBidListing, setQuickBidListing] = useState(null);
  const [quickBuyListing, setQuickBuyListing] = useState(null);

  // Real or mock listings state
  const [liveListings, setLiveListings] = useState([]);
  const [loadingListings, setLoadingListings] = useState(false);

  const fetchListings = async ({ silent = false } = {}) => {
    if (isMockMode) return;
    try {
      if (!silent) setLoadingListings(true);
      const data = await api.listings.getAll({ status_filter: 'all' });
      setLiveListings(data);
    } catch (err) {
      console.warn('FastAPI backend not reachable, using empty live list:', err.message);
    } finally {
      if (!silent) setLoadingListings(false);
    }
  };

  useEffect(() => {
    fetchListings();
  }, [isMockMode]);

  // Keep prices, bid counts and live-auction numbers current without a page refresh:
  // poll every 10s while the tab is visible, and refresh as soon as the tab is re-opened.
  useEffect(() => {
    if (isMockMode) return;
    const refresh = () => {
      if (!document.hidden) fetchListings({ silent: true });
    };
    const timer = setInterval(refresh, 10000);
    document.addEventListener('visibilitychange', refresh);
    window.addEventListener('focus', refresh);
    return () => {
      clearInterval(timer);
      document.removeEventListener('visibilitychange', refresh);
      window.removeEventListener('focus', refresh);
    };
  }, [isMockMode]);

  const currentListings = isMockMode ? mockListings : liveListings;

  const navigateTo = (page, param = null) => {
    if (page === 'checkout') {
      setCheckoutTransactionId(param);
    }
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSelectListing = (id) => {
    setSelectedListingId(id);
    setCurrentPage('listing-detail');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans selection:bg-emerald-100 selection:text-emerald-900">
      {/* Top Banner explaining Preview vs Local Windows Backend */}
      <MockBanner />

      {/* Main Navbar */}
      <Navbar
        currentPage={currentPage}
        onNavigate={navigateTo}
        onOpenAuth={(tab) => setAuthModalTab(tab)}
        onSearch={(q) => {
          setSearchQuery(q);
          navigateTo('browse');
        }}
      />
            <OfferBanner onViewOffer={handleSelectListing} refreshKey={currentPage} />

      {/* Main Page Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        {currentPage === 'home' && (
          <HomePage
            listings={currentListings}
            onSelectListing={handleSelectListing}
            onNavigate={navigateTo}
            onQuickBid={(listing) => setQuickBidListing(listing)}
            onBuyNow={(listing) => setQuickBuyListing(listing)}
            onFilterCategory={(catId) => {
              setSelectedCategory(catId);
              navigateTo('browse');
            }}
          />
        )}

        {currentPage === 'browse' && (
          <BrowseAuctionsPage
            listings={currentListings}
            onSelectListing={handleSelectListing}
            onQuickBid={(listing) => setQuickBidListing(listing)}
            onBuyNow={(listing) => setQuickBuyListing(listing)}
            initialCategory={selectedCategory}
            initialSearchQuery={searchQuery}
          />
        )}

        {currentPage === 'listing-detail' && selectedListingId && (
          <ListingDetailPage
            listingId={selectedListingId}
            onBack={() => navigateTo('browse')}
            onNavigate={navigateTo}
            onOpenAuth={(tab) => setAuthModalTab(tab)}
          />
        )}

        {currentPage === 'sell' && (
          <CreateListingPage
            onNavigate={navigateTo}
            onCreated={() => fetchListings()}
            onOpenAuth={(tab) => setAuthModalTab(tab)}
          />
        )}

        {currentPage === 'my-listings' && (
          <MyListingsPage
            onNavigate={navigateTo}
            onSelectListing={handleSelectListing}
            onOpenAuth={(tab) => setAuthModalTab(tab)}
          />
        )}

        {currentPage === 'my-bids' && (
          <MyBidsPage
            onNavigate={navigateTo}
            onSelectListing={handleSelectListing}
            onOpenAuth={(tab) => setAuthModalTab(tab)}
            onStartCheckout={(txId) => navigateTo('checkout', txId)}
          />
        )}

        {currentPage === 'checkout' && (
          <CheckoutPage
            transactionId={checkoutTransactionId}
            onBack={() => navigateTo('my-bids')}
            onComplete={() => {
              fetchListings();
              navigateTo('transactions');
            }}
            onNavigate={navigateTo}
          />
        )}

        {currentPage === 'seller-dashboard' && (
          <SellerDashboardPage
            onNavigate={navigateTo}
            onSelectListing={handleSelectListing}
            onOpenAuth={(tab) => setAuthModalTab(tab)}
          />
        )}

        {currentPage === 'transactions' && (
          <MyTransactionsPage
            onNavigate={navigateTo}
            onOpenAuth={(tab) => setAuthModalTab(tab)}
          />
        )}

        {currentPage === 'profile' && (
          <ProfilePage
            onOpenAuth={(tab) => setAuthModalTab(tab)}
          />
        )}
      </main>

      {/* Footer */}
      <Footer onNavigate={navigateTo} />

      {/* Global Auth Modal */}
      {authModalTab && (
        <AuthModal
          initialTab={authModalTab}
          onClose={() => setAuthModalTab(null)}
        />
      )}

      {/* Global Buy Now confirmation */}
      {quickBuyListing && (
        <BuyNowModal
          listing={quickBuyListing}
          onClose={() => setQuickBuyListing(null)}
          onSuccess={(tx) => {
            setQuickBuyListing(null);
            fetchListings();
            navigateTo('checkout', tx.id);
          }}
          onOpenAuth={(tab) => setAuthModalTab(tab)}
        />
      )}

      {/* Global Quick Place Bid Modal */}
      {quickBidListing && (
        <PlaceBidModal
          listing={quickBidListing}
          onClose={() => setQuickBidListing(null)}
          onBidSuccess={() => {
            fetchListings();
          }}
          onOpenAuth={(tab) => setAuthModalTab(tab)}
        />
      )}
    </div>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <MockDataProvider>
        <AuthProvider>
          <MainApp />
        </AuthProvider>
      </MockDataProvider>
    </ThemeProvider>
  );
}
