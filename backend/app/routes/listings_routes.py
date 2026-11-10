from datetime import timedelta
from typing import Optional, List
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from sqlalchemy import desc, asc
from app.db import get_db
from app.models import Listing, User, Bid, BidderSelection, Transaction
from app.schemas import (
    ListingCreate,
    ListingUpdate,
    ListingResponse,
    ListingDetailResponse,
)
from app.auth import get_current_user, get_optional_current_user, verify_csrf
from app.services.auction_service import (
    now_utc,
    format_listing_response,
    format_bid_response,
    format_selection_response,
    format_transaction_response,
    sync_listing_status,
)

router = APIRouter(prefix="/listings", tags=["Listings"])


@router.post("", response_model=ListingResponse, status_code=status.HTTP_201_CREATED, dependencies=[Depends(verify_csrf)])
def create_listing(
    data: ListingCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if not current_user.is_active:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Inactive account cannot post listings.")

    # Convert prices to integer paise
    starting_price_paise = int(round(data.starting_price_rupees * 100))
    min_increment_paise = int(round(data.min_increment_rupees * 100))

    if starting_price_paise <= 0 or min_increment_paise <= 0:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Prices must be positive numbers.")

    buy_now_price_paise = None
    if data.buy_now_price_rupees is not None:
        buy_now_price_paise = int(round(data.buy_now_price_rupees * 100))
        if buy_now_price_paise < starting_price_paise:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Buy Now price cannot be lower than the starting bid.",
            )

    created = now_utc()
    ends = created + (timedelta(minutes=data.demo_duration_minutes) if data.demo_duration_minutes else timedelta(hours=data.duration_hours))

    listing = Listing(
        seller_id=current_user.id,
        title=data.title.strip(),
        description=data.description.strip(),
        category=data.category,
        condition=data.condition,
        starting_price_paise=starting_price_paise,
        min_increment_paise=min_increment_paise,
        duration_hours=data.duration_hours,
        image_url=data.image_url.strip() if data.image_url else None,
        buy_now_price_paise=buy_now_price_paise,
        status="active",
        created_at=created,
        ends_at=ends,
    )
    db.add(listing)
    db.commit()
    db.refresh(listing)

    return format_listing_response(db, listing)


@router.get("", response_model=List[ListingResponse])
def get_listings(
    q: Optional[str] = Query(None, description="Search keyword in title or description"),
    category: Optional[str] = Query(None, description="Category filter"),
    condition: Optional[str] = Query(None, description="Condition filter"),
    status_filter: Optional[str] = Query("all_active", description="Filter: 'active', 'all', 'bidding_ended', 'all_active'"),
    sort_by: Optional[str] = Query("newest", description="Sort: 'newest', 'price_asc', 'price_desc', 'ending_soon', 'most_bids'"),
    db: Session = Depends(get_db),
):
    query = db.query(Listing)

    # Sync and filter
    now = now_utc()

    if status_filter == "all_active" or status_filter == "active":
        query = query.filter(Listing.status == "active", Listing.ends_at > now)
    elif status_filter != "all":
        query = query.filter(Listing.status == status_filter)

    if category:
        query = query.filter(Listing.category == category.lower())
    if condition:
        query = query.filter(Listing.condition == condition.lower())
    if q:
        query = query.filter(
            (Listing.title.ilike(f"%{q}%")) | (Listing.description.ilike(f"%{q}%"))
        )

    # Sorting
    if sort_by == "newest":
        query = query.order_by(desc(Listing.created_at))
    elif sort_by == "ending_soon":
        query = query.order_by(asc(Listing.ends_at))
    elif sort_by == "price_asc":
        query = query.order_by(asc(Listing.starting_price_paise))
    elif sort_by == "price_desc":
        query = query.order_by(desc(Listing.starting_price_paise))
    else:
        query = query.order_by(desc(Listing.created_at))

    listings = query.all()
    return [format_listing_response(db, l) for l in listings]


@router.get("/{listing_id}", response_model=ListingDetailResponse)
def get_listing_detail(
    listing_id: int,
    db: Session = Depends(get_db),
    _user: Optional[User] = Depends(get_optional_current_user),
):
    listing = db.query(Listing).filter(Listing.id == listing_id).first()
    if not listing:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Listing not found.")

    from app.services.auction_service import expire_stale_transactions
    expire_stale_transactions(db, listing)
    sync_listing_status(db, listing)
    base_resp = format_listing_response(db, listing)

    # Format bids
    bids = db.query(Bid).filter(Bid.listing_id == listing.id).order_by(desc(Bid.amount_paise)).all()
    bids_resp = [format_bid_response(b) for b in bids]

    # Active selection
    now = now_utc()
    active_sel = (
        db.query(BidderSelection)
        .filter(BidderSelection.listing_id == listing.id, BidderSelection.status == "pending", BidderSelection.expires_at > now)
        .first()
    )
    sel_resp = format_selection_response(active_sel) if active_sel else None

    # Transaction
    tx = db.query(Transaction).filter(Transaction.listing_id == listing.id).first()
    tx_resp = format_transaction_response(tx) if tx else None

    return ListingDetailResponse(
        **base_resp.model_dump(),
        bids=bids_resp,
        active_selection=sel_resp,
        transaction=tx_resp,
    )


@router.put("/{listing_id}", response_model=ListingResponse, dependencies=[Depends(verify_csrf)])
def update_listing(
    listing_id: int,
    data: ListingUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    listing = db.query(Listing).filter(Listing.id == listing_id).first()
    if not listing:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Listing not found.")

    if listing.seller_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Only the owner can edit this listing.")

    if data.title is not None:
        listing.title = data.title.strip()
    if data.description is not None:
        listing.description = data.description.strip()
    if data.image_url is not None:
        listing.image_url = data.image_url.strip() or None

    db.add(listing)
    db.commit()
    db.refresh(listing)
    return format_listing_response(db, listing)


@router.post("/{listing_id}/buy-now", dependencies=[Depends(verify_csrf)])
def execute_buy_now(
    listing_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    from app.services.bidding_service import buy_now
    from app.services.auction_service import format_transaction_response
    
    tx = buy_now(db, listing_id, current_user)
    return format_transaction_response(tx)


@router.post("/{listing_id}/deactivate", response_model=ListingResponse, dependencies=[Depends(verify_csrf)])
def deactivate_listing(
    listing_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    listing = db.query(Listing).filter(Listing.id == listing_id).first()
    if not listing:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Listing not found.")

    if listing.seller_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Only the owner can deactivate this listing.")

    if listing.status in ("reserved", "sold"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot withdraw an item that is currently reserved or already sold.",
        )

    listing.status = "withdrawn"
    db.add(listing)
    db.commit()
    db.refresh(listing)
    return format_listing_response(db, listing)
