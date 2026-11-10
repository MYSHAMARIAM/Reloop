from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, EmailStr, Field, field_validator
from app.config import settings

# ----------------- User Schemas -----------------

class UserRegister(BaseModel):
    email: EmailStr
    password: str = Field(..., min_length=8, max_length=128)
    display_name: str = Field(..., min_length=2, max_length=100)
    college_id: Optional[str] = Field(None, max_length=50)
    campus_location: Optional[str] = Field(None, max_length=100)
    bio: Optional[str] = Field(None, max_length=500)

    @field_validator("display_name")
    @classmethod
    def clean_name(cls, v: str) -> str:
        s = v.strip()
        if not s:
            raise ValueError("Display name cannot be empty or only spaces")
        return s

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserProfileUpdate(BaseModel):
    display_name: Optional[str] = Field(None, min_length=2, max_length=100)
    college_id: Optional[str] = Field(None, max_length=50)
    campus_location: Optional[str] = Field(None, max_length=100)
    bio: Optional[str] = Field(None, max_length=500)

class UserResponse(BaseModel):
    id: int
    email: EmailStr
    display_name: str
    college_id: Optional[str] = None
    campus_location: Optional[str] = None
    bio: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True

# ----------------- Listing Schemas -----------------

ALLOWED_CATEGORIES = {
    "textbooks",
    "calculators",
    "electronics",
    "robotics",
    "sensors",
    "stationery",
    "lab_gear",
    "other",
}

ALLOWED_CONDITIONS = {"brand_new", "like_new", "good", "fair"}

ALLOWED_DURATIONS_HOURS = {1, 6, 12, 24, 72, 120, 168}  # 1h, 6h, 12h, 24h, 3d, 5d, 7d

class ListingCreate(BaseModel):
    title: str = Field(..., min_length=3, max_length=150)
    description: str = Field(..., min_length=10, max_length=3000)
    category: str
    condition: str
    starting_price_rupees: float = Field(..., gt=0)
    min_increment_rupees: float = Field(..., gt=0)
    duration_hours: int = Field(..., ge=1, le=168)
    demo_duration_minutes: Optional[int] = Field(None, ge=1, le=30)
    image_url: Optional[str] = Field(None, max_length=500)
    buy_now_price_rupees: Optional[float] = Field(None, gt=0)

    @field_validator("category")
    @classmethod
    def validate_category(cls, v: str) -> str:
        cat = v.lower().strip()
        if cat not in ALLOWED_CATEGORIES:
            raise ValueError(f"Category must be one of: {', '.join(sorted(ALLOWED_CATEGORIES))}")
        return cat

    @field_validator("condition")
    @classmethod
    def validate_condition(cls, v: str) -> str:
        c = v.lower().strip()
        if c not in ALLOWED_CONDITIONS:
            raise ValueError(f"Condition must be one of: {', '.join(sorted(ALLOWED_CONDITIONS))}")
        return c

    @field_validator("duration_hours")
    @classmethod
    def validate_duration(cls, v: int) -> int:
        if v not in ALLOWED_DURATIONS_HOURS:
            raise ValueError(f"Duration must be one of: {sorted(list(ALLOWED_DURATIONS_HOURS))} hours (1h, 6h, 12h, 24h, 3d, 5d, 7d)")
        return v

    @field_validator("demo_duration_minutes")
    @classmethod
    def validate_demo_duration(cls, v: Optional[int]) -> Optional[int]:
        if v is not None and not (settings.DEBUG and settings.ALLOW_DEMO_DURATIONS):
            raise ValueError("Short demo durations are disabled in this environment")
        return v

class ListingUpdate(BaseModel):
    title: Optional[str] = Field(None, min_length=3, max_length=150)
    description: Optional[str] = Field(None, min_length=10, max_length=3000)
    image_url: Optional[str] = Field(None, max_length=500)

class ListingResponse(BaseModel):
    id: int
    seller_id: int
    seller_name: str
    seller_location: Optional[str] = None
    title: str
    description: str
    category: str
    condition: str
    starting_price_paise: int
    min_increment_paise: int
    starting_price_rupees: float
    min_increment_rupees: float
    current_highest_bid_paise: Optional[int] = None
    current_highest_bid_rupees: Optional[float] = None
    next_minimum_bid_paise: int
    next_minimum_bid_rupees: float
    buy_now_price_paise: Optional[int] = None
    buy_now_price_rupees: Optional[float] = None
    has_buy_now: bool = False
    bid_count: int
    duration_hours: int
    image_url: Optional[str] = None
    status: str
    created_at: datetime
    ends_at: datetime
    is_ended: bool
    seconds_remaining: int

    class Config:
        from_attributes = True

# ----------------- Bid Schemas -----------------

class BidCreate(BaseModel):
    amount_rupees: float = Field(..., gt=0)

class BidResponse(BaseModel):
    id: int
    listing_id: int
    bidder_id: int
    bidder_name: str
    amount_paise: int
    amount_rupees: float
    created_at: datetime

    class Config:
        from_attributes = True

class ListingDetailResponse(ListingResponse):
    bids: List[BidResponse] = []
    active_selection: Optional["BidderSelectionResponse"] = None
    transaction: Optional["TransactionResponse"] = None

# ----------------- Seller Selection Schemas -----------------

class BidderSelectionCreate(BaseModel):
    bid_id: int

class BidderSelectionAction(BaseModel):
    action: str  # "accept" or "decline"

    @field_validator("action")
    @classmethod
    def validate_action(cls, v: str) -> str:
        act = v.lower().strip()
        if act not in ("accept", "decline"):
            raise ValueError("Action must be 'accept' or 'decline'")
        return act

class BidderSelectionResponse(BaseModel):
    id: int
    listing_id: int
    seller_id: int
    selected_bidder_id: int
    selected_bidder_name: str
    bid_id: int
    bid_amount_paise: int
    bid_amount_rupees: float
    status: str
    selected_at: datetime
    expires_at: datetime
    response_at: Optional[datetime] = None
    seconds_remaining_to_respond: int

    class Config:
        from_attributes = True

# ----------------- Transaction Schemas -----------------

class HandoverArrangeRequest(BaseModel):
    handover_venue: str = Field(..., min_length=3, max_length=200)
    handover_notes: Optional[str] = Field(None, max_length=1000)
    scheduled_meetup_at: Optional[datetime] = None

class HandoverConfirmRequest(BaseModel):
    notes: Optional[str] = None

class SimulatedPaymentRequest(BaseModel):
    simulation_result: str
    fulfilment_type: str
    delivery_address: Optional[str] = Field(None, max_length=300)
    handover_venue: Optional[str] = Field(None, max_length=200)

    @field_validator("simulation_result")
    @classmethod
    def valid_result(cls, value: str) -> str:
        result = value.lower().strip()
        if result not in {"success", "failure"}:
            raise ValueError("simulation_result must be success or failure")
        return result

    @field_validator("fulfilment_type")
    @classmethod
    def valid_fulfilment(cls, value: str) -> str:
        result = value.lower().strip()
        if result not in {"delivery", "handover"}:
            raise ValueError("fulfilment_type must be delivery or handover")
        return result

class TransactionResponse(BaseModel):
    id: int
    listing_id: int
    listing_title: str
    seller_id: int
    seller_name: str
    buyer_id: int
    buyer_name: str
    final_amount_paise: int
    final_amount_rupees: float
    status: str
    payment_status: str = "unpaid"
    payment_reference: Optional[str] = None
    fulfilment_type: Optional[str] = None
    fulfilment_status: str = "awaiting_payment"
    delivery_address: Optional[str] = None
    timeline: List[dict] = []
    handover_venue: Optional[str] = None
    handover_notes: Optional[str] = None
    scheduled_meetup_at: Optional[datetime] = None
    seller_confirmed: bool
    buyer_confirmed: bool
    created_at: datetime
    completed_at: Optional[datetime] = None

    class Config:
        from_attributes = True

# Resolve circular references
ListingDetailResponse.model_rebuild()

class OTPVerifyRequest(BaseModel):
    email: str
    code: str