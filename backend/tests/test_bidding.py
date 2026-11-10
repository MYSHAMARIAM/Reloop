from datetime import datetime, timedelta
from app.models import Listing
from tests.conftest import login_user

def test_reject_self_bidding(client, test_seller):
    # Seller creates listing
    seller_headers = login_user(client, "seller@college.edu", "SellerSecret123!")
    create_resp = client.post("/api/listings", json={
        "title": "Digital Multimeter",
        "description": "Lab testing equipment for electronics.",
        "category": "lab_gear",
        "condition": "good",
        "starting_price_rupees": 500.0,
        "min_increment_rupees": 50.0,
        "duration_hours": 24,
    }, headers=seller_headers)
    listing_id = create_resp.json()["id"]

    # Seller tries to bid on own listing -> must be rejected
    bid_resp = client.post(
        f"/api/listings/{listing_id}/bids",
        json={"amount_rupees": 500.0},
        headers=seller_headers,
    )
    assert bid_resp.status_code == 400
    assert "cannot place bids on their own" in bid_resp.json()["detail"]

def test_valid_bids_and_minimum_increment_enforcement(client, test_seller, test_bidder1, test_bidder2):
    # 1. Seller creates listing: starting ₹500, min increment ₹50
    seller_headers = login_user(client, "seller@college.edu", "SellerSecret123!")
    create_resp = client.post("/api/listings", json={
        "title": "Robotics Sensor Shield",
        "description": "Shield for Arduino Uno with pull-up resistors.",
        "category": "robotics",
        "condition": "like_new",
        "starting_price_rupees": 500.0,
        "min_increment_rupees": 50.0,
        "duration_hours": 24,
    }, headers=seller_headers)
    listing_id = create_resp.json()["id"]

    # 2. Bidder 1 places first bid at starting price ₹500
    bidder1_headers = login_user(client, "bidder1@college.edu", "BidderOne123!")
    b1_resp = client.post(
        f"/api/listings/{listing_id}/bids",
        json={"amount_rupees": 500.0},
        headers=bidder1_headers,
    )
    assert b1_resp.status_code == 201
    assert b1_resp.json()["amount_rupees"] == 500.0

    # 3. Bidder 2 attempts invalid bid of ₹520 (needs at least ₹500 + ₹50 = ₹550)
    bidder2_headers = login_user(client, "bidder2@college.edu", "BidderTwo123!")
    invalid_resp = client.post(
        f"/api/listings/{listing_id}/bids",
        json={"amount_rupees": 520.0},
        headers=bidder2_headers,
    )
    assert invalid_resp.status_code == 400
    assert "below the required minimum" in invalid_resp.json()["detail"]

    # 4. Bidder 2 places valid bid of ₹550
    valid_resp = client.post(
        f"/api/listings/{listing_id}/bids",
        json={"amount_rupees": 550.0},
        headers=bidder2_headers,
    )
    assert valid_resp.status_code == 201
    assert valid_resp.json()["amount_rupees"] == 550.0

    # 5. Check listing details reflect new highest bid ₹550 and next min ₹600
    detail_resp = client.get(f"/api/listings/{listing_id}")
    assert detail_resp.status_code == 200
    d = detail_resp.json()
    assert d["current_highest_bid_rupees"] == 550.0
    assert d["next_minimum_bid_rupees"] == 600.0
    assert d["bid_count"] == 2
    assert len(d["bids"]) == 2

def test_reject_bids_after_auction_deadline(client, test_seller, test_bidder1, db_session):
    seller_headers = login_user(client, "seller@college.edu", "SellerSecret123!")
    create_resp = client.post("/api/listings", json={
        "title": "Expired Calculus Notes",
        "description": "Engineering mathematics notes.",
        "category": "textbooks",
        "condition": "fair",
        "starting_price_rupees": 200.0,
        "min_increment_rupees": 20.0,
        "duration_hours": 1,
    }, headers=seller_headers)
    listing_id = create_resp.json()["id"]

    # Artificially shift ends_at into the past in the database
    listing = db_session.query(Listing).filter(Listing.id == listing_id).first()
    listing.ends_at = datetime.utcnow() - timedelta(minutes=10)
    db_session.add(listing)
    db_session.commit()

    # Attempt to place bid on closed auction
    bidder1_headers = login_user(client, "bidder1@college.edu", "BidderOne123!")
    resp = client.post(
        f"/api/listings/{listing_id}/bids",
        json={"amount_rupees": 200.0},
        headers=bidder1_headers,
    )
    assert resp.status_code == 400
    assert "closed" in resp.json()["detail"].lower() or "passed" in resp.json()["detail"].lower()
