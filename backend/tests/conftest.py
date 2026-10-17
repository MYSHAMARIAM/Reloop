import os
import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool
from fastapi.testclient import TestClient

# Use isolated in-memory SQLite database for testing
TEST_DATABASE_URL = "sqlite:///:memory:"

test_engine = create_engine(
    TEST_DATABASE_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)

TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=test_engine)

from app.db import Base, get_db
from app.main import app
from app.models import User
from app.auth import hash_password

@pytest.fixture(scope="session", autouse=True)
def setup_test_database():
    """Initializes tables in test database once for test session."""
    Base.metadata.create_all(bind=test_engine)
    yield
    Base.metadata.drop_all(bind=test_engine)

@pytest.fixture
def db_session():
    """Provides a fresh transactional database session per test function."""
    connection = test_engine.connect()
    transaction = connection.begin()
    session = TestingSessionLocal(bind=connection)

    yield session

    session.close()
    transaction.rollback()
    connection.close()

@pytest.fixture
def client(db_session):
    """Provides FastAPI TestClient wired to the isolated test database."""
    def override_get_db():
        try:
            yield db_session
        finally:
            pass

    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app) as test_client:
        yield test_client
    app.dependency_overrides.clear()

@pytest.fixture
def test_seller(db_session):
    """Creates a pre-seeded test seller user."""
    seller = User(
        email="seller@college.edu",
        display_name="Seller Student",
        hashed_password=hash_password("SellerSecret123!"),
        college_id="2023-CS-001",
        campus_location="Hostel 1",
    )
    db_session.add(seller)
    db_session.commit()
    db_session.refresh(seller)
    return seller

@pytest.fixture
def test_bidder1(db_session):
    """Creates pre-seeded test bidder 1."""
    bidder = User(
        email="bidder1@college.edu",
        display_name="Bidder One",
        hashed_password=hash_password("BidderOne123!"),
        college_id="2023-CS-002",
        campus_location="Hostel 2",
    )
    db_session.add(bidder)
    db_session.commit()
    db_session.refresh(bidder)
    return bidder

@pytest.fixture
def test_bidder2(db_session):
    """Creates pre-seeded test bidder 2."""
    bidder = User(
        email="bidder2@college.edu",
        display_name="Bidder Two",
        hashed_password=hash_password("BidderTwo123!"),
        college_id="2023-CS-003",
        campus_location="Hostel 3",
    )
    db_session.add(bidder)
    db_session.commit()
    db_session.refresh(bidder)
    return bidder

def login_user(client: TestClient, email: str, password: str):
    """Authenticate and return an isolated bearer header for this user.

    TestClient has one mutable cookie jar, which cannot represent two browser
    sessions at once. The API deliberately supports signed bearer sessions for
    headless clients, so snapshot the token issued by each login.
    """
    resp = client.post("/api/auth/login", json={"email": email, "password": password})
    assert resp.status_code == 200
    session_token = client.cookies.get("reloop_session")
    client.cookies.clear()
    return {"Authorization": f"Bearer {session_token}"}
