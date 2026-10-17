from uuid import uuid4
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.db import get_db
from app.models import Transaction, User, Payment, TransactionEvent, Listing
from app.schemas import (
    TransactionResponse,
    HandoverArrangeRequest,
    HandoverConfirmRequest,
    SimulatedPaymentRequest,
)
from app.auth import get_current_user, verify_csrf
from app.services.handover_service import (
    get_authorized_transaction,
    arrange_handover,
    confirm_handover,
)
from app.services.auction_service import format_transaction_response

router = APIRouter(prefix="/transactions", tags=["Transactions & Handover"])


def add_event(db: Session, tx: Transaction, message: str):
    db.add(TransactionEvent(transaction_id=tx.id, status=tx.fulfilment_status, message=message))


@router.post("/{transaction_id}/simulate-payment", response_model=TransactionResponse, dependencies=[Depends(verify_csrf)])
def simulate_payment(transaction_id: int, data: SimulatedPaymentRequest,
                     current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    tx = get_authorized_transaction(db, transaction_id, current_user)
    if current_user.id != tx.buyer_id:
        raise HTTPException(status_code=403, detail="Only the selected buyer can pay for this order.")
    if tx.payment_status == "paid_demo":
        raise HTTPException(status_code=400, detail="This order has already been paid successfully.")
    if tx.status != "reserved":
        raise HTTPException(status_code=400, detail="This order is not available for checkout.")
    if data.fulfilment_type == "delivery" and not (data.delivery_address or "").strip():
        raise HTTPException(status_code=400, detail="Enter a delivery address for simulated delivery.")
    if data.fulfilment_type == "handover" and not (data.handover_venue or "").strip():
        raise HTTPException(status_code=400, detail="Choose a mutually agreed public meeting point.")
    tx.fulfilment_type = data.fulfilment_type
    tx.delivery_address = data.delivery_address.strip() if data.delivery_address else None
    tx.handover_venue = data.handover_venue.strip() if data.fulfilment_type == "handover" and data.handover_venue else None
    reference = f"DEMO-{uuid4().hex[:12].upper()}"
    outcome = "succeeded" if data.simulation_result == "success" else "failed"
    db.add(Payment(transaction_id=tx.id, amount_paise=tx.final_amount_paise, status=outcome, reference=reference))
    if outcome == "succeeded":
        tx.payment_status = "paid_demo"
        tx.payment_reference = reference
        tx.fulfilment_status = "order_confirmed"
        add_event(db, tx, f"Demo payment successful ({reference}); order confirmed.")
        if tx.fulfilment_type == "handover":
            tx.status = "handover_arranged"
    else:
        tx.payment_status = "failed_demo"
        add_event(db, tx, f"Demo payment failed ({reference}); retry is available.")
    db.commit()
    db.refresh(tx)
    return format_transaction_response(tx)


DELIVERY_STEPS = ["order_confirmed", "dispatched", "in_transit", "out_for_delivery", "delivered"]


@router.post("/{transaction_id}/advance-delivery", response_model=TransactionResponse, dependencies=[Depends(verify_csrf)])
def advance_delivery(transaction_id: int, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    tx = get_authorized_transaction(db, transaction_id, current_user)
    if current_user.id != tx.seller_id:
        raise HTTPException(status_code=403, detail="Only the seller can advance simulated delivery.")
    if tx.payment_status != "paid_demo" or tx.fulfilment_type != "delivery":
        raise HTTPException(status_code=400, detail="A successfully paid delivery order is required.")
    if tx.fulfilment_status == "delivered":
        raise HTTPException(status_code=400, detail="Delivery is awaiting buyer receipt confirmation.")
    current = DELIVERY_STEPS.index(tx.fulfilment_status) if tx.fulfilment_status in DELIVERY_STEPS else -1
    if current < 0 or current >= len(DELIVERY_STEPS) - 1:
        raise HTTPException(status_code=400, detail="Delivery cannot advance from the current status.")
    tx.fulfilment_status = DELIVERY_STEPS[current + 1]
    if tx.fulfilment_status == "delivered":
        tx.seller_confirmed = True
    add_event(db, tx, f"Simulated delivery status: {tx.fulfilment_status.replace('_', ' ').title()}.")
    db.commit(); db.refresh(tx)
    return format_transaction_response(tx)


@router.post("/{transaction_id}/advance-pickup", response_model=TransactionResponse, dependencies=[Depends(verify_csrf)])
def advance_pickup(transaction_id: int, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    tx = get_authorized_transaction(db, transaction_id, current_user)
    if current_user.id != tx.seller_id:
        raise HTTPException(status_code=403, detail="Only the seller can mark the item ready for handover.")
    if tx.payment_status != "paid_demo" or tx.fulfilment_type != "handover" or not tx.handover_venue:
        raise HTTPException(status_code=400, detail="A paid order with an agreed handover point is required.")
    if tx.fulfilment_status != "order_confirmed":
        raise HTTPException(status_code=400, detail="Item cannot be marked ready in its current state.")
    tx.fulfilment_status = "awaiting_receipt"
    tx.seller_confirmed = True
    add_event(db, tx, "Seller marked the item ready for nearby handover.")
    db.commit(); db.refresh(tx)
    return format_transaction_response(tx)


@router.post("/{transaction_id}/confirm-receipt", response_model=TransactionResponse, dependencies=[Depends(verify_csrf)])
def confirm_receipt(transaction_id: int, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    tx = get_authorized_transaction(db, transaction_id, current_user)
    if current_user.id != tx.buyer_id:
        raise HTTPException(status_code=403, detail="Only the buyer can confirm receipt.")
    allowed_receipt_state = (tx.fulfilment_type == "delivery" and tx.fulfilment_status == "delivered") or (tx.fulfilment_type == "handover" and tx.fulfilment_status == "awaiting_receipt")
    if tx.payment_status != "paid_demo" or not allowed_receipt_state:
        raise HTTPException(status_code=400, detail="The order is not ready for receipt confirmation.")
    tx.buyer_confirmed = True
    tx.fulfilment_status = "completed"
    tx.status = "completed"
    tx.completed_at = __import__("app.services.auction_service", fromlist=["now_utc"]).now_utc()
    listing = db.query(Listing).filter(Listing.id == tx.listing_id).first()
    if listing:
        listing.status = "sold"
    add_event(db, tx, "Buyer confirmed receipt. Order completed.")
    db.commit(); db.refresh(tx)
    return format_transaction_response(tx)


@router.get("/{transaction_id}", response_model=TransactionResponse)
def get_transaction(
    transaction_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    tx = get_authorized_transaction(db, transaction_id, current_user)
    return format_transaction_response(tx)


@router.post("/{transaction_id}/arrange-handover", response_model=TransactionResponse, dependencies=[Depends(verify_csrf)])
def update_handover_details(
    transaction_id: int,
    data: HandoverArrangeRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    tx = arrange_handover(
        db=db,
        transaction_id=transaction_id,
        user=current_user,
        venue=data.handover_venue,
        notes=data.handover_notes,
        scheduled_at=data.scheduled_meetup_at,
    )
    return format_transaction_response(tx)


@router.post("/{transaction_id}/confirm-handover", response_model=TransactionResponse, dependencies=[Depends(verify_csrf)])
def confirm_handover_completion(
    transaction_id: int,
    data: HandoverConfirmRequest = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    tx = confirm_handover(db, transaction_id, current_user)
    return format_transaction_response(tx)
