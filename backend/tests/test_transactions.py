from datetime import datetime, timedelta
from app.models import Listing
from tests.conftest import login_user

def test_handover_workflow_and_mutual_confirmation(
    client, test_seller, test_bidder1, test_bidder2, db_session
):
    seller_headers = login_user(client, "seller@college.edu", "SellerSecret123!")
    create_resp = client.post("/api/listings", json={
        "title": "Drawing Board and T-Square",
        "description": "Engineering graphics kit.",
        "category": "stationery",
        "condition": "like_new",
        "starting_price_rupees": 700.0,
        "min_increment_rupees": 50.0,
        "duration_hours": 1,
    }, headers=seller_headers)
    listing_id = create_resp.json()["id"]

    # Bidder 1 bids
    b1_headers = login_user(client, "bidder1@college.edu", "BidderOne123!")
    bid_resp = client.post(f"/api/listings/{listing_id}/bids", json={"amount_rupees": 700.0}, headers=b1_headers)
    bid_id = bid_resp.json()["id"]

    # Close auction
    listing = db_session.query(Listing).filter(Listing.id == listing_id).first()
    listing.ends_at = datetime.utcnow() - timedelta(minutes=1)
    db_session.commit()

    # Seller selects bidder 1 & bidder 1 accepts
    sel = client.post(f"/api/listings/{listing_id}/select-bidder", json={"bid_id": bid_id}, headers=seller_headers).json()
    client.post(f"/api/selections/{sel['id']}/respond", json={"action": "accept"}, headers=b1_headers)

    # Get transaction ID
    detail = client.get(f"/api/listings/{listing_id}").json()
    tx_id = detail["transaction"]["id"]

    # Third party student (bidder 2) attempts to view or update -> rejected 403
    b2_headers = login_user(client, "bidder2@college.edu", "BidderTwo123!")
    unauth_resp = client.get(f"/api/transactions/{tx_id}", headers=b2_headers)
    assert unauth_resp.status_code == 403

    pay_resp = client.post(f"/api/transactions/{tx_id}/simulate-payment", headers=b1_headers, json={
        "simulation_result": "success", "fulfilment_type": "handover",
        "handover_venue": "Campus Coffee Hub, Bench 2",
    })
    assert pay_resp.status_code == 200

    # Buyer or seller arranges handover venue
    venue_resp = client.post(
        f"/api/transactions/{tx_id}/arrange-handover",
        json={
            "handover_venue": "Campus Coffee Hub, Bench 2",
            "handover_notes": "Meet at 1:15 PM during lunch break.",
        },
        headers=b1_headers,
    )
    assert venue_resp.status_code == 200
    assert venue_resp.json()["handover_venue"] == "Campus Coffee Hub, Bench 2"
    assert venue_resp.json()["status"] == "handover_arranged"

    # Seller marks the item ready, then buyer confirms receipt.
    ready = client.post(f"/api/transactions/{tx_id}/advance-pickup", headers=seller_headers).json()
    assert ready["fulfilment_status"] == "awaiting_receipt"
    final = client.post(f"/api/transactions/{tx_id}/confirm-receipt", headers=b1_headers).json()
    assert final["buyer_confirmed"] is True
    assert final["seller_confirmed"] is True
    assert final["status"] == "completed"

    # Listing status should now be 'sold'
    final_listing = client.get(f"/api/listings/{listing_id}").json()
    assert final_listing["status"] == "sold"
