from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import desc
from app.db import get_db
from app.models import Listing, Bid, BidderSelection, User
from app.schemas import (
    BidCreate,
    BidResponse,
    BidderSelectionCreate,
    BidderSelectionAction,
    BidderSelectionResponse,
)
from app.auth import get_current_user, verify_csrf
from app.services.bidding_service import (
    bid_placement_lock,
    place_bid,
    select_bidder,
    respond_to_selection,
)
from app.services.auction_service import (
    format_bid_response,
    format_selection_response,
)

router = APIRouter(tags=["Bids & Selection"])


@router.post(
    "/listings/{listing_id}/bids",
    response_model=BidResponse,
    status_code=status.HTTP_201_CREATED,
    dependencies=[Depends(verify_csrf)],
)
def submit_bid(
    listing_id: int,
    data: BidCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    with bid_placement_lock:
        bid = place_bid(db, listing_id, current_user, data.amount_rupees)
    return format_bid_response(bid)


@router.get("/listings/{listing_id}/bids", response_model=List[BidResponse])
def get_listing_bids(
    listing_id: int,
    db: Session = Depends(get_db),
):
    listing = db.query(Listing).filter(Listing.id == listing_id).first()
    if not listing:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Listing not found.")

    bids = db.query(Bid).filter(Bid.listing_id == listing_id).order_by(desc(Bid.amount_paise)).all()
    return [format_bid_response(b) for b in bids]


@router.post(
    "/listings/{listing_id}/select-bidder",
    response_model=BidderSelectionResponse,
    status_code=status.HTTP_201_CREATED,
    dependencies=[Depends(verify_csrf)],
)
def seller_select_bidder(
    listing_id: int,
    data: BidderSelectionCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    selection = select_bidder(db, listing_id, current_user, data.bid_id)
    return format_selection_response(selection)


@router.post(
    "/selections/{selection_id}/respond",
    response_model=dict,
    dependencies=[Depends(verify_csrf)],
)
def bidder_respond_to_selection(
    selection_id: int,
    data: BidderSelectionAction,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    selection, message = respond_to_selection(db, selection_id, current_user, data.action)
    return {
        "message": message,
        "selection": format_selection_response(selection),
    }
