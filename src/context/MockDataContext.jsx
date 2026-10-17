/**
 * Development-Only In-Browser Mock Store for AI Studio Preview.
 *
 * NOTE: This mock is strictly separated from the authoritative FastAPI backend.
 * It is only active in the AI Studio preview environment where Python cannot execute.
 * When exported to Windows, the application connects directly to http://127.0.0.1:8000.
 */
import React, { createContext, useContext, useState, useEffect } from 'react';
import { calculateNextMinimumBid } from '../utils/currency';

const MockDataContext = createContext();

const INITIAL_MOCK_USERS = [
  {
    id: 1,
    email: 'rohit.verma@campus.edu',
    display_name: 'Rohit Verma',
    college_id: '2022-ME-088',
    campus_location: 'Hostel 7, Room 102',
    bio: 'Final year Mechanical. Selling lab gear and calculators before graduation.',
    created_at: new Date(Date.now() - 86400000 * 30).toISOString(),
  },
  {
    id: 2,
    email: 'aarav.sharma@campus.edu',
    display_name: 'Aarav Sharma',
    college_id: '2023-EE-042',
    campus_location: 'Hostel 4, Room 218',
    bio: '3rd Year Electrical Engg. Robotics and sensor enthusiast.',
    created_at: new Date(Date.now() - 86400000 * 20).toISOString(),
  },
  {
    id: 3,
    email: 'priya.nair@campus.edu',
    display_name: 'Priya Nair',
    college_id: '2024-CS-115',
    campus_location: 'Block A, Room 304',
    bio: '2nd Year CS undergrad. Always looking for good algorithm textbooks.',
    created_at: new Date(Date.now() - 86400000 * 15).toISOString(),
  },
  {
    id: 4,
    email: 'ananya.sen@campus.edu',
    display_name: 'Ananya Sen',
    college_id: '2023-EC-059',
    campus_location: 'Girls Hostel 2, Room 112',
    bio: 'Electronics & Comm. Robotics club member.',
    created_at: new Date(Date.now() - 86400000 * 10).toISOString(),
  },
];

const INITIAL_MOCK_LISTINGS = [
  {
    id: 1,
    seller_id: 1,
    seller_name: 'Rohit Verma',
    seller_location: 'Hostel 7, Room 102',
    title: 'Texas Instruments TI-84 Plus CE Graphing Calculator',
    description: 'Hardly used for 2 semesters of calculus and linear algebra. Screen protector installed since day 1. Includes USB charging cable and quick-start reference guide.',
    category: 'calculators',
    condition: 'like_new',
    starting_price_paise: 350000,
    min_increment_paise: 10000,
    starting_price_rupees: 3500.0,
    min_increment_rupees: 100.0,
    current_highest_bid_paise: 380000,
    current_highest_bid_rupees: 3800.0,
    next_minimum_bid_paise: 390000,
    next_minimum_bid_rupees: 3900.0,
    bid_count: 3,
    duration_hours: 48,
    image_url: 'https://images.unsplash.com/photo-1594980596870-8aa52a78d8cd?w=800&auto=format&fit=crop&q=80',
    status: 'active',
    created_at: new Date(Date.now() - 3600000 * 12).toISOString(),
    ends_at: new Date(Date.now() + 3600000 * 36).toISOString(),
    is_ended: false,
    seconds_remaining: 3600 * 36,
  },
  {
    id: 2,
    seller_id: 2,
    seller_name: 'Aarav Sharma',
    seller_location: 'Hostel 4, Room 218',
    title: 'Arduino Uno Rev3 Ultimate Starter Kit with 30+ Sensors',
    description: 'Complete Arduino kit including Uno R3, breadboard, ultrasonic distance sensor, HC-05 Bluetooth module, servo motor, stepper motor with driver, LEDs, resistors, and jumper wire bundle.',
    category: 'robotics',
    condition: 'good',
    starting_price_paise: 120000,
    min_increment_paise: 5000,
    starting_price_rupees: 1200.0,
    min_increment_rupees: 50.0,
    current_highest_bid_paise: 130000,
    current_highest_bid_rupees: 1300.0,
    next_minimum_bid_paise: 135000,
    next_minimum_bid_rupees: 1350.0,
    bid_count: 2,
    duration_hours: 72,
    image_url: 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=800&auto=format&fit=crop&q=80',
    status: 'active',
    created_at: new Date(Date.now() - 3600000 * 20).toISOString(),
    ends_at: new Date(Date.now() + 3600000 * 52).toISOString(),
    is_ended: false,
    seconds_remaining: 3600 * 52,
  },
  {
    id: 3,
    seller_id: 3,
    seller_name: 'Priya Nair',
    seller_location: 'Block A, Room 304',
    title: 'Introduction to Algorithms (CLRS 4th Edition) Hardcover',
    description: 'The classic MIT Press algorithm textbook. Clean pages, no highlighting or margin scribbles. Essential for Data Structures & Algorithms course and campus interview prep.',
    category: 'textbooks',
    condition: 'like_new',
    starting_price_paise: 180000,
    min_increment_paise: 10000,
    starting_price_rupees: 1800.0,
    min_increment_rupees: 100.0,
    current_highest_bid_paise: null,
    current_highest_bid_rupees: null,
    next_minimum_bid_paise: 180000,
    next_minimum_bid_rupees: 1800.0,
    bid_count: 0,
    duration_hours: 24,
    image_url: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=800&auto=format&fit=crop&q=80',
    status: 'active',
    created_at: new Date(Date.now() - 3600000 * 4).toISOString(),
    ends_at: new Date(Date.now() + 3600000 * 20).toISOString(),
    is_ended: false,
    seconds_remaining: 3600 * 20,
  },
  {
    id: 4,
    seller_id: 1,
    seller_name: 'Rohit Verma',
    seller_location: 'Hostel 7, Room 102',
    title: 'Raspberry Pi 4 Model B (4GB RAM) with Aluminium Heatsink Case',
    description: 'Bidding has concluded! Used for a final year IoT capstone project. Includes 32GB SanDisk Extreme MicroSD card pre-imaged with Raspberry Pi OS and 5V 3A USB-C official power adapter.',
    category: 'electronics',
    condition: 'good',
    starting_price_paise: 280000,
    min_increment_paise: 10000,
    starting_price_rupees: 2800.0,
    min_increment_rupees: 100.0,
    current_highest_bid_paise: 320000,
    current_highest_bid_rupees: 3200.0,
    next_minimum_bid_paise: 330000,
    next_minimum_bid_rupees: 3300.0,
    bid_count: 3,
    duration_hours: 24,
    image_url: 'https://images.unsplash.com/photo-1629654297299-c8506221ca97?w=800&auto=format&fit=crop&q=80',
    status: 'bidding_ended',
    created_at: new Date(Date.now() - 3600000 * 30).toISOString(),
    ends_at: new Date(Date.now() - 3600000 * 6).toISOString(),
    is_ended: true,
    seconds_remaining: 0,
  },
  {
    id: 5,
    seller_id: 4,
    seller_name: 'Ananya Sen',
    seller_location: 'Girls Hostel 2, Room 112',
    title: 'Rotring Rapid Pro Drafting Mechanical Pencil Set (0.5mm & 0.7mm)',
    description: 'All-metal hexagonal body technical drafting pencils with knurled grip. Includes extra 2B lead tubes and replacement erasers. Reserved for campus meetup handover.',
    category: 'stationery',
    condition: 'like_new',
    starting_price_paise: 90000,
    min_increment_paise: 5000,
    starting_price_rupees: 900.0,
    min_increment_rupees: 50.0,
    current_highest_bid_paise: 95000,
    current_highest_bid_rupees: 950.0,
    next_minimum_bid_paise: 100000,
    next_minimum_bid_rupees: 1000.0,
    bid_count: 1,
    duration_hours: 12,
    image_url: 'https://images.unsplash.com/photo-1583485088034-697b5bc54ccd?w=800&auto=format&fit=crop&q=80',
    status: 'reserved',
    created_at: new Date(Date.now() - 3600000 * 40).toISOString(),
    ends_at: new Date(Date.now() - 3600000 * 28).toISOString(),
    is_ended: true,
    seconds_remaining: 0,
  },
];

const INITIAL_MOCK_BIDS = [
  // Listing 1
  { id: 1, listing_id: 1, bidder_id: 3, bidder_name: 'Priya Nair', amount_paise: 350000, amount_rupees: 3500.0, created_at: new Date(Date.now() - 3600000 * 10).toISOString() },
  { id: 2, listing_id: 1, bidder_id: 4, bidder_name: 'Ananya Sen', amount_paise: 360000, amount_rupees: 3600.0, created_at: new Date(Date.now() - 3600000 * 6).toISOString() },
  { id: 3, listing_id: 1, bidder_id: 3, bidder_name: 'Priya Nair', amount_paise: 380000, amount_rupees: 3800.0, created_at: new Date(Date.now() - 3600000 * 2).toISOString() },
  // Listing 2
  { id: 4, listing_id: 2, bidder_id: 3, bidder_name: 'Priya Nair', amount_paise: 120000, amount_rupees: 1200.0, created_at: new Date(Date.now() - 3600000 * 18).toISOString() },
  { id: 5, listing_id: 2, bidder_id: 1, bidder_name: 'Rohit Verma', amount_paise: 130000, amount_rupees: 1300.0, created_at: new Date(Date.now() - 3600000 * 12).toISOString() },
  // Listing 4 (Ended auction with bids)
  { id: 6, listing_id: 4, bidder_id: 2, bidder_name: 'Aarav Sharma', amount_paise: 280000, amount_rupees: 2800.0, created_at: new Date(Date.now() - 3600000 * 25).toISOString() },
  { id: 7, listing_id: 4, bidder_id: 4, bidder_name: 'Ananya Sen', amount_paise: 300000, amount_rupees: 3000.0, created_at: new Date(Date.now() - 3600000 * 18).toISOString() },
  { id: 8, listing_id: 4, bidder_id: 3, bidder_name: 'Priya Nair', amount_paise: 320000, amount_rupees: 3200.0, created_at: new Date(Date.now() - 3600000 * 10).toISOString() },
  // Listing 5 (Reserved)
  { id: 9, listing_id: 5, bidder_id: 2, bidder_name: 'Aarav Sharma', amount_paise: 95000, amount_rupees: 950.0, created_at: new Date(Date.now() - 3600000 * 30).toISOString() },
];

const INITIAL_MOCK_SELECTIONS = [
  {
    id: 1,
    listing_id: 5,
    seller_id: 4,
    selected_bidder_id: 2,
    selected_bidder_name: 'Aarav Sharma',
    bid_id: 9,
    bid_amount_paise: 95000,
    bid_amount_rupees: 950.0,
    status: 'accepted',
    selected_at: new Date(Date.now() - 3600000 * 26).toISOString(),
    expires_at: new Date(Date.now() - 3600000 * 2).toISOString(),
    response_at: new Date(Date.now() - 3600000 * 24).toISOString(),
    seconds_remaining_to_respond: 0,
  },
];

const INITIAL_MOCK_TRANSACTIONS = [
  {
    id: 1,
    listing_id: 5,
    listing_title: 'Rotring Rapid Pro Drafting Mechanical Pencil Set (0.5mm & 0.7mm)',
    seller_id: 4,
    seller_name: 'Ananya Sen',
    buyer_id: 2,
    buyer_name: 'Aarav Sharma',
    final_amount_paise: 95000,
    final_amount_rupees: 950.0,
    status: 'handover_arranged',
    handover_venue: 'Central Library Lawn, Table 3',
    handover_notes: 'Meet at 4:30 PM after Digital Circuits lab.',
    scheduled_meetup_at: new Date(Date.now() + 3600000 * 4).toISOString(),
    seller_confirmed: false,
    buyer_confirmed: true,
    created_at: new Date(Date.now() - 3600000 * 24).toISOString(),
    completed_at: null,
  },
];

export function MockDataProvider({ children }) {
  const [users, setUsers] = useState(() => {
    const saved = localStorage.getItem('reloop_mock_users');
    return saved ? JSON.parse(saved) : INITIAL_MOCK_USERS;
  });

  const [listings, setListings] = useState(() => {
    const saved = localStorage.getItem('reloop_mock_listings');
    return saved ? JSON.parse(saved) : INITIAL_MOCK_LISTINGS;
  });

  const [bids, setBids] = useState(() => {
    const saved = localStorage.getItem('reloop_mock_bids');
    return saved ? JSON.parse(saved) : INITIAL_MOCK_BIDS;
  });

  const [selections, setSelections] = useState(() => {
    const saved = localStorage.getItem('reloop_mock_selections');
    return saved ? JSON.parse(saved) : INITIAL_MOCK_SELECTIONS;
  });

  const [transactions, setTransactions] = useState(() => {
    const saved = localStorage.getItem('reloop_mock_transactions');
    return saved ? JSON.parse(saved) : INITIAL_MOCK_TRANSACTIONS;
  });

  useEffect(() => {
    localStorage.setItem('reloop_mock_users', JSON.stringify(users));
  }, [users]);

  useEffect(() => {
    localStorage.setItem('reloop_mock_listings', JSON.stringify(listings));
  }, [listings]);

  useEffect(() => {
    localStorage.setItem('reloop_mock_bids', JSON.stringify(bids));
  }, [bids]);

  useEffect(() => {
    localStorage.setItem('reloop_mock_selections', JSON.stringify(selections));
  }, [selections]);

  useEffect(() => {
    localStorage.setItem('reloop_mock_transactions', JSON.stringify(transactions));
  }, [transactions]);

  // Reset to initial demo state
  const resetDemoData = () => {
    setUsers(INITIAL_MOCK_USERS);
    setListings(INITIAL_MOCK_LISTINGS);
    setBids(INITIAL_MOCK_BIDS);
    setSelections(INITIAL_MOCK_SELECTIONS);
    setTransactions(INITIAL_MOCK_TRANSACTIONS);
    localStorage.removeItem('reloop_mock_users');
    localStorage.removeItem('reloop_mock_listings');
    localStorage.removeItem('reloop_mock_bids');
    localStorage.removeItem('reloop_mock_selections');
    localStorage.removeItem('reloop_mock_transactions');
  };

  // Mock API methods
  const mockApi = {
    getAllListings: ({ q, category, condition, status_filter, sort_by } = {}) => {
      let filtered = [...listings];
      const now = new Date().toISOString();

      if (status_filter === 'all_active' || status_filter === 'active') {
        filtered = filtered.filter(l => l.status === 'active' && l.ends_at > now);
      } else if (status_filter && status_filter !== 'all') {
        filtered = filtered.filter(l => l.status === status_filter);
      }

      if (category) {
        filtered = filtered.filter(l => l.category === category);
      }

      if (condition) {
        filtered = filtered.filter(l => l.condition === condition);
      }

      if (q) {
        const query = q.toLowerCase();
        filtered = filtered.filter(l => l.title.toLowerCase().includes(query) || l.description.toLowerCase().includes(query));
      }

      if (sort_by === 'newest') {
        filtered.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
      } else if (sort_by === 'ending_soon') {
        filtered.sort((a, b) => new Date(a.ends_at) - new Date(b.ends_at));
      } else if (sort_by === 'price_asc') {
        filtered.sort((a, b) => a.starting_price_rupees - b.starting_price_rupees);
      } else if (sort_by === 'price_desc') {
        filtered.sort((a, b) => b.starting_price_rupees - a.starting_price_rupees);
      }

      return Promise.resolve(filtered);
    },

    getListingById: (id) => {
      const listing = listings.find(l => l.id === Number(id));
      if (!listing) return Promise.reject(new Error('Listing not found'));

      const listingBids = bids.filter(b => b.listing_id === Number(id)).sort((a, b) => b.amount_rupees - a.amount_rupees);
      const activeSel = selections.find(s => s.listing_id === Number(id) && s.status === 'pending');
      const tx = transactions.find(t => t.listing_id === Number(id));

      return Promise.resolve({
        ...listing,
        bids: listingBids,
        active_selection: activeSel || null,
        transaction: tx || null,
      });
    },

    createListing: (payload, currentUser) => {
      if (!currentUser) return Promise.reject(new Error('Authentication required'));

      const now = new Date();
      const endsAt = new Date(now.getTime() + payload.duration_hours * 3600000);

      const newListing = {
        id: Date.now(),
        seller_id: currentUser.id,
        seller_name: currentUser.display_name,
        seller_location: currentUser.campus_location,
        title: payload.title,
        description: payload.description,
        category: payload.category,
        condition: payload.condition,
        starting_price_paise: Math.round(payload.starting_price_rupees * 100),
        min_increment_paise: Math.round(payload.min_increment_rupees * 100),
        starting_price_rupees: payload.starting_price_rupees,
        min_increment_rupees: payload.min_increment_rupees,
        current_highest_bid_paise: null,
        current_highest_bid_rupees: null,
        next_minimum_bid_paise: Math.round(payload.starting_price_rupees * 100),
        next_minimum_bid_rupees: payload.starting_price_rupees,
        bid_count: 0,
        duration_hours: payload.duration_hours,
        image_url: payload.image_url || null,
        status: 'active',
        created_at: now.toISOString(),
        ends_at: endsAt.toISOString(),
        is_ended: false,
        seconds_remaining: payload.duration_hours * 3600,
      };

      setListings(prev => [newListing, ...prev]);
      return Promise.resolve(newListing);
    },

    placeBid: (listingId, amountRupees, currentUser) => {
      if (!currentUser) return Promise.reject(new Error('Please log in to place a bid.'));

      const listing = listings.find(l => l.id === Number(listingId));
      if (!listing) return Promise.reject(new Error('Listing not found.'));

      if (listing.seller_id === currentUser.id) {
        return Promise.reject(new Error('Sellers are prohibited from bidding on their own listings.'));
      }

      if (listing.status !== 'active' || new Date(listing.ends_at) <= new Date()) {
        return Promise.reject(new Error('Bidding deadline has passed or auction is closed.'));
      }

      const nextMin = calculateNextMinimumBid(
        listing.starting_price_rupees,
        listing.current_highest_bid_rupees,
        listing.min_increment_rupees
      );

      if (amountRupees < nextMin) {
        return Promise.reject(new Error(`Bid amount ₹${amountRupees.toFixed(2)} is below the required minimum ₹${nextMin.toFixed(2)}.`));
      }

      const newBid = {
        id: Date.now(),
        listing_id: Number(listingId),
        bidder_id: currentUser.id,
        bidder_name: currentUser.display_name,
        amount_paise: Math.round(amountRupees * 100),
        amount_rupees: amountRupees,
        created_at: new Date().toISOString(),
      };

      setBids(prev => [newBid, ...prev]);

      // Update listing
      setListings(prev => prev.map(l => {
        if (l.id === Number(listingId)) {
          const nextNextMin = amountRupees + l.min_increment_rupees;
          return {
            ...l,
            current_highest_bid_paise: Math.round(amountRupees * 100),
            current_highest_bid_rupees: amountRupees,
            next_minimum_bid_paise: Math.round(nextNextMin * 100),
            next_minimum_bid_rupees: nextNextMin,
            bid_count: l.bid_count + 1,
          };
        }
        return l;
      }));

      return Promise.resolve(newBid);
    },

    selectBidder: (listingId, bidId, currentUser) => {
      const listing = listings.find(l => l.id === Number(listingId));
      if (!listing) return Promise.reject(new Error('Listing not found'));

      if (listing.seller_id !== currentUser.id) {
        return Promise.reject(new Error('Only the seller can select a winning bidder.'));
      }

      const chosenBid = bids.find(b => b.id === Number(bidId));
      if (!chosenBid) return Promise.reject(new Error('Bid not found.'));

      const newSelection = {
        id: Date.now(),
        listing_id: Number(listingId),
        seller_id: currentUser.id,
        selected_bidder_id: chosenBid.bidder_id,
        selected_bidder_name: chosenBid.bidder_name,
        bid_id: chosenBid.id,
        bid_amount_paise: chosenBid.amount_paise,
        bid_amount_rupees: chosenBid.amount_rupees,
        status: 'pending',
        selected_at: new Date().toISOString(),
        expires_at: new Date(Date.now() + 86400000).toISOString(),
        response_at: null,
        seconds_remaining_to_respond: 86400,
      };

      setSelections(prev => [newSelection, ...prev]);
      return Promise.resolve(newSelection);
    },

    respondToSelection: (selectionId, action, currentUser) => {
      const sel = selections.find(s => s.id === Number(selectionId));
      if (!sel) return Promise.reject(new Error('Selection offer not found.'));

      if (sel.selected_bidder_id !== currentUser.id) {
        return Promise.reject(new Error('Only the selected bidder can accept or decline this offer.'));
      }

      if (action === 'decline') {
        setSelections(prev => prev.map(s => s.id === sel.id ? { ...s, status: 'declined', response_at: new Date().toISOString() } : s));
        return Promise.resolve({ message: 'You have declined the offer. The seller can select another bidder.' });
      } else if (action === 'accept') {
        const nowIso = new Date().toISOString();
        setSelections(prev => prev.map(s => s.id === sel.id ? { ...s, status: 'accepted', response_at: nowIso } : s));
        
        // Update listing to reserved
        setListings(prev => prev.map(l => l.id === sel.listing_id ? { ...l, status: 'reserved' } : l));

        // Create transaction
        const targetListing = listings.find(l => l.id === sel.listing_id);
        const newTx = {
          id: Date.now(),
          listing_id: sel.listing_id,
          listing_title: targetListing ? targetListing.title : 'Item',
          seller_id: sel.seller_id,
          seller_name: targetListing ? targetListing.seller_name : 'Seller',
          buyer_id: currentUser.id,
          buyer_name: currentUser.display_name,
          final_amount_paise: sel.bid_amount_paise,
          final_amount_rupees: sel.bid_amount_rupees,
          status: 'reserved',
          handover_venue: null,
          handover_notes: null,
          scheduled_meetup_at: null,
          seller_confirmed: false,
          buyer_confirmed: false,
          created_at: nowIso,
          completed_at: null,
        };

        setTransactions(prev => [newTx, ...prev]);
        return Promise.resolve({ message: 'Offer accepted! Item is reserved. You can now coordinate handover.' });
      }
    },

    arrangeHandover: (txId, { handover_venue, handover_notes, scheduled_meetup_at }) => {
      setTransactions(prev => prev.map(t => {
        if (t.id === Number(txId)) {
          return {
            ...t,
            handover_venue,
            handover_notes,
            scheduled_meetup_at,
            status: t.status === 'reserved' ? 'handover_arranged' : t.status,
          };
        }
        return t;
      }));
      return Promise.resolve({ message: 'Handover details updated.' });
    },

    confirmHandover: (txId, currentUser) => {
      let isFullyCompleted = false;
      let targetListingId = null;

      setTransactions(prev => prev.map(t => {
        if (t.id === Number(txId)) {
          targetListingId = t.listing_id;
          const isSeller = t.seller_id === currentUser.id;
          const isBuyer = t.buyer_id === currentUser.id;

          const sellerConf = isSeller ? true : t.seller_confirmed;
          const buyerConf = isBuyer ? true : t.buyer_confirmed;
          isFullyCompleted = sellerConf && buyerConf;

          return {
            ...t,
            seller_confirmed: sellerConf,
            buyer_confirmed: buyerConf,
            status: isFullyCompleted ? 'completed' : t.status,
            completed_at: isFullyCompleted ? new Date().toISOString() : null,
          };
        }
        return t;
      }));

      if (isFullyCompleted && targetListingId) {
        setListings(prev => prev.map(l => l.id === targetListingId ? { ...l, status: 'sold' } : l));
      }

      return Promise.resolve({ message: 'Handover confirmation recorded.' });
    },

    getMyListings: (currentUser) => {
      if (!currentUser) return Promise.resolve([]);
      return Promise.resolve(listings.filter(l => l.seller_id === currentUser.id));
    },

    getMyBids: (currentUser) => {
      if (!currentUser) return Promise.resolve([]);
      const myBids = bids.filter(b => b.bidder_id === currentUser.id);
      const uniqueListingIds = [...new Set(myBids.map(b => b.listing_id))];

      const results = uniqueListingIds.map(lid => {
        const listing = listings.find(l => l.id === lid);
        const userBids = myBids.filter(b => b.listing_id === lid);
        const pendingSel = selections.find(s => s.listing_id === lid && s.selected_bidder_id === currentUser.id && s.status === 'pending');

        return {
          listing,
          my_bids: userBids,
          my_highest_bid_rupees: Math.max(...userBids.map(b => b.amount_rupees)),
          selection_invitation: pendingSel || null,
          action_required: Boolean(pendingSel),
        };
      });

      return Promise.resolve(results);
    },

    getSellerOverview: (currentUser) => {
      if (!currentUser) return Promise.resolve({ summary: {}, active_auctions: [], ended_awaiting_decision: [], pending_bidder_responses: [], reserved_items: [], completed_sales: [], unsold_auctions: [] });

      const myListings = listings.filter(l => l.seller_id === currentUser.id);
      const now = new Date().toISOString();

      const active = [];
      const awaitingDecision = [];
      const pendingResponses = [];
      const reserved = [];
      const completed = [];
      const unsold = [];

      myListings.forEach(l => {
        if (l.status === 'active' && l.ends_at > now) {
          active.push(l);
        } else if (l.status === 'reserved') {
          reserved.push(l);
        } else if (l.status === 'sold') {
          completed.push(l);
        } else {
          // Bidding ended
          const pendingSel = selections.find(s => s.listing_id === l.id && s.status === 'pending');
          if (pendingSel) {
            pendingResponses.push({ listing: l, selection: pendingSel });
          } else if (l.bid_count > 0) {
            awaitingDecision.push(l);
          } else {
            unsold.push(l);
          }
        }
      });

      return Promise.resolve({
        summary: {
          total_listings: myListings.length,
          active_count: active.length,
          awaiting_decision_count: awaitingDecision.length,
          pending_response_count: pendingResponses.length,
          reserved_count: reserved.length,
          completed_count: completed.length,
          unsold_count: unsold.length,
        },
        active_auctions: active,
        ended_awaiting_decision: awaitingDecision,
        pending_bidder_responses: pendingResponses,
        reserved_items: reserved,
        completed_sales: completed,
        unsold_auctions: unsold,
      });
    },

    getMyTransactions: (currentUser) => {
      if (!currentUser) return Promise.resolve([]);
      return Promise.resolve(transactions.filter(t => t.seller_id === currentUser.id || t.buyer_id === currentUser.id));
    },
  };

  return (
    <MockDataContext.Provider value={{ users, listings, bids, selections, transactions, mockApi, resetDemoData }}>
      {children}
    </MockDataContext.Provider>
  );
}

export function useMockData() {
  return useContext(MockDataContext);
}
