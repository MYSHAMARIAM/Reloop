"""
Seed realistic demo data for college marketplace demonstration.
Idempotent: skips existing users and listings.
"""
from datetime import timedelta
from app.db import SessionLocal, init_db
from app.models import User, Listing, Bid, BidderSelection, Transaction
from app.auth import hash_password
from app.services.auction_service import now_utc

DEMO_PASSWORD = "CampusPass2026!"

DEMO_USERS = [
    {
        "email": "aarav.sharma@campus.edu",
        "display_name": "Aarav Sharma",
        "college_id": "2023-EE-042",
        "campus_location": "Hostel 4, Room 218",
        "bio": "3rd Year Electrical Engg. Building autonomous rovers & robotics sensors.",
    },
    {
        "email": "priya.nair@campus.edu",
        "display_name": "Priya Nair",
        "college_id": "2024-CS-115",
        "campus_location": "Block A, Room 304",
        "bio": "2nd Year CS undergrad. Always looking for good algorithm textbooks and dev boards.",
    },
    {
        "email": "rohit.verma@campus.edu",
        "display_name": "Rohit Verma",
        "college_id": "2022-ME-088",
        "campus_location": "Hostel 7, Room 102",
        "bio": "Final year Mechanical. Selling lab gear and calculators before graduation.",
    },
    {
        "email": "ananya.sen@campus.edu",
        "display_name": "Ananya Sen",
        "college_id": "2023-EC-059",
        "campus_location": "Girls Hostel 2, Room 112",
        "bio": "Electronics & Comm. Robotics club member. Selling spare sensors.",
    },
]

def seed():
    init_db()
    db = SessionLocal()
    try:
        now = now_utc()
        users = {}
        for u_data in DEMO_USERS:
            user = db.query(User).filter(User.email == u_data["email"]).first()
            if not user:
                user = User(
                    email=u_data["email"],
                    display_name=u_data["display_name"],
                    hashed_password=hash_password(DEMO_PASSWORD),
                    college_id=u_data["college_id"],
                    campus_location=u_data["campus_location"],
                    bio=u_data["bio"],
                )
                db.add(user)
                db.commit()
                db.refresh(user)
                print(f"Created user: {user.email}")
            users[user.email] = user

        # Seed listings if empty
        if db.query(Listing).count() == 0:
            u_rohit = users["rohit.verma@campus.edu"]
            u_aarav = users["aarav.sharma@campus.edu"]
            u_priya = users["priya.nair@campus.edu"]
            u_ananya = users["ananya.sen@campus.edu"]

            # Listing 1: Active calculator auction
            l1 = Listing(
                seller_id=u_rohit.id,
                title="Texas Instruments TI-84 Plus CE Graphing Calculator",
                description="Hardly used for 2 semesters of calculus and linear algebra. Screen protector installed since day 1. Includes USB charging cable and quick-start reference guide.",
                category="calculators",
                condition="like_new",
                starting_price_paise=350000,  # ₹3500
                min_increment_paise=10000,    # ₹100
                buy_now_price_paise=550000,  # ₹5500 Buy Now
                duration_hours=48,
                image_url="https://images.unsplash.com/photo-1594980596870-8aa52a78d8cd?w=800&auto=format&fit=crop&q=80",
                status="active",
                created_at=now - timedelta(hours=12),
                ends_at=now + timedelta(hours=36),
            )
            db.add(l1)
            db.commit()
            db.refresh(l1)

            # Add competing bids
            b1_1 = Bid(listing_id=l1.id, bidder_id=u_priya.id, amount_paise=350000, created_at=now - timedelta(hours=10))
            b1_2 = Bid(listing_id=l1.id, bidder_id=u_ananya.id, amount_paise=360000, created_at=now - timedelta(hours=6))
            b1_3 = Bid(listing_id=l1.id, bidder_id=u_priya.id, amount_paise=380000, created_at=now - timedelta(hours=2))
            db.add_all([b1_1, b1_2, b1_3])
            db.commit()

            # Listing 2: Active robotics kit
            l2 = Listing(
                seller_id=u_aarav.id,
                title="Arduino Uno Rev3 Ultimate Starter Kit with 30+ Sensors",
                description="Complete Arduino kit including Uno R3, breadboard, ultrasonic distance sensor, HC-05 Bluetooth module, servo motor, stepper motor with driver, LEDs, resistors, and jumper wire bundle.",
                category="robotics",
                condition="good",
                starting_price_paise=120000,  # ₹1200
                min_increment_paise=5000,     # ₹50
                duration_hours=72,
                image_url="https://images.unsplash.com/photo-1518770660439-4636190af475?w=800&auto=format&fit=crop&q=80",
                status="active",
                created_at=now - timedelta(hours=20),
                ends_at=now + timedelta(hours=52),
            )
            db.add(l2)
            db.commit()
            db.refresh(l2)

            b2_1 = Bid(listing_id=l2.id, bidder_id=u_priya.id, amount_paise=120000, created_at=now - timedelta(hours=18))
            b2_2 = Bid(listing_id=l2.id, bidder_id=u_rohit.id, amount_paise=130000, created_at=now - timedelta(hours=12))
            db.add_all([b2_1, b2_2])
            db.commit()

            # Listing 3: Active textbook
            l3 = Listing(
                seller_id=u_priya.id,
                title="Introduction to Algorithms (CLRS 4th Edition) Hardcover",
                description="The classic MIT Press algorithm textbook. Clean pages, no highlighting or margin scribbles. Essential for Data Structures & Algorithms course and campus interview prep.",
                category="textbooks",
                condition="like_new",
                starting_price_paise=180000,  # ₹1800
                min_increment_paise=10000,    # ₹100
                buy_now_price_paise=300000,  # ₹3000 Buy Now
                duration_hours=24,
                image_url="https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=800&auto=format&fit=crop&q=80",
                status="active",
                created_at=now - timedelta(hours=4),
                ends_at=now + timedelta(hours=20),
            )
            db.add(l3)
            db.commit()
            db.refresh(l3)

            # Listing 4: Bidding ended, awaiting seller selection! Perfect for demonstration!
            l4 = Listing(
                seller_id=u_rohit.id,
                title="Raspberry Pi 4 Model B (4GB RAM) with Aluminium Heatsink Case",
                description="This auction has concluded! Used for a final year IoT capstone project. Includes 32GB SanDisk Extreme MicroSD card pre-imaged with Raspberry Pi OS and 5V 3A USB-C official power adapter.",
                category="electronics",
                condition="good",
                starting_price_paise=280000,  # ₹2800
                min_increment_paise=10000,    # ₹100
                duration_hours=24,
                image_url="https://images.unsplash.com/photo-1629654297299-c8506221ca97?w=800&auto=format&fit=crop&q=80",
                status="bidding_ended",
                created_at=now - timedelta(hours=30),
                ends_at=now - timedelta(hours=6),
            )
            db.add(l4)
            db.commit()
            db.refresh(l4)

            # Multiple competing bids on l4 so Rohit can demonstrate selecting ANY bidder
            b4_1 = Bid(listing_id=l4.id, bidder_id=u_aarav.id, amount_paise=280000, created_at=now - timedelta(hours=25))
            b4_2 = Bid(listing_id=l4.id, bidder_id=u_ananya.id, amount_paise=300000, created_at=now - timedelta(hours=18))
            b4_3 = Bid(listing_id=l4.id, bidder_id=u_priya.id, amount_paise=320000, created_at=now - timedelta(hours=10))
            db.add_all([b4_1, b4_2, b4_3])
            db.commit()

            # Listing 5: Reserved item with handover in progress
            l5 = Listing(
                seller_id=u_ananya.id,
                title="Rotring Rapid Pro Drafting Mechanical Pencil Set (0.5mm & 0.7mm)",
                description="All-metal hexagonal body technical drafting pencils with knurled grip. Includes extra 2B lead tubes and replacement erasers. Reserved for handover.",
                category="stationery",
                condition="like_new",
                starting_price_paise=90000,  # ₹900
                min_increment_paise=5000,   # ₹50
                duration_hours=12,
                image_url="https://images.unsplash.com/photo-1583485088034-697b5bc54ccd?w=800&auto=format&fit=crop&q=80",
                status="reserved",
                created_at=now - timedelta(hours=40),
                ends_at=now - timedelta(hours=28),
            )
            db.add(l5)
            db.commit()
            db.refresh(l5)

            b5_1 = Bid(listing_id=l5.id, bidder_id=u_aarav.id, amount_paise=95000, created_at=now - timedelta(hours=30))
            db.add(b5_1)
            db.commit()
            db.refresh(b5_1)

            # Accepted selection and transaction
            sel5 = BidderSelection(
                listing_id=l5.id,
                seller_id=u_ananya.id,
                selected_bidder_id=u_aarav.id,
                bid_id=b5_1.id,
                status="accepted",
                selected_at=now - timedelta(hours=26),
                expires_at=now - timedelta(hours=2),
                response_at=now - timedelta(hours=24),
            )
            db.add(sel5)
            db.commit()

            tx5 = Transaction(
                listing_id=l5.id,
                seller_id=u_ananya.id,
                buyer_id=u_aarav.id,
                final_amount_paise=95000,
                status="handover_arranged",
                handover_venue="Central Library Lawn, Table 3",
                handover_notes="Meet at 4:30 PM after Digital Circuits lab.",
                scheduled_meetup_at=now + timedelta(hours=4),
                seller_confirmed=False,
                buyer_confirmed=True,
                created_at=now - timedelta(hours=24),
            )
            db.add(tx5)
            db.commit()

            print("Database seeded with demo users, active auctions, ended auctions, and transactions.")

    finally:
        db.close()

if __name__ == "__main__":
    seed()
