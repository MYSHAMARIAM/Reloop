# Reloop — College Project Demonstration Guide

Use this guide for a 5–10 minute live presentation of Reloop to project evaluators or professors.

---

## 1. Demo Credentials

All demo accounts share the password: **`CampusPass2026!`**

| Name | Role in Demo | Email | Campus Location |
| :--- | :--- | :--- | :--- |
| **Rohit Verma** | Seller (TI-84 & Raspberry Pi) | `rohit.verma@campus.edu` | Hostel 7, Room 102 |
| **Aarav Sharma** | Seller & Competing Bidder | `aarav.sharma@campus.edu` | Hostel 4, Room 218 |
| **Priya Nair** | High Bidder | `priya.nair@campus.edu` | Block A, Room 304 |
| **Ananya Sen** | Lower Bidder (Selected by Rohit) | `ananya.sen@campus.edu` | Girls Hostel 2, Room 112 |

*(Tip: In the web preview, use the **Persona Switcher** dropdown in the top bar to switch students with 1 click without re-typing passwords!)*

---

## 2. Step-by-Step Demonstration Flow

### Scene 1: The Problem & Value Proposition (1 minute)
1. Start both launchers and open `http://localhost:5173`. FastAPI mode is enabled by default locally.
2. Point out the core college categories: Textbooks, Graphing Calculators, Arduino/Robotics, Sensors, Drafting Stationery, and Lab Equipment.
3. Explain why eBay or Olx don't work for campuses:
   - Shipping is slow and costs extra.
   - High platform commissions.
   - Commercial sellers spam listings.
   - Fixed prices don't account for true student demand.

---

### Scene 2: Live Bidding & Minimum Increment Enforcement (2 minutes)
1. Click **Browse Auctions** and select **"Texas Instruments TI-84 Plus CE Graphing Calculator"**.
2. Notice the current price and minimum next bid.
3. Log in as **Priya Nair** (`priya.nair@campus.edu`, password `CampusPass2026!`) and click **Place Bid**.
4. Demonstrate validation:
   - Try to enter an amount lower than the minimum required increment: **System immediately stops it**.
   - Enter a valid bid (e.g. ₹3,900): **Bid is registered**.
5. Log out and log in as **Rohit Verma** (the seller):
   - Click Place Bid: Notice the warning that **self-bidding is strictly prohibited**.

---

### Scene 3: The Core Innovation — Seller Selects Winner (3 minutes)
1. Log in as **Rohit Verma**.
2. Navigate to **Seller Dashboard** or open the **"Raspberry Pi 4 Model B (4GB RAM)"** auction (where bidding has ended).
3. Point out that there are 3 bids:
   - Priya Nair bid **₹3,200** (Highest Bid).
   - Ananya Sen bid **₹3,000** (Lower Bid).
   - Aarav Sharma bid **₹2,800**.
4. **Demonstrate Reloop's Key Principle**:
   - The highest bidder is **NOT automatically the winner**.
   - Rohit wants to sell to **Ananya Sen** because she lives in the same engineering quad and can pick it up today.
   - Click **"Select This Bidder"** next to Ananya Sen.
   - An invitation is dispatched with a response timer.

---

### Scene 4: Bidder Right of Refusal (2 minutes)
1. Log out and log in as **Ananya Sen** (`ananya.sen@campus.edu`, password `CampusPass2026!`).
2. Notice the top banner: **"Action Required: You Have Been Chosen as Winner!"**
3. Open **My Bids**: Ananya sees the invitation from Rohit for the Raspberry Pi at ₹3,000.
4. Click **"Accept Offer"**.
   *(Note: If she clicked Decline, Rohit would be allowed to select Priya or Aarav instead!)*
5. Checkout opens for the order. Choose nearby handover or simulated delivery, then run the successful payment simulation. You can try the failure simulation first; the order remains unpaid and can be retried.

---

### Scene 5: Campus Handover & Mutual Confirmation (2 minutes)
1. Open **Transactions** and point out the order reference, demo payment reference, and saved status timeline.
2. Log in as Rohit and click **Mark item ready for handover**.
3. Log in as Ananya, inspect the Raspberry Pi, and click **Confirm receipt**.
4. The backend marks the order complete and the listing **Sold**. **Order Received Successfully!** appears only after that response.

For the distant delivery branch, choose **Simulated Platform Delivery** at checkout. Rohit advances the order through Dispatched, In transit, Out for delivery, and Delivered; Ananya confirms receipt. No courier is connected.

---

## 3. Anticipated Viva / Examiner Questions

**Q1: Why did you use SQLite instead of Firebase or PostgreSQL?**
> *Answer:* Reloop is designed for offline, zero-cost, localized institutional deployments. SQLite runs self-contained without needing Docker, cloud bills, or external network connectivity. It is configured with WAL (Write-Ahead Logging) and enforced foreign keys for ACID compliance.

**Q2: How do you prevent race conditions when two students place a bid simultaneously?**
> *Answer:* The local single-worker API serializes bid validation through commit. Each request checks the server-side deadline and current highest bid before recording the next valid bid.

**Q3: How are passwords secured?**
> *Answer:* Using Argon2id (`argon2-cffi`), the winner of the Password Hashing Competition. It is memory-hard and computationally resistant to GPU/ASIC cracking. Plain passwords never touch session storage.

**Q4: Why does the highest bidder not automatically win?**
> *Answer:* In college marketplaces, physical proximity, trusted peer reputation, and timing are often more important than an extra ₹50. Giving sellers explicit selection authority eliminates no-shows and ghosting.
