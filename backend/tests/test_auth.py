from app.auth import verify_password
from app.models import User
from tests.conftest import login_user

def test_registration_and_argon2_hashing(client, db_session):
    payload = {
        "email": "fresh.student@college.edu",
        "password": "SecurePassword2026!",
        "display_name": "Fresh Student",
        "college_id": "2024-ME-019",
        "campus_location": "Block C, 204",
    }
    response = client.post("/api/auth/register", json=payload)
    assert response.status_code == 201
    data = response.json()
    assert data["email"] == "fresh.student@college.edu"
    assert data["display_name"] == "Fresh Student"
    
    # Verify NO password or hash leaked in API response
    assert "password" not in data
    assert "hashed_password" not in data

    # Verify session cookie was set
    assert "reloop_session" in response.cookies
    assert "reloop_csrf" in response.cookies

    # Verify stored in database with Argon2 hash
    user = db_session.query(User).filter(User.email == "fresh.student@college.edu").first()
    assert user is not None
    assert user.hashed_password.startswith("$argon2")
    assert verify_password("SecurePassword2026!", user.hashed_password)

def test_duplicate_email_rejection(client):
    payload = {
        "email": "duplicate@college.edu",
        "password": "StrongPassword123!",
        "display_name": "First User",
    }
    resp1 = client.post("/api/auth/register", json=payload)
    assert resp1.status_code == 201

    # Second registration with exact same email must fail with 400
    resp2 = client.post("/api/auth/register", json=payload)
    assert resp2.status_code == 400
    assert "already exists" in resp2.json()["detail"]

def test_login_success_and_session_restore(client, test_seller):
    login_resp = client.post(
        "/api/auth/login",
        json={"email": "seller@college.edu", "password": "SellerSecret123!"},
    )
    assert login_resp.status_code == 200
    assert "reloop_session" in login_resp.cookies

    # Access protected /me endpoint using session cookie
    me_resp = client.get("/api/auth/me")
    assert me_resp.status_code == 200
    assert me_resp.json()["email"] == "seller@college.edu"

def test_login_invalid_credentials_rejected(client, test_seller):
    resp = client.post(
        "/api/auth/login",
        json={"email": "seller@college.edu", "password": "WrongPassword!"},
    )
    assert resp.status_code == 401
    assert "Invalid email or password" in resp.json()["detail"]

def test_logout_clears_session(client, test_seller):
    # Exercise the browser cookie session directly (other workflow tests use
    # stateless bearer snapshots to model separate simultaneous users).
    client.post("/api/auth/login", json={"email": "seller@college.edu", "password": "SellerSecret123!"})
    headers = {"X-CSRF-Token": client.cookies.get("reloop_csrf")}
    
    # Confirm authenticated
    assert client.get("/api/auth/me").status_code == 200

    # Logout
    logout_resp = client.post("/api/auth/logout", headers=headers)
    assert logout_resp.status_code == 200

    # Next call to /me should now fail
    unauth_resp = client.get("/api/auth/me")
    assert unauth_resp.status_code == 401
