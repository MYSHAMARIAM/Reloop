from tests.conftest import login_user

def test_create_valid_listing(client, test_seller):
    headers = login_user(client, "seller@college.edu", "SellerSecret123!")
    payload = {
        "title": "TI-84 Plus Graphing Calculator",
        "description": "Mint condition calculator with manual and USB cable included.",
        "category": "calculators",
        "condition": "like_new",
        "starting_price_rupees": 2500.0,
        "min_increment_rupees": 100.0,
        "duration_hours": 24,
    }
    response = client.post("/api/listings", json=payload, headers=headers)
    assert response.status_code == 201
    data = response.json()
    assert data["title"] == payload["title"]
    assert data["starting_price_paise"] == 250000
    assert data["min_increment_paise"] == 10000
    assert data["next_minimum_bid_rupees"] == 2500.0
    assert data["status"] == "active"
    assert data["seller_id"] == test_seller.id

def test_reject_invalid_prices(client, test_seller):
    headers = login_user(client, "seller@college.edu", "SellerSecret123!")
    # Negative starting price
    payload = {
        "title": "Invalid Price Item",
        "description": "Testing negative price validation.",
        "category": "textbooks",
        "condition": "good",
        "starting_price_rupees": -50.0,
        "min_increment_rupees": 10.0,
        "duration_hours": 24,
    }
    response = client.post("/api/listings", json=payload, headers=headers)
    assert response.status_code == 422

def test_reject_unsupported_duration(client, test_seller):
    headers = login_user(client, "seller@college.edu", "SellerSecret123!")
    payload = {
        "title": "Invalid Duration Item",
        "description": "Duration must be from allowed presets.",
        "category": "stationery",
        "condition": "fair",
        "starting_price_rupees": 100.0,
        "min_increment_rupees": 10.0,
        "duration_hours": 50,  # 50 is not an allowed duration option
    }
    response = client.post("/api/listings", json=payload, headers=headers)
    assert response.status_code == 422

def test_browse_and_filter_listings(client, test_seller):
    headers = login_user(client, "seller@college.edu", "SellerSecret123!")
    # Create two items
    client.post("/api/listings", json={
        "title": "Algorithms Textbook CLRS",
        "description": "Computer science textbook",
        "category": "textbooks",
        "condition": "good",
        "starting_price_rupees": 1500.0,
        "min_increment_rupees": 50.0,
        "duration_hours": 72,
    }, headers=headers)

    client.post("/api/listings", json={
        "title": "Arduino Nano Starter Pack",
        "description": "Robotics micro controller board",
        "category": "robotics",
        "condition": "like_new",
        "starting_price_rupees": 800.0,
        "min_increment_rupees": 50.0,
        "duration_hours": 24,
    }, headers=headers)

    # Filter by category
    resp = client.get("/api/listings?category=robotics")
    assert resp.status_code == 200
    items = resp.json()
    assert len(items) == 1
    assert items[0]["category"] == "robotics"

    # Search keyword
    search_resp = client.get("/api/listings?q=Algorithms")
    assert search_resp.status_code == 200
    search_items = search_resp.json()
    assert len(search_items) == 1
    assert "Algorithms" in search_items[0]["title"]
