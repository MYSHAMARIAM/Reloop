from datetime import datetime, timedelta
from threading import Lock
from fastapi import HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import desc
from app.config import settings
from app.models import Listing, Bid, BidderSelection, Transaction, User, TransactionEvent
from app.services.auction_service import (
    now_utc,
    sync_listing_status,
    calculate_next_minimum_bid,
    get_highest_bid,
)

# The local demo runs one Uvicorn worker. Serialize bid validation through
# commit so concurrent requests cannot both validate against the same high bid.
bid_placement_lock = Lock()

def place_bid(db: Session, listing_id: int, bidder: User, amount_rupees: float) -> Bid:
    """
    Places an immutable bid with strict backend-enforced validation rules.
    The route serializes this validation-and-commit operation for the local API.
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

    # Check the authoritative deadline before syncing status so a just-expired
    # auction gets a useful deadline error instead of a generic state error.
    now = now_utc()
    if listing.ends_at <= now:
        sync_listing_status(db, listing)
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Auction bidding deadline has passed. Bidding is now closed.",
        )

    sync_listing_status(db, listing)

    # Reject self-bidding
    if listing.seller_id == bidder.id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Sellers are prohibited from bidding on their own listings.",
        )

    # Check status
    if listing.status != "active":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Cannot place bid. Auction status is '{listing.status}'.",
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

    sync_listing_status(db, listing)
    now = now_utc()

    if listing.ends_at > now and listing.status == "active":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Bidding is still in progress. You can only select a winner after the auction closes.",
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


def respond_to_selection(db: Session, selection_id: int, user: User, action: str) -> Tuple[BidderSelection, str]:
    """
    Selected bidder accepts or declines the seller's offer.
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
        # Listing remains available for seller to choose another eligible bidder
        listing.status = "bidding_ended"
        db.add(selection)
        db.add(listing)
        db.commit()
        db.refresh(selection)
        return selection, "You have declined the seller's offer. The seller can now offer to another bidder."

    elif action == "accept":
        selection.status = "accepted"
        selection.response_at = now
        listing.status = "reserved"

        # Check if transaction already exists
        existing_tx = db.query(Transaction).filter(Transaction.listing_id == listing.id).first()
        if not existing_tx:
            tx = Transaction(
                listing_id=listing.id,
                seller_id=listing.seller_id,
                buyer_id=user.id,
                final_amount_paise=selection.bid.amount_paise,
                status="reserved",
                seller_confirmed=False,
                buyer_confirmed=False,
                created_at=now,
            )
            db.add(tx)
            db.flush()
            db.add(TransactionEvent(transaction_id=tx.id, status="awaiting_payment", message="Selected bidder accepted; checkout is available."))

        db.add(selection)
        db.add(listing)
        db.commit()
        db.refresh(selection)
        return selection, "Offer accepted! Item is now reserved. You can now coordinate handover with the seller."
    else:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid action. Must be 'accept' or 'decline'.",
        )
