import uuid
from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, Field, ConfigDict
from app.schemas.address import AddressOut


class OrderItemOut(BaseModel):
    id: uuid.UUID
    product_id: uuid.UUID
    product_name: str
    product_image: Optional[str] = None
    unit_info: str
    unit_price: float
    quantity: int
    total_price: float

    model_config = ConfigDict(from_attributes=True)


class OrderCreate(BaseModel):
    delivery_address_id: uuid.UUID = Field(..., description="ID of customer's delivery address")
    payment_method: str = Field("COD", description="Payment method (COD)")
    customer_notes: Optional[str] = Field(None, max_length=500, description="Optional delivery notes")


class OrderCancelRequest(BaseModel):
    reason: Optional[str] = Field(None, max_length=300, description="Reason for cancellation")


class OrderOut(BaseModel):
    id: uuid.UUID
    order_number: str
    user_id: uuid.UUID
    delivery_address_id: uuid.UUID
    delivery_address: Optional[AddressOut] = None
    subtotal: float
    discount_amount: float
    delivery_fee: float
    total_amount: float
    order_status: str
    payment_method: str
    payment_status: str
    customer_notes: Optional[str] = None
    cancellation_reason: Optional[str] = None
    items: List[OrderItemOut] = []
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class OrderListResponse(BaseModel):
    items: List[OrderOut]
    total: int
