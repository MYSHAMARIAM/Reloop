# Changes in this update

1. **Dark / light mode** – toggle (sun/moon) in the navbar and mobile menu; remembers your choice, follows your OS setting the first time, no flash on load. (`ThemeContext`, `ThemeToggle`, `index.css`)
2. **Live auction count** – Home counts auctions that are active AND not past their deadline, re-checked every second; listings refresh from the server every 10 s.
3. **Buy Now on listings** – cards on Home and Browse show the Buy Now price and a *Buy Now* button (not shown to the seller or on auction-only items). Confirmation dialog, then straight to checkout. (`AuctionCard`, `BuyNowModal`)
4. **Seller dashboard is live** – refreshes every 8 s (instantly in demo mode), shows current bid / bid count / countdown / Buy Now price per auction, and a *Live Bid Activity* feed. Backend `seller-overview` now also returns `recent_bids` and `summary.total_bids`.
5. **Real date & time** – root cause: the backend sends UTC timestamps without a "Z", so browsers read them as local time (5 h 30 m off in India). All `*_at` fields are now parsed as UTC (`utils/time.js`, applied in `api.js`). Added a live clock (navbar / status bar).
6. **Professional home page** – shorter hero, illustrated collage on the right, rotating "thought on auctions", "Auctions done properly" section. The word "bidding" removed from user-facing text.

Demo data: two seeded listings now have a Buy Now price. For the real backend, delete `backend/data/reloop.db` once so it re-seeds (or create a listing with a Buy Now price on the Sell page).
