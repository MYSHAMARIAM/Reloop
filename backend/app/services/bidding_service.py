from datetime import datetime, timedelta
from typing import Optional, Tuple
from fastapi import HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import desc
from app.config import settings
from app.models import Listing, Bid, BidderSelection, Transaction,TransactionEvent, User
from app.services.auction_service import (
    now_utc,
    sync_listing_status,
    calculate_next_minimum_bid,
    get_highest_bid,
)
import threading

bid_placement_lock = threading.Lock()

def place_bid(db: Session, listing_id: int, bidder: User, amount_rupees: float) -> Bid:
    """
    Places an immutable bid with strict backend-enforced validation rules.
    Uses SQLite immediate transaction to prevent race conditions.
    """
    if not bidder.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Account is inactive. Cannot place bids.",
        )

    # Convert to exact integer paise
    amount_paise = int(round(amount_rupees * 100))
    if amount_paise <= 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Bid amount must be a positive number.",
        )

    # Fetch listing
    listing = db.query(Listing).filter(Listing.id == listing_id).first()
    if not listing:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Listing not found.",
        )

    # Expire any dead checkouts before processing new bids
    from app.services.auction_service import expire_stale_transactions
    expire_stale_transactions(db, listing)

    # Sync state authoritatively
    sync_listing_status(db, listing)

    # Reject self-bidding
    if listing.seller_id == bidder.id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Sellers cannot place bids on their own listings.",
        )

    # No new bids while the seller's offer to a bidder is awaiting an answer
    if listing.status in ("reserved", "sold", "withdrawn"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="This item is no longer open for bids.",
        )
    now = now_utc()
    for sel in listing.selections:
        if sel.status == "pending" and sel.expires_at > now:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="The seller has already selected a bidder and is waiting for their response.",
            )

    # Check only the auction deadline
    if listing.ends_at <= now:
        listing.status = "bidding_ended"
        db.commit()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="The auction deadline has passed. This auction is now closed.",
        )

    # Calculate required minimum
    min_required_paise = calculate_next_minimum_bid(listing)
    if amount_paise < min_required_paise:
        min_rupees = min_required_paise / 100.0
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Bid amount ₹{amount_rupees:.2f} is below the required minimum of ₹{min_rupees:.2f}.",
        )

    # Record immutable bid
    new_bid = Bid(
        listing_id=listing.id,
        bidder_id=bidder.id,
        amount_paise=amount_paise,
        created_at=now,
    )
    db.add(new_bid)
    db.commit()
    db.refresh(new_bid)

    return new_bid


def select_bidder(db: Session, listing_id: int, seller: User, bid_id: int) -> BidderSelection:
    """
    Seller explicitly picks an eligible bidder after auction closes.
    Allows selecting any valid bidder (highest bidder not automatically selected).
    """
    listing = db.query(Listing).filter(Listing.id == listing_id).first()
    if not listing:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Listing not found.",
        )

    if listing.seller_id != seller.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only the seller who created this listing can select a winning bidder.",
        )

    from app.services.auction_service import expire_stale_transactions
    expire_stale_transactions(db, listing)
    sync_listing_status(db, listing)
    now = now_utc()

    # The seller may accept any bid at any time (before or after the timer ends).
    if listing.status == "withdrawn":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="This listing has been withdrawn.",
        )

    if listing.status in ("reserved", "sold"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="This item is already reserved or completed under a confirmed transaction.",
        )

    # Verify that there is no currently pending, unexpired selection
    for sel in listing.selections:
        if sel.status == "pending" and sel.expires_at > now:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="A bidder selection is already awaiting response. Please wait for them to respond or for the deadline to expire before selecting another bidder.",
            )

    # Find the bid
    bid = db.query(Bid).filter(Bid.id == bid_id, Bid.listing_id == listing.id).first()
    if not bid:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Selected bid does not exist or does not belong to this listing.",
        )

    # Create new selection record
    expires_at = now + timedelta(hours=settings.SELECTION_EXPIRY_HOURS)
    selection = BidderSelection(
        listing_id=listing.id,
        seller_id=seller.id,
        selected_bidder_id=bid.bidder_id,
        bid_id=bid.id,
        status="pending",
        selected_at=now,
        expires_at=expires_at,
    )
    db.add(selection)
    db.commit()
    db.refresh(selection)

    return selection

def _attach_transaction(
    db: Session,
    listing: Listing,
    buyer: User,
    amount_paise: int,
    message: str,
) -> Transaction:
    """
    Creates (or revives) the single Transaction row for a listing.
    transactions.listing_id is UNIQUE, so a previously cancelled transaction
    must be reused instead of inserting a second row.
    """
    now = now_utc()
    expires_at = now + timedelta(hours=settings.CHECKOUT_EXPIRY_HOURS)

    tx = db.query(Transaction).filter(Transaction.listing_id == listing.id).first()
    if tx is None:
        tx = Transaction(
            listing_id=listing.id,
            seller_id=listing.seller_id,
            buyer_id=buyer.id,
            final_amount_paise=amount_paise,
            status="reserved",
            payment_status="unpaid",
            fulfilment_status="awaiting_payment",
            seller_confirmed=False,
            buyer_confirmed=False,
            created_at=now,
            expires_at=expires_at,
        )
        db.add(tx)
    else:
        tx.seller_id = listing.seller_id
        tx.buyer_id = buyer.id
        tx.final_amount_paise = amount_paise
        tx.status = "reserved"
        tx.payment_status = "unpaid"
        tx.payment_reference = None
        tx.fulfilment_type = None
        tx.fulfilment_status = "awaiting_payment"
        tx.delivery_address = None
        tx.handover_venue = None
        tx.handover_notes = None
        tx.scheduled_meetup_at = None
        tx.seller_confirmed = False
        tx.buyer_confirmed = False
        tx.completed_at = None
        tx.created_at = now
        tx.expires_at = expires_at

    db.flush()  # assigns tx.id so the event below gets a valid transaction_id
    db.add(TransactionEvent(
        transaction_id=tx.id,
        status="reserved",
        message=message,
    ))
    return tx


def buy_now(db: Session, listing_id: int, buyer: User) -> Transaction:
    """
    Instantly purchases a listing at the seller's fixed Buy Now price.
    Only allowed while the item is still open (not reserved/sold/withdrawn)
    and no offer to another bidder is pending.
    """
    listing = db.query(Listing).filter(Listing.id == listing_id).first()
    if not listing:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Listing not found.")

    from app.services.auction_service import expire_stale_transactions
    expire_stale_transactions(db, listing)
    sync_listing_status(db, listing)

    if not listing.buy_now_price_paise:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="This listing does not offer Buy Now.")

    if listing.seller_id == buyer.id:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="You cannot buy your own item.")

    if listing.status != "active":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"This item is no longer available (status: {listing.status}).",
        )

    now = now_utc()
    if listing.ends_at <= now:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="This auction has ended. Buy Now is closed.")

    for sel in listing.selections:
        if sel.status == "pending" and sel.expires_at > now:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="The seller has already offered this item to a bidder. Please try again later.",
            )

    tx = _attach_transaction(
        db, listing, buyer, listing.buy_now_price_paise,
        f"Buy Now purchase initiated by {buyer.display_name}.",
    )
    listing.status = "reserved"
    db.add(listing)
    db.commit()
    db.refresh(tx)
    return tx


def respond_to_selection(
    db: Session, selection_id: int, user: User, action: str
) -> Tuple[BidderSelection, str, Optional[Transaction]]:
    """
    Selected bidder accepts or declines the seller's offer.
    Returns (selection, message, transaction). transaction is only set on accept.
    """
    selection = db.query(BidderSelection).filter(BidderSelection.id == selection_id).first()
    if not selection:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Selection offer not found.",
        )

    if selection.selected_bidder_id != user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only the selected bidder can accept or decline this offer.",
        )

    now = now_utc()
    if selection.status != "pending" or selection.expires_at <= now:
        if selection.status == "pending":
            selection.status = "expired"
            selection.response_at = now
            db.add(selection)
            db.commit()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"This offer is no longer pending (current status: {selection.status}).",
        )

    listing = db.query(Listing).filter(Listing.id == selection.listing_id).first()

    if action == "decline":
        selection.status = "declined"
        selection.response_at = now
        # Listing status is left alone: if the timer is still running it stays
        # 'active', otherwise it is already 'bidding_ended'. Seller can pick again.
        db.add(selection)
        db.commit()
        db.refresh(selection)
        return selection, "You have declined the seller's offer. The seller can now offer to another bidder.", None

    if action == "accept":
        if listing.status in ("reserved", "sold", "withdrawn"):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="This item is no longer available.",
            )

        selection.status = "accepted"
        selection.response_at = now
        listing.status = "reserved"  # becomes 'sold' once the order is completed

        tx = _attach_transaction(
            db, listing, user, selection.bid.amount_paise,
            f"Seller's offer accepted by {user.display_name}. Awaiting payment.",
        )

        db.add(selection)
        db.add(listing)
        db.commit()
        db.refresh(selection)
        db.refresh(tx)

        return (
            selection,
            f"Offer accepted! You have {settings.CHECKOUT_EXPIRY_HOURS} hours to complete checkout. The item is reserved for you.",
            tx,
        )

    raise HTTPException(
        status_code=status.HTTP_400_BAD_REQUEST,
        detail="Invalid action. Must be 'accept' or 'decline'.",
    )
