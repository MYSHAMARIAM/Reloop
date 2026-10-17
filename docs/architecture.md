# Reloop — System Architecture & Design Specification

## 1. Executive Summary

**Reloop** is a localized, student-to-student second-hand bidding marketplace tailored specifically for college campuses. It is architected for local execution on **Windows 11** with:
- **Frontend**: React (v19), Vite, Plain CSS & Tailwind CSS, JavaScript.
- **Backend**: Python (3.10+), FastAPI, Uvicorn ASGI server.
- **Database**: SQLite with SQLAlchemy 2.0 ORM (enforcing `PRAGMA foreign_keys = ON` and WAL mode).
- **Validation**: Pydantic v2 schemas.
- **Authentication**: Argon2 password hashing (`argon2-cffi`), signed timestamped sessions (`itsdangerous`), HttpOnly cookies, and CSRF protection.

---

## 2. Core Business Principles & Non-Goals

1. **No Automatic Winner Selection**:
   - In traditional auction platforms (like eBay), the highest bidder automatically wins upon clock expiration.
   - On **Reloop**, bidding close only marks the conclusion of competitive price submission. The **seller explicitly chooses** the winning student from the pool of eligible bidders.
   - A seller can intentionally pick a lower bidder (e.g., closer hostel block, convenient library pickup, junior student).
2. **Bidder Right of Refusal**:
   - The selected bidder receives an in-app invitation with an acceptance deadline (24 hours).
   - If accepted, the item becomes `reserved` and moves to the campus handover stage.
   - If declined or expired, the seller can select another eligible bidder.
3. **No Direct Buy-Now or Shopping Cart**:
   - All transactions originate through competitive bidding or negotiation.
4. **No Payments, Banking, or Payouts**:
   - Zero integration with payment gateways, credit cards, or UPI PINs.
   - Campus handovers are in-person peer-to-peer exchanges verified mutually by both students.
5. **Single Account Model**:
   - Every authenticated student can list items as a seller and place bids on other students' items.

---

## 3. Database Schema & Entities

The SQLite database schema is defined in `backend/app/models.py`:

```
┌─────────────────────────────────┐
│              User               │
├─────────────────────────────────┤
│ id (PK, Integer)                │
│ email (Unique, String)          │
│ display_name (String)           │
│ hashed_password (Argon2, String)│
│ college_id (String, Nullable)   │
│ campus_location (String)        │
│ is_active (Boolean)             │
│ created_at (DateTime, UTC)      │
└──────────────┬──────────────────┘
               │ 1:N
               ▼
┌─────────────────────────────────┐       1:N       ┌─────────────────────────────────┐
│             Listing             ├────────────────►│               Bid               │
├─────────────────────────────────┤                 ├─────────────────────────────────┤
│ id (PK, Integer)                │                 │ id (PK, Integer)                │
│ seller_id (FK -> User.id)       │                 │ listing_id (FK -> Listing.id)   │
│ title (String)                  │                 │ bidder_id (FK -> User.id)       │
│ description (Text)              │                 │ amount_paise (Integer, >0)      │
│ category (Enum/String)          │                 │ created_at (DateTime, UTC)      │
│ condition (String)              │                 └────────────────┬────────────────┘
│ starting_price_paise (Integer)  │                                  │ 1:1
│ min_increment_paise (Integer)   │                                  ▼
│ duration_hours (1..168, Integer)│       1:N       ┌─────────────────────────────────┐
│ status (active, ended, ...)     ├────────────────►│         BidderSelection         │
│ ends_at (DateTime, UTC)         │                 ├─────────────────────────────────┤
└──────────────┬──────────────────┘                 │ id (PK, Integer)                │
               │ 1:1                                │ listing_id (FK -> Listing.id)   │
               ▼                                    │ seller_id (FK -> User.id)       │
┌─────────────────────────────────┐                 │ selected_bidder_id (FK -> User) │
│           Transaction           │                 │ bid_id (FK -> Bid.id)           │
├─────────────────────────────────┤                 │ status (pending/accepted/...)   │
│ id (PK, Integer)                │                 │ expires_at (DateTime, UTC)      │
│ listing_id (FK -> Listing.id)   │                 └─────────────────────────────────┘
│ seller_id (FK -> User.id)       │
│ buyer_id (FK -> User.id)        │
│ final_amount_paise (Integer)    │
│ status (reserved/arranged/done) │
│ handover_venue (String)         │
│ handover_notes (Text)           │
│ seller_confirmed (Boolean)      │
│ buyer_confirmed (Boolean)       │
└─────────────────────────────────┘
```

### Exact Monetary Precision
All currency values are stored as **exact integer paise** (1 Rupee = 100 Paise).
This completely eliminates floating-point rounding inaccuracies.

---

## 4. State Machines

### 4.1 Auction Lifecycle
```
[ active ] ───(deadline passes)───► [ bidding_ended ]
    │                                      │
(withdrawn by seller)             (seller selects bidder & bidder accepts)
    ▼                                      ▼
[ withdrawn ]                         [ reserved ] ───(both confirm handover)───► [ sold ]
```

### 4.2 Seller Selection & Bidder Response
```
[ pending ] ───(bidder clicks Accept)───► [ accepted ]  ──► (Transaction Created, Item Reserved)
     │
     ├───(bidder clicks Decline)────────► [ declined ]  ──► (Seller can select another bidder)
     │
     └───(24h deadline expires)─────────► [ expired ]   ──► (Seller can select another bidder)
```

### 4.3 Handover Coordination
```
[ reserved ] ───(venue/schedule arranged)───► [ handover_arranged ]
                                                      │
                                          (both parties confirm)
                                                      ▼
                                                 [ completed ]
```

---

## 5. Security & Authentication Architecture

1. **Argon2id Hashing**:
   - `ph = PasswordHasher(time_cost=2, memory_cost=65536, parallelism=2)`.
   - Never exposes plaintext passwords or password hashes in logs or responses.
2. **HttpOnly Signed Sessions**:
   - Authenticated sessions are encoded using `itsdangerous.URLSafeTimedSerializer` with a cryptographic server secret key.
   - Stored in an `HttpOnly` browser cookie (`reloop_session`), preventing XSS exfiltration.
   - Configurable cookie flags: `SameSite=Lax`, `Secure` (auto-false on localhost HTTP, true on HTTPS).
3. **Cross-Site Request Forgery (CSRF) Protection**:
   - The server issues a signed, cryptographically generated token in a cookie (`reloop_csrf`).
   - The React client extracts this cookie and includes it as an `X-CSRF-Token` header on state-modifying requests (`POST`, `PUT`, `DELETE`).
   - The FastAPI backend validates token equivalence in `verify_csrf`.

---

## 6. Testing Strategy

1. **Frontend Testing**:
   - Executed using Vitest in the local Node.js environment.
   - Tests verify currency formatting, countdown logic, and minimum bid calculations.
2. **Backend Testing**:
   - Authored using `pytest` and `httpx.AsyncClient` / `TestClient`.
   - Uses an isolated in-memory SQLite database (`sqlite:///:memory:`) per test run.
   - 100% covers self-bidding rejection, minimum increment enforcement, deadline boundaries, seller selection autonomy, and mutual handover completion.
