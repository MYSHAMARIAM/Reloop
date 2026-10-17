from datetime import datetime, timedelta

from app.models import Listing, Payment
from tests.conftest import login_user


def make_order(client, db_session):
    seller = login_user(client, "seller@college.edu", "SellerSecret123!")
    listing = client.post("/api/listings", headers=seller, json={
        "title": "Demo Engineering Kit", "description": "A useful kit for a workflow demo.",
        "category": "robotics", "condition": "good", "starting_price_rupees": 500,
        "min_increment_rupees": 25, "duration_hours": 1, "demo_duration_minutes": 2,
    }).json()
    buyer = login_user(client, "bidder1@college.edu", "BidderOne123!")
    bid = client.post(f"/api/listings/{listing['id']}/bids", headers=buyer,
                      json={"amount_rupees": 500}).json()
    row = db_session.query(Listing).filter(Listing.id == listing["id"]).one()
    row.ends_at = datetime.utcnow() - timedelta(seconds=1)
    db_session.commit()
    selection = client.post(f"/api/listings/{listing['id']}/select-bidder", headers=seller,
                            json={"bid_id": bid["id"]}).json()
    assert client.post(f"/api/selections/{selection['id']}/respond", headers=buyer,
                       json={"action": "accept"}).status_code == 200
    tx = client.get(f"/api/listings/{listing['id']}").json()["transaction"]
    return seller, buyer, tx["id"]


def test_failed_demo_payment_can_retry_and_success_is_persisted(client, db_session,
                                                                test_seller, test_bidder1):
    seller, buyer, tx_id = make_order(client, db_session)
    endpoint = f"/api/transactions/{tx_id}/simulate-payment"
    failed = client.post(endpoint, headers=buyer, json={
        "simulation_result": "failure", "fulfilment_type": "delivery",
        "delivery_address": "Hostel 2, Room 5",
    })
    assert failed.status_code == 200
    assert failed.json()["payment_status"] == "failed_demo"
    success = client.post(endpoint, headers=buyer, json={
        "simulation_result": "success", "fulfilment_type": "delivery",
        "delivery_address": "Hostel 2, Room 5",
    })
    assert success.status_code == 200
    assert success.json()["payment_status"] == "paid_demo"
    assert success.json()["payment_reference"].startswith("DEMO-")
    assert len(db_session.query(Payment).filter(Payment.transaction_id == tx_id).all()) == 2
    assert client.post(endpoint, headers=buyer, json={
        "simulation_result": "success", "fulfilment_type": "delivery",
        "delivery_address": "Hostel 2, Room 5",
    }).status_code == 400

    for expected in ("dispatched", "in_transit", "out_for_delivery", "delivered"):
        response = client.post(f"/api/transactions/{tx_id}/advance-delivery", headers=seller)
        assert response.status_code == 200
        assert response.json()["fulfilment_status"] == expected
    complete = client.post(f"/api/transactions/{tx_id}/confirm-receipt", headers=buyer)
    assert complete.status_code == 200
    assert complete.json()["status"] == "completed"
    assert complete.json()["timeline"]
    assert client.get(f"/api/transactions/{tx_id}", headers=buyer).json()["status"] == "completed"


def test_only_authorized_seller_can_advance_delivery(client, db_session,
                                                      test_seller, test_bidder1, test_bidder2):
    seller, buyer, tx_id = make_order(client, db_session)
    client.post(f"/api/transactions/{tx_id}/simulate-payment", headers=buyer, json={
        "simulation_result": "success", "fulfilment_type": "delivery",
        "delivery_address": "Hostel 2",
    })
    outsider = login_user(client, "bidder2@college.edu", "BidderTwo123!")
    assert client.post(f"/api/transactions/{tx_id}/advance-delivery", headers=outsider).status_code == 403
