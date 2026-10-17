from datetime import datetime
from sqlalchemy import (
    Column,
    Integer,
    String,
    Text,
    Boolean,
    DateTime,
    ForeignKey,
    CheckConstraint,
    Index,
)
from sqlalchemy.orm import relationship
from app.db import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(255), unique=True, index=True, nullable=False)
    display_name = Column(String(100), nullable=False)
    hashed_password = Column(String(255), nullable=False)
    college_id = Column(String(50), nullable=True)
    campus_location = Column(String(100), nullable=True)
    bio = Column(Text, nullable=True)
    is_active = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    # Relationships
    listings = relationship("Listing", back_populates="seller", cascade="all, delete-orphan")
    bids = relationship("Bid", back_populates="bidder", cascade="all, delete-orphan")
    selections_made = relationship("BidderSelection", foreign_keys="BidderSelection.seller_id", back_populates="seller")
    selections_received = relationship("BidderSelection", foreign_keys="BidderSelection.selected_bidder_id", back_populates="selected_bidder")
    seller_transactions = relationship("Transaction", foreign_keys="Transaction.seller_id", back_populates="seller")
    buyer_transactions = relationship("Transaction", foreign_keys="Transaction.buyer_id", back_populates="buyer")

    def __repr__(self):
        return f"<User id={self.id} email='{self.email}' name='{self.display_name}'>"


class Listing(Base):
    __tablename__ = "listings"

    id = Column(Integer, primary_key=True, index=True)
    seller_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    title = Column(String(150), nullable=False, index=True)
    description = Column(Text, nullable=False)
    category = Column(String(50), nullable=False, index=True)
    condition = Column(String(30), nullable=False)  # 'brand_new', 'like_new', 'good', 'fair'
    starting_price_paise = Column(Integer, nullable=False)
    min_increment_paise = Column(Integer, nullable=False)
    duration_hours = Column(Integer, nullable=False)
    image_url = Column(String(500), nullable=True)
    status = Column(String(30), default="active", nullable=False, index=True)  # 'active', 'bidding_ended', 'reserved', 'sold', 'withdrawn'
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    ends_at = Column(DateTime, nullable=False, index=True)

    __table_args__ = (
        CheckConstraint("starting_price_paise > 0", name="check_positive_starting_price"),
        CheckConstraint("min_increment_paise > 0", name="check_positive_increment"),
        CheckConstraint("duration_hours >= 1 AND duration_hours <= 168", name="check_duration_range"),
        Index("ix_listings_status_ends_at", "status", "ends_at"),
    )

    # Relationships
    seller = relationship("User", back_populates="listings")
    bids = relationship("Bid", back_populates="listing", cascade="all, delete-orphan", order_by="desc(Bid.amount_paise)")
    selections = relationship("BidderSelection", back_populates="listing", cascade="all, delete-orphan", order_by="desc(BidderSelection.selected_at)")
    transaction = relationship("Transaction", back_populates="listing", uselist=False, cascade="all, delete-orphan")

    def __repr__(self):
        return f"<Listing id={self.id} title='{self.title}' status='{self.status}'>"


class Bid(Base):
    __tablename__ = "bids"

    id = Column(Integer, primary_key=True, index=True)
    listing_id = Column(Integer, ForeignKey("listings.id", ondelete="CASCADE"), nullable=False, index=True)
    bidder_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    amount_paise = Column(Integer, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False, index=True)

    __table_args__ = (
        CheckConstraint("amount_paise > 0", name="check_positive_bid_amount"),
        Index("ix_bids_listing_amount", "listing_id", "amount_paise"),
    )

    # Relationships
    listing = relationship("Listing", back_populates="bids")
    bidder = relationship("User", back_populates="bids")
    selection = relationship("BidderSelection", back_populates="bid", uselist=False)

    def __repr__(self):
        return f"<Bid id={self.id} listing={self.listing_id} bidder={self.bidder_id} amount={self.amount_paise}>"


class BidderSelection(Base):
    __tablename__ = "bidder_selections"

    id = Column(Integer, primary_key=True, index=True)
    listing_id = Column(Integer, ForeignKey("listings.id", ondelete="CASCADE"), nullable=False, index=True)
    seller_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    selected_bidder_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    bid_id = Column(Integer, ForeignKey("bids.id", ondelete="CASCADE"), nullable=False)
    status = Column(String(30), default="pending", nullable=False, index=True)  # 'pending', 'accepted', 'declined', 'expired'
    selected_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    expires_at = Column(DateTime, nullable=False)
    response_at = Column(DateTime, nullable=True)

    __table_args__ = (
        Index("ix_selections_active", "listing_id", "status"),
    )

    # Relationships
    listing = relationship("Listing", back_populates="selections")
    seller = relationship("User", foreign_keys=[seller_id], back_populates="selections_made")
    selected_bidder = relationship("User", foreign_keys=[selected_bidder_id], back_populates="selections_received")
    bid = relationship("Bid", back_populates="selection")

    def __repr__(self):
        return f"<BidderSelection id={self.id} listing={self.listing_id} bidder={self.selected_bidder_id} status='{self.status}'>"


class Transaction(Base):
    __tablename__ = "transactions"

    id = Column(Integer, primary_key=True, index=True)
    listing_id = Column(Integer, ForeignKey("listings.id", ondelete="CASCADE"), unique=True, nullable=False, index=True)
    seller_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    buyer_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    final_amount_paise = Column(Integer, nullable=False)
    status = Column(String(30), default="reserved", nullable=False, index=True)  # 'reserved', 'handover_arranged', 'completed', 'cancelled'
    payment_status = Column(String(30), default="unpaid", nullable=False)
    payment_reference = Column(String(80), nullable=True, unique=True)
    fulfilment_type = Column(String(20), nullable=True)
    fulfilment_status = Column(String(40), default="awaiting_payment", nullable=False)
    delivery_address = Column(String(300), nullable=True)
    
    # Campus Handover Tracking
    handover_venue = Column(String(200), nullable=True)
    handover_notes = Column(Text, nullable=True)
    scheduled_meetup_at = Column(DateTime, nullable=True)
    seller_confirmed = Column(Boolean, default=False, nullable=False)
    buyer_confirmed = Column(Boolean, default=False, nullable=False)
    
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    completed_at = Column(DateTime, nullable=True)

    __table_args__ = (
        CheckConstraint("final_amount_paise > 0", name="check_positive_final_amount"),
    )

    # Relationships
    listing = relationship("Listing", back_populates="transaction")
    seller = relationship("User", foreign_keys=[seller_id], back_populates="seller_transactions")
    buyer = relationship("User", foreign_keys=[buyer_id], back_populates="buyer_transactions")
    payments = relationship("Payment", back_populates="transaction", cascade="all, delete-orphan")
    events = relationship("TransactionEvent", back_populates="transaction", cascade="all, delete-orphan", order_by=lambda: (TransactionEvent.created_at, TransactionEvent.id))

    def __repr__(self):
        return f"<Transaction id={self.id} listing={self.listing_id} status='{self.status}' amount={self.final_amount_paise}>"


class Payment(Base):
    __tablename__ = "payments"
    id = Column(Integer, primary_key=True, index=True)
    transaction_id = Column(Integer, ForeignKey("transactions.id", ondelete="CASCADE"), nullable=False, index=True)
    amount_paise = Column(Integer, nullable=False)
    status = Column(String(20), nullable=False)
    reference = Column(String(80), unique=True, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    transaction = relationship("Transaction", back_populates="payments")


class TransactionEvent(Base):
    __tablename__ = "transaction_events"
    id = Column(Integer, primary_key=True, index=True)
    transaction_id = Column(Integer, ForeignKey("transactions.id", ondelete="CASCADE"), nullable=False, index=True)
    status = Column(String(50), nullable=False)
    message = Column(String(300), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    transaction = relationship("Transaction", back_populates="events")
