from typing import List, Dict, Any
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import desc
from app.db import get_db
from app.models import Listing, Bid, BidderSelection, Transaction, User
from app.auth import get_current_user
from app.services.auction_service import (
    format_listing_response,
    format_selection_response,
    format_transaction_response,
    sync_listing_status,
    now_utc,
)

router = APIRouter(prefix="/dashboard", tags=["User Dashboards"])


@router.get("/my-listings")
def get_my_listings(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Returns all listings created by the current user."""
    listings = (
        db.query(Listing)
        .filter(Listing.seller_id == current_user.id)
        .order_by(desc(Listing.created_at))
        .all()
    )
    return [format_listing_response(db, l) for l in listings]


@router.get("/my-bids")
def get_my_bids(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Returns all auctions where the current user placed bids,
    along with their bids on each and any selection invitations requiring their action.
    """
    now = now_utc()
    # Find all unique listings the user bid on
    user_bids = (
        db.query(Bid)
        .filter(Bid.bidder_id == current_user.id)
        .order_by(desc(Bid.created_at))
        .all()
    )

    listing_map = {}
    for b in user_bids:
        if b.listing_id not in listing_map:
            listing_map[b.listing_id] = []
        listing_map[b.listing_id].append({
            "id": b.id,
            "amount_rupees": b.amount_paise / 100.0,
            "created_at": b.created_at,
        })

    results = []
    for lid, bids in listing_map.items():
        listing = db.query(Listing).filter(Listing.id == lid).first()
        if not listing:
            continue
        sync_listing_status(db, listing)
        
        # Check if user is currently selected
        pending_sel = (
            db.query(BidderSelection)
            .filter(
                BidderSelection.listing_id == lid,
                BidderSelection.selected_bidder_id == current_user.id,
                BidderSelection.status == "pending",
                BidderSelection.expires_at > now,
            )
            .first()
        )

        formatted_listing = format_listing_response(db, listing)
        results.append({
            "listing": formatted_listing,
            "my_bids": bids,
            "my_highest_bid_rupees": max([b["amount_rupees"] for b in bids]),
            "selection_invitation": format_selection_response(pending_sel) if pending_sel else None,
            "action_required": pending_sel is not None,
        })

    return results


@router.get("/seller-overview")
def get_seller_dashboard(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Detailed seller dashboard categorizing listings into:
    - active_auctions
    - ended_awaiting_decision (bidding ended, bids exist, no pending selection or confirmed transaction)
    - pending_bidder_response (seller picked someone, waiting for them to accept/decline)
    - reserved_items
    - completed_sales
    - unsold_auctions (ended with 0 bids or all declined)
    """
    now = now_utc()
    listings = db.query(Listing).filter(Listing.seller_id == current_user.id).all()

    active = []
    awaiting_decision = []
    pending_response = []
    reserved = []
    completed = []
    unsold = []

    for l in listings:
        sync_listing_status(db, l)
        formatted = format_listing_response(db, l)
        bid_count = len(l.bids)

        if l.status == "active" and l.ends_at > now:
            active.append(formatted)
        elif l.status == "reserved":
            reserved.append(formatted)
        elif l.status == "sold":
            completed.append(formatted)
        elif l.status in ("bidding_ended", "active"):
            # Bidding has ended
            # Check if pending selection exists
            active_sel = (
                db.query(BidderSelection)
                .filter(
                    BidderSelection.listing_id == l.id,
                    BidderSelection.status == "pending",
                    BidderSelection.expires_at > now,
                )
                .first()
            )
            if active_sel:
                pending_response.append({
                    "listing": formatted,
                    "selection": format_selection_response(active_sel),
                })
            elif bid_count > 0:
                awaiting_decision.append(formatted)
            else:
                unsold.append(formatted)
        else:
            unsold.append(formatted)

    # Live bid activity across ALL of this seller's auctions (newest first)
    listing_ids = [l.id for l in listings]
    title_by_id = {l.id: l.title for l in listings}
    total_bids = 0
    recent_bids = []
    if listing_ids:
        bid_query = db.query(Bid).filter(Bid.listing_id.in_(listing_ids))
        total_bids = bid_query.count()
        for b in bid_query.order_by(desc(Bid.created_at)).limit(8).all():
            recent_bids.append({
                "id": b.id,
                "listing_id": b.listing_id,
                "listing_title": title_by_id.get(b.listing_id, "Item"),
                "bidder_name": b.bidder.display_name if b.bidder else "Student",
                "amount_rupees": b.amount_paise / 100.0,
                "created_at": b.created_at,
            })

    return {
        "summary": {
            "total_listings": len(listings),
            "total_bids": total_bids,
            "active_count": len(active),
            "awaiting_decision_count": len(awaiting_decision),
            "pending_response_count": len(pending_response),
            "reserved_count": len(reserved),
            "completed_count": len(completed),
            "unsold_count": len(unsold),
        },
        "active_auctions": active,
        "ended_awaiting_decision": awaiting_decision,
        "pending_bidder_responses": pending_response,
        "reserved_items": reserved,
        "completed_sales": completed,
        "unsold_auctions": unsold,
        "recent_bids": recent_bids,
    }


@router.get("/my-transactions")
def get_my_transactions(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Returns all transactions where the current user is either seller or buyer.
    """
    txs = (
        db.query(Transaction)
        .filter(
            (Transaction.seller_id == current_user.id) | (Transaction.buyer_id == current_user.id)
        )
        .order_by(desc(Transaction.created_at))
        .all()
    )
    return [format_transaction_response(t) for t in txs]
