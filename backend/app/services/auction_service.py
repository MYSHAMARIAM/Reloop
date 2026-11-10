from datetime import datetime, timezone
from typing import Optional, Tuple
from sqlalchemy.orm import Session
from sqlalchemy import desc
from app.models import Listing, Bid, BidderSelection, Transaction, TransactionEvent
from app.schemas import ListingResponse, ListingDetailResponse, BidResponse, BidderSelectionResponse, TransactionResponse
from datetime import datetime, timedelta

def expire_stale_transactions(db: Session, listing: Listing):
    """
    Checks for unpaid transactions past their deadline and cancels them,
    freeing the listing back to the seller.
    """
    now = now_utc()
    tx = listing.transaction  # Using singular 'transaction'
    
    if tx and tx.status == "reserved" and tx.payment_status == "unpaid":
        if tx.expires_at and tx.expires_at <= now:
            tx.status = "cancelled"
            tx.fulfilment_status = "cancelled"
            
            db.add(TransactionEvent(
                transaction_id=tx.id, 
                status="cancelled", 
                message="Checkout window expired. Reservation automatically cancelled."
            ))
            
            # Release the item: back to 'active' if the timer is still running,
            # otherwise 'bidding_ended' so the seller can pick someone else
            if listing.status in ("reserved", "sold"):
                listing.status = "active" if listing.ends_at > now else "bidding_ended"
            db.add(listing)
            
    db.commit()

def now_utc() -> datetime:
    """Returns current UTC datetime without tzinfo for consistent SQLite storage."""
    return datetime.utcnow()

def sync_listing_status(db: Session, listing: Listing) -> str:
    """
    Authoritatively synchronizes auction state based on UTC clock.
    If auction deadline passed while in 'active' status, transitions to 'bidding_ended'.
    Also expires stale bidder selections.
    """
    now = now_utc()
    
    # Check auction deadline
    if listing.status == "active" and listing.ends_at <= now:
        listing.status = "bidding_ended"
        db.add(listing)
        db.commit()
        db.refresh(listing)

    # Check pending selections expiration
    for sel in listing.selections:
        if sel.status == "pending" and sel.expires_at <= now:
            sel.status = "expired"
            sel.response_at = now
            db.add(sel)
            db.commit()

    return listing.status

def get_highest_bid(listing: Listing) -> Optional[Bid]:
    """Returns the highest bid for a listing or None."""
    if not listing.bids:
        return None
    return max(listing.bids, key=lambda b: b.amount_paise)

def calculate_next_minimum_bid(listing: Listing) -> int:
    """
    Calculates required minimum valid bid in paise.
    - If no bids exist: starting_price_paise
    - Otherwise: highest_bid + min_increment_paise
    """
    highest_bid = get_highest_bid(listing)
    if highest_bid is None:
        return listing.starting_price_paise
    return highest_bid.amount_paise + listing.min_increment_paise

def format_listing_response(db: Session, listing: Listing) -> ListingResponse:
    """Formats a Listing model into a rich ListingResponse Pydantic schema."""
    sync_listing_status(db, listing)
    now = now_utc()
    
    highest_bid = get_highest_bid(listing)
    highest_paise = highest_bid.amount_paise if highest_bid else None
    highest_rupees = (highest_paise / 100.0) if highest_paise is not None else None
    
    next_min_paise = calculate_next_minimum_bid(listing)
    next_min_rupees = next_min_paise / 100.0
    
    is_ended = (listing.ends_at <= now) or (listing.status in ("bidding_ended", "reserved", "sold", "withdrawn"))
    seconds_remaining = max(0, int((listing.ends_at - now).total_seconds())) if not is_ended else 0

    return ListingResponse(
        id=listing.id,
        seller_id=listing.seller_id,
        seller_name=listing.seller.display_name if listing.seller else "Anonymous",
        seller_location=listing.seller.campus_location if listing.seller else None,
        title=listing.title,
        description=listing.description,
        category=listing.category,
        condition=listing.condition,
        starting_price_paise=listing.starting_price_paise,
        min_increment_paise=listing.min_increment_paise,
        starting_price_rupees=listing.starting_price_paise / 100.0,
        min_increment_rupees=listing.min_increment_paise / 100.0,
        current_highest_bid_paise=highest_paise,
        current_highest_bid_rupees=highest_rupees,
        next_minimum_bid_paise=next_min_paise,
        next_minimum_bid_rupees=next_min_rupees,
        buy_now_price_paise=listing.buy_now_price_paise,
        buy_now_price_rupees=(listing.buy_now_price_paise / 100.0) if listing.buy_now_price_paise else None,
        has_buy_now=bool(listing.buy_now_price_paise),
        bid_count=len(listing.bids),
        duration_hours=listing.duration_hours,
        image_url=listing.image_url,
        status=listing.status,
        created_at=listing.created_at,
        ends_at=listing.ends_at,
        is_ended=is_ended,
        seconds_remaining=seconds_remaining,
    )
def format_bid_response(bid: Bid) -> BidResponse:
    return BidResponse(
        id=bid.id,
        listing_id=bid.listing_id,
        bidder_id=bid.bidder_id,
        bidder_name=bid.bidder.display_name if bid.bidder else "Student",
        amount_paise=bid.amount_paise,
        amount_rupees=bid.amount_paise / 100.0,
        created_at=bid.created_at,
    )

def format_selection_response(sel: BidderSelection) -> BidderSelectionResponse:
    now = now_utc()
    rem = max(0, int((sel.expires_at - now).total_seconds())) if sel.status == "pending" else 0
    return BidderSelectionResponse(
        id=sel.id,
        listing_id=sel.listing_id,
        seller_id=sel.seller_id,
        selected_bidder_id=sel.selected_bidder_id,
        selected_bidder_name=sel.selected_bidder.display_name if sel.selected_bidder else "Student",
        bid_id=sel.bid_id,
        bid_amount_paise=sel.bid.amount_paise if sel.bid else 0,
        bid_amount_rupees=(sel.bid.amount_paise / 100.0) if sel.bid else 0.0,
        status=sel.status,
        selected_at=sel.selected_at,
        expires_at=sel.expires_at,
        response_at=sel.response_at,
        seconds_remaining_to_respond=rem,
    )

def format_transaction_response(tx: Transaction) -> TransactionResponse:
    return TransactionResponse(
        id=tx.id,
        listing_id=tx.listing_id,
        listing_title=tx.listing.title if tx.listing else "Item",
        seller_id=tx.seller_id,
        seller_name=tx.seller.display_name if tx.seller else "Seller",
        buyer_id=tx.buyer_id,
        buyer_name=tx.buyer.display_name if tx.buyer else "Buyer",
        final_amount_paise=tx.final_amount_paise,
        final_amount_rupees=tx.final_amount_paise / 100.0,
        status=tx.status,
        payment_status=tx.payment_status,
        payment_reference=tx.payment_reference,
        fulfilment_type=tx.fulfilment_type,
        fulfilment_status=tx.fulfilment_status,
        delivery_address=tx.delivery_address,
        timeline=[{"status": e.status, "message": e.message, "created_at": e.created_at} for e in tx.events],
        handover_venue=tx.handover_venue,
        handover_notes=tx.handover_notes,
        scheduled_meetup_at=tx.scheduled_meetup_at,
        seller_confirmed=tx.seller_confirmed,
        buyer_confirmed=tx.buyer_confirmed,
        created_at=tx.created_at,
        completed_at=tx.completed_at,
    )
