from datetime import datetime
from fastapi import HTTPException, status
from sqlalchemy.orm import Session
from app.models import Transaction, Listing, User, TransactionEvent
from app.services.auction_service import now_utc

def get_authorized_transaction(db: Session, transaction_id: int, user: User) -> Transaction:
    """Fetches transaction and ensures only the seller or buyer can access it."""
    tx = db.query(Transaction).filter(Transaction.id == transaction_id).first()
    if not tx:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Transaction not found.",
        )
    if tx.seller_id != user.id and tx.buyer_id != user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access forbidden. You are not a participant in this transaction.",
        )
    return tx

def arrange_handover(
    db: Session,
    transaction_id: int,
    user: User,
    venue: str,
    notes: str = None,
    scheduled_at: datetime = None,
) -> Transaction:
    """Updates meetup venue and schedule."""
    tx = get_authorized_transaction(db, transaction_id, user)
    
    if tx.status == "completed":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="This transaction is already completed.",
        )

    if tx.payment_status != "paid_demo" or tx.fulfilment_type != "handover":
        raise HTTPException(status_code=400, detail="Complete simulated checkout and choose nearby handover first.")
    if tx.fulfilment_status != "order_confirmed":
        raise HTTPException(status_code=400, detail="Handover details cannot change after the seller marks the item ready.")

    tx.handover_venue = venue
    tx.handover_notes = notes
    tx.scheduled_meetup_at = scheduled_at
    if tx.status == "reserved":
        tx.status = "handover_arranged"
    tx.fulfilment_status = "order_confirmed"
    db.add(TransactionEvent(transaction_id=tx.id, status=tx.fulfilment_status, message=f"Nearby handover point agreed: {venue.strip()}."))

    db.add(tx)
    db.commit()
    db.refresh(tx)
    return tx

def confirm_handover(db: Session, transaction_id: int, user: User) -> Transaction:
    """
    Records confirmation from seller or buyer.
    When both parties confirm, marks transaction as 'completed' and listing as 'sold'.
    """
    tx = get_authorized_transaction(db, transaction_id, user)

    if tx.status == "completed":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Handover has already been fully confirmed and completed.",
        )

    if tx.payment_status != "paid_demo" or tx.fulfilment_type != "handover" or tx.fulfilment_status != "awaiting_receipt":
        raise HTTPException(status_code=400, detail="The seller must mark this paid item ready before handover confirmation.")

    if user.id == tx.seller_id:
        tx.seller_confirmed = True
        tx.fulfilment_status = "awaiting_receipt"
    elif user.id == tx.buyer_id:
        tx.buyer_confirmed = True

    # If both parties confirmed, complete transaction
    if tx.seller_confirmed and tx.buyer_confirmed:
        tx.status = "completed"
        tx.completed_at = now_utc()
        
        # Mark listing as sold
        listing = db.query(Listing).filter(Listing.id == tx.listing_id).first()
        if listing:
            listing.status = "sold"
            db.add(listing)

    if tx.buyer_confirmed and tx.seller_confirmed:
        tx.fulfilment_status = "completed"
    db.add(TransactionEvent(transaction_id=tx.id, status=tx.fulfilment_status, message=f"{'Seller' if user.id == tx.seller_id else 'Buyer'} confirmed handover."))

    db.add(tx)
    db.commit()
    db.refresh(tx)
    return tx
