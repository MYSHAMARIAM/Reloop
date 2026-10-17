# Reloop — College Second-Hand Bidding Marketplace

A lightweight, local college marketplace designed for peer-to-peer bidding and safe on-campus handovers. Built specifically for **Windows 11 local execution** with zero external cloud dependencies, zero paid APIs, and zero payment gateways.

---

## Technology Stack

- **Frontend**: React (v19), Vite, Plain CSS & Tailwind CSS, JavaScript.
- **Backend**: Python 3.10+, FastAPI, Uvicorn ASGI server.
- **Database**: SQLite with SQLAlchemy ORM (WAL mode, foreign key enforcement).
- **Validation**: Pydantic v2 schemas.
- **Authentication**: Argon2 password hashing (`argon2-cffi`), signed timestamped sessions (`itsdangerous`), HttpOnly cookies, and CSRF protection headers.
- **Testing**:
  - Frontend: Vitest suite (executable in web preview & locally).
  - Backend: Pytest suite with isolated in-memory test database (for Windows local execution).

---

## Project Structure

```
Reloop_New/
│
├── README.md                   # Complete local setup and execution guide
├── .gitignore                  # Git exclusions for venv, pycache, and SQLite databases
├── .env.example                # Template configuration parameters
├── run_backend.bat             # 1-Click Windows launcher for FastAPI (port 8000)
├── run_frontend.bat            # 1-Click Windows launcher for Vite React (port 5173)
│
├── backend/                    # Python FastAPI Backend
│   ├── requirements.txt        # Backend dependencies (FastAPI, SQLAlchemy, Argon2, etc.)
│   ├── run_server.py           # Convenience launcher for Uvicorn
│   ├── app/
│   │   ├── __init__.py
│   │   ├── main.py             # FastAPI entry point, CORS, and lifespan
│   │   ├── config.py           # Cross-platform Pathlib settings & secrets
│   │   ├── db.py               # SQLite engine, WAL mode, session factory
│   │   ├── models.py           # SQLAlchemy User, Listing, Bid, Selection, Transaction models
│   │   ├── schemas.py          # Pydantic validation schemas
│   │   ├── auth.py             # Argon2 hasher, signed session cookies, CSRF protection
│   │   ├── seed_demo.py        # Realistic college demo data seeder
│   │   ├── services/
│   │   │   ├── __init__.py
│   │   │   ├── auction_service.py   # State synchronization & minimum bid math
│   │   │   ├── bidding_service.py   # Atomic bid placement & seller winner selection
│   │   │   └── handover_service.py  # Meetup venue tracking & mutual confirmation
│   │   └── routes/
│   │       ├── __init__.py
│   │       ├── auth_routes.py       # Register, login, logout, profile
│   │       ├── listings_routes.py   # Create, search, filter, browse listings
│   │       ├── bids_routes.py       # Place bid, seller selection, bidder response
│   │       ├── dashboard_routes.py  # User dashboards (My Listings, Bids, Seller metrics)
│   │       └── transactions_routes.py # Handover meetup coordination & mutual confirmation
│   ├── data/                   # SQLite database directory (excluded from git)
│   └── tests/                  # Pytest test suite
│       ├── __init__.py
│       ├── conftest.py         # Isolated in-memory SQLite fixtures & mock users
│       ├── test_auth.py        # Argon2, duplicate emails, sessions, secrecy
│       ├── test_listings.py    # Price validation, duration range, filtering
│       ├── test_bidding.py     # Self-bidding rejection, minimum increments, deadlines
│       ├── test_selection.py   # Non-automatic winner selection, decline, re-selection
│       └── test_transactions.py # Handover venue coordination & mutual confirmation
│
├── frontend/                   # React Vite Frontend (Standalone Export)
│   ├── package.json            # Frontend npm dependencies and scripts
│   ├── vite.config.js          # Vite config
│   ├── index.html              # Frontend HTML entry point
│   ├── src/
│   │   ├── main.jsx            # React root mount
│   │   ├── App.jsx             # Top-level page router & global state
│   │   ├── api.js              # Authoritative API client (fetch + credentials + CSRF)
│   │   ├── index.css           # Global typography and Tailwind styles
│   │   ├── components/         # Reusable UI components
│   │   │   ├── Navbar.jsx
│   │   │   ├── Footer.jsx
│   │   │   ├── MockBanner.jsx
│   │   │   ├── AuctionCard.jsx
│   │   │   ├── CountdownTimer.jsx
│   │   │   ├── PlaceBidModal.jsx
│   │   │   ├── StatusBadge.jsx
│   │   │   └── AuthModal.jsx
│   │   ├── pages/              # Primary application views
│   │   │   ├── HomePage.jsx
│   │   │   ├── BrowseAuctionsPage.jsx
│   │   │   ├── ListingDetailPage.jsx
│   │   │   ├── CreateListingPage.jsx
│   │   │   ├── MyListingsPage.jsx
│   │   │   ├── MyBidsPage.jsx
│   │   │   ├── SellerDashboardPage.jsx
│   │   │   ├── MyTransactionsPage.jsx
│   │   │   └── ProfilePage.jsx
│   │   ├── context/
│   │   │   ├── AuthContext.jsx
│   │   │   └── MockDataContext.jsx
│   │   └── utils/
│   │       ├── currency.js     # Currency formatter & minimum bid calculation
│   │       ├── time.js         # Countdown formatter
│   │       └── validators.js   # Category & condition constants
│   └── tests/                  # Vitest frontend tests
│       ├── biddingRules.test.js
│       ├── currency.test.js
│       └── time.test.js
│
└── docs/
    ├── architecture.md         # Detailed system architecture & schema specifications
    └── demo-guide.md           # Step-by-step evaluator presentation guide with sample personas
```

---

## Local Windows 11 Execution Guide

Follow these exact steps after downloading/exporting to your Windows machine (e.g., at `D:\Rimsha\Reloop_New`):

### Prerequisites on Windows
1. **Python 3.10 or newer** installed (ensure *"Add python.exe to PATH"* was checked during install).
2. **Node.js 18+ and npm** installed.

---

### Option A: 1-Click Launchers (Recommended)
1. Double click **`run_backend.bat`**.
   - Creates the backend virtual environment if needed, installs `requirements.txt`, preserves the existing SQLite database, seeds demo data if needed, and starts Uvicorn on **`http://127.0.0.1:8000`**.
2. Double click **`run_frontend.bat`**.
   - Installs npm packages if needed and launches the API-connected React app on **`http://127.0.0.1:5173`**.
3. Open your browser to **`http://localhost:5173`**.
   - Local mode uses the FastAPI backend by default. The browser preview toggle is for mock data only.

---

### Option B: Manual Command Line Execution

#### Step 1: Start the Backend (Terminal 1)
```cmd
cd D:\Rimsha\biddingloop\reloop--bidding\backend
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
python run_server.py
```
*Backend runs on `http://127.0.0.1:8000`.*
*Swagger API Docs: `http://127.0.0.1:8000/docs`.*

#### Step 2: Start the Frontend (Terminal 2)
```cmd
cd D:\Rimsha\biddingloop\reloop--bidding
npm install
npm run dev
```
*Frontend runs on `http://localhost:5173`.*

---

## Running Automated Tests

### 1. Frontend Tests (Vitest)
Can be run both in this environment and locally on Windows:
```cmd
npm test
```
*Tests coverage: Currency math, minimum bid calculations, countdown timers, and duration presets.*

### 2. Backend Tests (Pytest)
Run locally in your Windows terminal inside the Python virtual environment:
```cmd
cd D:\Rimsha\biddingloop\reloop--bidding\backend
.venv\Scripts\activate
pytest -v
```
*Tests coverage:*
- Registration, Argon2 password hashing, and duplicate email prevention.
- Valid bids, minimum increments, and deadline enforcement.
- Self-bidding rejection.
- Seller winner selection (highest bidder not automatically chosen).
- Selected bidder accept/decline workflows.
- Mutual in-person campus handover confirmation.

---

## Preview Mode vs Production Mode

- **Browser Preview Mode**: Uses in-browser demo data for visual previews. It is not the complete persisted workflow.
- **Windows Local Setup**: The frontend starts in FastAPI mode and uses SQLite persistence, Argon2 password hashing, and HttpOnly session cookies. The banner can switch to mock preview mode when needed.

---

## Pre-Seeded Demo Accounts

Password for all accounts: **`CampusPass2026!`**

1. **`rohit.verma@campus.edu`** (Seller of TI-84 and Raspberry Pi 4)
2. **`aarav.sharma@campus.edu`** (Electrical Engg, Seller of Arduino Starter Kit)
3. **`priya.nair@campus.edu`** (Computer Science, Active Bidder)
4. **`ananya.sen@campus.edu`** (Robotics Club, Selected Bidder)

College affiliation and college ID are optional for new registrations. For a short presentation auction, create a listing in FastAPI mode and choose **Presentation demo duration** (2, 5, or 10 minutes). The regular duration choices remain 1 hour through 7 days.

### Repeatable live demo

1. Start both launchers and log in as `rohit.verma@campus.edu` with password `CampusPass2026!`.
2. Open **Seller Dashboard** and select the pre-seeded ended Raspberry Pi auction. It already has bids from Aarav, Ananya, and Priya; select Ananya's bid to show that the seller chooses the buyer.
3. Log out and log in as `ananya.sen@campus.edu`. Open **My Bids**, accept Rohit's offer, then complete the checkout using the clearly labelled simulated payment success or failure action. No payment credentials are entered.
4. For nearby handover, choose a meeting point during checkout. Log back in as Rohit, open **Transactions**, and mark the item ready. Log in as Ananya and confirm receipt.
5. Alternatively, choose simulated delivery, log in as Rohit, and advance each delivery status in **Transactions**. Log in as Ananya at **Delivered** and confirm receipt.
6. The order timeline and **Order Received Successfully!** message appear only when the backend confirms completion.
