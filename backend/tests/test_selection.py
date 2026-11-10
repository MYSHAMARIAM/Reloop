from datetime import datetime, timedelta
from app.models import Listing, BidderSelection, Transaction
from tests.conftest import login_user

def test_seller_selection_rules_and_highest_bidder_not_automatic(
    client, test_seller, test_bidder1, test_bidder2, db_session
):
    """
    Key Reloop Requirement:
    - Highest bidder is NOT automatically selected.
    - Seller can choose ANY eligible bidder (including lower bidder).
    - Cannot select before auction closes.
    """
    # 1. Seller creates listing
    seller_headers = login_user(client, "seller@college.edu", "SellerSecret123!")
    create_resp = client.post("/api/listings", json={
        "title": "Lab Oscilloscope Probe",
        "description": "100MHz probe with BNC connector.",
        "category": "lab_gear",
        "condition": "like_new",
        "starting_price_rupees": 1000.0,
        "min_increment_rupees": 100.0,
        "duration_hours": 1,
    }, headers=seller_headers)
    listing_id = create_resp.json()["id"]

    # 2. Bidder 1 bids ₹1000
    b1_headers = login_user(client, "bidder1@college.edu", "BidderOne123!")
    b1_resp = client.post(f"/api/listings/{listing_id}/bids", json={"amount_rupees": 1000.0}, headers=b1_headers)
    bid1_id = b1_resp.json()["id"]

    # 3. Bidder 2 bids ₹1200 (Highest Bidder)
    b2_headers = login_user(client, "bidder2@college.edu", "BidderTwo123!")
    b2_resp = client.post(f"/api/listings/{listing_id}/bids", json={"amount_rupees": 1200.0}, headers=b2_headers)
    bid2_id = b2_resp.json()["id"]

    # 4. A non-seller can never select a winner, even while bidding is open
    early_sel = client.post(
        f"/api/listings/{listing_id}/select-bidder",
        json={"bid_id": bid1_id},
        headers=b1_headers,
    )
    assert early_sel.status_code == 403

    # 5. Artificially close the auction by moving ends_at to past
    listing = db_session.query(Listing).filter(Listing.id == listing_id).first()
    listing.ends_at = datetime.utcnow() - timedelta(minutes=5)
    listing.status = "bidding_ended"
    db_session.add(listing)
    db_session.commit()

    # 6. Non-seller tries to select -> rejected
    unauth_sel = client.post(
        f"/api/listings/{listing_id}/select-bidder",
        json={"bid_id": bid1_id},
        headers=b1_headers,
    )
    assert unauth_sel.status_code == 403

    # 7. Seller intentionally selects Bidder 1 (LOWER bidder at ₹1000, not Bidder 2)
    sel_resp = client.post(
        f"/api/listings/{listing_id}/select-bidder",
        json={"bid_id": bid1_id},
        headers=seller_headers,
    )
    assert sel_resp.status_code == 201
    sel_data = sel_resp.json()
    assert sel_data["selected_bidder_id"] == test_bidder1.id
    assert sel_data["bid_amount_rupees"] == 1000.0
    assert sel_data["status"] == "pending"

def test_selected_bidder_acceptance_creates_transaction(
    client, test_seller, test_bidder1, db_session
):
    seller_headers = login_user(client, "seller@college.edu", "SellerSecret123!")
    create_resp = client.post("/api/listings", json={
        "title": "Electronics Sensor Pack",
        "description": "Temperature and humidity sensors.",
        "category": "sensors",
        "condition": "like_new",
        "starting_price_rupees": 400.0,
        "min_increment_rupees": 50.0,
        "duration_hours": 1,
    }, headers=seller_headers)
    listing_id = create_resp.json()["id"]

    # Bidder 1 bids
    b1_headers = login_user(client, "bidder1@college.edu", "BidderOne123!")
    bid_resp = client.post(f"/api/listings/{listing_id}/bids", json={"amount_rupees": 400.0}, headers=b1_headers)
    bid_id = bid_resp.json()["id"]

    # Fast forward to auction end
    listing = db_session.query(Listing).filter(Listing.id == listing_id).first()
    listing.ends_at = datetime.utcnow() - timedelta(minutes=1)
    db_session.commit()

    # Seller selects bidder 1
    sel_resp = client.post(
        f"/api/listings/{listing_id}/select-bidder",
        json={"bid_id": bid_id},
        headers=seller_headers,
    )
    selection_id = sel_resp.json()["id"]

    # Other student tries to respond -> rejected
    other_headers = login_user(client, "seller@college.edu", "SellerSecret123!")
    unauth_resp = client.post(
        f"/api/selections/{selection_id}/respond",
        json={"action": "accept"},
        headers=other_headers,
    )
    assert unauth_resp.status_code == 403

    # Selected bidder accepts offer
    accept_resp = client.post(
        f"/api/selections/{selection_id}/respond",
        json={"action": "accept"},
        headers=b1_headers,
    )
    assert accept_resp.status_code == 200

    # Verify listing is now reserved and transaction created
    detail = client.get(f"/api/listings/{listing_id}").json()
    assert detail["status"] == "reserved"
    assert detail["transaction"] is not None
    assert detail["transaction"]["status"] in ("awaiting_payment", "reserved")
    assert detail["transaction"]["final_amount_rupees"] == 400.0

def test_selected_bidder_decline_allows_reselection(
    client, test_seller, test_bidder1, test_bidder2, db_session
):
    seller_headers = login_user(client, "seller@college.edu", "SellerSecret123!")
    create_resp = client.post("/api/listings", json={
        "title": "Discrete Math Textbook",
        "description": "Rosen Discrete Mathematics textbook.",
        "category": "textbooks",
        "condition": "good",
        "starting_price_rupees": 600.0,
        "min_increment_rupees": 50.0,
        "duration_hours": 1,
    }, headers=seller_headers)
    listing_id = create_resp.json()["id"]

    # Both bidders bid
    b1_headers = login_user(client, "bidder1@college.edu", "BidderOne123!")
    b1 = client.post(f"/api/listings/{listing_id}/bids", json={"amount_rupees": 600.0}, headers=b1_headers).json()

    b2_headers = login_user(client, "bidder2@college.edu", "BidderTwo123!")
    b2 = client.post(f"/api/listings/{listing_id}/bids", json={"amount_rupees": 650.0}, headers=b2_headers).json()

    # Fast forward auction end
    listing = db_session.query(Listing).filter(Listing.id == listing_id).first()
    listing.ends_at = datetime.utcnow() - timedelta(minutes=1)
    db_session.commit()

    # Seller selects Bidder 2
    sel1 = client.post(f"/api/listings/{listing_id}/select-bidder", json={"bid_id": b2["id"]}, headers=seller_headers).json()

    # Bidder 2 declines
    decline_resp = client.post(
        f"/api/selections/{sel1['id']}/respond",
        json={"action": "decline"},
        headers=b2_headers,
    )
    assert decline_resp.status_code == 200

    # Seller can now select Bidder 1!
    sel2_resp = client.post(
        f"/api/listings/{listing_id}/select-bidder",
        json={"bid_id": b1["id"]},
        headers=seller_headers,
    )
    assert sel2_resp.status_code == 201
    assert sel2_resp.json()["selected_bidder_id"] == test_bidder1.id
